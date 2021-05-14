import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SummariesService } from './summaries.service';
import { SummariesController } from './summaries.controller';
import { Project, DailySummary } from './entities';
import { Interfaces } from './constants';

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
