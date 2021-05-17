import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AuthService } from './app/auth/auth.service';
type MockType<T> = {
    [P in keyof T]?: jest.Mock<{}>;
};

describe('AppController', () => {
    let appController: AppController;
    let authService: AuthService;

    beforeEach(async () => {
        const serviceMockFactory: () => MockType<AuthService> = jest.fn(() => ({
            login: jest.fn((abc) => '123'),
        }));

        const app: TestingModule = await Test.createTestingModule({
            providers: [
                // Provide your mock instead of the actual repository
                { provide: AuthService, useFactory: serviceMockFactory },
            ],
            controllers: [AppController],
        }).compile();

        authService = app.get(AuthService);
        appController = app.get<AppController>(AppController);
    });

    describe('root', () => {
        it('should return "Hello World!"', () => {
            jest.spyOn(authService, 'login').mockImplementationOnce((a) =>
                Promise.resolve({ access_token: '123' })
            );
            appController.login('123')
            .then((re) => {
                expect(re.access_token).toEqual('123');
            });
        });
    });
});
