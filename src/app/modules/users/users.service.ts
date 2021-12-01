import { ImATeapotException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindConditions, FindManyOptions } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './users.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) {}

    async find(conditions?: FindConditions<User>): Promise<User[]>;

    async find(options?: FindManyOptions<User>): Promise<User[]>;

    async find(options?: any): Promise<User[]> {
        return await this.usersRepository.find(options);
    }

    async findOne(id: number): Promise<User | undefined> {
        return await this.usersRepository.findOne(id);
    }

    async findOneByAccount(account: string): Promise<User | undefined> {
        return await this.usersRepository.findOne({
            where: { account: account }
        });
    }

    async setToken(id: number, token: string, service: string) {
        try {
            await this.usersRepository.update(id, {
                toggl_token: token,
                third_party_service: service
            });
        } catch (err) {
            throw new ImATeapotException(err.code);
        }
    }

    async setRefreshToken(refreshToken: string, userId: number) {
        const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.usersRepository.update(userId, {
            refresh_token: currentHashedRefreshToken
        });
    }

    async removeRefreshToken(userId: number) {
        return this.usersRepository.update(userId, {
            refresh_token: null
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
