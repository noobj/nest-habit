import { Repository } from 'typeorm';

import { Project } from 'src/app/modules/summaries/entities';
import { ISeeder } from './seeder.interface';

export class ProjectSeeder implements ISeeder {
    constructor(public repository: Repository<Project>) {}

    async run() {
        const projects = [
            { name: 'Meditation', id: 157099012 },
            { name: 'Productive', id: 92848653 },
            { name: 'Workout', id: 154629151 },
        ];
        const result = await this.repository.save(projects);
        console.log(result);
    }
}
