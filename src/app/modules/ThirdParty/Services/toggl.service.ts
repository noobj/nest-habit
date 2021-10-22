import { Injectable, HttpException } from '@nestjs/common';
import { TogglClient } from 'src/common/helpers/TogglClient';
import { Project } from '../../summaries/entities';
import { User } from '../../users';
import { IThirdPartyService } from '../third-party.interface';

@Injectable()
export class TogglService implements IThirdPartyService {
    public async getProjects(user: Partial<User>) {
        const togglClient = new TogglClient({
            baseURL: 'https://api.track.toggl.com/',
            timeout: 10000,
            auth: {
                username: user.toggl_token,
                password: 'api_token'
            }
        });

        return await togglClient.getProjects();
    }

    public async checkTokenValid(token: string) {
        const togglClient = new TogglClient({
            baseURL: 'https://api.track.toggl.com/',
            timeout: 10000,
            auth: {
                username: token,
                password: 'api_token'
            }
        });

        const workSpaceId = await togglClient.getWorkSpaceId();
        if (!workSpaceId) throw new HttpException('Invalid api token', 400);
    }

    public async fetch(project: Project, since: string): Promise<any[]> {
        const togglClient = new TogglClient({
            baseURL: 'https://api.track.toggl.com/',
            timeout: 10000,
            auth: {
                username: project.user.toggl_token,
                password: 'api_token'
            }
        });

        const workSpaceId = await togglClient.getWorkSpaceId();

        let page = 1;
        let details = [];
        let response;

        do {
            response = await togglClient.getDetails(workSpaceId, project.project_id, {
                page: page++,
                userAgent: 'Toggl NestJS Client',
                since: since
            });

            details = [...details, ...response.data];
            await new Promise((resolve) => setTimeout(resolve, 1000));
        } while (details.length < response.total_count);

        return details;
    }
}
