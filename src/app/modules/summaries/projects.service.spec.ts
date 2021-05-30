import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from './entities';
import { ImATeapotException } from '@nestjs/common';
import { User, UsersService } from '../users';
import { ProjectService } from './projects.service';
import { SyncTogglService } from 'src/app/console/modules/sync-toggl';

jest.mock('../../console/modules/sync-toggl/TogglClient', () => {
    return {
        TogglClient: jest.fn().mockImplementation(() => {
            return {
                getProjects: () => [
                    {
                        id: 2,
                        name: 'sleep',
                    },
                    {
                        id: 1,
                        name: 'meditation',
                    },
                ],
            };
        }),
    };
});

describe('ProjectService', () => {
    let service: ProjectService;

    const user: Omit<User, 'summaries'> = {
        id: 1,
        account: 'jjj',
        email: 'test',
        password: 'DGAF',
        toggl_token: 'DGAF',
    };

    const mockProject = {
        id: 1,
        name: 'meditation',
        last_updated: new Date('2021-05-30 02:49:54'),
        user: user,
    };

    const mockProjects = [
        {
            id: 1,
            name: 'meditation',
            last_updated: new Date('2021-05-30 02:49:54'),
            user: user,
        },
        {
            id: 2,
            name: 'sleep',
            last_updated: new Date('2021-05-30 02:49:54'),
            user: user,
        },
        {
            id: 3,
            name: 'eat',
            last_updated: new Date('2021-05-30 02:49:54'),
            user: user,
        },
    ];

    const mockProjectRepo = {
        findOne: jest.fn(() => Promise.resolve<Partial<Project>>(mockProject)),
        find: jest.fn(() => Promise.resolve<Partial<Project>[]>(mockProjects)),
        save: jest.fn(),
    };

    const mockSyncTogglService = {
        getProjectByUser: jest.fn((name: string) => ({
            name: name,
            id: 123,
        })),
        getLeastUpdatedProjects: jest.fn(),
    };

    const mockUsersService = {
        findOne: jest.fn(() => user),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectService,
                {
                    provide: getRepositoryToken(Project),
                    useValue: mockProjectRepo,
                },
                {
                    provide: SyncTogglService,
                    useValue: mockSyncTogglService,
                },
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        service = module.get<ProjectService>(ProjectService);
    });

    it('should return project of the user', async () => {
        const result = await service.getProjectByUser(user);

        expect(result).toEqual(mockProject);

        expect(mockProjectRepo.findOne).toBeCalledWith({
            where: {
                user: user,
            },
        });
    });

    it('should return least update project', async () => {
        // 2021/5/30 Note: sould find out a better way like check the argv and return certain amount of data
        const result = await service.getLeastUpdatedProjects(1);
        expect(result).toEqual(mockProjects);

        expect(mockProjectRepo.find).toBeCalledWith({
            relations: ['user'],
            order: {
                last_updated: 'DESC',
            },
            take: 1,
        });
    });

    it('should update last_updated', async () => {
        const mockDate = new Date(1466424490000);
        const spyOnDate = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
        await service.updateProjectLastUpdated(mockProject);
        expect(mockProjectRepo.save).toBeCalledWith({
            id: 1,
            name: 'meditation',
            last_updated: new Date(1466424490000),
            user: user,
        });
        spyOnDate.mockRestore();
    });

    it('should get all projects of the user', async () => {
        const result = await service.getAllProjects(user);
        expect(result).toEqual([
            {
                id: 2,
                name: 'sleep',
            },
            {
                id: 1,
                name: 'meditation',
            },
        ]);
    });

});
