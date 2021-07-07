import {
    Controller,
    Request,
    UseGuards,
    Get,
    Post,
    UploadedFile,
    UseInterceptors,
    UseFilters,
    Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Express } from 'express';
import { resolve } from 'path';
import * as sharp from 'sharp';
import { unlinkSync } from 'fs';

import { AuthService } from './app/auth/auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { imageFileFilter } from './common/helpers/file-upload.utils';
import { HttpExceptionFilter } from './common/exception-filters/http-exception.filter';
import { UsersService } from 'src/app/modules/users/users.service';
import { ProjectService } from 'src/app/modules/summaries/projects.service';
import { ThirdPartyService } from './app/modules/ThirdParty/third-party.service';

@Controller()
export class AppController {
    constructor(
        private authService: AuthService,
        private userService: UsersService,
        private projectService: ProjectService,
        private thirdPartyService: ThirdPartyService
    ) {}

    @UseGuards(AuthGuard('local'))
    @Post('auth/login')
    async login(@Request() req) {
        const token = await this.authService.login(req.user);
        req.session.access_token = token.access_token;
        req.session.refresh_token = token.refresh_token;
        this.userService.setRefreshToken(token.refresh_token, req.user.id);

        return 'done';
    }

    @UseGuards(AuthGuard('jwt-refresh'))
    @Get('refresh')
    refresh(@Request() req) {
        req.session.access_token = this.authService.generateAccessToken(req.user);

        return 'done';
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('upload_avatar')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: 'dist/public/img',
            }),
            fileFilter: imageFileFilter,
        })
    )
    @UseFilters(new HttpExceptionFilter())
    async uploadFile(@Request() req, @UploadedFile() file: Express.Multer.File) {
        await sharp(file.path)
            .resize(200, 200)
            .jpeg({ quality: 90 })
            .toFile(resolve('dist/public/img', `${req.user.id}.jpg`));
        unlinkSync(file.path);

        const response = {
            originalname: file.originalname,
            filename: `${req.user.id}.jpg`,
        };

        return response;
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('api_token')
    async setToken(@Request() req, @Body('api_token') apiToken) {
        const user = await this.userService.findOne(req.user.id);
        await this.thirdPartyService
            .serviceFactory(user.third_party_service)
            .checkTokenValid(apiToken);

        await this.userService.setToken(user.id, apiToken);
        await this.projectService.deleteProjectByUser(user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('logout')
    async logout(@Request() req) {
        req.session.cookie.expires = Date.now();
        req.session.cookie.maxAge = 0;
        await this.userService.removeRefreshToken(req.user.id);
    }
}
