import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BullModule } from '@nestjs/bull';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { TelegrafModule } from 'nestjs-telegraf';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersModule } from './app/modules/users/users.module';
import { SummariesModule, SummariesController } from './app/modules/summaries';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AuthModule } from './app/auth/auth.module';
import { AppController } from './app.controller';
import { CommandsModule } from './app/console/commands.module';
import configuration, { configs } from './config/configuration';
import { ThirdPartyModule } from './app/modules/ThirdParty/third-party.module';
import { SocketServerModule } from 'src/app/modules/socket-server/socket-server.module';
import { CronModule } from './app/modules/cron/cron.module';

const modulesForImport = [
    MongooseModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
            let url = '';
            if (configService.get('mongo.user') == undefined)
                url = `${configService.get('mongo.prefix')}://${configService.get(
                    'mongo.host'
                )}`;
            else
                url = `${configService.get('mongo.prefix')}://${configService.get(
                    'mongo.user'
                )}:${configService.get('mongo.password')}@${configService.get(
                    'mongo.host'
                )}`;

            return {
                loggerLevel: 'error',
                dbName: configService.get('mongo.database'),
                uri: url
            };
        }
    }),
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
    SocketServerModule
];

if (configs.telegram.bot_enable === true && configs.node_env !== 'test')
    modulesForImport.push(
        TelegrafModule.forRoot({
            token: configs.telegram.bot_api_key
        })
    );

@Module({
    imports: modulesForImport,
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
