import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as moment from 'moment-timezone';

import { DailySummary, Project } from './entities';
import { IBasicService } from './interfaces';
import { CreateDailySummaryDto, WrapperCreateDailySummaryDto } from './daily_summary_dto';
import { validate } from 'class-validator';
import { ClassTransformer } from 'class-transformer';

/**
 * The return format for frontend use
 */
interface IFormatedSummary {
    level: number;
    date: string;
    timestamp: number;
    duration: string;
}

@Injectable()
export class SummariesService implements IBasicService {
    constructor(
        @InjectRepository(DailySummary)
        private dailySummaryRepository: Repository<DailySummary>,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>
    ) {
        moment.tz.setDefault('Asia/Taipei');
    }

    public async getProjectIdByName(name: string): Promise<number> {
        const project = await this.projectRepository.findOne({
            where: { name: name },
        });

        return project.id;
    }

    public async getRawDailySummaries(
        startDate: string,
        endDate: string,
        project = 'meditation'
    ): Promise<DailySummary[]> {
        const projectId = await this.getProjectIdByName(project);

        return await this.dailySummaryRepository.find({
            where: [
                {
                    date: Between(startDate, endDate),
                    project: projectId,
                },
            ],
        });
    }

    public async processTheRawSummaries(rawData: DailySummary[]): Promise<IFormatedSummary[]> {
        return rawData.map((entry) => {
            const level = this.calLevel(entry.duration);
            const timestamp = moment(entry.date, 'YYYY-MM-DD').valueOf();
            const duration = this.convertRawDurationToFormat(entry.duration);

            return {
                date: moment(entry.date).format('MMM DD, YYYY'),
                level: level,
                timestamp: timestamp,
                duration: duration,
            };
        });
    }

    private calLevel(duration: number): number {
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

    private convertRawDurationToFormat(duration: number): string {
        const durationInMinute = duration / 1000 / 60;

        if (durationInMinute < 1) {
            return '1m';
        }

        const hours = Math.floor(durationInMinute / 60);
        const minutes = Math.floor(durationInMinute % 60);

        if (hours == 0) return `${minutes}m`;

        return `${hours}h${minutes}m`;
    }

    public getLongestDayRecord(rawData: DailySummary[]): { date: string; duration: string } {
        const longestRecord = rawData.sort((a, b) => {
            return b.duration - a.duration;
        })[0];

        return {
            date: longestRecord.date,
            duration: this.convertRawDurationToFormat(longestRecord.duration),
        };
    }

    public getTotalDuration(rawData: DailySummary[]): string {
        return this.convertRawDurationToFormat(
            rawData.reduce((sum, entry) => {
                return (sum += entry.duration);
            }, 0)
        );
    }

    public getTotalThisMonth(rawData: DailySummary[]): string {
        const stingOfThisMonth = moment().format('YYYY-MM');

        const sum = rawData
            .filter((entry) => {
                return entry.date.includes(stingOfThisMonth);
            })
            .reduce((sum, entry) => (sum += entry.duration), 0);

        return this.convertRawDurationToFormat(sum);
    }

    public async upsert(data: CreateDailySummaryDto[]) {
        const classTransformer = new ClassTransformer();
        const entity = classTransformer.plainToClass(CreateDailySummaryDto, data);
        const wrapped = new WrapperCreateDailySummaryDto(entity);
        const errors = await validate(wrapped);
        if (errors.length > 0) {
            throw new BadRequestException('Validation failed');
        }

        try {
            return await this.dailySummaryRepository
                .createQueryBuilder()
                .insert()
                .values(data)
                .orUpdate({
                    conflict_target: 'daily_summaries.uni_prj_date',
                    overwrite: ['duration'],
                })
                .execute()
                .then((result) => result.raw);
        } catch (e) {
            console.log('Upsert failed: ', e);
        }
    }
}
