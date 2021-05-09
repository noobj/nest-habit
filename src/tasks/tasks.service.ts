import { Injectable, Logger } from '@nestjs/common';
import { SummariesService } from '../summaries/summaries.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as _ from 'lodash';
import * as moment from 'moment';
import { TogglClient } from './TogglClient';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        private summariesService: SummariesService,
        private configService: ConfigService
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_10PM)
    async syncWithToggl() {
        const togglClient = new TogglClient({
            baseURL: 'https://api.track.toggl.com/',
            timeout: 1000,
            auth: {
                username: this.configService.get('toggl.token'),
                password: 'api_token',
            },
        });

        const workSpaceId = await togglClient.getWorkSpaceId();

        const projectId = await this.summariesService.getProjectIdByName(
            'Meditation'
        );

        let page = 1;
        let details = [];
        let response;

        do {
            response = await togglClient.getDetails(workSpaceId, projectId, {
                page: page++,
                userAgent: 'Toggl NestJS Client',
            });

            details = [...details, ...response.data];
        } while (details.length < response.total_count);

        const tmp = _.groupBy(details, (entry) => {
            return moment(entry.start).format('YYYY-MM-DD');
        });

        const result = Object.entries(tmp).map((key) => {
            return {
                date: key[0],
                project: projectId,
                duration: key[1].reduce((sum, entry) => sum + entry.dur, 0),
            };
        });

        await this.summariesService.upsert(result);
    }
}
