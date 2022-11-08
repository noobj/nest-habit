import { Injectable, BadRequestException } from '@nestjs/common';
import * as moment from 'moment-timezone';
import { Redis } from 'ioredis';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from '../users';
import { UsersService } from '../users';
import { ThirdPartyFactory } from '../ThirdParty/third-party.factory';
import { SummariesService } from './summaries.service';
import { RedisService } from '../redis';
import { Project, ProjectDocument } from 'src/schemas/project.schema';
import { User as MongoUser, UserDocument } from 'src/schemas/user.schema';

export type ProjectWithMysqlUser = Project & { userMysql: User };

@Injectable()
export class ProjectService {
    private redisClient: Redis;

    constructor(
        @InjectModel(Project.name)
        private projectModel: Model<ProjectDocument>,
        @InjectModel(MongoUser.name)
        private userModel: Model<UserDocument>,
        private summariesService: SummariesService,
        private usersService: UsersService,
        private redisService: RedisService
    ) {
        moment.tz.setDefault('Asia/Taipei');
        this.redisClient = this.redisService.getClient();
    }

    public async getProjectByUser(user: Partial<User>): Promise<ProjectDocument> {
        const mongoUser = await this.userModel.findOne({ mysqlId: user.id });
        const project = await this.projectModel
            .findOne({ user: mongoUser })
            .populate('user');

        return project;
    }

    public async getLeastUpdatedProjects(
        amount: number
    ): Promise<ProjectWithMysqlUser[]> {
        const projects = await this.projectModel
            .find({})
            .sort({ lastUpdated: -1 })
            .limit(amount)
            .populate('user');

        return await Promise.all(
            projects.map(async (project) => {
                const user = await this.usersService.findOne(project.user.mysqlId);
                return {
                    ...project,
                    userMysql: user
                };
            })
        );
    }

    public async updateProjectLastUpdated(project: ProjectDocument) {
        project.lastUpdated = new Date();
        return await this.projectModel.findByIdAndUpdate(project.id, {
            lastUpdated: new Date()
        });
    }

    public async getAllProjects(user: Partial<User>) {
        user = await this.usersService.findOne(user.id);

        return await ThirdPartyFactory.getService(user.third_party_service).getProjects(
            user
        );
    }

    public async deleteProjectByUser(user: Partial<User> | number) {
        const userId = typeof user === 'number' ? user : user.id;

        // clean cache
        const keys = await this.redisClient.keys(`summaries:${user}*`);
        for (const key of keys) await this.redisClient.del(key);

        const userMongo = await this.userModel.findOne({ mysqlId: userId });

        await this.projectModel.deleteOne({ user: userMongo });
    }

    public async setCurrentProject(user: User, projectName: string) {
        const userWhole = await this.userModel.findOne({ mysqlId: user.id });
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
                user: userWhole,
                lastUpdated: new Date()
            };
            await this.projectModel.create(project);
        }

        return await this.summariesService.syncWithThirdParty(365, user);
    }
}
