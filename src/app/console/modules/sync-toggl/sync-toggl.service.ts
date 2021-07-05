import { Injectable, Logger, ImATeapotException, OnModuleInit } from '@nestjs/common';
import * as _ from 'lodash';
import * as moment from 'moment';

import { SummariesService } from 'src/app/modules/summaries/summaries.service';
import { CreateDailySummaryDto, ProjectService } from 'src/app/modules/summaries';
import { ICommand } from 'src/app/console/interfaces/command.interface';
import { Project } from 'src/app/modules/summaries/entities';
import { ModuleRef } from '@nestjs/core';
import { TogglService } from 'src/app/modules/toggl/toggl.service';
import { SummariesGateway } from 'src/app/modules/summaries/summaries.gateway';
import { convertRawDurationToFormat } from 'src/common/helpers/utils';

@Injectable()
export class SyncTogglService implements ICommand, OnModuleInit {
    private readonly logger = new Logger(SyncTogglService.name);
    private projectService: ProjectService;
    private socketServer: SummariesGateway;

    constructor(
        private moduleRef: ModuleRef,
        private summariesService: SummariesService,
        private togglService: TogglService
    ) {}

    onModuleInit() {
        this.projectService = this.moduleRef.get(ProjectService, { strict: false });
        this.socketServer = this.moduleRef.get(SummariesGateway, { strict: false });
    }

    /**
     * Usage - npm run artisan syncToggl 180 user
     * @param argv[0] optional - how many days prior to today to fetch
     * @param argv[1] optional - pass the specific user's account for fetching
     */
    async run(argv: string[]) {
        const days = +argv[0];
        const userName = argv[1] ?? null;
        let since = null;

        if (argv.length) {
            if (isNaN(days)) throw new ImATeapotException('days must be a number');

            since = moment().subtract(days, 'days').format('YYYY-MM-DD');
        }

        const arg = userName ?? 10;
        const projects = await this.projectService.getLeastUpdatedProjects(arg);

        if (projects.length == 0) throw new ImATeapotException('No project found');

        return await Promise.all(
            projects.map(async (project: Project) => {
                const details = await this.togglService.fetch(project, since);
                if (!details.length) throw new ImATeapotException('no data');

                const fetchedData = this.processFetchedData(details, project);
                const result = await this.summariesService.upsert(fetchedData);

                if (userName) this.sendMessageToSocketClients(result);

                await this.projectService.updateProjectLastUpdated(project);

                return this.calNewRecords(result);
            })
        ).catch((err) => {
            return Promise.reject(err);
        });
    }

    private calNewRecords(entries: any[]): number {
        return entries.reduce((sum, entry) => {
            if (entry.user) return sum + 1;
            return sum;
        }, 0);
    }

    private sendMessageToSocketClients(entries: CreateDailySummaryDto[]) {
        entries.map((entry) => {
            // Only new records have user data
            if (entry.user) {
                const { user, duration, ...rest } = entry; // sift out sensetive user info
                const result = {
                    ...rest,
                    duration: convertRawDurationToFormat(entry.duration),
                    userId: entry.user.id,
                    account: entry.user.account,
                };
                this.socketServer.server.emit('notice', JSON.stringify(result));
            }
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
}
