import { NestFactory } from '@nestjs/core';
import * as session from 'express-session';
import { ConfigService } from '@nestjs/config';
import * as redis from 'redis';
import * as connectRedis from 'connect-redis';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { staticChecker } from './common/middleware/static-file-checker.middleware';

async function bootstrap() {
    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();

    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.use(staticChecker);
    const configService = app.get(ConfigService);
    app.use(
        session({
            store: new RedisStore({ client: redisClient }),
            secret: configService.get('session.secret'),
            resave: false,
            saveUninitialized: false,
        })
    );
    await app.listen(configService.get('PORT'));
}
bootstrap();
