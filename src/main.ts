import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser());
    const configService = app.get(ConfigService);
    await app.listen(configService.get('PORT'));
}
bootstrap();
