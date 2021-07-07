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
import { forkJoin, from, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { Redis } from 'ioredis';

import { IBasicService } from './interfaces/basic.service';
import { Interfaces } from './constants';
import { ProjectService } from './projects.service';
import { HttpExceptionFilter } from 'src/common/exception-filters/http-exception.filter';
import { DailySummary } from './entities';
import { RedisService } from 'nestjs-redis';
import { getCacheString } from 'src/common/helpers/utils';

class DateRange {
    @IsDateString()
    start_date: string;

    @IsDateString()
    end_date: string;
}

@Controller()
export class SummariesController {
    private redisClient: Redis;

    constructor(
        @Inject(Interfaces.IBasicService)
        private summariesService: IBasicService,
        private projectService: ProjectService,
        private readonly redisService: RedisService
    ) {
        this.redisClient = this.redisService.getClient();
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('project')
    @UseFilters(new HttpExceptionFilter())
    setCurrentProjectByName(@Request() req, @Body('project_name') projectName) {
        return from(this.projectService.setCurrentProject(req.user, projectName)).pipe(
            map(() => 'done')
        );
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('projects')
    getProjectNameByUser(@Request() req) {
        return forkJoin({
            curretProject: this.projectService.getProjectByUser(req.user),
            allProjects: this.projectService.getAllProjects(req.user).then((res) => {
                return res.data.map((entry) => entry.name);
            }),
        }).pipe(
            map(({ curretProject, allProjects }) => {
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
            })
        );
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('summaries')
    async showAll(@Query(new ValidationPipe()) dateRange: DateRange, @Request() req) {
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
                data: JSON.parse(cacheSummaries),
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
                        data: 'No Data',
                    });
                } else {
                    return forkJoin({
                        summries: this.summariesService.processTheRawSummaries(rawData),
                        longestRecord: of(
                            this.summariesService.getLongestDayRecord(rawData)
                        ),
                        totalYear: of(this.summariesService.getTotalDuration(rawData)),
                        totalThisMonth: of(
                            this.summariesService.getTotalThisMonth(rawData)
                        ),
                    }).pipe(
                        map(({ summries, longestRecord, totalYear, totalThisMonth }) => {
                            return {
                                summaries: summries,
                                longest_record: longestRecord,
                                total_last_year: totalYear,
                                total_this_month: totalThisMonth,
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
                                data: res,
                            };
                        })
                    );
                }
            })
        );
    }
}
