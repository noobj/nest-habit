import { Injectable, ImATeapotException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as moment from 'moment-timezone';

import { Project } from './entities';
import { User } from '../users';
import { TogglClient } from 'src/app/console/modules/sync-toggl/TogglClient';
import { UsersService } from '../users';
import { SyncTogglService } from 'src/app/console/modules/sync-toggl/sync-toggl.service';

@Injectable()
export class ProjectService {
    constructor(
        private syncTogglService: SyncTogglService,
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

        return project;
    }

    public async getLeastUpdatedProjects(arg: number | string): Promise<Project[]>;
    public async getLeastUpdatedProjects(arg: any): Promise<Project[]> {
        if (typeof arg == 'number')
            return await this.projectRepository.find({
                relations: ['user'],
                order: {
                    last_updated: 'DESC',
                },
                take: arg,
            });
        else if (typeof arg == 'string') {
            const user = await this.usersService.findOne(arg);
            if (user == undefined) throw new ImATeapotException('Invalid user');
            const result = await this.projectRepository.findOne(
                { user: user },
                { relations: ['user'] }
            );

            return [result];
        }
    }

    public async updateProjectLastUpdated(project: Project) {
        project.last_updated = new Date();
        return await this.projectRepository.save(project);
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

    public async deleteProjectByUser(user: Partial<User>) {
        await this.projectRepository
            .createQueryBuilder()
            .delete()
            .where('user_id = :id', { id: user.id })
            .execute();
    }

    public async setCurrentProject(user: Partial<User>, projectName: string) {
        const userWhole: User = await this.usersService.findOne(user.account);
        const currentProject = await this.getProjectByUser(user);

        // if current project equals to passed project, then only sync data
        if (!currentProject || currentProject.name !== projectName) {
            const { data: projects } = await this.getAllProjects(user);
            const fetchedProject = projects
                .filter((project) => project.name == projectName)
                .pop();

            if (!fetchedProject) throw new ImATeapotException('Project Not Found');

            // delete the original project
            await this.deleteProjectByUser(user);
            const project: Project = {
                id: fetchedProject.id,
                name: projectName,
                user: userWhole,
                last_updated: new Date(),
            };
            await this.projectRepository.save(project);
        }

        return (await this.syncTogglService.run(['365', userWhole.account])).pop();
    }
}
