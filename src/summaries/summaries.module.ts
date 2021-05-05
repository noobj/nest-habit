import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SummariesService } from './summaries.service';
import { SummariesController } from './summaries.controller';
import { DailySummary } from './daily_summary.entity';
import { Project } from './project.entity';
import { Interfaces } from './types';

@Module({
    imports: [TypeOrmModule.forFeature([DailySummary, Project])],
    providers: [{ provide: Interfaces.IBasicService, useClass: SummariesService }],
    controllers: [SummariesController],
})
export class SummariesModule {}
