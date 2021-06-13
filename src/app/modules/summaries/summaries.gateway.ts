import { UseGuards } from '@nestjs/common';
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

@WebSocketGateway(3002)
export class SummariesGateway {
    constructor(
        private summariesService: SummariesService,
        private projectService: ProjectService
    ) {}

    @WebSocketServer()
    server: Server;

    @UseGuards(AuthGuard('jwt'))
    @SubscribeMessage('sync')
    async onEvent(socket, data): Promise<WsResponse<string>> {
        await this.projectService.setCurrentProject(socket.user, data.projectName);
        const currentProject = await this.projectService.getProjectByUser(socket.user);

        const tmpEnd = endOfToday();
        const tmpStart = subYears(tmpEnd, 1);
        const endDate = format(tmpEnd, 'yyyy-MM-dd');
        const startDate = format(subDays(tmpStart, 7), 'yyyy-MM-dd');
        const rawData = await this.summariesService.getRawDailySummaries(
            startDate,
            endDate,
            socket.user
        );

        if (rawData.length === 0) {
            return {
                event: 'sync',
                data: JSON.stringify({ current_project: currentProject }),
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
            current_project: currentProject,
        };

        return {
            event: 'sync',
            data: JSON.stringify(result),
        };
    }
}
