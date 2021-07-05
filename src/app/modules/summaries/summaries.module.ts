import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SummariesService } from './summaries.service';
import { SummariesController } from './summaries.controller';
import { ProjectService } from './projects.service';
import { Project, DailySummary } from './entities';
import { Interfaces } from './constants';
import { UsersModule } from '../users';
import SyncTogglModule from 'src/app/console/modules/sync-toggl/sync-toggl.module';
import { TogglModule } from '../toggl/toggl.module';
import { SummariesGateway } from './summaries.gateway';
import { RedisModule } from 'nestjs-redis';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        TypeOrmModule.forFeature([DailySummary, Project]),
        UsersModule,
        SyncTogglModule,
        TogglModule,
        RedisModule.forRootAsync({
            useFactory: async (configService: ConfigService) => ({
                host: 'localhost',
                port: 6379,
                db: configService.get('redis.db'),
            }),
            inject: [ConfigService],
            imports: [ConfigModule],
        }),
    ],
    providers: [
        SummariesService,
        ProjectService,
        SummariesGateway,
        { provide: Interfaces.IBasicService, useClass: SummariesService },
    ],
    controllers: [SummariesController],
    exports: [SummariesService, ProjectService],
})
export class SummariesModule {}
