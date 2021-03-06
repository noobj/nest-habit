import { NestFactory } from '@nestjs/core';
import * as session from 'express-session';
import { ConfigService } from '@nestjs/config';
import * as redis from 'redis';
import * as connectRedis from 'connect-redis';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { staticChecker } from './common/middleware/static-file-checker.middleware';
import { RedisSessionIoAdapter } from './common/adapters/redis-session.io.adapter';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        cors: {
            origin: [
                'http://192.168.56.101:3001',
                'http://localhost:3001',
                'http://127.0.0.1:3001'
            ],
            credentials: true
        }
    });
    const server = app.getHttpServer();
    app.useWebSocketAdapter(new RedisSessionIoAdapter(server, app));
    app.use(staticChecker);
    const configService = app.get(ConfigService);

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient({
        host: configService.get('redis.host'),
        db: configService.get('redis.db')
    });
    app.use(
        session({
            store: new RedisStore({ client: redisClient, ttl: 259200 }),
            secret: configService.get('session.secret'),
            resave: false,
            saveUninitialized: false
        })
    );

    const config = new DocumentBuilder()
        .setTitle('Nest Habit')
        .setDescription('The nest-habit API description')
        .setVersion('1.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(configService.get('PORT'));
}
bootstrap();
