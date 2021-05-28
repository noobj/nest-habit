import {
    Controller,
    Get,
    Query,
    HttpStatus,
    ValidationPipe,
    Inject,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsDateString } from 'class-validator';

import { IBasicService } from './interfaces/basic.service';
import { Interfaces } from './constants';
import { ProjectService } from './projects.service';

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
        private projectService: ProjectService
    ) {}

    @UseGuards(AuthGuard('jwt'))
    @Get('project_name')
    async getProjectNameByUser(@Request() req) {
        const project = await this.projectService.getProjectByUser(req.user);

        return {
            statusCode: HttpStatus.OK,
            data: project.name,
        };
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    async showAll(@Query(new ValidationPipe()) dateRange: DateRange, @Request() req) {
        const rawData = await this.summariesService.getRawDailySummaries(
            dateRange.start_date,
            dateRange.end_date,
            req.user
        );

        if (rawData.length === 0) {
            return {
                statusCode: HttpStatus.NO_CONTENT,
                data: 'No Data',
            };
        }
        const summries = await this.summariesService.processTheRawSummaries(rawData);
        const longestRecord = this.summariesService.getLongestDayRecord(rawData);
        const totalYear = this.summariesService.getTotalDuration(rawData);
        const totalThisMonth = this.summariesService.getTotalThisMonth(rawData);

        const result = {
            summaries: summries,
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
