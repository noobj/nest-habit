import { Injectable, ImATeapotException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as moment from 'moment-timezone';
import * as _ from 'lodash';
import { Redis } from 'ioredis';

import { RedisService } from '../redis';
import { DailySummary } from './entities';
import { IBasicService } from './interfaces';
import { CreateDailySummaryDto, WrapperCreateDailySummaryDto } from './daily_summary_dto';
import { validate } from 'class-validator';
import { ProjectService } from './projects.service';
import { Project } from './entities/project.entity';
import { ClassTransformer } from 'class-transformer';
import { User } from '../users';
import { ThirdPartyService } from '../ThirdParty/third-party.service';
import { SummariesGateway } from 'src/app/modules/summaries/summaries.gateway';
import { ModuleRef } from '@nestjs/core';
import { convertRawDurationToFormat } from 'src/common/helpers/utils';

/**
 * The return format for frontend use
 */
interface IFormatedSummary {
    level: number;
    date: string;
    timestamp: number;
    duration: string;
}

@Injectable()
export class SummariesService implements IBasicService, OnModuleInit {
    private projectService: ProjectService;
    private socketServer: SummariesGateway;
    private redisClient: Redis;

    constructor(
        @InjectRepository(DailySummary)
        private dailySummaryRepository: Repository<DailySummary>,
        private moduleRef: ModuleRef,
        private thirdPartyService: ThirdPartyService,
        private readonly redisService: RedisService
    ) {
        moment.tz.setDefault('Asia/Taipei');
        this.redisClient = this.redisService.getClient();
    }

    onModuleInit() {
        this.socketServer = this.moduleRef.get(SummariesGateway, { strict: false });
        this.projectService = this.moduleRef.get(ProjectService);
    }

    public async getRawDailySummaries(
        startDate: string,
        endDate: string,
        user: Partial<User>
    ): Promise<DailySummary[]> {
        const { id: projectId } =
            (await this.projectService.getProjectByUser(user)) || {};

        return await this.dailySummaryRepository.find({
            where: [
                {
                    date: Between(startDate, endDate),
                    project: projectId,
                    user: user
                }
            ]
        });
    }

    public async processTheRawSummaries(
        rawData: DailySummary[]
    ): Promise<IFormatedSummary[]> {
        return rawData.map((entry) => {
            const level = this.calLevel(entry.duration);
            const timestamp = moment(entry.date, 'YYYY-MM-DD').valueOf();
            const duration = convertRawDurationToFormat(entry.duration);

            return {
                date: moment(entry.date).format('MMM DD, YYYY'),
                level: level,
                timestamp: timestamp,
                duration: duration
            };
        });
    }

    private calLevel(duration: number): number {
        const MAX_DURATION_LEVEL_INDEX = 5;
        const MAX_DURATION_LEVEL = 4;
        const durationLevelMap = new Map([
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 3],
            [4, 3],
            [5, 3]
        ]);

        const levelIndex = Math.floor(duration / 1000 / 60 / 30);
        return levelIndex > MAX_DURATION_LEVEL_INDEX
            ? MAX_DURATION_LEVEL
            : durationLevelMap.get(levelIndex);
    }

    public getLongestDayRecord(rawData: DailySummary[]): {
        date: string;
        duration: string;
    } {
        const longestRecord = rawData.sort((a, b) => {
            return b.duration - a.duration;
        })[0];

        return {
            date: longestRecord.date,
            duration: convertRawDurationToFormat(longestRecord.duration)
        };
    }

    public getTotalDuration(rawData: DailySummary[]): string {
        return convertRawDurationToFormat(
            rawData.reduce((sum, entry) => {
                return (sum += entry.duration);
            }, 0)
        );
    }

    public getTotalThisMonth(rawData: DailySummary[]): string {
        const stingOfThisMonth = moment().format('YYYY-MM');

        const sum = rawData
            .filter((entry) => {
                return entry.date.includes(stingOfThisMonth);
            })
            .reduce((sum, entry) => (sum += entry.duration), 0);

        return convertRawDurationToFormat(sum);
    }

    public async upsert(data: CreateDailySummaryDto[]): Promise<any> {
        const classTransformer = new ClassTransformer();
        const entity = classTransformer.plainToClass(CreateDailySummaryDto, data);
        const wrapped = new WrapperCreateDailySummaryDto(entity);
        const errors = await validate(wrapped);
        if (errors.length > 0) {
            throw new ImATeapotException('Validation failed');
        }

        try {
            let affected = 0;
            // search for those existing entries and insert their id
            data = await Promise.all(
                data.map(async (entry) => {
                    return this.dailySummaryRepository
                        .findOne({
                            where: {
                                user: entry.user,
                                date: entry.date,
                                project: entry.project
                            }
                        })
                        .then((result) => {
                            if (result) {
                                if (result.duration != entry.duration) {
                                    affected++;
                                    result.duration = entry.duration;
                                }

                                return result;
                            } else {
                                affected++;
                                return entry;
                            }
                        });
                })
            );

            const entries = await this.dailySummaryRepository.save(data);
            return {
                affected,
                entries
            };
        } catch (e) {
            throw new ImATeapotException(e);
        }
    }

    async syncWithThirdParty(days: number, user: User, emitNotice = true) {
        const since = moment().subtract(days, 'days').format('YYYY-MM-DD');

        const project = await this.projectService.getProjectByUser(user);
        project.user = user;

        if (!project) throw new ImATeapotException('No project found');

        try {
            const details = await this.thirdPartyService
                .serviceFactory(user.third_party_service)
                .fetch(project, since);

            if (!details.length) {
                const keys = await this.redisClient.keys(`summaries:${user.id}*`);
                for (const key of keys) await this.redisClient.del(key);
                return 0;
            }

            const fetchedData = this.processFetchedData(details, project);
            const result = await this.upsert(fetchedData);

            await this.projectService.updateProjectLastUpdated(project);

            // Delete all the summaries cache of the user
            if (result.affected > 0) {
                const keys = await this.redisClient.keys(`summaries:${user.id}*`);
                for (const key of keys) await this.redisClient.del(key);
            }

            if (emitNotice && result.affected > 0)
                this.sendMessageToSocketClients(result.entries);

            return result.affected;
        } catch (err) {
            throw err;
        }
    }

    private sendMessageToSocketClients(entries: CreateDailySummaryDto[]) {
        entries.map((entry) => {
            // Only new records have user data
            if (entry.user) {
                const { user, duration, ...rest } = entry; // sift out sensetive user info
                const result = {
                    ...rest,
                    duration: convertRawDurationToFormat(entry.duration),
                    userId: entry.user.id,
                    account: entry.user.account
                };
                this.socketServer.server.emit('notice', JSON.stringify(result));
            }
        });
    }

    private processFetchedData(
        details: any[],
        project: Project
    ): CreateDailySummaryDto[] {
        const tmp = _.groupBy(details, (entry) => {
            return moment(entry.start).format('YYYY-MM-DD');
        });

        return Object.entries(tmp).map((key) => {
            return {
                date: key[0],
                project: project.id,
                duration: key[1].reduce((sum, entry) => sum + entry.dur, 0),
                user: project.user
            };
        });
    }

    public async getCurrentStreak(user: User): Promise<number> {
        let streak = await this.dailySummaryRepository
            .query(`select if(max(maxcount) < 0, 0, max(maxcount)) streak
        from (
        select
          if(datediff(@prevDate, \`date\`) = 1, @count := @count + 1, @count := -99999) maxcount,
          @prevDate := \`date\`
          from daily_summaries as v cross join
            (select @prevDate := curdate(), @count := 0) t1
          where user_id = ${user.id}
          and \`date\` < curdate()
          order by \`date\` desc
        ) t1; `);

        const todayDateString = moment().format('YYYY-MM-DD');
        const today = await this.dailySummaryRepository.find({ date: todayDateString });
        streak = streak[0].streak;
        if (today.length) streak++;

        return streak;
    }
}
