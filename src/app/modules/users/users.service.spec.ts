import { createMock } from '@golevelup/ts-jest';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDocument } from 'src/schemas/user.schema';

import { UsersService } from './users.service';

describe('UsersService', () => {
    let service: UsersService;

    const user: UserDocument = createMock<UserDocument>({
        account: 'jjj',
        _id: () => '1',
        email: 'test',
        password: 'DGAF',
        toggl_token: 'DGAF'
    });

    const mockUsersRepo = {
        findOne: jest.fn(() => Promise.resolve<Partial<UserDocument>>(user)),
        findByIdAndUpdate: jest.fn()
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getModelToken('User'),
                    useValue: mockUsersRepo
                }
            ]
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('should return user by the given account', async () => {
        const result = await service.findOneByAccount('jjj');

        expect(result).toEqual(user);
        expect(mockUsersRepo.findOne).toBeCalledWith({
            account: 'jjj'
        });
    });

    it('should return user by the given id', async () => {
        const result = await service.findOne(1);

        expect(result).toEqual(user);
        expect(mockUsersRepo.findOne).toBeCalledWith(1);
    });

    it('should set the users Toggl token', async () => {
        await service.setToken(user.id, '123456', 'toggl');

        expect(mockUsersRepo.findByIdAndUpdate).toBeCalledWith(user.id, {
            toggl_token: '123456',
            third_party_service: 'toggl'
        });
    });
});
