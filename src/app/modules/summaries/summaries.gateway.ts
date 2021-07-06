import { OnModuleInit, UseFilters, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    WebSocketGateway,
    SubscribeMessage,
    WsResponse,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { endOfToday, subYears, subDays, format } from 'date-fns';
import { Observable, from, forkJoin, of } from 'rxjs';
import { ModuleRef } from '@nestjs/core';
import { map, mergeMap, tap } from 'rxjs/operators';
import { RedisService } from 'nestjs-redis';
import { Redis } from 'ioredis';

import { getSummariesCacheString } from 'src/common/helpers/utils';
import { ProjectService } from './projects.service';
import { SummariesService } from './summaries.service';
import { WSExceptionsFilter } from 'src/common/exception-filters/ws-exception.filter';

@WebSocketGateway(3002)
export class SummariesGateway implements OnModuleInit {
    private projectService: ProjectService;
    private redisClient: Redis;

    constructor(
        private moduleRef: ModuleRef,
        private summariesService: SummariesService,
        private readonly redisService: RedisService
    ) {
        this.redisClient = this.redisService.getClient();
    }

    onModuleInit() {
        this.projectService = this.moduleRef.get(ProjectService, { strict: false });
    }

    @WebSocketServer()
    server: Server;

    @UseFilters(new WSExceptionsFilter())
    @UseGuards(AuthGuard('jwt'))
    @SubscribeMessage('sync')
    async onEvent(socket, data): Promise<Observable<WsResponse<string>>> {
        const newRecordsNumber = await this.projectService.setCurrentProject(
            socket.user,
            data.projectName
        );
        const tmpEnd = endOfToday();
        const tmpStart = subYears(tmpEnd, 1);
        const endDate = format(tmpEnd, 'yyyy-MM-dd');
        const startDate = format(subDays(tmpStart, 7), 'yyyy-MM-dd');

        const cacheString = getSummariesCacheString(socket.user.id, startDate, endDate);
        // test if there is any new record
        if (newRecordsNumber == 0) {
            const cacheSummaries = await this.redisClient.get(cacheString);
            if (cacheSummaries !== null) {
                return await this.processCacheData(cacheSummaries, socket, cacheString);
            }
        }

        return from(
            this.summariesService.getRawDailySummaries(startDate, endDate, socket.user)
        ).pipe(
            mergeMap((rawData) => {
                return forkJoin({
                    summaries: this.summariesService.processTheRawSummaries(rawData),
                    currentProject: this.projectService.getProjectByUser(socket.user),
                }).pipe(
                    map(({ summaries, currentProject }) => {
                        if (rawData.length === 0) {
                            return {
                                current_project: currentProject,
                            };
                        }

                        const longestRecord =
                            this.summariesService.getLongestDayRecord(rawData);
                        const totalYear = this.summariesService.getTotalDuration(rawData);
                        const totalThisMonth =
                            this.summariesService.getTotalThisMonth(rawData);

                        return {
                            current_project: currentProject,
                            summaries: summaries,
                            longest_record: longestRecord,
                            total_last_year: totalYear,
                            total_this_month: totalThisMonth,
                        };
                    }),
                    tap((res) => {
                        return from(
                            this.redisClient.set(
                                cacheString,
                                JSON.stringify(res),
                                'EX',
                                3600
                            )
                        );
                    })
                );
            }),
            map((val) => ({ event: 'sync', data: JSON.stringify(val) }))
        );
    }

    private async processCacheData(
        cacheSummaries: string,
        socket: any,
        cacheString: string
    ): Promise<Observable<WsResponse<string>>> {
        let {
            summaries,
            longest_record,
            total_last_year,
            total_this_month,
            current_project,
        } = JSON.parse(cacheSummaries);

        if (current_project === undefined) {
            current_project = await this.projectService.getProjectByUser(socket.user);

            const res = {
                current_project,
                summaries: summaries,
                longest_record,
                total_last_year,
                total_this_month,
            };

            await this.redisClient.set(cacheString, JSON.stringify(res), 'EX', 3600);
        } else {
            current_project.last_updated = Date.now();
        }

        const result = {
            current_project,
            summaries: summaries,
            longest_record,
            total_last_year,
            total_this_month,
        };

        return of({ event: 'sync', data: JSON.stringify(result) });
    }
}
