import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

import { ICommand } from '../../interfaces/command.interface';
import * as Seeder from 'src/database/seeders';

@Injectable()
export class SeedService implements ICommand {
    constructor(
        @InjectConnection()
        public connection: Connection
    ) {}

    async run(argv: string[]) {
        let className = argv[0]
            ? argv[0].charAt(0).toUpperCase() + argv[0].slice(1)
            : null;
        type ISeeder = Seeder.ISeeder;

        if (className != null) {
            try {
                this.connection.getRepository(className);
            } catch (err) {
                console.log(`${className} entity doesn't exist`);
                process.exit(1);
            }
        } else {
            className = 'Default';
        }

        const seeder: ISeeder = new Seeder[`${className}Seeder`](this.connection);
        await seeder.run();
    }
}
