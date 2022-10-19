import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

import { ICommand } from '../../interfaces/command.interface';
import * as Seeder from 'src/database/mongo_seeders';
import { ISeeder } from 'src/database/seeders';

@Injectable()
export class SeedMongoService implements ICommand {
    constructor(
        @InjectConnection()
        public connection: Connection
    ) {}

    async run(argv: string[]) {
        const className = argv[0]
            ? argv[0].charAt(0).toUpperCase() + argv[0].slice(1)
            : null;

        // if (className != null) {
        //     try {
        //         this.connection.getRepository(className);
        //     } catch (err) {
        //         console.log(`${className} entity doesn't exist`);
        //         process.exit(1);
        //     }
        // } else {
        //     className = 'Default';
        // }

        const seeder: ISeeder = new Seeder[`${className}Seeder` as keyof typeof Seeder](
            this.connection
        );
        await seeder.run();
    }
}
