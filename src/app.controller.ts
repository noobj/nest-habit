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
    UnsupportedMediaTypeException,
    BadRequestException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Express } from 'express';
import { resolve } from 'path';
import * as sharp from 'sharp';
import { unlinkSync } from 'fs';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiProperty,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
    ApiUnsupportedMediaTypeResponse
} from '@nestjs/swagger';

import { AuthService } from './app/auth/auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { imageFileFilter } from './common/helpers/file-upload.utils';
import { HttpExceptionFilter } from './common/exception-filters/http-exception.filter';
import { UsersService } from 'src/app/modules/users/users.service';
import { ProjectService } from 'src/app/modules/summaries/projects.service';
import { ThirdPartyService } from './app/modules/ThirdParty/third-party.service';
import Services from 'src/config/third-party-services.map';

class LoginDTO {
    @ApiProperty({ required: true })
    readonly account: string;
    @ApiProperty({ required: true })
    readonly password: string;
}

class TokenAndService {
    @ApiProperty({ required: true })
    readonly service: string;
    @ApiProperty({ required: true })
    readonly api_token: string;
}

class FileUploadDto {
    @ApiProperty({ type: 'string', format: 'binary' })
    file: any;
}

@ApiTags('profile')
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
    @ApiOperation({ summary: 'Log in and get the cookies' })
    @ApiBody({
        description: 'username and password',
        type: LoginDTO
    })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @ApiResponse({ status: 201, description: 'Success' })
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
                destination: 'dist/public/img'
            }),
            fileFilter: imageFileFilter
        })
    )
    @ApiOperation({ summary: 'Upload the avatar' })
    @ApiConsumes('multipart/form-data')
    @ApiUnsupportedMediaTypeResponse({ description: 'Wrong file format' })
    @ApiBody({
        description: 'Avatar',
        type: FileUploadDto
    })
    @ApiResponse({ status: 201, description: 'Success' })
    @UseFilters(new HttpExceptionFilter())
    async uploadFile(@Request() req, @UploadedFile() file: Express.Multer.File) {
        try {
            await sharp(file?.path)
                .resize(200, 200)
                .jpeg({ quality: 90 })
                .toFile(resolve('dist/public/img', `${req.user.id}.jpg`));
            unlinkSync(file?.path);
        } catch (error) {
            throw new UnsupportedMediaTypeException();
        }

        const response = {
            originalname: file.originalname,
            filename: `${req.user.id}.jpg`
        };

        return response;
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('api_token')
    @ApiOperation({ summary: 'Set the api token of third party' })
    @ApiBody({
        description: 'service type and token',
        type: TokenAndService
    })
    @ApiResponse({ status: 201, description: 'Success' })
    @ApiBadRequestResponse({ description: 'Third party return error' })
    async setToken(
        @Request() req,
        @Body('api_token') apiToken,
        @Body('service') service
    ) {
        const userId = req.user.id;
        try {
            await this.thirdPartyService
                .serviceFactory(service)
                .checkTokenValid(apiToken);
        } catch (error) {
            throw new BadRequestException('Set Failed');
        }

        await this.userService.setToken(userId, apiToken, service);
        await this.projectService.deleteProjectByUser(userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('services')
    @ApiOperation({ summary: 'Get the all available third party service' })
    @ApiResponse({ status: 200, description: 'Success' })
    async getServices() {
        return Object.keys(Services);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('logout')
    async logout(@Request() req) {
        req.session.cookie.expires = Date.now();
        req.session.cookie.maxAge = 0;
        await this.userService.removeRefreshToken(req.user.id);
    }
}
