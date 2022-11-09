import { Test, TestingModule } from '@nestjs/testing';
import { User, UsersService } from '../users';
import { ProjectService } from './projects.service';
import { ThirdPartyFactory } from '../ThirdParty/third-party.factory';
import { SummariesService } from './summaries.service';
import { RedisService } from 'src/app/modules/redis';
import { User as UserMongo } from 'src/schemas/user.schema';
import { Project } from 'src/schemas/project.schema';
import { getModelToken } from '@nestjs/mongoose';

describe('ProjectService', () => {
    let service: ProjectService;

    const user: Omit<User, 'summaries'> = {
        id: 1,
        account: 'jjj',
        email: 'test',
        password: 'DGAF',
        toggl_token: 'DGAF'
    };

    const userMongo: UserMongo = {
        account: 'jjj',
        email: 'test',
        password: 'DGAF',
        toggl_token: 'DGAF',
        mysqlId: 1
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
        _id: 1,
        id: 1,
        name: 'meditation',
        lastUpdated: new Date('2021-05-30 02:49:54'),
        user: userMongo,
        thirdPartyId: 123
    };

    const mockProjects = [
        {
            _id: 1,
            name: 'meditation',
            last_updated: new Date('2021-05-30 02:49:54'),
            user: userMongo,
            userMysql: user,
            project_id: 123
        },
        {
            _id: 2,
            name: 'sleep',
            last_updated: new Date('2021-05-30 02:49:54'),
            user: userMongo,
            userMysql: user,
            project_id: 223
        },
        {
            _id: 3,
            name: 'eat',
            last_updated: new Date('2021-05-30 02:49:54'),
            user: userMongo,
            userMysql: user,
            project_id: 323
        }
    ];

    const mockProjectModel = {
        findOne: jest.fn(() => ({
            ...mockProject,
            populate: jest.fn(() => mockProject)
        })),
        find: jest.fn(() => ({
            sort: jest.fn(() => ({
                limit: jest.fn(() => ({
                    populate: jest.fn(() => mockProjects)
                }))
            }))
        })),
        deleteOne: jest.fn(),
        findByIdAndUpdate: jest.fn(() => mockProject),
        create: jest.fn()
    };

    const mockUserModel = {
        findOne: jest.fn(() => Promise.resolve<Partial<UserMongo>>(userMongo))
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
                    provide: getModelToken(Project.name),
                    useValue: mockProjectModel
                },
                {
                    provide: getModelToken(UserMongo.name),
                    useValue: mockUserModel
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

        expect(mockProjectModel.findOne).toBeCalledWith({
            user: userMongo
        });
    });

    it('should return least update project', async () => {
        // 2021/5/30 Note: sould find out a better way to check the argv and return certain amount of data
        const result = await service.getLeastUpdatedProjects(1);
        expect(result).toEqual(mockProjects);

        expect(mockProjectModel.find).toBeCalledWith({});
    });

    it('should update last_updated', async () => {
        const mockDate = new Date(1466424490000);
        const spyOnDate = jest
            .spyOn(global, 'Date')
            .mockImplementation(() => mockDate as unknown as string);
        await service.updateProjectLastUpdated(mockProject);
        expect(mockProjectModel.findByIdAndUpdate).toBeCalledWith(mockProject.id, {
            lastUpdated: mockDate
        });
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
        expect(mockProjectModel.deleteOne).toBeCalledTimes(1);
        expect(mockProjectModel.deleteOne).toBeCalledWith({ user: userMongo });
    });

    it('should set the given project and delete the current one', async () => {
        const mockDate = new Date(1466424490000);
        const spyOnDate = jest
            .spyOn(global, 'Date')
            .mockImplementation(() => mockDate as unknown as string);
        await service.setCurrentProject(user, 'sleep');
        expect(mockProjectModel.create).toBeCalledWith({
            name: 'sleep',
            user: userMongo,
            thirdPartyId: 223,
            lastUpdated: new Date(1466424490000)
        });
        expect(mockSummariesService.syncWithThirdParty).toBeCalledTimes(1);
        spyOnDate.mockRestore();
    });
});
