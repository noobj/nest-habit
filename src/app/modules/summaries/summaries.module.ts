import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SummariesService } from './summaries.service';
import { SummariesController } from './summaries.controller';
import { ProjectService } from './projects.service';
import { Project, DailySummary } from './entities';
import { Interfaces } from './constants';
import { UsersModule } from '../users';
import SyncTogglModule from 'src/app/console/modules/sync-toggl/sync-toggl.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([DailySummary, Project]),
        UsersModule,
        forwardRef(() => SyncTogglModule),
    ],
    providers: [
        SummariesService,
        ProjectService,
        { provide: Interfaces.IBasicService, useClass: SummariesService },
    ],
    controllers: [SummariesController],
    exports: [SummariesService, ProjectService],
})
export class SummariesModule {}
