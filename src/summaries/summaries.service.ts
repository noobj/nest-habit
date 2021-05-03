import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DailySummary } from './daily_summary.entity';

@Injectable()
export class SummariesService {
    constructor(
        @InjectRepository(DailySummary)
        private dailySummaryRepository: Repository<DailySummary>,
    ) {}

    async showAll() {
        return await this.dailySummaryRepository.find({
			where: [
                {project: 1}
			]
		});
    }
}
