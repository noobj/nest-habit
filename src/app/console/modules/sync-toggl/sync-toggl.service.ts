import { Injectable, Logger, ImATeapotException, OnModuleInit } from '@nestjs/common';

import { SummariesService } from 'src/app/modules/summaries/summaries.service';
import { ProjectService } from 'src/app/modules/summaries';
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

    /**
     * Usage - npm run artisan syncToggl 180 user
     * @param argv[0] optional - how many days prior to today to fetch
     * @param argv[1] optional - pass the specific user's account for fetching
     */
    async run(argv: string[]) {
        const projects = await this.projectService.getLeastUpdatedProjects(10);

        if (projects.length == 0) throw new ImATeapotException('No project found');

        return await Promise.all(
            projects.map(async (project: Project) => {
                const affectedRow = await this.summariesService.syncWithThirdParty(
                    365,
                    project.user,
                    false
                );

                console.log(
                    `User ${project.user.account} done syncing on <${project.name}> ${affectedRow} rows affected`
                );
            })
        ).catch((err) => {
            return Promise.reject(err);
        });
    }
}
