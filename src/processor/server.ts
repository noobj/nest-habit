import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.processor.module';
import { RedisSocketIoAdapter } from './redis-socket.io.adapter';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const server = app.getHttpServer();
    app.useWebSocketAdapter(new RedisSocketIoAdapter(server, app));

    app.listen(3003);
}
bootstrap();
