import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { RedisService } from '../redis';
import { Redis } from 'ioredis';
import { endOfToday, subYears, subDays, format } from 'date-fns';

import { ProjectService } from './projects.service';
import { SummariesService } from './summaries.service';
import { getCacheString } from 'src/common/helpers/utils';
import { WsResponse } from '@nestjs/websockets/interfaces';
import { SummariesGateway } from './summaries.gateway';
import { User, UsersService } from '../users';

@Processor('summary')
export class SummaryProcessor {
    private readonly logger = new Logger(SummaryProcessor.name);
    private redisClient: Redis;

    constructor(
        private readonly projectService: ProjectService,
        private readonly summariesService: SummariesService,
        private readonly summariesGateway: SummariesGateway,
        private readonly usersService: UsersService,
        private readonly redisService: RedisService
    ) {
        this.redisClient = this.redisService.getClient();
    }

    @Process('sync')
    async handleSync(job: Job) {
        console.log('queue processor handling sync');
        try {
            const { user, socketId, days } = job.data;
            const userWhole: User = await this.usersService.findOne(user.id);
            const newRecordsNumber = await this.summariesService.syncWithThirdParty(
                days,
                userWhole
            );
            if (!socketId) return;

            const tmpEnd = endOfToday();
            const tmpStart = subYears(tmpEnd, 1);
            const endDate = format(tmpEnd, 'yyyy-MM-dd');
            const startDate = format(subDays(tmpStart, 7), 'yyyy-MM-dd');

            const cacheString = getCacheString('Summaries', user.id, startDate, endDate);
            // if there is no new record, using cache
            if (newRecordsNumber == 0) {
                const cacheSummaries = await this.redisClient.get(cacheString);
                if (cacheSummaries !== null) {
                    const event = await this.processCacheData(
                        cacheSummaries,
                        user,
                        cacheString
                    );
                    this.summariesGateway.server
                        .to(`Room ${user.id}`)
                        .emit(event.event, event.data);
                    return;
                }
            }

            const rawData = await this.summariesService.getRawDailySummaries(
                startDate,
                endDate,
                user
            );
            const summaries = await this.summariesService.processTheRawSummaries(rawData);
            const currentProject = await this.projectService.getProjectByUser(user);
            let result;

            if (rawData.length === 0) {
                result = {
                    current_project: currentProject
                };
            } else {
                const streak = await this.summariesService.getCurrentStreak(user);
                const totalYear = this.summariesService.getTotalDuration(rawData);
                const totalThisMonth = this.summariesService.getTotalThisMonth(rawData);

                result = {
                    current_project: currentProject,
                    summaries: summaries,
                    streak,
                    total_last_year: totalYear,
                    total_this_month: totalThisMonth
                };
            }

            await this.redisClient.set(cacheString, JSON.stringify(result), 'EX', 3600);
            this.summariesGateway.server
                .to(socketId)
                .emit('sync', JSON.stringify(result));
        } catch (err) {
            // TODO: log into file
            console.log(err);
        }
    }

    private async processCacheData(
        cacheSummaries: string,
        user: any,
        cacheString: string
    ): Promise<WsResponse<string>> {
        let { summaries, streak, total_last_year, total_this_month, current_project } =
            JSON.parse(cacheSummaries);

        if (current_project === undefined) {
            current_project = await this.projectService.getProjectByUser(user);

            const res = {
                current_project,
                summaries: summaries,
                streak,
                total_last_year,
                total_this_month
            };

            await this.redisClient.set(cacheString, JSON.stringify(res), 'EX', 3600);
        } else {
            current_project.last_updated = Date.now();
        }

        const result = {
            current_project,
            summaries: summaries,
            streak,
            total_last_year,
            total_this_month
        };

        return { event: 'sync', data: JSON.stringify(result) };
    }
}
