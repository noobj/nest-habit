import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment-timezone';
import { SummariesService } from '../summaries';
import { UsersService } from '../users';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { QuoteService } from '../quote/quote.service';
import { SocketServerGateway } from '../socket-server/socket-server.gateway';
import { Notification, NotificationDocument } from '../../../schemas/notification.schema';
import * as winston from 'winston';
import { timezoned } from 'src/common/helpers/utils';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

dotenv.config();

@Injectable()
export class CronService {
    constructor(
        @InjectQueue('summary') private readonly summaryQueue: Queue,
        private summariesService: SummariesService,
        private usersService: UsersService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger,
        private quoteService: QuoteService,
        private socketServerGateway: SocketServerGateway,
        @InjectModel(Notification.name)
        private notificationModel: Model<NotificationDocument>
    ) {
        logger.add(
            new winston.transports.File({
                filename: `logs/cron-${moment().format('YYYY-MM-DD')}.log`,
                format: winston.format.combine(
                    winston.format.timestamp({ format: timezoned }),
                    winston.format.prettyPrint()
                )
            })
        );
    }

    @Cron(CronExpression.EVERY_5_SECONDS)
    public async dailyNotify() {
        const botApi = `bot${process.env.TELEGRAM_BOT_API_KEY}/`;
        const client = axios.create({
            baseURL: 'https://api.telegram.org/' + botApi,
            timeout: 10000
        });

        const notificationWithUsers = await this.notificationModel
            .find({
                $or: [
                    {
                        last_notify: { $lt: moment().format('YYYY-MM-DD') },
                        notify_time: { $lt: moment().format('HH:mm') }
                    },
                    { last_notify: null }
                ]
            })
            .populate('user');

        await Promise.all(
            notificationWithUsers.map(async (entry) => {
                const startDate = moment().isoWeekday(1).format('YYYY-MM-DD');
                const endDate = moment().isoWeekday(7).format('YYYY-MM-DD');
                const user = { id: entry.user.mysqlId, ...entry.user };
                return this.summariesService
                    .getRawDailySummaries(startDate, endDate, user)
                    .then(async (rawData) => {
                        return {
                            total: this.summariesService.getTotalDuration(rawData),
                            days: rawData.length,
                            streak: await this.summariesService.getCurrentStreak(user)
                        };
                    })
                    .then(async (res) => {
                        let streakAlert = '';
                        if (res.streak > 1)
                            streakAlert = `❗Keep going bro💪, don't lose your hard-earned ${res.streak} days steak✅\n\n`;
                        else {
                            const missDays = await this.summariesService.getMissingStreak(
                                entry.user
                            );
                            streakAlert = `🤷 You've already missed ${missDays} days👎, make a change today!\n\n`;
                        }
                        const text =
                            streakAlert +
                            `*🧘Weekly Meditation Progress👃*\nDays: ${res.days}\nTotal: ${res.total}\nStreak: ${res.streak} days`;
                        const params = {
                            chat_id: entry.notify_id,
                            text: text,
                            parse_mode: 'markdown'
                        };
                        await this.notificationModel.updateOne(
                            { _id: entry.id },
                            {
                                last_notify: moment().format('YYYY-MM-DD')
                            }
                        );

                        return client.get('sendMessage', { params });
                    })
                    .catch((err) => {
                        this.logger.log({
                            level: 'error',
                            message: `Notify user (${entry.user.id}) failed: [${err}]`
                        });
                    });
            })
        );
    }

    @Cron(CronExpression[process.env.CRON_DAILY_SYNC_TIME as keyof typeof CronExpression])
    public async dailySync() {
        try {
            const users = await this.usersService.find({ select: ['id'] });

            await Promise.all(
                users.map((user) =>
                    this.summaryQueue.add('sync', {
                        user: user,
                        days: 2
                    })
                )
            );
        } catch (err) {
            this.logger.log({
                level: 'error',
                message: `Sync user failed: [${err}]`
            });
        }
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    public async quoteCarousel() {
        try {
            const quote = await this.quoteService.randomFetchQuote();
            this.socketServerGateway.server.emit('quote', JSON.stringify(quote));
        } catch (err) {
            throw err;
        }
    }
}
