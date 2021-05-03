import { Module } from '@nestjs/common';
import { SummariesService } from './summaries.service';
import { SummariesController } from './summaries.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailySummary } from './daily_summary.entity';
import { Project } from './project.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DailySummary, Project])],
    providers: [SummariesService],
    controllers: [SummariesController],
})
export class SummariesModule {}
