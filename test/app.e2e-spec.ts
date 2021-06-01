import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './../src/app/modules/users/users.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from 'src/config/configuration';
import { DailySummary } from 'src/app/modules/summaries/entities/daily_summary.entity';
import { Project } from 'src/app/modules/summaries/entities/project.entity';
import { Repository } from 'typeorm';
import * as session from 'express-session';
import { join } from 'path';
import * as fs from 'fs';

describe('AppController (e2e)', () => {
    let app: INestApplication;
    let cookies;

    beforeAll(async () => {
        process.env.TYPEORM_CONNECTION = 'sqlite';
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRootAsync({
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: async (configService: ConfigService) => ({
                        type: 'mysql',
                        database: 'test',
                        username: 'linuxj',
                        password: '1234',
                        entities: [User, DailySummary, Project],
                        synchronize: true,
                        logging: false,
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
            .expect(201)
            .end(function (err, res) {
                expect(res.body.access_token).toBeDefined();
                // Save the cookie to use it later to retrieve the session
                cookies = res.headers['set-cookie'].pop().split(';')[0];
                done();
            });
    });

    it('/POST upload_avatar', async (done) => {
        const buffer = await fs.promises.readFile(join(__dirname, '../display.png'));

        return request(app.getHttpServer())
            .post('/upload_avatar')
            .set('Cookie', cookies)
            .attach('file', buffer, { filename: 'display.png' })
            .then((res) => {
                expect(res.body.filename).toEqual('222.jpg');
                expect(res.body.originalname).toEqual('display.png');

                done();
            });
    });

    it('/POST upload_avatar unsupported file extension', async (done) => {
        const buffer = await fs.promises.readFile(join(__dirname, '../display.png'));

        return request(app.getHttpServer())
            .post('/upload_avatar')
            .set('Cookie', cookies)
            .attach('file', buffer, { filename: 'display.pig' })
            .then((res) => {
                expect(res.status).toEqual(418);
                expect(res.body.message).toEqual('Only image files are allowed!');
                done();
            });
    });

    it('/GET profile', (done) => {
        return request(app.getHttpServer())
            .get('/profile')
            .set('Cookie', cookies)
            .send()
            .expect(200)
            .end((err, res) => {
                expect(res.body.id).toEqual(222);
                expect(res.body.account).toEqual('jjj');

                done();
            });
    });

    it('/GET logout', () => {
        return request(app.getHttpServer())
            .get('/logout')
            .set('Cookie', cookies)
            .send()
            .expect(200);
    });

    it('/GET profile Unauthorized and logout', () => {
        return request(app.getHttpServer())
            .get('/profile')
            .set('Cookie', cookies)
            .send()
            .expect(401);
    });

    afterAll(async () => {
        app.close();
    });
});
