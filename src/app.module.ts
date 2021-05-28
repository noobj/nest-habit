import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { UsersModule } from './app/modules/users/users.module';
import { SummariesModule, SummariesController } from './app/modules/summaries';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AuthModule } from './app/auth/auth.module';
import { AppController } from './app.controller';
import { CommandsModule } from './app/console/commands.module';
import configuration from './config/configuration';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, 'public'),
            renderPath: '/',
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                type: configService.get('database.type') as 'mysql',
                host: configService.get('database.host'),
                port: configService.get('database.port'),
                username: configService.get('database.username'),
                password: configService.get<string>('database.password'),
                database: configService.get<string>('database.database'),
                entities: [configService.get('database.entities')],
                synchronize: false,
                logging: configService.get<boolean>('database.logging'),
            }),
        }),
        UsersModule,
        SummariesModule,
        AuthModule,
        ConfigModule.forRoot({ load: [configuration] }),
        ScheduleModule.forRoot(),
        CommandsModule,
    ],
    controllers: [AppController],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes(SummariesController, AppController);
    }
}
