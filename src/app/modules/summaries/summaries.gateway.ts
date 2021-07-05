import { OnModuleInit, UseFilters, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    WebSocketGateway,
    SubscribeMessage,
    WsResponse,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ProjectService } from './projects.service';
import { SummariesService } from './summaries.service';
import { endOfToday, subYears, subDays, format } from 'date-fns';
import { ModuleRef } from '@nestjs/core';
import { Observable, from, forkJoin, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { WSExceptionsFilter } from 'src/common/exception-filters/ws-exception.filter';
import { RedisService } from 'nestjs-redis';
import { Redis } from 'ioredis';

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
        const currentProject = await this.projectService.getProjectByUser(socket.user);

        const cacheId = Buffer.from(socket.user.id + startDate + endDate).toString(
            'base64'
        );
        const cacheString = `summaries:${cacheId}`;
        if (newRecordsNumber == 0) {
            const cacheSummaries = await this.redisClient.get(cacheString);
            if (cacheSummaries !== null) {
                const { summaries, longest_record, total_last_year, total_this_month } =
                    JSON.parse(cacheSummaries);
                const result = {
                    current_project: currentProject,
                    summaries: summaries,
                    longest_record,
                    total_last_year,
                    total_this_month,
                };

                return of({ event: 'sync', data: JSON.stringify(result) });
            }
        }

        return from(
            this.summariesService.getRawDailySummaries(startDate, endDate, socket.user)
        ).pipe(
            mergeMap((rawData) => {
                return forkJoin({
                    summaries: this.summariesService.processTheRawSummaries(rawData),
                }).pipe(
                    map(({ summaries }) => {
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
}
