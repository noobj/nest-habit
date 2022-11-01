import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DailySummary } from './entities';
import { SummariesService } from './summaries.service';
import { Between } from 'typeorm';
import { ImATeapotException } from '@nestjs/common';
import { User } from '../users';
import { ProjectService } from './projects.service';
import { ModuleRef } from '@nestjs/core';
import { ThirdPartyFactory } from '../ThirdParty/third-party.factory';
import { RedisService } from 'src/app/modules/redis';
import { SocketServerGateway } from 'src/app/modules/socket-server/socket-server.gateway';
import { Project } from 'src/schemas/project.schema';
import { User as MongoUser } from 'src/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Summary } from 'src/schemas/summary.schema';

describe('SummariesService', () => {
    let service: SummariesService;

    const user: Omit<User, 'summaries'> = {
        id: 1,
        account: 'jjj',
        email: 'test',
        password: 'DGAF',
        toggl_token: 'DGAF'
    };

    const userWithMysqlId = {
        ...user,
        mysqlId: 1
    };

    const project: Project = {
        mysqlId: 30.0,
        user: userWithMysqlId,
        thirdPartyId: 157099012,
        name: 'meditation',
        lastUpdated: new Date('2022-10-24 16:50:19')
    };

    const mockSummaryModel = {
        findOne: jest.fn((entry) =>
            Promise.resolve<Summary>({
                project: entry.project,
                date: entry.date,
                duration: 1500000,
                user: entry.user
            })
        ),
        save: jest.fn((entries) => Promise.resolve<DailySummary[]>(entries)),
        find: jest.fn(() =>
            Promise.resolve<Summary[]>([
                {
                    date: '2021-04-23',
                    duration: 1500000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-04-21',
                    duration: 12000000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-04-20',
                    duration: 3300000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-04-19',
                    duration: 1800000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-04-17',
                    duration: 2700000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-04-13',
                    duration: 2700000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-04-12',
                    duration: 1800000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-04-11',
                    duration: 2700000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-04-10',
                    duration: 1800000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-04-09',
                    duration: 3000000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-04-07',
                    duration: 2700000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-04-03',
                    duration: 2700000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-04-02',
                    duration: 16200000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-03-31',
                    duration: 2700000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-03-30',
                    duration: 1800000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-03-16',
                    duration: 2700000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-03-09',
                    duration: 1800000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-03-05',
                    duration: 5400000,
                    user: userWithMysqlId,
                    project: project
                },
                {
                    date: '2021-03-01',
                    duration: 2700000,
                    user: userWithMysqlId,
                    project: project
                }
            ])
        ),
        query: jest.fn(() => Promise.resolve<any>([{ streak: 3 }]))
    };

    const mockProjectService = {
        getProjectByUser: jest.fn((name: string) => ({
            name: name,
            id: 123
        })),
        getLeastUpdatedProjects: jest.fn(),
        updateProjectLastUpdated: jest.fn()
    };

    const mockSocketServerGateway = {
        server: jest.fn()
    };

    const mockModuleRef = {
        get: jest.fn(() => {
            return mockProjectService;
        })
    };

    const mockThirdPartyService = jest.fn().mockImplementation(() => ({
        fetch: () => [
            {
                start: '2021-01-10T11:00:51+08:00',
                dur: 1000
            },
            {
                start: '2021-01-10T11:00:51+08:00',
                dur: 1000
            },
            {
                start: '2021-01-11T11:00:51+08:00',
                dur: 1000
            }
        ]
    }));

    ThirdPartyFactory.getService = mockThirdPartyService;

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
                SummariesService,
                {
                    provide: getModelToken(Summary.name),
                    useValue: mockSummaryModel
                },
                {
                    provide: getModelToken(Project.name),
                    useValue: mockSummaryModel
                },
                {
                    provide: getModelToken(MongoUser.name),
                    useValue: mockSummaryModel
                },
                {
                    provide: ProjectService,
                    useValue: mockProjectService
                },
                {
                    provide: ModuleRef,
                    useValue: mockModuleRef
                },
                {
                    provide: ThirdPartyFactory,
                    useValue: mockThirdPartyService
                },
                {
                    provide: RedisService,
                    useValue: mockRedisService
                },
                {
                    provide: SocketServerGateway,
                    useValue: mockSocketServerGateway
                }
            ]
        }).compile();

        service = module.get<SummariesService>(SummariesService);
        service.onModuleInit();
    });

    it('should return raw data of daily summaries', async () => {
        const result = await service.getRawDailySummaries('startDate', 'endDate', user);

        expect(result[0]).toEqual({
            id: 9,
            date: '2021-04-23',
            duration: 1500000,
            user: user
        });
        expect(mockSummaryModel.find).toBeCalledWith({
            project: project,
            user: user,
            date: { $gte: 'startDate', $lte: 'endDate' }
        });
    });

    it('should return processed summaries', async () => {
        const rawData = await service.getRawDailySummaries('startDate', 'endDate', user);
        const result = await service.processTheRawSummaries(rawData);

        expect(result[0]).toEqual({
            date: 'Apr 23, 2021',
            duration: '25m',
            level: 1,
            timestamp: 1619107200000
        });
        expect(result[1]).toEqual({
            date: 'Apr 21, 2021',
            duration: '3h20m',
            level: 4,
            timestamp: 1618934400000
        });
    });

    it('should return longest day summary', async () => {
        const rawData = await service.getRawDailySummaries('startDate', 'endDate', user);
        const result = await service.getLongestDayRecord(rawData);

        expect(result).toEqual({
            date: '2021-04-02',
            duration: '4h30m'
        });
    });

    it('should return total duration', async () => {
        const rawData = await service.getRawDailySummaries('startDate', 'endDate', user);
        const result = await service.getTotalDuration(rawData);

        expect(result).toEqual('20h0m');
    });

    it('should return total duration of April 2021', async () => {
        const globalDate = Date;
        Date.now = jest.fn(() => new Date(Date.UTC(2021, 3, 8)).valueOf());
        const rawData = await service.getRawDailySummaries('startDate', 'endDate', user);
        const result = await service.getTotalThisMonth(rawData);

        expect(result).toEqual('15h15m');

        global.Date = globalDate;
    });

    it('should return upsert result', async () => {
        const result = await service.upsert([
            {
                project: project,
                date: '2021-04-23',
                duration: 1500000,
                user: userWithMysqlId
            }
        ]);

        expect(result.entries).toEqual([
            {
                id: 9,
                project: 9,
                date: '2021-04-23',
                duration: 1500000,
                user: user
            }
        ]);
    });

    it('should upsert failed and throw Validation error', async () => {
        await expect(async () => {
            await service.upsert([
                {
                    project: project,
                    date: '123',
                    duration: 1500000,
                    user: userWithMysqlId
                }
            ]);
        }).rejects.toThrow(ImATeapotException);
    });

    it('should upsert failed and throw out exception', async () => {
        const spyMockDSRepo = jest
            .spyOn(mockSummaryModel, 'findOne')
            .mockImplementation(() => {
                throw ImATeapotException;
            });

        await expect(async () => {
            await service.upsert([
                {
                    project: project,
                    date: '2021-04-23',
                    duration: 1500000,
                    user: userWithMysqlId
                }
            ]);
        }).rejects.toThrow(ImATeapotException);
        spyMockDSRepo.mockImplementation((entry) =>
            Promise.resolve<Summary>({
                project: entry.project,
                date: entry.date,
                duration: 1500000,
                user: entry.user
            })
        );
    });

    it('should syncWithThirdParty', async () => {
        const result = await service.syncWithThirdParty(365, user, false);

        expect(result).toEqual(2);
        expect(mockRedisClient.keys).toBeCalledWith(`summaries:${user.id}*`);
        expect(mockRedisClient.del).toBeCalledWith('fake');
    });

    it('should calculate the current streak', async () => {
        const streak = await service.getCurrentStreak(user);
        expect(streak).toEqual(4);
    });
});
