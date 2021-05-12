import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SummariesService } from './summaries.service';
import { SummariesController } from './summaries.controller';
import { DailySummary } from './entities/daily_summary.entity';
import { Project } from './entities/project.entity';
import { Interfaces } from './interfaces/types';

@Module({
    imports: [TypeOrmModule.forFeature([DailySummary, Project])],
    providers: [
        SummariesService,
        { provide: Interfaces.IBasicService, useClass: SummariesService },
    ],
    controllers: [SummariesController],
    exports: [SummariesService],
})
export class SummariesModule {}
