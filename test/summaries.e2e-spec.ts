import { Test, TestingModule } from '@nestjs/testing';
import { ImATeapotException, INestApplicationContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from 'src/config/test.config';
import { User } from './../src/app/modules/users/users.entity';
import { Project } from './../src/app/modules/summaries/entities/project.entity';
import { getConnection, Repository } from 'typeorm';
import * as session from 'express-session';
import { RedisSessionIoAdapter } from 'src/common/adapters/redis-session.io.adapter';
import * as redis from 'redis';
import * as connectRedis from 'connect-redis';
import { DailySummary } from 'src/app/modules/summaries/entities';
import { getCacheString } from 'src/common/helpers/utils';
import { NestExpressApplication } from '@nestjs/platform-express/interfaces';
import { ThirdPartyServiceKeys } from 'src/app/modules/ThirdParty/third-party.factory';

describe('SummariesController (e2e)', () => {
    let app: NestExpressApplication;
    let cookies: string;
    let server: INestApplicationContext | any;
    let redisClient: redis.RedisClient;
    let summariesReop: Repository<DailySummary>;
    let project: Project;
    let currentUser: User;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, ConfigModule.forRoot({ load: [configuration] })]
        }).compile();

        app = moduleFixture.createNestApplication();
        server = app.getHttpServer();
        app.useWebSocketAdapter(new RedisSessionIoAdapter(server, app));
        const configService = app.get(ConfigService);
        const RedisStore = connectRedis(session);
        redisClient = redis.createClient({ db: configService.get('redis.db') });

        app.use(
            session({
                store: new RedisStore({ client: redisClient }),
                secret: 'secret',
                resave: false,
                saveUninitialized: false
            })
        );
        await app.init();

        const userRepository: Repository<User> = moduleFixture.get('UserRepository');
        summariesReop = moduleFixture.get('DailySummaryRepository');
        currentUser = {
            id: 222,
            account: 'jjj',
            email: 'marley.lemke@example.org',
            password: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            toggl_token: '1cf1a1e2b149f8465373bfcacb7a831e',
            third_party_service: 'toggl' as ThirdPartyServiceKeys
        };
        await userRepository.save(currentUser);
    });

    it('/POST auth/login', (done) => {
        const payload = {
            account: 'jjj',
            password: 'password'
        };

        request(server)
            .post('/auth/login')
            .send(payload)
            .end(function (err, res) {
                // Save the cookie to use it later to retrieve the session
                cookies = res.headers['set-cookie'].pop().split(';')[0];
                done();
            });
    });

    it('/GET projects no current project', (done) => {
        request(server)
            .get('/projects')
            .set('Cookie', cookies)
            .send()
            .end((err, res) => {
                expect(res.status).toEqual(200);
                expect(res.body.data.allProjects).toEqual(['ffff', 'ggg', 'meditation']);
                expect(res.body.data.currentProject).toEqual(null);
                done();
            });
    });

    it('/POST project empty project', (done) => {
        const payload = {
            project_name: 'ffff'
        };
        request(server)
            .post('/project')
            .set('Cookie', cookies)
            .send(payload)
            .end((err, res) => {
                expect(res.status).toEqual(201);
                done();
            });
    });

    it('/POST project', (done) => {
        const spyLog = jest.spyOn(console, 'log').mockImplementation();
        const payload = {
            project_name: 'meditation'
        };
        request(server)
            .post('/project')
            .set('Cookie', cookies)
            .send(payload)
            .end((err, res) => {
                expect(res.status).toEqual(201);
                spyLog.mockRestore();
                done();
            });
    });

    it('/GET projects', (done) => {
        request(server)
            .get('/projects')
            .set('Cookie', cookies)
            .send()
            .end((err, res) => {
                expect(res.status).toEqual(200);
                expect(res.body.data.allProjects).toEqual(['ffff', 'ggg', 'meditation']);
                expect(res.body.data.currentProject.name).toEqual('meditation');
                project = res.body.data.currentProject;
                done();
            });
    });

    it('/POST project with nonexist project', (done) => {
        const payload = {
            project_name: 'jjj'
        };
        const spyLog = jest.spyOn(console, 'log').mockImplementation();
        request(server)
            .post('/project')
            .set('Cookie', cookies)
            .send(payload)
            .end((err, res) => {
                expect(res.status).toEqual(400);
                expect(spyLog).toBeCalledWith(
                    new ImATeapotException('Project Not Found')
                );
                expect(res.body.message).toEqual('Project Not Found');
                spyLog.mockRestore();
                done();
            });
    });

    // it('/WS sync', (done) => {
    //     const opts = {
    //         extraHeaders: {
    //             Cookie: cookies
    //         }
    //     };
    //     summariesReop.delete(1);
    //     const socket = io('ws://localhost:3333', opts);

    //     socket.on('connect', () => {
    //         socket.emit('sync', { projectName: 'meditation' });
    //     });

    //     socket.on('sync', (data: any) => {
    //         expect(data).toBeDefined();
    //         socket.disconnect();
    //         done();
    //     });

    //     socket.on('notice', (data: any) => {
    //         expect(JSON.parse(data)).toEqual({
    //             date: '2021-06-15',
    //             project: 2,
    //             id: 6,
    //             duration: '3m',
    //             userId: 222,
    //             account: 'jjj'
    //         });
    //     });
    // });

    // it('/WS sync cache', (done) => {
    //     const opts = {
    //         extraHeaders: {
    //             Cookie: cookies
    //         }
    //     };

    //     const socket = io('ws://localhost:3333', opts);

    //     socket.on('connect', () => {
    //         socket.emit('sync', { projectName: 'meditation' });
    //     });

    //     socket.on('sync', async (data: any) => {
    //         expect(data).toBeDefined();

    //         const tmpEnd = endOfToday();
    //         const tmpStart = subYears(tmpEnd, 1);
    //         const endDate = format(tmpEnd, 'yyyy-MM-dd');
    //         const startDate = format(subDays(tmpStart, 7), 'yyyy-MM-dd');
    //         const cacheString = getCacheString('Summaries', 222, startDate, endDate);

    //         redisClient.get(cacheString, (err, result) => {
    //             expect(JSON.parse(result).summaries).toEqual(JSON.parse(data).summaries);
    //         });
    //         socket.disconnect();
    //         done();
    //     });
    // });

    it('/GET summaries', async () => {
        const summaries = [
            {
                date: '2022-05-23',
                duration: 3600000,
                project: project.id,
                user: currentUser
            },
            {
                date: '2022-05-24',
                duration: 7800000,
                project: project.id,
                user: currentUser
            },
            {
                date: '2022-05-25',
                duration: 1800000,
                project: project.id,
                user: currentUser
            }
        ];
        await summariesReop.insert(summaries);

        const query = {
            start_date: '2022-05-22',
            end_date: '2022-05-26'
        };
        jest.useFakeTimers('modern').setSystemTime(new Date('2022-05-25').getTime());
        request(server)
            .get('/summaries')
            .set('Cookie', cookies)
            .query(query)
            .end((err, res) => {
                expect(res.body.data.summaries).toEqual([
                    {
                        date: 'May 23, 2022',
                        level: 3,
                        timestamp: 1653235200000,
                        duration: '1h0m'
                    },
                    {
                        date: 'May 24, 2022',
                        level: 3,
                        timestamp: 1653321600000,
                        duration: '2h10m'
                    },
                    {
                        date: 'May 25, 2022',
                        level: 2,
                        timestamp: 1653408000000,
                        duration: '30m'
                    }
                ]);
                expect(res.body.data.streak).toEqual(1);
                expect(res.body.data.total_last_year).toEqual('3h40m');
                expect(res.status).toEqual(200);
                jest.useRealTimers();
            });
    });

    // Don't need to set the system datetime, since its fetched from cache
    it('/GET summaries from cache', (done) => {
        const query = {
            start_date: '2022-05-22',
            end_date: '2022-05-26'
        };
        request(server)
            .get('/summaries')
            .set('Cookie', cookies)
            .query(query)
            .end((err, res) => {
                const cacheString = getCacheString(
                    'Summaries',
                    222,
                    query.start_date,
                    query.end_date
                );
                redisClient.get(cacheString, (err, result) => {
                    expect(JSON.parse(result)).toEqual(res.body.data);
                });

                expect(res.body.data.streak).toEqual(1);
                expect(res.body.data.total_last_year).toEqual('3h40m');
                expect(res.status).toEqual(200);
                done();
            });
    });

    it('/GET summaries wrong format of dates', (done) => {
        const query = {
            start_date: '2021-02',
            end_date: '2021-26'
        };
        request(server)
            .get('/summaries')
            .set('Cookie', cookies)
            .query(query)
            .end((err, res) => {
                expect(res.status).toEqual(400);
                expect(res.body.message).toEqual([
                    'end_date must be a valid ISO 8601 date string'
                ]);
                done();
            });
    });

    it('/GET summaries no data in given date range', (done) => {
        const query = {
            start_date: '2012-05-22',
            end_date: '2012-05-26'
        };
        request(server)
            .get('/summaries')
            .set('Cookie', cookies)
            .query(query)
            .end((err, res) => {
                expect(res.body.statusCode).toEqual(204);
                expect(res.body.data).toEqual('No Data');
                done();
            });
    });

    afterAll(async () => {
        await redisClient.flushdb();
        await getConnection().synchronize(true); // clean up all data
        await redisClient.quit();

        await app.close();
    });
});
