import { Repository, Connection } from 'typeorm';
import { ImATeapotException } from '@nestjs/common';

import { Project } from 'src/app/modules/summaries/entities';
import { ISeeder } from '../src/database/mongo_seeders/seeder.interface';
import { User } from 'src/app/modules/users';

export class ProjectSeeder implements ISeeder {
    private projectRepository: Repository<Project>;
    private userRepository: Repository<User>;

    constructor(public connection: Connection) {
        this.projectRepository = connection.getRepository(Project);
        this.userRepository = connection.getRepository(User);
    }

    async run() {
        const user = await this.userRepository.findOneOrFail({ account: 'jjj' });

        if (!user) {
            throw new ImATeapotException('No User Exist');
        }

        const projects = [{ name: 'meditation', project_id: 170109732, user: user }];
        const result = await this.projectRepository.save(projects);
        console.log(result);
    }
}
