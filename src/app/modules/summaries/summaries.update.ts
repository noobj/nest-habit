import { Help, InjectBot, Start, Update, Command, Action } from 'nestjs-telegraf';
import { Context, Telegraf, deunionize, Markup } from 'telegraf';
import { TimePicker, HourExpression } from 'telegraf-time-picker';
import { Redis } from 'ioredis';
import * as winston from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { RedisService } from 'src/app/modules/redis';
import { timezoned } from 'src/common/helpers/utils';
import { Notification, NotificationDocument } from '../notification/notification.schema';
import { MysqlUserId, MysqlUserIdDocument } from '../users/mysqlUserId.schema';
import { User, UserDocument } from '../users/user.schema';

@Update()
export class SummariesUpdate {
    private redisClient: Redis;
    private timePicker: TimePicker;

    constructor(
        @InjectBot()
        private readonly bot: Telegraf,
        private redisService: RedisService,
        @InjectModel(User.name)
        private userModel: Model<UserDocument>,
        @InjectModel(Notification.name)
        private notificationModel: Model<NotificationDocument>,
        @InjectModel(MysqlUserId.name)
        private mysqlUserIdModel: Model<MysqlUserIdDocument>,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger
    ) {
        this.redisClient = this.redisService.getClient();
        logger.add(
            new winston.transports.File({
                filename: `logs/cron-${moment().format('YYYY-MM-DD')}.log`,
                format: winston.format.combine(
                    winston.format.timestamp({ format: timezoned }),
                    winston.format.prettyPrint()
                )
            })
        );

        this.timePicker = new TimePicker(this.bot);
    }

    @Start()
    async onStart(): Promise<string> {
        const me = await this.bot.telegram.getMe();
        return `Hey, I'm ${me.first_name}`;
    }

    @Help()
    async onHelp(): Promise<string> {
        return 'Send me any text';
    }

    @Command('sub')
    async onSub(ctx: Context): Promise<void> {
        const regex = /\/sub (.*)/;
        const text = deunionize(ctx.message)?.text.match(regex);
        const token = text === null ? null : text[1];
        const userIdFromRedis = await this.redisClient.get(`subtoken:${token}`);
        if (userIdFromRedis === null) {
            ctx.reply('Invalid token');
            return;
        }

        const userId = await this.mysqlUserIdModel.findOne({
            mysqlUid: +userIdFromRedis
        });
        const user = await this.userModel.findById(userId.uid);

        if (!user) {
            ctx.reply('User not found');
            return;
        }

        const notifyEntry = await this.notificationModel.findOne({
            user: user
        });

        const newEntry: Partial<NotificationDocument> = {
            user: user,
            notify_id: ctx.message.chat.id.toString(),
            notify_time: '00:00'
        };

        if (notifyEntry !== null)
            await this.notificationModel.updateOne({ _id: notifyEntry?.id }, newEntry, {
                upsert: true
            });
        else await this.notificationModel.create(newEntry);

        ctx.reply('Thanks for Subscribing');

        // delete token after subscribed
        await this.redisClient.del(`subtoken:${token}`);
    }

    @Command('unsub')
    async onUnsub(ctx: Context): Promise<void> {
        const keyboards = await this.getUsersInlineKeyboards(ctx, 'unsub');
        if (keyboards === false) return;

        await ctx.reply('Which user to unsubscribe?', keyboards);
    }

