import { Injectable, BadRequestException } from '@nestjs/common';
import * as moment from 'moment-timezone';
import { Redis } from 'ioredis';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ThirdPartyFactory } from '../ThirdParty/third-party.factory';
import { SummariesService } from './summaries.service';
import { RedisService } from '../redis';
import { Project, ProjectDocument } from 'src/schemas/project.schema';
import { UserDocument } from 'src/schemas/user.schema';

@Injectable()
export class ProjectService {
    private redisClient: Redis;

    constructor(
        @InjectModel(Project.name)
        private projectModel: Model<ProjectDocument>,
        private summariesService: SummariesService,
        private redisService: RedisService
    ) {
        moment.tz.setDefault('Asia/Taipei');
        this.redisClient = this.redisService.getClient();
    }

    public async getProjectByUser(user: UserDocument): Promise<ProjectDocument> {
        const project = await this.projectModel.findOne({ user: user }).populate('user');

        return project;
    }

    public async getLeastUpdatedProjects(amount: number): Promise<ProjectDocument[]> {
        return await this.projectModel
            .find({})
            .sort({ lastUpdated: -1 })
            .limit(amount)
            .populate('user');
    }

    public async updateProjectLastUpdated(project: Partial<ProjectDocument>) {
        return await this.projectModel.findByIdAndUpdate(project.id, {
            lastUpdated: new Date()
        });
    }

    public async getAllProjects(user: UserDocument) {
        return await ThirdPartyFactory.getService(user.third_party_service).getProjects(
            user
        );
    }

    public async deleteProjectByUser(user: UserDocument) {
        // clean cache
        const keys = await this.redisClient.keys(`summaries:${user._id}*`);
        for (const key of keys) await this.redisClient.del(key);

        await this.projectModel.deleteOne({ user: user });
    }

    public async setCurrentProject(user: UserDocument, projectName: string) {
        const currentProject = await this.getProjectByUser(user);

        // if current project equals to passed project, then only sync data
        if (!currentProject || currentProject.name !== projectName) {
            const { data: projects } = await this.getAllProjects(user);
            const fetchedProject = projects
                .filter((project: { name: string }) => project.name == projectName)
                .pop();

            if (!fetchedProject) throw new BadRequestException('Project Not Found');

            // delete the original project
            await this.deleteProjectByUser(user);
            const project: Project = {
                thirdPartyId: fetchedProject.id,
                name: projectName,
                user: user,
                lastUpdated: new Date()
            };
            await this.projectModel.create(project);
        }

        return await this.summariesService.syncWithThirdParty(365, user);
    }
}
