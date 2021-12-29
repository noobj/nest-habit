import axios from 'axios';
import * as moment from 'moment';

export class TogglClient {
    public client;

    constructor(obj: {
        baseURL: string;
        timeout: number;
        auth: { username: string; password: string };
    }) {
        this.client = axios.create({
            baseURL: obj.baseURL,
            timeout: obj.timeout,
            auth: {
                username: obj.auth.username,
                password: obj.auth.password
            }
        });
    }

    public async getWorkSpaceId() {
        return await this.client
            .get('api/v8/workspaces')
            .then((res) => res.data[0].id)
            .catch((err) => {
                console.log(err);
                const message = `fetch from Toggl failed: [${err?.request?.res?.statusCode} ${err?.request?.res?.statusMessage}]`;

                throw new Error(message);
            });
    }

    public async getProjects() {
        const workspaceId = await this.getWorkSpaceId();
        return await this.client.get(`api/v8/workspaces/${workspaceId}/projects`);
    }

    public async getDetails(workspaceId: number, projectId: number, { ...options }) {
        const userAgent = options?.userAgent ?? 'testing';
        const page = options?.page ?? 1;
        const since = options?.since ?? moment().subtract(1, 'year').format('YYYY-MM-DD');
        const until = options?.until ?? moment().add(1, 'day').format('YYYY-MM-DD');

        return await this.client
            .get(
                `reports/api/v2/details?workspace_id=${workspaceId}&project_ids=${projectId}&user_agent=${userAgent}&page=${page}&since=${since}&until=${until}`
            )
            .then((res) => res.data)
            .catch((err) => {
                throw err;
            });
    }
}
