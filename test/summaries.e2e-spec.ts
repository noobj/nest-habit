import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
            .expect(200)
            .end((err, res) => {
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
            .expect(201)
            .end((err, res) => {
                expect(spyLog).toBeCalledWith('User jjj Updated 3 rows');

                done();
            });
    });

    afterAll(async () => {
        await getConnection().synchronize(true); // clean up all data
        app.close();
    });
});
