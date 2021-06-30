import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../modules/users';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(username);

        if (!user) return null;

        user.password = user.password.replace('$2y$', '$2a$');

        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }

        return null;
    }

    public login(user: any) {
        const payload = {
            account: user.account,
            sub: user.id,
        };

        const access_token = this.jwtService.sign(payload);
        const refresh_token = this.generateRefreshToken(user.id);

        return { access_token, refresh_token };
    }

    public generateAccessToken(user: any): string {
        const payload = {
            account: user.account,
            sub: user.id,
        };

        return this.jwtService.sign(payload);
    }

    public generateRefreshToken(userId: number): string {
        return this.jwtService.sign(
            { userId },
            {
                secret: this.configService.get('jwt.refresh_secret'),
                expiresIn: `${this.configService.get('refresh_expiration_time')}s`,
            }
        );
    }
}
