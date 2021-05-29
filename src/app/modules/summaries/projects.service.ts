import { Injectable, ImATeapotException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as moment from 'moment-timezone';

import { Project } from './entities';
import { User } from '../users';
import { TogglClient } from 'src/app/console/modules/sync-toggl/TogglClient';
import { UsersService } from '../users';

@Injectable()
export class ProjectService {
    constructor(
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        private usersService: UsersService
    ) {
        moment.tz.setDefault('Asia/Taipei');
    }

    public async getProjectByUser(user: Partial<User>): Promise<Project> {
        const project = await this.projectRepository.findOne({
            where: { user: user },
        });

        if (project == undefined) throw new ImATeapotException('Project Not Found');

        return project;
    }

    public async getLeastUpdatedProjects(limit: number): Promise<Project[]> {
        return await this.projectRepository.find({
            relations: ['user'],
            order: {
                last_updated: 'DESC',
            },
            take: limit,
        });
    }

    public async updateProjectLastUpdated(project: Project) {
        project.last_updated = new Date();
        await this.projectRepository.save(project);
    }

    public async getAllProjects(user: Partial<User>) {
        user = await this.usersService.findOne(user.account);

        const togglClient = new TogglClient({
            baseURL: 'https://api.track.toggl.com/',
            timeout: 5000,
            auth: {
                username: user.toggl_token,
                password: 'api_token',
            },
        });

        return await togglClient.getProjects();
    }
}
