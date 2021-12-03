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
    UseFilters
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsDateString } from 'class-validator';
import { forkJoin, from, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { Redis } from 'ioredis';
import { Express } from 'express';

import { IBasicService } from './interfaces/basic.service';
import { Interfaces } from './constants';
import { ProjectService } from './projects.service';
import { HttpExceptionFilter } from 'src/common/exception-filters/http-exception.filter';
import { DailySummary } from './entities';
import { RedisService } from '../redis';
import { getCacheString } from 'src/common/helpers/utils';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiInternalServerErrorResponse,
    ApiNoContentResponse,
    ApiOperation,
    ApiProperty,
    ApiQuery,
    ApiResponse,
    ApiTags
} from '@nestjs/swagger';
import { IFormatedSummary } from './summaries.service';

class DateRange {
    @ApiProperty()
    @IsDateString()
    start_date: string;

    @ApiProperty()
    @IsDateString()
    end_date: string;
}

class ProjectName {
    @ApiProperty()
    readonly project_name: string;
}

@ApiTags('summary')
@Controller()
export class SummariesController {
    private redisClient: Redis;

    constructor(
        @Inject(Interfaces.IBasicService)
        private summariesService: IBasicService<DailySummary, IFormatedSummary>,
        private projectService: ProjectService,
        private readonly redisService: RedisService
    ) {
        this.redisClient = this.redisService.getClient();
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('project')
    @UseFilters(new HttpExceptionFilter())
    @ApiOperation({ summary: 'Change tracking project and sync the data' })
    @ApiBody({
        description: 'project name',
        type: ProjectName
    })
    @ApiResponse({ status: 201, description: 'Success' })
    @ApiBadRequestResponse({ description: 'Wrong project input' })
    @ApiInternalServerErrorResponse()
    setCurrentProjectByName(
        @Request() req: Express.Request,
        @Body('project_name') projectName: string
    ) {
        return from(this.projectService.setCurrentProject(req.user, projectName)).pipe(
            map(() => 'done')
        );
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('projects')
    @ApiOperation({ summary: 'Get all projects of the user along with current project' })
    @ApiResponse({ status: 200, description: 'Success' })
    getProjectNameByUser(@Request() req: Express.Request) {
        return forkJoin({
            curretProject: this.projectService.getProjectByUser(req.user),
            allProjects: this.projectService.getAllProjects(req.user).then((res) => {
                return res.data.map((entry: { name: string }) => entry.name);
            })
        }).pipe(
            map(({ curretProject, allProjects }) => {
                const result =
                    curretProject == undefined
                        ? {
                              allProjects: allProjects,
                              currentProject: null
                          }
                        : {
                              allProjects: allProjects,
                              currentProject: curretProject
                          };

                return {
                    statusCode: HttpStatus.OK,
                    data: result
                };
            })
        );
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('summaries')
    @ApiOperation({
        summary:
            'Fetch all the entries within the date range along with some other statistics'
    })
    @ApiQuery({ name: 'start_date', type: String })
    @ApiQuery({ name: 'end_date', type: String })
    @ApiResponse({ status: 200, description: 'Success' })
    @ApiNoContentResponse({ description: 'No content' })
    async showAll(
        @Query(new ValidationPipe()) dateRange: DateRange,
        @Request() req: Express.Request & { user: { id: number; account: string } }
    ) {
        const cacheString = getCacheString(
            'summaries',
            req.user.id,
            dateRange.start_date,
            dateRange.end_date
        );

        // Fetch from redis first, if null then fetch from db
        const cacheSummaries = await this.redisClient.get(cacheString);
        if (cacheSummaries !== null)
            return {
                statusCode: HttpStatus.OK,
                data: JSON.parse(cacheSummaries)
            };

        return from(
            this.summariesService.getRawDailySummaries(
                dateRange.start_date,
                dateRange.end_date,
                req.user
            )
        ).pipe(
            mergeMap((rawData: DailySummary[]) => {
                if (rawData.length === 0) {
                    return of({
                        statusCode: HttpStatus.NO_CONTENT,
                        data: 'No Data'
                    });
                } else {
                    return forkJoin({
                        summries: this.summariesService.processTheRawSummaries(rawData),
                        streak: from(this.summariesService.getCurrentStreak(req.user)),
                        totalYear: of(this.summariesService.getTotalDuration(rawData)),
                        totalThisMonth: of(
                            this.summariesService.getTotalThisMonth(rawData)
                        )
                    }).pipe(
                        map(({ summries, streak, totalYear, totalThisMonth }) => {
                            return {
                                summaries: summries,
                                streak,
                                total_last_year: totalYear,
                                total_this_month: totalThisMonth
                            };
                        }),
                        tap((res) =>
                            from(
                                this.redisClient.set(
                                    cacheString,
                                    JSON.stringify(res),
                                    'EX',
                                    3600
                                )
                            )
                        ),
                        map((res) => {
                            return {
                                statusCode: HttpStatus.OK,
                                data: res
                            };
                        })
                    );
                }
            })
        );
    }
}
