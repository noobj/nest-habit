import * as Queue from 'bull';
import { createConnection, Connection } from 'typeorm';
import { Server } from 'socket.io';
import { createAdapter } from 'socket.io-redis';
import * as Redis from 'ioredis';
import { endOfToday, format, subDays, subYears } from 'date-fns';
import { config as TestConfig } from './test.config';
import { config as Config } from './config';

import { User } from './entities/users.entity';
import { ProcessorService } from './processor.service';

export const getCacheString = (
    prefix: string,
    userId: number | string,
    startDate: string,
    endDate: string
): string => {
    prefix = prefix.toLowerCase();
    const cacheId = Buffer.from(startDate + endDate).toString('base64');
    return `${prefix}:${userId}:${cacheId}`;
};

export class Processor {
    constructor(
        private processorService: ProcessorService,
        private io: Server,
        private redisClient: Redis.Redis,
        private subClient: Redis.Redis,
        private connection: Connection,
        private queue: Queue.Queue
    ) {}

    public static CreateAsync = async () => {
        console.log('Start queue processor...');

        const config = process.env.NODE_ENV === 'test' ? TestConfig : Config;
        const databaseConfig = config.database;
        const redisConfig = config.redis;

        const connection = await createConnection({
            name: 'processor',
            type: 'mysql',
            host: databaseConfig.host,
            port: +databaseConfig.port,
            username: databaseConfig.username,
            password: databaseConfig.password,
            database: databaseConfig.database,
            entities: databaseConfig.entities,
            synchronize: false,
            logging: databaseConfig.logging
        });
        const redisClient = new Redis(6379, process.env.REDIS_HOST, {
            db: redisConfig.db
        });
        const queue = new Queue('summary', {
            redis: { host: redisConfig.host, db: redisConfig.db }
        });

        const io = new Server();
        const pubClient = redisClient;
        const subClient = pubClient.duplicate();
        const redisAdapter = createAdapter({ pubClient, subClient });
        io.adapter(redisAdapter);

        const processorService = new ProcessorService(connection, redisClient, io);

        return new Processor(
            processorService,
            io,
            redisClient,
            subClient,
            connection,
            queue
        );
    };

    async listen() {
        const userRepository = this.connection.getRepository(User);

        this.queue.process('sync', async (job) => {
            console.log('Handling sync');
            try {
                const { user, socketId, days } = job.data;
                const userWhole: User = await userRepository.findOne(user.id);
                const newRecordsNumber = await this.processorService.syncWithThirdParty(
                    days,
                    userWhole
                );
                if (!socketId) return;

                const tmpEnd = endOfToday();
                const tmpStart = subYears(tmpEnd, 1);
                const endDate = format(tmpEnd, 'yyyy-MM-dd');
                const startDate = format(subDays(tmpStart, 7), 'yyyy-MM-dd');

                const cacheString = getCacheString(
                    'Summaries',
                    user.id,
                    startDate,
                    endDate
                );
                // if there is no new record, using cache
                if (newRecordsNumber == 0) {
                    const cacheSummaries = await this.redisClient.get(cacheString);
                    if (cacheSummaries !== null) {
                        const event = await this.processCacheData(
                            cacheSummaries,
                            user,
                            cacheString
                        );
                        this.io.to(`Room ${user.id}`).emit(event.event, event.data);
                        return;
                    }
                }

                const rawData = await this.processorService.getRawDailySummaries(
                    startDate,
                    endDate,
                    user
                );
                const summaries = await this.processorService.processTheRawSummaries(
                    rawData
                );
                const currentProject = await this.processorService.getProjectByUser(user);
                let result;

                if (rawData.length === 0) {
                    result = {
                        current_project: currentProject
                    };
                } else {
                    const streak = await this.processorService.getCurrentStreak(user);
                    const totalYear = this.processorService.getTotalDuration(rawData);
                    const totalThisMonth =
                        this.processorService.getTotalThisMonth(rawData);

                    result = {
                        current_project: currentProject,
                        summaries: summaries,
                        streak,
                        total_last_year: totalYear,
                        total_this_month: totalThisMonth
                    };
                }

                await this.redisClient.set(
                    cacheString,
                    JSON.stringify(result),
                    'EX',
                    3600
                );
                this.io.to(socketId).emit('sync', JSON.stringify(result));
            } catch (err) {
                console.log(err);
            }
        });
    }

    async processCacheData(
        cacheSummaries: string,
        user: any,
        cacheString: string
    ): Promise<any> {
        let { summaries, streak, total_last_year, total_this_month, current_project } =
            JSON.parse(cacheSummaries);

        if (current_project === undefined) {
            current_project = await this.processorService.getProjectByUser(user);

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

    async close() {
        this.io.disconnectSockets(true);
        await this.redisClient.quit();
        await this.connection.close();
        await this.queue.close();
        await this.subClient.quit();
    }
}

if (process.env.NODE_ENV !== 'test')
    Processor.CreateAsync().then((main) => main.listen());
