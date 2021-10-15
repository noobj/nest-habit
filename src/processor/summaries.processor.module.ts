import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import {
    SummaryProcessor,
    SummariesService,
    ProjectService,
    Project,
    DailySummary
} from 'src/app/modules/summaries';
import { Interfaces } from 'src/app/modules/summaries/constants';
import { UsersModule } from 'src/app/modules/users';
import { ThirdPartyModule } from 'src/app/modules/ThirdParty/third-party.module';
import { RedisModule } from 'src/app/modules/redis/redis.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'summary'
        }),
        TypeOrmModule.forFeature([DailySummary, Project]),
        UsersModule,
        ThirdPartyModule,
        RedisModule.forRootAsync({
            useFactory: async (configService: ConfigService) => ({
                host: configService.get('redis.host'),
                db: configService.get('redis.db')
            }),
            inject: [ConfigService],
            imports: [ConfigModule]
        })
    ],
    providers: [
        SummaryProcessor,
        SummariesService,
        ProjectService,
        { provide: Interfaces.IBasicService, useClass: SummariesService }
    ],
    exports: [SummariesService, ProjectService]
})
export class SummariesModule {}
