import { Project } from './entities/project.entity';
import { User } from './entities/users.entity';

export interface IThirdPartyService {
    getProjects(user: Partial<User>): Promise<any>;
    checkTokenValid(token: string): Promise<void>;
    fetch(project: Project, since: string): Promise<any[]>;
}
