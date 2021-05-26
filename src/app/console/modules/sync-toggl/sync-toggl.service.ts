import { Injectable, Logger, ImATeapotException } from '@nestjs/common';
import * as _ from 'lodash';
import * as moment from 'moment';

import { CreateDailySummaryDto, SummariesService } from 'src/app/modules/summaries';
import { TogglClient } from './TogglClient';
import { ICommand } from 'src/app/console/interfaces/command.interface';
import { Project } from 'src/app/modules/summaries/entities';

@Injectable()
export class SyncTogglService implements ICommand {
    private readonly logger = new Logger(SyncTogglService.name);

    constructor(private summariesService: SummariesService) {}

    async run(argv: string[]) {
        const days = +argv[0];
        let since = null;

        if (argv.length) {
            if (isNaN(days)) throw new ImATeapotException('days must be a number');

            since = moment().subtract(days, 'days').format('YYYY-MM-DD');
        }

        const projects = await this.summariesService.getLeastUpdatedProjects(10);

        await Promise.all(
            projects.map(async (project: Project) => {
                const details = await this.fetchDataFromToggl(project, since);
                const fetchedData = this.processFetchedData(details, project);
                const result = await this.summariesService.upsert(fetchedData);

                console.log(
                    `User ${project.user.account} Updated ${result.affectedRows} rows`
                );

                await this.summariesService.updateProjectLastUpdated(project);
            })
        ).catch((err) => {
            console.log('Sync Failed...', err.response);
            process.exit(1);
        });
    }

    private processFetchedData(
        details: any[],
        project: Project
    ): CreateDailySummaryDto[] {
        const tmp = _.groupBy(details, (entry) => {
            return moment(entry.start).format('YYYY-MM-DD');
        });

        return Object.entries(tmp).map((key) => {
            return {
                date: key[0],
                project: project.id,
                duration: key[1].reduce((sum, entry) => sum + entry.dur, 0),
                user: project.user,
            };
        });
    }

    private async fetchDataFromToggl(project: Project, since: string): Promise<any[]> {
        const togglClient = new TogglClient({
            baseURL: 'https://api.track.toggl.com/',
            timeout: 5000,
            auth: {
                username: project.user.toggl_token,
                password: 'api_token',
            },
        });

        const workSpaceId = await togglClient.getWorkSpaceId();

        let page = 1;
        let details = [];
        let response;

        do {
            response = await togglClient.getDetails(workSpaceId, project.id, {
                page: page++,
                userAgent: 'Toggl NestJS Client',
                since: since,
            });

            details = [...details, ...response.data];
        } while (details.length < response.total_count);

        return details;
    }
}
