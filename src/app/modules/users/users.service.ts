import { ImATeapotException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './users.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) {}

    async findOne(account: string): Promise<User | undefined> {
        return await this.usersRepository.findOne({
            where: { account: account },
        });
    }

    async setToken(id: number, token: string) {
        try {
            await this.usersRepository.update(id, { toggl_token: token });
        } catch (err) {
            throw new ImATeapotException(err.code);
        }
    }
}
