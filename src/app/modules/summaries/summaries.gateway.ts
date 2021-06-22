import { OnModuleInit, UseGuards } from '@nestjs/common';
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
import { Observable, from, forkJoin } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

@WebSocketGateway(3002)
export class SummariesGateway implements OnModuleInit {
    private projectService: ProjectService;

    constructor(
        private moduleRef: ModuleRef,
        private summariesService: SummariesService
    ) {}

    onModuleInit() {
        this.projectService = this.moduleRef.get(ProjectService, { strict: false });
    }

    @WebSocketServer()
    server: Server;

    @UseGuards(AuthGuard('jwt'))
    @SubscribeMessage('sync')
    onEvent(socket, data): Observable<WsResponse<string>> {
        return from(
            this.projectService.setCurrentProject(socket.user, data.projectName)
        ).pipe(
            mergeMap(() => {
                const tmpEnd = endOfToday();
                const tmpStart = subYears(tmpEnd, 1);
                const endDate = format(tmpEnd, 'yyyy-MM-dd');
                const startDate = format(subDays(tmpStart, 0), 'yyyy-MM-dd');
                return this.summariesService.getRawDailySummaries(
                    startDate,
                    endDate,
                    socket.user
                );
            }),
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
                    })
                );
            }),
            map((val) => ({ event: 'sync', data: JSON.stringify(val) }))
        );
    }
}
