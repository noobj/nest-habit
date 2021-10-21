import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment-timezone';
import { Redis } from 'ioredis';
import { RedisService } from '../redis';
import { SummariesService } from '../summaries';
import { UsersService } from '../users';
import axios from 'axios';
import { IsNull, Not } from 'typeorm';
import * as dotenv from 'dotenv';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { QuoteService } from '../quote/quote.service';
import { SocketServerGateway } from '../socket-server/socket-server.gateway';

dotenv.config();

@Injectable()
export class CronService {
    private redisClient: Redis;

    constructor(
        @InjectQueue('summary') private readonly summaryQueue: Queue,
        private summariesService: SummariesService,
        private usersService: UsersService,
        private redisService: RedisService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
        private quoteService: QuoteService,
        private socketServerGateway: SocketServerGateway
    ) {
        moment.tz.setDefault('Asia/Taipei');
        this.redisClient = this.redisService.getClient();
    }

    @Cron(CronExpression[process.env.CRON_TG_UPDATE_FREQ])
    public async updateSubscriber() {
        const botApi = `bot${process.env.TELEGRAM_BOT_API_KEY}/`;
        const client = axios.create({
            baseURL: 'https://api.telegram.org/' + botApi,
            timeout: 10000
        });
        const updateOffset = await this.redisClient.get('telegram_update_id_offset');

        const params = {
            offset: updateOffset
        };

        try {
            const updates = await client.get('getUpdates', { params });
            const regex = /\/sub (.*)/i;
            const messages = updates.data.result
                .filter((v) => v.message?.text.match(regex))
                .map((v) => ({
                    load: v.message?.text.match(regex)[1],
                    chatId: v.message.from.id
                }));

            await Promise.all(
                messages.map((message) =>
                    this.usersService.setNotifyId(message.load, message.chatId)
                )
            );

            if (updates.data.result.length != 0)
                await this.redisClient.set(
                    'telegram_update_id_offset',
                    updates.data.result.pop().update_id + 1
                );
        } catch (e) {
            this.logger.log({
                level: 'error',
                message: `Update subscriber failed: [${e}]`
            });
        }
    }

    @Cron(CronExpression[process.env.CRON_NOTIFICATION_TIME])
    public async dailyNotify() {
        const botApi = `bot${process.env.TELEGRAM_BOT_API_KEY}/`;
        const client = axios.create({
            baseURL: 'https://api.telegram.org/' + botApi,
            timeout: 10000
        });

        const users = await this.usersService.find({
            notify_id: Not(IsNull())
        });

        await Promise.all(
            users.map((user) => {
                const startDate = moment().isoWeekday(1).format('YYYY-MM-DD');
                const endDate = moment().isoWeekday(7).format('YYYY-MM-DD');
                return this.summariesService
                    .getRawDailySummaries(startDate, endDate, user)
                    .then(async (rawData) => {
                        return {
                            total: this.summariesService.getTotalDuration(rawData),
                            days: rawData.length,
                            streak: await this.summariesService.getCurrentStreak(user)
                        };
                    })
                    .then((res) => {
                        let streakAlert = '';
                        if (res.streak > 1)
                            streakAlert = `❗Keep going bro💪, don't lose your hard-earned ${res.streak} days steak✅\n\n`;
                        const text =
                            streakAlert +
                            `*🧘Weekly Meditation Progress👃*\nDays: ${res.days}\nTotal: ${res.total}\nStreak: ${res.streak} days`;
                        const params = {
                            chat_id: user.notify_id,
                            text: text,
                            parse_mode: 'markdown'
                        };

                        return client.get('sendMessage', { params });
                    })
                    .catch((err) => {
                        this.logger.log({
                            level: 'error',
                            message: `Notify user (${user.id}) failed: [${err}]`
                        });
                    });
            })
        );
    }

    @Cron(CronExpression[process.env.CRON_DAILY_SYNC_TIME])
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

    @Cron(CronExpression.EVERY_10_MINUTES)
    public async quoteCarousel() {
        try {
            const quote = await this.quoteService.randomFetchQuote();
            this.socketServerGateway.server.emit('quote', JSON.stringify(quote[0]));
        } catch (err) {
            throw err;
        }
    }
}