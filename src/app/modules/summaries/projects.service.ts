import { Injectable, ImATeapotException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as moment from 'moment-timezone';

import { Project } from './entities';
import { User } from '../users';

@Injectable()
export class ProjectService {
    constructor(
        @InjectRepository(Project)
        private projectRepository: Repository<Project>
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
}
