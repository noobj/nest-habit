import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AuthService } from './app/auth/auth.service';
import { UsersService } from './app/modules/users/users.service';

describe('AppController', () => {
    let appController: AppController;

    const mockAuthService = {
        login: jest.fn(() => ({
            access_token: '123',
        })),
    };

    const mockUsersService = {
        setToken: jest.fn(() => {}),
    };

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [AuthService, UsersService],
            controllers: [AppController],
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
            const fakeRequest = {
                session: { token: 1 },
                user: { name: 'jjj', id: 1 },
            };
            const result = await appController.login(fakeRequest);

            expect(result.access_token).toEqual('123');
            expect(fakeRequest.session.token).toEqual('123');
            expect(mockAuthService.login).toHaveBeenCalledTimes(1);
            expect(mockAuthService.login).toHaveBeenCalledWith(fakeRequest.user);
        });
    });
});
