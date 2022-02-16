import { Help, InjectBot, Start, Update, Command, Action } from 'nestjs-telegraf';
import { Context, Telegraf, deunionize, Markup } from 'telegraf';
import { TimePicker, HourExpression } from 'telegraf-time-picker';
import { Redis } from 'ioredis';
import * as winston from 'winston';
import { getCustomRepository } from 'typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import * as moment from 'moment';

import { RedisService } from 'src/app/modules/redis';
import { UsersService } from 'src/app/modules/users/users.service';
import { NotificationService } from '../notification/notification.service';
import { Notification } from '../notification/notification.entity';
import { User } from '../users';
import { timezoned } from 'src/common/helpers/utils';

@Update()
export class SummariesUpdate {
    private redisClient: Redis;
    private timePicker: TimePicker;

    constructor(
        @InjectBot()
        private readonly bot: Telegraf,
        private redisService: RedisService,
        private usersService: UsersService,
        private notificationService: NotificationService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger
    ) {
        this.redisClient = this.redisService.getClient();
        this.notificationService = getCustomRepository(NotificationService);
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

        const user = await this.usersService.findOne(+userIdFromRedis);
        if (!user) {
            ctx.reply('User not found');
            return;
        }

        const notifyEntry = await this.notificationService.findOne({
            where: {
                user: user
            }
        });

        const newEntry: Partial<Notification> = {
            user: user,
            notify_id: ctx.message.chat.id.toString()
        };

        if (notifyEntry !== undefined) newEntry['id'] = notifyEntry.id;

        await this.notificationService.save(newEntry);
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

    @Action(/unsub ([0-9]+|cancel)/)
    async onUnsubCb(ctx: Context): Promise<void> {
        const ctxCbQuery = deunionize(ctx.update)?.callback_query;
        const userId = deunionize(ctxCbQuery)?.data.match(/unsub ([0-9]+|cancel)/)[1];
        const chatId = ctxCbQuery.message.chat.id.toString();

        if (userId === 'cancel') {
            await this.answerAndDeleteCb(ctx, 'Cancelled');
            return;
        }

        try {
            const result = await this.notificationService.delete({
                user: +userId as Partial<User>,
                notify_id: chatId
            });

            if (result?.affected === 0) {
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

    @Action(/setnotifytime ([0-9]+|cancel)/)
    async onSetnotifytimeCb(ctx: Context): Promise<void> {
        const ctxCbQuery = deunionize(ctx.update)?.callback_query;
        const userId = deunionize(ctxCbQuery)?.data.match(
            /setnotifytime ([0-9]+|cancel)/
        )[1];
        const chatId = ctxCbQuery.message.chat.id.toString();

        if (userId === 'cancel') {
            await this.answerAndDeleteCb(ctx, 'Cancelled');
            return;
        }

        const notification = await this.notificationService.findOne({
            user: +userId as Partial<User>,
            notify_id: chatId
        });

        const currentHour = notification.notify_time.match(/(\d+):.*:.*/)[1];

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
                await this.notificationService.update(notification.id, {
                    notify_time: `${time}:0`
                });
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
        const notifyEntries = await this.notificationService.find({
            relations: ['user'],
            where: {
                notify_id: chatId
            }
        });

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
