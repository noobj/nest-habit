import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from './entities';
import { User, UsersService } from '../users';
import { ProjectService } from './projects.service';
import { ThirdPartyFactory } from '../ThirdParty/third-party.factory';
import { SummariesService } from './summaries.service';
import { RedisService } from 'src/app/modules/redis';

describe('ProjectService', () => {
    let service: ProjectService;

    const user: Omit<User, 'summaries'> = {
        id: 1,
        account: 'jjj',
        email: 'test',
        password: 'DGAF',
        toggl_token: 'DGAF'
    };

    const mockThirdPartyService = jest.fn().mockImplementation(() => ({
        getProjects: () => ({
            data: [
                {
                    id: 223,
                    name: 'sleep'
                },
                {
                    id: 123,
                    name: 'meditation'
                }
            ]
        })
    }));

    ThirdPartyFactory.getService = mockThirdPartyService;

    const mockProject = {
        id: 1,
        name: 'meditation',
        last_updated: new Date('2021-05-30 02:49:54'),
        user: user,
        project_id: 123
    };

    const mockProjects = [
        {
            id: 1,
            name: 'meditation',
            last_updated: new Date('2021-05-30 02:49:54'),
            user: user,
            project_id: 123
        },
        {
            id: 2,
            name: 'sleep',
            last_updated: new Date('2021-05-30 02:49:54'),
            user: user,
            project_id: 223
        },
        {
            id: 3,
            name: 'eat',
            last_updated: new Date('2021-05-30 02:49:54'),
            user: user,
            project_id: 323
        }
    ];

    const mockProjectRepo = {
        findOne: jest.fn(() => Promise.resolve<Partial<Project>>(mockProject)),
        find: jest.fn(() => Promise.resolve<Partial<Project>[]>(mockProjects)),
        save: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockReturnThis()
    };

    const mockUsersService = {
        findOne: jest.fn(() => user)
    };

    const mockSummariesService = {
        syncWithThirdParty: jest.fn(() => 2)
    };

    const mockRedisClient = {
        keys: jest.fn(() => {
            return ['fake'];
        }),
        del: jest.fn()
    };

    const mockRedisService = {
        getClient: jest.fn(() => mockRedisClient)
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectService,
                {
                    provide: getRepositoryToken(Project),
                    useValue: mockProjectRepo
                },
                {
                    provide: SummariesService,
                    useValue: mockSummariesService
                },
                {
                    provide: UsersService,
                    useValue: mockUsersService
                },
                {
                    provide: RedisService,
                    useValue: mockRedisService
                }
            ]
        }).compile();

        service = module.get<ProjectService>(ProjectService);
    });

    it('should return project of the user', async () => {
        const result = await service.getProjectByUser(user);

        expect(result).toEqual(mockProject);

        expect(mockProjectRepo.findOne).toBeCalledWith({
            where: {
                user: user
            }
        });
    });

    it('should return least update project', async () => {
        // 2021/5/30 Note: sould find out a better way to check the argv and return certain amount of data
        const result = await service.getLeastUpdatedProjects(1);
        expect(result).toEqual(mockProjects);

        expect(mockProjectRepo.find).toBeCalledWith({
            relations: ['user'],
            order: {
                last_updated: 'DESC'
            },
            take: 1
        });
    });

    it('should update last_updated', async () => {
        const mockDate = new Date(1466424490000).toISOString();
        const spyOnDate = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
        await service.updateProjectLastUpdated(mockProject);
        expect(mockProjectRepo.save).toBeCalledWith(mockProject);
        spyOnDate.mockRestore();
    });

    it('should get all projects of the user', async () => {
        const result = await service.getAllProjects(user);
        expect(result).toEqual({
            data: [
                {
                    id: 223,
                    name: 'sleep'
                },
                {
                    id: 123,
                    name: 'meditation'
                }
            ]
        });
    });

    it('should delete the current project of the user', async () => {
        await service.deleteProjectByUser(user);
        expect(mockProjectRepo.delete).toBeCalledTimes(1);
        expect(mockProjectRepo.where).toBeCalledWith('user_id = :id', { id: user.id });
    });

    it('should set the given project and delete the current one', async () => {
        const mockDate = new Date(1466424490000).toISOString();
        const spyOnDate = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
        await service.setCurrentProject(user, 'meditation');
        expect(mockProjectRepo.save).toBeCalledWith({
            id: 1,
            name: 'meditation',
            user: user,
            project_id: 123,
            last_updated: new Date(1466424490000)
        });
        expect(mockSummariesService.syncWithThirdParty).toBeCalledTimes(1);
        spyOnDate.mockRestore();
    });
});
