import { Test, TestingModule } from '@nestjs/testing';
import { ImATeapotException, INestApplicationContext } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from 'src/app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from 'src/config/test.config';
import * as session from 'express-session';
import { join } from 'path';
import * as fs from 'fs';
import { staticChecker } from 'src/common/middleware/static-file-checker.middleware';
import { RedisSessionIoAdapter } from 'src/common/adapters/redis-session.io.adapter';
import Services from 'src/config/third-party-services.map';
import { NestExpressApplication } from '@nestjs/platform-express/interfaces';
import { ThirdPartyServiceKeys } from 'src/app/modules/ThirdParty/third-party.factory';
import { UserDocument } from 'src/schemas/user.schema';
import { Model } from 'mongoose';
import { clearCollections } from './test.helper';

describe('AppController (e2e)', () => {
    let app: NestExpressApplication;
    let server: INestApplicationContext | any;
    let cookies: string;
    let currentUser: UserDocument;
    let userModel: Model<UserDocument>;

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

        userModel = moduleFixture.get('UserModel');
        const fakeUser = {
            account: 'jjj',
            email: 'marley.lemke@example.org',
            password: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            toggl_token: '1cf1a1e2b149f8465373bfcacb7a831e',
            third_party_service: 'toggl' as ThirdPartyServiceKeys
        };
        currentUser = await userModel.create(fakeUser);
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
                expect(res.status).toEqual(201);
                expect(res.text).toEqual('done');
                // Save the cookie to use it later to retrieve the session
                cookies = res.headers['set-cookie'].pop().split(';')[0];
                done();
            });
    });

    it('/POST upload_avatar', async () => {
        const buffer = await fs.promises.readFile(join(__dirname, '../img/display.png'));

        return request(server)
            .post('/upload_avatar')
            .set('Cookie', cookies)
            .attach('file', buffer, { filename: 'display.png' })
            .then((res) => {
                expect(res.body.filename).toEqual(`${currentUser.id}.jpg`);
                expect(res.body.originalname).toEqual('display.png');
            });
    });

    it('/POST upload_avatar unsupported file extension', async () => {
        const buffer = await fs.promises.readFile(join(__dirname, '../img/display.png'));
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
            });
    });

    it('/GET profile', (done) => {
        request(server)
            .get('/profile')
            .set('Cookie', cookies)
            .send()
            .end((err, res) => {
                console.log(res);
                expect(res.status).toEqual(200);
                expect(res.body._id).toEqual(currentUser.id);
                expect(res.body.account).toEqual('jjj');

                done();
            });
    });

    it('/GET static nonexist img', (done) => {
        request(server)
            .get('/img/abc.jpg')
            .set('Cookie', cookies)
            .send()
            .expect(404)
            .end(() => done());
    });

    it('/POST api_token', (done) => {
        const payload = {
            api_token: '1cf1a1e2b149f8465373bfcacb7a831e',
            service: 'toggl'
        };

        request(server)
            .post('/api_token')
            .send(payload)
            .set('Cookie', cookies)
            .end(function (err, res) {
                expect(res.status).toEqual(201);
                done();
            });
    });

    it('/GET refresh', (done) => {
        request(server)
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
        request(server)
            .get('/services')
            .set('Cookie', cookies)
            .send()
            .end((err, res) => {
                expect(res.status).toEqual(200);
                expect(JSON.parse(res.text)).toEqual(Object.keys(Services));

                done();
            });
    });

    it('/GET subscribe token', (done) => {
        request(server)
            .get('/sub_token')
            .set('Cookie', cookies)
            .send()
            .end((err, res) => {
                expect(res.status).toEqual(200);
                expect(res.text).toMatch(/[a-zA-Z0-9]{20}/);

                done();
            });
    });

    it('/GET logout', (done) => {
        request(server)
            .get('/logout')
            .set('Cookie', cookies)
            .send()
            .expect(200)
            .end(() => done());
    });

    it('/GET refresh Unauthorized', (done) => {
        request(server)
            .get('/refresh')
            .set('Cookie', cookies)
            .send()
            .expect(401)
            .end(() => done());
    });

    it('/GET profile Unauthorized', (done) => {
        request(server)
            .get('/profile')
            .set('Cookie', cookies)
            .send()
            .expect(401)
            .end(() => done());
    });

    afterAll(async () => {
        await clearCollections(userModel.db);
        app.close();
    });
});
