import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';

import { DailySummary } from './daily_summary.entity';
import { Project } from './project.entity';
import * as moment from 'moment';

/**
 * The return format for frontend use
 */
interface IFormatedSummary extends DailySummary {
    level: number;
    timestamp: number;
}

@Injectable()
export class SummariesService {
    constructor(
        @InjectRepository(DailySummary)
        private dailySummaryRepository: Repository<DailySummary>,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
    ) {}

    async getProjectIdByName(name: string): Promise<number> {
        let project = await this.projectRepository.findOne({
            where: { name: name },
        });

        return project.id;
    }

    async getRawDailySummaries(
        projectId: number,
        startDate: string,
        endDate: string,
    ): Promise<DailySummary[]> {
        return await this.dailySummaryRepository.find({
            where: [
                {
                    date: Between(startDate, endDate),
                    project: projectId,
                },
            ],
        });
    }

    async getRangeDailySummaries(
        project: string = 'meditation',
        startDate: string,
        endDate: string,
    ): Promise<IFormatedSummary[]> {
        let projectId = await this.getProjectIdByName(project);
        let rawData = await this.getRawDailySummaries(
            projectId,
            startDate,
            endDate,
        );

        return rawData.map((entry) => {
            const level = this.calLevel(entry.duration);
            const timestamp = moment(entry.date, 'YYYY-MM-DD').valueOf();
            const extraProperties = { level: level, timestamp: timestamp };
            entry.date = moment(entry.date).format('MMM DD, YYYY');

            return Object.assign({}, entry, extraProperties);
        });
    }

    calLevel(duration: number): number {
        const MAX_DURATION_LEVEL_INDEX = 5;
        const MAX_DURATION_LEVEL = 4;
        const durationLevelMap = new Map([
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 3],
            [4, 3],
            [5, 3],
        ]);

        const levelIndex = Math.floor(duration / 1000 / 60 / 30);
        return levelIndex > MAX_DURATION_LEVEL_INDEX
            ? MAX_DURATION_LEVEL
            : durationLevelMap.get(levelIndex);
    }
}
