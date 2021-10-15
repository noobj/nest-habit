import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as moment from 'moment';

import configuration from '../config/configuration';
import { SummariesModule } from './summaries.processor.module';
import { SocketServerModule } from 'src/app/modules/socket-server/socket-server.module';

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
        WinstonModule.forRoot({
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.ms(),
                        nestWinstonModuleUtilities.format.nestLike()
                    )
                }),
                new winston.transports.File({
                    filename: `logs/cron-${moment().format('YYYY-MM-DD')}.log`,
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.prettyPrint()
                    )
                })
            ]
        }),
        ConfigModule.forRoot({ load: [configuration] }),
        SummariesModule,
        SocketServerModule
    ]
})
export class AppModule {}
