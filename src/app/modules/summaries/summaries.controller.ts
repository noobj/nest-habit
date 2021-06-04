import {
    Controller,
    Get,
    Query,
    HttpStatus,
    ValidationPipe,
    Inject,
    UseGuards,
    Request,
    Post,
    Body,
    UseFilters,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsDateString } from 'class-validator';

import { IBasicService } from './interfaces/basic.service';
import { Interfaces } from './constants';
import { ProjectService } from './projects.service';
import { HttpExceptionFilter } from 'src/common/exception-filters/http-exception.filter';

class DateRange {
    @IsDateString()
    start_date: string;

    @IsDateString()
    end_date: string;
}

@Controller()
export class SummariesController {
    constructor(
        @Inject(Interfaces.IBasicService)
        private summariesService: IBasicService,
        private projectService: ProjectService
    ) {}

    @UseGuards(AuthGuard('jwt'))
    @Post('project')
    @UseFilters(new HttpExceptionFilter())
    async setCurrentProjectByName(@Request() req, @Body('project_name') projectName) {
        await this.projectService.setCurrentProject(req.user, projectName);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('projects')
    async getProjectNameByUser(@Request() req) {
        const curretProject = await this.projectService.getProjectByUser(req.user);
        const allProjects = await this.projectService
            .getAllProjects(req.user)
            .then((res) => {
                return res.data.map((entry) => entry.name);
            });

        const result =
            curretProject == undefined
                ? {
                      allProjects: allProjects,
                      currentProject: null,
                  }
                : {
                      allProjects: allProjects,
                      currentProject: curretProject,
                  };

        return {
            statusCode: HttpStatus.OK,
            data: result,
        };
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('summaries')
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
