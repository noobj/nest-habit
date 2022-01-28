import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BullModule } from '@nestjs/bull';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { TelegrafModule } from 'nestjs-telegraf';

import { UsersModule } from './app/modules/users/users.module';
import { SummariesModule, SummariesController } from './app/modules/summaries';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AuthModule } from './app/auth/auth.module';
import { AppController } from './app.controller';
import { CommandsModule } from './app/console/commands.module';
import configuration from './config/configuration';
import { ThirdPartyModule } from './app/modules/ThirdParty/third-party.module';
import { SocketServerModule } from 'src/app/modules/socket-server/socket-server.module';
import { CronModule } from './app/modules/cron/cron.module';

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                redis: {
                    host: configService.get('redis.host'),
                    db: configService.get('redis.db')
                }
            })
        }),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, 'public'),
            renderPath: '/'
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
                entities: configService.get('database.entities'),
                synchronize: configService.get<boolean>('database.synchronize'),
                logging: configService.get<boolean>('database.logging')
            })
        }),
        ThirdPartyModule,
        UsersModule,
        SummariesModule,
        AuthModule,
        ConfigModule.forRoot({ load: [configuration] }),
        ScheduleModule.forRoot(),
        CommandsModule,
        CronModule.register(),
        WinstonModule.forRoot({
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.ms(),
                        nestWinstonModuleUtilities.format.nestLike()
                    )
                })
            ]
        }),
        SocketServerModule,
        TelegrafModule.forRoot({
            token: process.env.TELEGRAM_BOT_API_KEY
        })
    ],
    controllers: [AppController]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        if (process.env.NODE_ENV !== 'test')
            consumer
                .apply(LoggerMiddleware)
                .forRoutes(SummariesController, AppController);
    }
}