    @Action(/unsub ([0-9a-fA-F]+|cancel)/)
    async onUnsubCb(ctx: Context): Promise<void> {
        const ctxCbQuery = deunionize(ctx.update)?.callback_query;
        const userId = deunionize(ctxCbQuery)?.data.match(
            /unsub ([0-9a-fA-F]{24}|cancel)/
        )[1];
        const chatId = ctxCbQuery.message.chat.id.toString();

        if (userId === 'cancel') {
            await this.answerAndDeleteCb(ctx, 'Cancelled');
            return;
        }

        try {
            const user = await this.userModel.findById(userId);
            const result = await this.notificationModel.findOneAndDelete({
                user: user,
                notify_id: chatId
            });

            if (result === null) {
                await this.answerAndDeleteCb(ctx, 'Unsubscribe failed');
                return;
            }
        } catch (err) {
            this.logger.error(`TG bot error: Unsubscribe error ${err}`);
            await this.answerAndDeleteCb(ctx, 'Unsubscribe failed');
            return;
        }

        await this.answerAndDeleteCb(ctx, 'Unsubscribed');
    }

    @Command('setnotifytime')
    async onSetnotifytime(ctx: Context) {
        const keyboards = await this.getUsersInlineKeyboards(ctx, 'setnotifytime');
        if (keyboards === false) return;

        ctx.reply('Choose a user to set the notification time.', keyboards);
    }

    @Action(/setnotifytime ([0-9a-fA-F]+|cancel)/)
    async onSetnotifytimeCb(ctx: Context): Promise<void> {
        const ctxCbQuery = deunionize(ctx.update)?.callback_query;
        const userId = deunionize(ctxCbQuery)?.data.match(
            /setnotifytime ([0-9a-fA-F]{24}|cancel)/
        )[1];
        const chatId = ctxCbQuery.message.chat.id.toString();

        if (userId === 'cancel') {
            await this.answerAndDeleteCb(ctx, 'Cancelled');
            return;
        }

        const user = await this.userModel.findById(userId);
        const notification = await this.notificationModel.findOne({
            user: user,
            notify_id: chatId
        });

        const currentHour = notification.notify_time.match(/(\d+):00/)[1];

        if (notification === undefined) {
            await this.answerAndDeleteCb(ctx, 'Setnotifytime failed');
            this.logger.error(
                `TG bot error: setting notify time error: notification not found`
            );
            return;
        }

        const callBackAfterTimePickerSubmit = async (
            ctx: Context,
            time: HourExpression
        ) => {
            try {
                await this.notificationModel.updateOne(
                    { _id: notification.id },
                    {
                        notify_time: `${time}:00`
                    }
                );
            } catch (err) {
                this.logger.error(`TG bot error: setting notify time error: ${err}`);
                await ctx.reply(`Update failed`);
                await this.answerAndDeleteCb(ctx);
                return;
            }
            await ctx.reply(`You will get the notice at ${time}👍.`);
            await this.answerAndDeleteCb(ctx, 'done');
        };
        await this.timePicker.setTimePickerListener(callBackAfterTimePickerSubmit);

        await this.answerAndDeleteCb(ctx);
        await ctx.reply(
            'Choose a time to be notified:',
            this.timePicker.getTimePicker(+currentHour)
        );
    }

    answerAndDeleteCb(ctx: Context, answerString?: string) {
        return Promise.all([ctx.answerCbQuery(answerString), ctx.deleteMessage()]);
    }

    async getNotificationEntryByChatId(ctx: Context) {
        const chatId = ctx.message.chat.id.toString();
        const notifyEntries = await this.notificationModel
            .find({
                notify_id: chatId
            })
            .populate('user');

        return notifyEntries;
    }

    /**
     * Get the subscribed users inline keyboards by the chat_id of the context.
     * Return false, if no users subscribed on this chat_id.
     */
    async getUsersInlineKeyboards(ctx: Context, callbackAction: string) {
        const notifyEntries = await this.getNotificationEntryByChatId(ctx);
        if (notifyEntries.length === 0) {
            ctx.reply('You have not subscribed yet');
            return false;
        }

        const keyboards = notifyEntries.map((entry) => {
            return [
                {
                    text: entry.user.account,
                    callback_data: `${callbackAction} ${entry.user.id}`
                }
            ];
        });

        keyboards.push([{ text: 'Cancel', callback_data: `${callbackAction} cancel` }]);

        return Markup.inlineKeyboard(keyboards);
    }
}
