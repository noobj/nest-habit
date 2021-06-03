import { Test, TestingModule } from '@nestjs/testing';
import { ImATeapotException, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from 'src/config/test.config';
import { User } from './../src/app/modules/users/users.entity';
import { DailySummary } from 'src/app/modules/summaries/entities/daily_summary.entity';
import { Project } from 'src/app/modules/summaries/entities/project.entity';
import { getConnection, Repository } from 'typeorm';
import * as session from 'express-session';
import { join } from 'path';
import * as fs from 'fs';

describe('SummariesController (e2e)', () => {
    let app: INestApplication;
    let cookies;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRootAsync({
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: async (configService: ConfigService) => ({
                        type: configService.get('database.type') as 'mysql',
                        host: configService.get('database.host'),
                        port: configService.get('database.port'),
                        username: configService.get('database.username'),
                        password: configService.get<string>('database.password'),
                        database: configService.get<string>('database.database'),
                        entities: [User, DailySummary, Project],
                        synchronize: true,
                        logging: configService.get<boolean>('database.logging'),
                    }),
                }),
                AppModule,
                ConfigModule.forRoot({ load: [configuration] }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();

        const configService = app.get(ConfigService);
        app.use(
            session({
                secret: configService.get('session.secret'),
                resave: false,
                saveUninitialized: false,
            })
        );
        await app.init();

        const userRepository: Repository<User> = moduleFixture.get('UserRepository');
        const user = {
            id: 222,
            account: 'jjj',
            email: 'marley.lemke@example.org',
            password: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            toggl_token: '1cf1a1e2b149f8465373bfcacb7a831e',
        };
        await userRepository.save(user);
    });

    it('/POST auth/login', (done) => {
        const payload = {
            account: 'jjj',
            password: 'password',
        };

        return request(app.getHttpServer())
            .post('/auth/login')
            .send(payload)
            .end(function (err, res) {
                // Save the cookie to use it later to retrieve the session
                cookies = res.headers['set-cookie'].pop().split(';')[0];
                done();
            });
    });

    it('/GET projects', (done) => {
        return request(app.getHttpServer())
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

    it('/POST project', (done) => {
        const spyLog = jest.spyOn(console, 'log').mockImplementation();
        const payload = {
            project_name: 'meditation',
        };
        return request(app.getHttpServer())
            .post('/project')
            .set('Cookie', cookies)
            .send(payload)
            .end((err, res) => {
                expect(res.status).toEqual(201);
                expect(spyLog).toBeCalledWith('User jjj Updated 3 rows');
                spyLog.mockRestore();
                done();
            });
    });

    it('/POST project with nonexist project', (done) => {
        const payload = {
            project_name: 'jjj',
        };
        const spyLog = jest.spyOn(console, 'log').mockImplementation();
        return request(app.getHttpServer())
            .post('/project')
            .set('Cookie', cookies)
            .send(payload)
            .end((err, res) => {
                expect(res.status).toEqual(418);
                expect(spyLog).toBeCalledWith(
                    new ImATeapotException('Project Not Found')
                );
                expect(res.body.message).toEqual('Project Not Found');
                spyLog.mockRestore();
                done();
            });
    });

    it('/GET summaries', (done) => {
        const query = {
            start_date: '2021-05-22',
            end_date: '2021-05-26',
        };
        jest.useFakeTimers('modern').setSystemTime(new Date('2021-05-01').getTime());
        return request(app.getHttpServer())
            .get('/summaries')
            .set('Cookie', cookies)
            .query(query)
            .end((err, res) => {
                expect(res.body.data.summaries).toEqual([
                    {
                        date: 'May 25, 2021',
                        level: 4,
                        timestamp: 1621872000000,
                        duration: '3h0m',
                    },
                    {
                        date: 'May 24, 2021',
                        level: 3,
                        timestamp: 1621785600000,
                        duration: '2h0m',
                    },
                    {
                        date: 'May 23, 2021',
                        level: 3,
                        timestamp: 1621699200000,
                        duration: '1h0m',
                    },
                ]);
                expect(res.body.data.longest_record).toEqual({
                    date: '2021-05-25',
                    duration: '3h0m',
                });
                expect(res.body.data.total_last_year).toEqual('6h0m');
                expect(res.status).toEqual(200);
                jest.useRealTimers();
                done();
            });
    });

    it('/GET summaries wrong format of dates', (done) => {
        const query = {
            start_date: '2021-02',
            end_date: '2021-26',
        };
        return request(app.getHttpServer())
            .get('/summaries')
            .set('Cookie', cookies)
            .query(query)
            .end((err, res) => {
                expect(res.status).toEqual(400);
                expect(res.body.message).toEqual([
                    'end_date must be a valid ISO 8601 date string',
                ]);
                done();
            });
    });

    it('/GET summaries no data in given date range', (done) => {
        const query = {
            start_date: '2012-05-22',
            end_date: '2012-05-26',
        };
        return request(app.getHttpServer())
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
        await getConnection().synchronize(true); // clean up all data
        app.close();
    });
});
