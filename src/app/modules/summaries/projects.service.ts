import { Injectable, ImATeapotException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import * as moment from 'moment-timezone';
import { Redis } from 'ioredis';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Project } from './entities';
import { User } from '../users';
import { UsersService } from '../users';
import { ThirdPartyService } from '../ThirdParty/third-party.service';
import { SummariesService } from './summaries.service';
import { RedisService } from '../redis';

@Injectable()
export class ProjectService {
    private redisClient: Redis;

    constructor(
        private summariesService: SummariesService,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        private usersService: UsersService,
        private thirdPartyService: ThirdPartyService,
        private redisService: RedisService
    ) {
        moment.tz.setDefault('Asia/Taipei');
        this.redisClient = this.redisService.getClient();
    }

    public async getProjectByUser(user: Partial<User>): Promise<Project> {
        const project = await this.projectRepository.findOne({
            where: { user: user }
        });

        return project;
    }

    public async getLeastUpdatedProjects(arg: number): Promise<Project[]> {
        return await this.projectRepository.find({
            relations: ['user'],
            order: {
                last_updated: 'DESC'
            },
            take: arg
        });
    }

    public async updateProjectLastUpdated(project: Project) {
        project.last_updated = new Date();
        return await this.projectRepository.save(project);
    }

    public async getAllProjects(user: Partial<User>) {
        user = await this.usersService.findOne(user.id);

        return await this.thirdPartyService
            .serviceFactory(user.third_party_service)
            .getProjects(user);
    }

    public async deleteProjectByUser(user: Partial<User> | number) {
        const userId = typeof user === 'number' ? user : user.id;

        // clean cache
        const keys = await this.redisClient.keys(`summaries:${user}*`);
        for (const key of keys) await this.redisClient.del(key);

        await this.projectRepository
            .createQueryBuilder()
            .delete()
            .where('user_id = :id', { id: userId })
            .execute();
    }

    public async setCurrentProject(user: Partial<User>, projectName: string) {
        const userWhole: User = await this.usersService.findOne(user.id);
        const currentProject = await this.getProjectByUser(user);

        // if current project equals to passed project, then only sync data
        if (!currentProject || currentProject.name !== projectName) {
            const { data: projects } = await this.getAllProjects(user);
            const fetchedProject = projects
                .filter((project) => project.name == projectName)
                .pop();

            if (!fetchedProject) throw new ImATeapotException('Project Not Found');

            // delete the original project
            await this.deleteProjectByUser(user);
            const project: Partial<Project> = {
                project_id: fetchedProject.id,
                name: projectName,
                user: userWhole,
                last_updated: new Date()
            };
            await this.projectRepository.save(project);
        }

        return await this.summariesService.syncWithThirdParty(365, userWhole);
    }

    @Cron(CronExpression.EVERY_10_MINUTES)
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
    }

    @Cron(CronExpression.EVERY_DAY_AT_9PM)
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
                    .then((rawData) => {
                        return {
                            total: this.summariesService.getTotalDuration(rawData),
                            days: rawData.length
                        };
                    })
                    .then((res) => {
                        const text = `*🧘 Meditation Progress👃*\nDays: ${res.days}\nTotal: ${res.total}\nStreak: !!!`;
                        const params = {
                            chat_id: user.notify_id,
                            text: text,
                            parse_mode: 'markdown'
                        };

                        return client.get('sendMessage', { params });
                    });
            })
        );
    }
}
