import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as moment from 'moment-timezone';
import { Redis } from 'ioredis';
import { RedisService } from '../redis';
import { SummariesService } from '../summaries';
import { UsersService } from '../users';
import axios from 'axios';
import { IsNull, Not } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class CronService {
    private redisClient: Redis;

    constructor(
        private summariesService: SummariesService,
        private usersService: UsersService,
        private redisService: RedisService
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
            //TODO: log exceptions
            console.log(e);
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
                        const text = `*🧘Weekly Meditation Progress👃*\nDays: ${res.days}\nTotal: ${res.total}\nStreak: ${res.streak} days`;
                        const params = {
                            chat_id: user.notify_id,
                            text: text,
                            parse_mode: 'markdown'
                        };

                        return client.get('sendMessage', { params });
                    })
                    .catch((err) => {
                        // TODO: log error
                        console.log(err);
                    });
            })
        );
    }
}
