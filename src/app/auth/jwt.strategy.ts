import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../modules/users';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private userService: UsersService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: any) => {
                    return req?.session?.access_token;
                },
                ExtractJwt.fromAuthHeaderAsBearerToken()
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get('jwt.secret')
        });
    }

    async validate(payload: any) {
        return await this.userService.findOneByAccount(payload.account);
    }
}
