import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.processor.module';
import { RedisSessionIoAdapter } from '../common/adapters/redis-session.io.adapter';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.useWebSocketAdapter(new RedisSessionIoAdapter(app, 'sub'));

    app.listen(3001);
}
bootstrap();
