import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { SummariesService } from './summaries.service';
import { SummariesController } from './summaries.controller';
import { ProjectService } from './projects.service';
import { Project, DailySummary } from './entities';
import { Interfaces } from './constants';
import { UsersModule } from '../users';
import { ThirdPartyModule } from '../ThirdParty/third-party.module';
import { SummariesGateway } from './summaries.gateway';
import { RedisModule } from '../redis/redis.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SummariesUpdate } from './summaries.update';
import { NotificationModule } from '../notification/notification.module';

const providers: Provider[] = [
    SummariesService,
    ProjectService,
    SummariesGateway,
    { provide: Interfaces.IBasicService, useClass: SummariesService }
];

if (process.env.NODE_ENV !== 'test') providers.push(SummariesUpdate);

@Module({
    imports: [
        NotificationModule,
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
        }),
        ScheduleModule.forRoot()
    ],
    providers,
    controllers: [SummariesController],
    exports: [SummariesService, ProjectService]
})
export class SummariesModule {}
