import { ImATeapotException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ThirdPartyServiceKeys } from '../ThirdParty/third-party.factory';
import { User, UserDocument } from 'src/schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name)
        private userModel: Model<UserDocument>
    ) {}

    async find(...args: any): Promise<UserDocument[]> {
        return await this.userModel.find(...args);
    }

    async findOne(...args: any): Promise<UserDocument | undefined> {
        return await this.userModel.findOne(...args);
    }

    async findOneByAccount(account: string): Promise<UserDocument | undefined> {
        return await this.userModel.findOne({
            account: account
        });
    }

    async setToken(id: string, token: string, service: ThirdPartyServiceKeys) {
        try {
            await this.userModel.findByIdAndUpdate(id, {
                toggl_token: token,
                third_party_service: service
            });
        } catch (err) {
            throw new ImATeapotException(err.code);
        }
    }

    async setRefreshToken(refreshToken: string, userId: string) {
        const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.userModel.findByIdAndUpdate(userId, {
            refresh_token: currentHashedRefreshToken
        });
    }

    async removeRefreshToken(userId: string) {
        return this.userModel.findByIdAndUpdate(userId, {
            refresh_token: null
        });
    }

    async attempRefreshToken(
        refreshToken: string,
        userId: string
    ): Promise<void | UserDocument> {
        const user = await this.userModel.findById(userId);

        const isRefreshTokenMatching = await bcrypt.compare(
            refreshToken,
            user.refresh_token
        );

        if (isRefreshTokenMatching) {
            return user;
        }
    }
}
