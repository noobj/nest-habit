import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { UsersModule } from '../modules/users';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshStrategy } from './jwt_refresh.strategy';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('jwt.secret'),
                signOptions: {
                    expiresIn: `${configService.get('jwt.expiration_time')}s`,
                },
            }),
        }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule {}
