import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

import { ICommand } from '../../interfaces/command.interface';
import * as seeder from 'src/database/seeders';

@Injectable()
export class SeedService implements ICommand {
    constructor(
        @InjectConnection()
        public connection: Connection
    ) {}

    async run(argv: string[]) {
        const className = argv[0].charAt(0).toUpperCase() + argv[0].slice(1);
        let repository;
        type Seeder = seeder.ISeeder;

        try {
            repository = this.connection.getRepository(className);
        } catch (err) {
            console.log(`${className} seeder doesn't exist`);
            process.exit(1);
        }

        const projectSeeder: Seeder = new seeder[`${className}Seeder`](
            repository
        );
        await projectSeeder.run();
    }
}