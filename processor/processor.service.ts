import { ClassTransformer } from 'class-transformer';
import { validate } from 'class-validator';
import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import * as Redis from 'ioredis';
import { Server } from 'socket.io';
import { Between, Connection, Repository } from 'typeorm';

import { CreateDailySummaryDto, WrapperCreateDailySummaryDto } from './daily_summary_dto';
import { ThirdPartyFactory } from './third-party/third-party.factory';
import { User } from './entities/users.entity';
import { Project } from './entities/project.entity';
import { DailySummary } from './entities/daily_summary.entity';

const convertRawDurationToFormat = (duration: number): string => {
    const durationInMinute = duration / 1000 / 60;

    if (durationInMinute < 1) {
        return '1m';
    }

    const hours = Math.floor(durationInMinute / 60);
    const minutes = Math.floor(durationInMinute % 60);

    if (hours == 0) return `${minutes}m`;

    return `${hours}h${minutes}m`;
};

interface IFormatedSummary {
    level: number;
    date: string;
    timestamp: number;
    duration: string;
}

export class ProcessorService {
    projectRepository: Repository<Project>;
    dailySummaryRepository: Repository<DailySummary>;

    constructor(
        connection: Connection,
        private readonly redisClient: Redis.Redis,
        private readonly socketIoServer: Server
    ) {
        moment.tz.setDefault('Asia/Taipei');
        this.projectRepository = connection.getRepository(Project);
        this.dailySummaryRepository = connection.getRepository(DailySummary);
    }

    async syncWithThirdParty(days: number, user: User, emitNotice = true) {
        const since = moment().subtract(days, 'days').format('YYYY-MM-DD');

        const project = await this.getProjectByUser(user);
        project.user = user;

        if (!project) throw new Error('No project found');

        try {
            await this.updateProjectLastUpdated(project);
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
            throw new Error(`Sync error: ${err.message}`);
        }
    }

    public async getProjectByUser(user: Partial<User>): Promise<Project> {
        const project = await this.projectRepository.findOne({
            where: { user: user }
        });

        return project;
    }

    public async updateProjectLastUpdated(project: Project) {
        project.last_updated = new Date();
        return await this.projectRepository.save(project);
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

    public async upsert(data: CreateDailySummaryDto[]): Promise<any> {
        const classTransformer = new ClassTransformer();
        const entity = classTransformer.plainToClass(CreateDailySummaryDto, data);
        const wrapped = new WrapperCreateDailySummaryDto(entity);
        const errors = await validate(wrapped);
        if (errors.length > 0) {
            throw new Error('Validation failed in upsert');
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
            throw new Error(e.message);
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

                this.socketIoServer.emit('notice', JSON.stringify(result));
            }
        });
    }

    public async getRawDailySummaries(
        startDate: string,
        endDate: string,
        user: Partial<User>
    ): Promise<DailySummary[]> {
        const { id: projectId } = (await this.getProjectByUser(user)) || {};

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
}
