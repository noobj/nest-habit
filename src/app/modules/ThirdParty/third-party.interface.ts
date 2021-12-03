import { Project } from '../summaries/entities/project.entity';
import { User } from '../users';

export interface IThirdPartyService {
    getProjects(user: Partial<User>): Promise<any>;
    checkTokenValid(token: string): Promise<void>;
    fetch(project: Project, since: string): Promise<any[]>;
}
