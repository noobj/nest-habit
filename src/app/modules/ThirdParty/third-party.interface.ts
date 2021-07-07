import { Project } from '../summaries/entities/project.entity';
import { User } from '../users';

export interface IThirdPartyService {
    getProjects(user: Partial<User>);
    checkTokenValid(token: string);
    fetch(project: Project, since: string): Promise<any[]>;
}
