import { ImATeapotException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

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

    async setRefreshToken(refreshToken: string, userId: number) {
        const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.usersRepository.update(userId, {
            refresh_token: currentHashedRefreshToken,
        });
    }

    async removeRefreshToken(userId: number) {
        return this.usersRepository.update(userId, {
            refresh_token: null,
        });
    }

    async attempRefreshToken(refreshToken: string, userId: number) {
        const user = await this.usersRepository.findOne(userId);

        const isRefreshTokenMatching = await bcrypt.compare(
            refreshToken,
            user.refresh_token
        );

        if (isRefreshTokenMatching) {
            return user;
        }
    }
}
