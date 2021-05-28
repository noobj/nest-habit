import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({ usernameField: 'account' });
    }

    async validate(accout: string, password: string): Promise<any> {
        const user = await this.authService.validateUser(accout, password);
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}
