import {
    Controller,
    Get,
    Query,
    Param,
    HttpStatus,
    ValidationPipe,
    Inject,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsDateString } from 'class-validator';

import { IBasicService } from './interfaces/basic.service';
import { Interfaces } from './constants';

class DateRange {
    @IsDateString()
    start_date: string;

    @IsDateString()
    end_date: string;
}

@Controller('summaries')
export class SummariesController {
    constructor(
        @Inject(Interfaces.IBasicService)
        private summariesService: IBasicService,
    ) {}

    @UseGuards(AuthGuard('jwt'))
    @Get(':project?')
    async showAll(
        @Param('project') projectName: string,
        @Query(new ValidationPipe()) dateRange: DateRange,
    ) {
        const rawData = await this.summariesService.getRawDailySummaries(
            dateRange.start_date,
            dateRange.end_date,
            projectName,
        );

        const summries = await this.summariesService.processTheRawSummaries(
            rawData,
        );
        const longestRecord = this.summariesService.getLongestDayRecord(
            rawData,
        );
        const totalYear = this.summariesService.getTotalDuration(rawData);
        const totalThisMonth = this.summariesService.getTotalThisMonth(rawData);

        const result = {
            summries: summries,
            longest_record: longestRecord,
            total_last_year: totalYear,
            total_this_month: totalThisMonth,
        };

        return {
            statusCode: HttpStatus.OK,
            data: result,
        };
    }
}
