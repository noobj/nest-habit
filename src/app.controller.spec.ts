import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthService } from './app/auth/auth.service';
import { ProjectService } from './app/modules/summaries';
import { ThirdPartyFactory } from './app/modules/ThirdParty/third-party.factory';
import { UsersService } from './app/modules/users/users.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { RedisService } from './app/modules/redis';

describe('AppController', () => {
    let appController: AppController;

    const mockAuthService = {
        login: jest.fn(() => ({
            access_token: '123',
            refresh_token: '456'
        }))
    };

    const mockUsersService = {
        setToken: jest.fn(),
        setRefreshToken: jest.fn()
    };

    const mockService = {
        add: jest.fn(),
        getClient: jest.fn()
    };

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                UsersService,
                {
                    provide: ProjectService,
                    useValue: mockService
                },
                {
                    provide: ThirdPartyFactory,
                    useValue: mockService
                },
                {
                    provide: ConfigService,
                    useValue: mockService
                },
                {
                    provide: RedisService,
                    useValue: mockService
                },
                {
                    provide: WINSTON_MODULE_PROVIDER,
                    useValue: mockService
                }
            ],
            controllers: [AppController]
        })
            .overrideProvider(AuthService)
            .useValue(mockAuthService)
            .overrideProvider(UsersService)
            .useValue(mockUsersService)
            .compile();

        appController = app.get<AppController>(AppController);
    });

    describe('root', () => {
        it('should return access token', async () => {
            const fakeRequest: any = {
                session: { token: 1 },
                user: { name: 'jjj', id: 1 }
            };
            const result = await appController.login(fakeRequest);

            expect(result).toEqual('done');
            expect(fakeRequest.session.access_token).toEqual('123');
            expect(mockAuthService.login).toHaveBeenCalledTimes(1);
            expect(mockUsersService.setRefreshToken).toBeCalledWith(
                fakeRequest.session.refresh_token,
                fakeRequest.user.id
            );
            expect(mockAuthService.login).toHaveBeenCalledWith(fakeRequest.user);
        });
    });
});
