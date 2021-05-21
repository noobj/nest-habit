import { Controller, Request, UseGuards, Get, Redirect } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { BasicAuthGuard } from './app/auth/basic-auth.guard';
import { AuthService } from './app/auth/auth.service';

@Controller()
export class AppController {
    constructor(private authService: AuthService) {}

    @UseGuards(BasicAuthGuard)
    @Get('auth/login')
    @Redirect('/', 302)
    async login(@Request() req) {
        const token = await this.authService.login(req.user);
        req.session.token = token.access_token;

        return token;
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }
}
