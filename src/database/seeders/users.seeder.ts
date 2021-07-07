import { Repository, Connection } from 'typeorm';

import { User } from 'src/app/modules/users';
import { ISeeder } from './seeder.interface';

export class UserSeeder implements ISeeder {
    private repository: Repository<User>;

    constructor(public connection: Connection) {
        this.repository = connection.getRepository(User);
    }

    async run() {
        const users = [
            {
                account: 'jjj',
                email: 'marley.lemke@example.org',
                password: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                toggl_token: '1cf1a1e2b149f8465373bfcacb7a831e',
                third_party_service: 'toggl',
            },
        ];
        const result = await this.repository.save(users);
        console.log(result);
    }
}
