import {
    Injectable,
    ImATeapotException,
    OnModuleInit,
    BadRequestException,
    InternalServerErrorException
} from '@nestjs/common';
import * as moment from 'moment-timezone';
import * as _ from 'lodash';
import { Redis } from 'ioredis';

import { RedisService } from '../redis';
import { ProjectService } from './projects.service';
import { User } from '../users';
import { ThirdPartyFactory } from '../ThirdParty/third-party.factory';
import { SocketServerGateway } from '../socket-server/socket-server.gateway';
import { ModuleRef } from '@nestjs/core';
import { convertRawDurationToFormat } from 'src/common/helpers/utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project as MongoProject, ProjectDocument } from 'src/schemas/project.schema';
import { Summary, SummaryDocument } from 'src/schemas/summary.schema';
import { User as MongoUser, UserDocument } from 'src/schemas/user.schema';

/**
 * The return format for frontend use
 */
export interface IFormatedSummary {
    level: number;
    date: string;
    timestamp: number;
    duration: string;
}

@Injectable()
export class SummariesService implements OnModuleInit {
    private projectService: ProjectService;
    private redisClient: Redis;

    constructor(
        @InjectModel(MongoProject.name)
        private projectModel: Model<ProjectDocument>,
        @InjectModel(Summary.name)
        private summaryModel: Model<SummaryDocument>,
        @InjectModel(MongoUser.name)
        private userModel: Model<UserDocument>,
        private moduleRef: ModuleRef,
        private readonly socketServerGateway: SocketServerGateway,
        private readonly redisService: RedisService
    ) {
        moment.tz.setDefault('Asia/Taipei');
        this.redisClient = this.redisService.getClient();
    }

    onModuleInit() {
        this.projectService = this.moduleRef.get(ProjectService);
    }

    public async getRawDailySummaries(
        startDate: string,
        endDate: string,
        user: Partial<User>
    ): Promise<SummaryDocument[]> {
        const { id } = (await this.projectService.getProjectByUser(user)) || {};
        const project = await this.projectModel.findOne({ mysqlId: id });
        const mongoUser = await this.userModel.findOne({ mysqlId: user.id });

        return await this.summaryModel.find({
            project: project,
            user: mongoUser,
            date: { $gte: startDate, $lte: endDate }
        });
    }

    public async processTheRawSummaries(
        rawData: SummaryDocument[]
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

    public getLongestDayRecord(rawData: SummaryDocument[]): {
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

    public getTotalDuration(rawData: SummaryDocument[]): string {
        return convertRawDurationToFormat(
            rawData.reduce((sum, entry) => {
                return (sum += entry.duration);
            }, 0)
        );
    }

    public getTotalThisMonth(rawData: SummaryDocument[]): string {
        const stingOfThisMonth = moment().format('YYYY-MM');

        const sum = rawData
            .filter((entry) => {
                return entry.date.includes(stingOfThisMonth);
            })
            .reduce((sum, entry) => (sum += entry.duration), 0);

        return convertRawDurationToFormat(sum);
    }

    public async upsert(entries: Summary[]): Promise<any> {
        try {
            let affected = 0;
            // search for those existing entries and insert their id
            await Promise.all(
                entries.map(async (entry) => {
                    return this.summaryModel
                        .updateOne(
                            {
                                user: entry.user,
                                date: entry.date,
                                project: entry.project
                            },
                            entry,
                            { upsert: true, new: true }
                        )
                        .then((result) => {
                            if (result.nModified > 0 || result.upserted) {
                                affected++;
                            }
                        });
                })
            );

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

        const projectMysql = await this.projectService.getProjectByUser(user);

        if (!projectMysql) throw new BadRequestException('No project found');
        const project = await this.projectModel
            .findOne({ mysqlId: projectMysql.id })
            .populate('user');

        try {
            await this.projectService.updateProjectLastUpdated(projectMysql);
            const details = await ThirdPartyFactory.getService(
                user.third_party_service
            ).fetch(project, since);
            if (!details.length) return 0;

            const fetchedData = this.processFetchedData(details, project);
            const result = await this.upsert(fetchedData);

            // Delete all the summaries cache of the user
            if (result.affected > 0) {
                const keys = await this.redisClient.keys(`summaries:${user.id}*`);
                for (const key of keys) await this.redisClient.del(key);
            }

            if (emitNotice && result.affected > 0)
                this.sendMessageToSocketClients(result.entries);

            return result.affected;
        } catch (err) {
            throw new InternalServerErrorException(`Sync error: ${err.message}`);
        }
    }

    private sendMessageToSocketClients(entries: SummaryDocument[]) {
        entries.map((entry) => {
            // Only new records have user data
            if (entry.user) {
                const userId = entry.user;
                const userAccount = entry.user.account;
                entry.user = null;
                entry.duration = null;
                const result = {
                    ...entry,
                    duration: convertRawDurationToFormat(entry.duration),
                    userId: userId,
                    account: userAccount
                };
                this.socketServerGateway.server.emit('notice', JSON.stringify(result));
            }
        });
    }

    private processFetchedData(details: any[], project: ProjectDocument): Summary[] {
        const tmp = _.groupBy(details, (entry) => {
            return moment(entry.start).format('YYYY-MM-DD');
        });

        return Object.entries(tmp).map((key) => {
            return {
                date: key[0],
                project: project,
                duration: key[1].reduce((sum, entry) => sum + entry.dur, 0),
                user: project.user
            };
        });
    }

    public async getCurrentStreak(user: Partial<User>): Promise<number> {
        let streak = 0;
        let today = new Date('2022-06-15').toISOString().slice(0, 10).replace(/T.*/, '');

        const userComplete = await this.userModel.findOne({ mysqlId: user.id });
        const entries = await this.summaryModel
            .find({ user: userComplete })
            .sort({ date: -1 });
        for (const entry of entries) {
            if (entry.date != today) {
                break;
            }

            streak++;
            const prevDate = new Date(today);
            prevDate.setDate(prevDate.getDate() - 1);
            today = prevDate.toISOString().slice(0, 10).replace(/T.*/, '');
        }

        return streak;
    }

    public async getMissingStreak(user: UserDocument): Promise<number> {
        const lastEntry = await this.summaryModel.findOne({
            user
        });

        return Math.floor(
            moment.duration(moment().diff(moment(lastEntry.date))).as('days')
        );
    }
}
