import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '.';

import { UsersService } from './users.service';

describe('UsersService', () => {
    let service: UsersService;

    const user: Omit<User, 'summaries'> = {
        id: 1,
        account: 'jjj',
        email: 'test',
        password: 'DGAF',
        toggl_token: 'DGAF',
    };

    const mockUsersRepo = {
        findOne: jest.fn(() => Promise.resolve<Partial<User>>(user)),
        update: jest.fn(() => {}),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUsersRepo,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('should return user by the given account', async () => {
        const result = await service.findOneByAccount('jjj');

        expect(result).toEqual(user);
        expect(mockUsersRepo.findOne).toBeCalledWith({
            where: { account: 'jjj' },
        });
    });

    it('should return user by the given id', async () => {
        const result = await service.findOne(1);

        expect(result).toEqual(user);
        expect(mockUsersRepo.findOne).toBeCalledWith(1);
    });

    it('should set the users Toggl token', async () => {
        await service.setToken(user.id, '123456', 'toggl');

        expect(mockUsersRepo.update).toBeCalledWith(user.id, {
            toggl_token: '123456',
            third_party_service: 'toggl',
        });
    });
});
