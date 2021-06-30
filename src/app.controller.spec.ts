import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AuthService } from './app/auth/auth.service';
import { ProjectService } from './app/modules/summaries';
import { TogglService } from './app/modules/toggl/toggl.service';
import { UsersService } from './app/modules/users/users.service';

describe('AppController', () => {
    let appController: AppController;

    const mockAuthService = {
        login: jest.fn(() => ({
            access_token: '123',
            refresh_token: '456',
        })),
    };

    const mockUsersService = {
        setToken: jest.fn(() => {}),
        setRefreshToken: jest.fn(() => {}),
    };

    const mockProjectService = {};

    const mockTogglService = {};

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                UsersService,
                {
                    provide: ProjectService,
                    useValue: mockProjectService,
                },
                {
                    provide: TogglService,
                    useValue: mockTogglService,
                },
            ],
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
            const fakeRequest: any = {
                session: { token: 1 },
                user: { name: 'jjj', id: 1 },
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
