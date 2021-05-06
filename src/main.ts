import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(
        session({
          secret: 'my-secret',
          resave: false,
          saveUninitialized: false,
        }),
    );
    const configService = app.get(ConfigService);
    await app.listen(configService.get('PORT'));
}
bootstrap();
