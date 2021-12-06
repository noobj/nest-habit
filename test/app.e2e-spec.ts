import { Test, TestingModule } from '@nestjs/testing';
import { ImATeapotException, INestApplicationContext } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from 'src/app.module';
import { User } from 'src/app/modules/users/users.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from 'src/config/test.config';
import { getConnection, Repository } from 'typeorm';
import * as session from 'express-session';
import { join } from 'path';
import * as fs from 'fs';
import { staticChecker } from 'src/common/middleware/static-file-checker.middleware';
import { RedisSessionIoAdapter } from 'src/common/adapters/redis-session.io.adapter';
import Services from 'src/config/third-party-services.map';
import { NestExpressApplication } from '@nestjs/platform-express/interfaces';

describe('AppController (e2e)', () => {
    let app: NestExpressApplication;
    let server: INestApplicationContext | any;
    let cookies: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, ConfigModule.forRoot({ load: [configuration] })]
        }).compile();

        app = moduleFixture.createNestApplication();
        server = app.getHttpServer();
        app.useWebSocketAdapter(new RedisSessionIoAdapter(server, app));

        app.use(staticChecker);
        const configService = app.get(ConfigService);
        app.use(
            session({
                secret: configService.get('session.secret'),
                resave: false,
                saveUninitialized: false
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
            third_party_service: 'toggl'
        };
        await userRepository.save(user);
    });

    it('/POST auth/login', (done) => {
        const payload = {
            account: 'jjj',
            password: 'password'
        };

        return request(server)
            .post('/auth/login')
            .send(payload)
            .end(function (err, res) {
                expect(res.status).toEqual(201);
                expect(res.text).toEqual('done');
                // Save the cookie to use it later to retrieve the session
                cookies = res.headers['set-cookie'].pop().split(';')[0];
                done();
            });
    });

    it('/POST upload_avatar', async (done) => {
        const buffer = await fs.promises.readFile(join(__dirname, '../display.png'));

        return request(server)
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
        const spyLog = jest.spyOn(console, 'log').mockImplementation();
        return request(server)
            .post('/upload_avatar')
            .set('Cookie', cookies)
            .attach('file', buffer, { filename: 'display.pig' })
            .then((res) => {
                expect(spyLog).toBeCalledWith(
                    new ImATeapotException('Only image files are allowed!')
                );
                expect(res.status).toEqual(418);
                expect(res.body.message).toEqual('Only image files are allowed!');
                spyLog.mockRestore();
                done();
            });
    });

    it('/GET profile', (done) => {
        return request(server)
            .get('/profile')
            .set('Cookie', cookies)
            .send()
            .end((err, res) => {
                expect(res.status).toEqual(200);
                expect(res.body.id).toEqual(222);
                expect(res.body.account).toEqual('jjj');

                done();
            });
    });

    it('/GET static nonexist img', () => {
        return request(server)
            .get('/img/abc.jpg')
            .set('Cookie', cookies)
            .send()
            .expect(404);
    });

    it('/POST api_token', (done) => {
        const payload = {
            api_token: '1cf1a1e2b149f8465373bfcacb7a831e',
            service: 'toggl'
        };

        return request(server)
            .post('/api_token')
            .send(payload)
            .set('Cookie', cookies)
            .end(function (err, res) {
                expect(res.status).toEqual(201);
                done();
            });
    });

    it('/GET refresh', (done) => {
        return request(server)
            .get('/refresh')
            .set('Cookie', cookies)
            .send()
            .end((err, res) => {
                expect(res.status).toEqual(200);
                expect(res.text).toEqual('done');

                done();
            });
    });

    it('/GET services', (done) => {
        return request(server)
            .get('/services')
            .set('Cookie', cookies)
            .send()
            .end((err, res) => {
                expect(res.status).toEqual(200);
                expect(JSON.parse(res.text)).toEqual(Object.keys(Services));

                done();
            });
    });

    it('/GET logout', () => {
        return request(server).get('/logout').set('Cookie', cookies).send().expect(200);
    });

    it('/GET refresh Unauthorized', () => {
        return request(server).get('/refresh').set('Cookie', cookies).send().expect(401);
    });

    it('/GET profile Unauthorized', () => {
        return request(server).get('/profile').set('Cookie', cookies).send().expect(401);
    });

    afterAll(async () => {
        await getConnection().synchronize(true); // clean up all data
        app.close();
    });
});
