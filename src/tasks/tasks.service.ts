import { Injectable, Logger } from '@nestjs/common';
import { SummariesService } from '../summaries/summaries.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import * as _ from 'lodash';
import * as moment from 'moment';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(private summariesService: SummariesService) {}

    @Cron(CronExpression.EVERY_DAY_AT_10PM)
    async syncWithToggl() {
        const togglClient = axios.create({
            baseURL: 'https://api.track.toggl.com/',
            timeout: 1000,
            auth: {
                username: 'e61f97013c7f984c38fdc4b1736bd748',
                password: 'api_token',
            },
        });

        const workSpaceId = await togglClient
            .get('api/v8/workspaces')
            .then((res) => res.data[0].id)
            .catch((err) => {
                throw err;
            });

        const projectId = await this.summariesService.getProjectIdByName(
            'Meditation',
        );

        const userAgent = 'Toggl NestJS Client';

        let page = 1;
        let details = [];
        let response;

        do {
            response = await togglClient
                .get(
                    `reports/api/v2/details?workspace_id=${workSpaceId}&project_ids=${projectId}&user_agent=${userAgent}&page=${page++}&since=2021-04-19&until=2021-05-20`,
                )
                .then((res) => res.data)
                .catch((err) => {
                    throw err;
                });

            details = [...details, ...response.data];
        } while (details.length < response.total_count);

        const tmp = _.groupBy(details, (entry) => {
            return moment(entry.start).format('YYYY-MM-DD');
        });

        console.log(
            Object.entries(tmp).map((key) => {
                return {
                    date: key[0],
                    duration: key[1].reduce((sum, entry) => sum + entry.dur, 0),
                };
            }),
        );
    }
}
