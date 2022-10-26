import { ProjectDocument } from 'src/schemas/project.schema';
import { User } from '../users';

export interface IThirdPartyService {
    getProjects(user: Partial<User>): Promise<any>;
    checkTokenValid(token: string): Promise<void>;
    fetch(project: ProjectDocument, since: string): Promise<any[]>;
}
