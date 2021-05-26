import { BasicStrategy as Strategy } from 'passport-http';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({ usernameField: 'account' });
    }

    async validate(account: string, password: string): Promise<any> {
        const user = await this.authService.validateUser(account, password);
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}
