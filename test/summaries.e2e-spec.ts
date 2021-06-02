import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from 'src/config/configuration';
import { User } from './../src/app/modules/users/users.entity';
import { DailySummary } from 'src/app/modules/summaries/entities/daily_summary.entity';
import { Project } from 'src/app/modules/summaries/entities/project.entity';
import { Repository } from 'typeorm';
import * as session from 'express-session';
import { join } from 'path';
import * as fs from 'fs';

describe('SummariesController (e2e)', () => {
    let app: INestApplication;
    let cookies;

    beforeAll(async () => {
        process.env.TYPEORM_CONNECTION = 'sqlite';
        process.env.TYPEORM_DATABASE = ':memory:';
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [User, DailySummary, Project],
                    synchronize: true,
                    logging: false,
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
            .expect(201)
            .end(function (err, res) {
                expect(res.body.access_token).toBeDefined();
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

    afterAll(async () => {
        app.close();
    });
});
