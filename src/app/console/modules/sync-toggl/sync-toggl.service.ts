import { Injectable, Logger, ImATeapotException, OnModuleInit } from '@nestjs/common';
import * as _ from 'lodash';
import * as moment from 'moment';

import { SummariesService } from 'src/app/modules/summaries/summaries.service';
import { CreateDailySummaryDto, ProjectService } from 'src/app/modules/summaries';
import { TogglClient } from './TogglClient';
import { ICommand } from 'src/app/console/interfaces/command.interface';
import { Project } from 'src/app/modules/summaries/entities';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class SyncTogglService implements ICommand, OnModuleInit {
    private readonly logger = new Logger(SyncTogglService.name);
    private projectService: ProjectService;

    constructor(
        private moduleRef: ModuleRef,
        private summariesService: SummariesService
    ) {}

    onModuleInit() {
        this.projectService = this.moduleRef.get(ProjectService, { strict: false });
    }

    async run(argv: string[]) {
        const days = +argv[0];
        let since = null;

        if (argv.length) {
            if (isNaN(days)) throw new ImATeapotException('days must be a number');

            since = moment().subtract(days, 'days').format('YYYY-MM-DD');
        }

        const projects = await this.projectService.getLeastUpdatedProjects(10);

        await Promise.all(
            projects.map(async (project: Project) => {
                const details = await this.fetchDataFromToggl(project, since);
                if (!details.length) return;

                const fetchedData = this.processFetchedData(details, project);
                const result = await this.summariesService.upsert(fetchedData);

                console.log(
                    `User ${project.user.account} Updated ${result.affectedRows} rows`
                );

                await this.projectService.updateProjectLastUpdated(project);
            })
        ).catch((err) => {
            console.log('Sync Failed...', err);
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
