import { ProjectDocument } from 'src/schemas/project.schema';
import { UserDocument } from 'src/schemas/user.schema';

export interface IThirdPartyService {
    getProjects(user: UserDocument): Promise<any>;
    checkTokenValid(token: string): Promise<void>;
    fetch(project: ProjectDocument, since: string): Promise<any[]>;
}
