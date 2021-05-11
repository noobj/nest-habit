import { Controller, Request, Post, UseGuards, Get, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BasicAuthGuard } from './app/auth/basic-auth.guard';
import { AuthService } from './app/auth/auth.service';
import { Response } from 'express';

@Controller()
export class AppController {
    constructor(private authService: AuthService) {}

    @UseGuards(BasicAuthGuard)
    @Get('auth/login')
    async login(@Request() req, @Res({ passthrough: true }) res: Response) {
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
