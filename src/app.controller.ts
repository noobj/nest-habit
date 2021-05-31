import {
    Controller,
    Request,
    UseGuards,
    Get,
    Redirect,
    Post,
    UploadedFile,
    UseInterceptors,
    UseFilters,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Express } from 'express';
import { resolve } from 'path';
import * as sharp from 'sharp';
import { unlinkSync } from 'fs';

import { BasicAuthGuard } from './app/auth/basic-auth.guard';
import { AuthService } from './app/auth/auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { imageFileFilter } from './common/helpers/file-upload.utils';
import { HttpExceptionFilter } from './common/exception-filters/http-exception.filter';

@Controller()
export class AppController {
    constructor(private authService: AuthService) {}

    @UseGuards(AuthGuard('local'))
    @Post('auth/login')
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
    @Get('logout')
    logout(@Request() req) {
        req.session.cookie.expires = Date.now();
        req.session.cookie.maxAge = 0;
    }
}
