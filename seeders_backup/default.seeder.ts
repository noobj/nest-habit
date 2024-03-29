import { Connection } from 'typeorm';

import { ISeeder } from '../src/database/mongo_seeders/seeder.interface';
import { ProjectSeeder, UserSeeder } from '.';

export class DefaultSeeder implements ISeeder {
    constructor(public connection: Connection) {}

    async run() {
        return new UserSeeder(this.connection).run().then(() => {
            return new ProjectSeeder(this.connection).run();
        });
    }
}
