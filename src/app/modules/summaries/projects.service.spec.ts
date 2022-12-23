import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users';
import { ProjectService } from './projects.service';
import { ThirdPartyFactory } from '../ThirdParty/third-party.factory';
import { SummariesService } from './summaries.service';
import { RedisService } from 'src/app/modules/redis';
import { UserDocument, User } from 'src/schemas/user.schema';
import { Project, ProjectDocument } from 'src/schemas/project.schema';
import { getModelToken } from '@nestjs/mongoose';
import { createMock } from '@golevelup/ts-jest';

describe('ProjectService', () => {
    let service: ProjectService;
    const userMongo: UserDocument = createMock<UserDocument>({
        account: 'jjj',
        _id: () => '1234',
        email: 'test',
        password: 'DGAF',
        toggl_token: 'DGAF'
    });

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

    const mockProjectDoc = (mock?: Partial<ProjectDocument>): ProjectDocument =>
        createMock<ProjectDocument>({
            _id: () => mock._id,
            name: mock.name,
            lastUpdated: mock.lastUpdated,
            user: userMongo,
            thirdPartyId: mock.thirdPartyId
        });

    const mockProject: ProjectDocument = mockProjectDoc({
        _id: 1,
        name: 'meditation',
        lastUpdated: new Date('2021-05-30 02:49:54'),
        thirdPartyId: 123
    });

    const mockProjects = [
        mockProject,
        mockProjectDoc({
            _id: 2,
            name: 'sleep',
            lastUpdated: new Date('2021-05-30 02:49:54'),
            thirdPartyId: 223
        }),
        mockProjectDoc({
            _id: 3,
            name: 'eat',
            lastUpdated: new Date('2021-05-30 02:49:54'),
            thirdPartyId: 323
        })
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
        findOne: jest.fn(() => Promise.resolve<Partial<User>>(userMongo))
    };

    const mockUsersService = {
        findOne: jest.fn(() => userMongo)
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
                    provide: getModelToken(User.name),
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
        const result = await service.getProjectByUser(userMongo);

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
        const result = await service.getAllProjects(userMongo);
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
        await service.deleteProjectByUser(userMongo);
        expect(mockProjectModel.deleteOne).toBeCalledTimes(1);
        expect(mockProjectModel.deleteOne).toBeCalledWith({ user: userMongo });
    });

    it('should set the given project and delete the current one', async () => {
        const mockDate = new Date(1466424490000);
        const spyOnDate = jest
            .spyOn(global, 'Date')
            .mockImplementation(() => mockDate as unknown as string);
        await service.setCurrentProject(userMongo, 'sleep');
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
