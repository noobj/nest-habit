import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DailySummary } from './entities';
import { SummariesService } from './summaries.service';
import { Between } from 'typeorm';
import { ImATeapotException } from '@nestjs/common';
import { User } from '../users';
import { ProjectService } from './projects.service';
import { ModuleRef } from '@nestjs/core';

describe('SummariesService', () => {
    let service: SummariesService;

    const user: Omit<User, 'summaries'> = {
        id: 1,
        account: 'jjj',
        email: 'test',
        password: 'DGAF',
        toggl_token: 'DGAF',
    };

    const mockDailySummaryRepo = {
        findOne: jest.fn((entry) =>
            Promise.resolve<DailySummary>({
                id: entry.where.project,
                project: entry.where.project,
                date: entry.where.date,
                duration: 1500000,
                user: entry.where.user,
            })
        ),
        save: jest.fn((entries) => Promise.resolve<DailySummary[]>(entries)),
        find: jest.fn(() =>
            Promise.resolve<Partial<DailySummary>[]>([
                { id: 9, date: '2021-04-23', duration: 1500000, user: user },
                { id: 10, date: '2021-04-21', duration: 12000000, user: user },
                { id: 11, date: '2021-04-20', duration: 3300000, user: user },
                { id: 12, date: '2021-04-19', duration: 1800000, user: user },
                { id: 13, date: '2021-04-17', duration: 2700000, user: user },
                { id: 14, date: '2021-04-13', duration: 2700000, user: user },
                { id: 15, date: '2021-04-12', duration: 1800000, user: user },
                { id: 16, date: '2021-04-11', duration: 2700000, user: user },
                { id: 17, date: '2021-04-10', duration: 1800000, user: user },
                { id: 18, date: '2021-04-09', duration: 3000000, user: user },
                { id: 19, date: '2021-04-07', duration: 2700000, user: user },
                { id: 20, date: '2021-04-03', duration: 2700000, user: user },
                { id: 21, date: '2021-04-02', duration: 16200000, user: user },
                { id: 22, date: '2021-03-31', duration: 2700000, user: user },
                { id: 23, date: '2021-03-30', duration: 1800000, user: user },
                { id: 24, date: '2021-03-16', duration: 2700000, user: user },
                { id: 25, date: '2021-03-09', duration: 1800000, user: user },
                { id: 26, date: '2021-03-05', duration: 5400000, user: user },
                { id: 27, date: '2021-03-01', duration: 2700000, user: user },
            ])
        ),
    };

    const mockProjectService = {
        getProjectByUser: jest.fn((name: string) => ({
            name: name,
            id: 123,
        })),
        getLeastUpdatedProjects: jest.fn(),
    };

    const mockModuleRef = {
        get: jest.fn(() => {
            return mockProjectService;
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SummariesService,
                {
                    provide: getRepositoryToken(DailySummary),
                    useValue: mockDailySummaryRepo,
                },
                {
                    provide: ProjectService,
                    useValue: mockProjectService,
                },
                {
                    provide: ModuleRef,
                    useValue: mockModuleRef,
                },
            ],
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
            user: user,
        });
        expect(mockDailySummaryRepo.find).toBeCalledWith({
            where: [
                {
                    date: Between('startDate', 'endDate'),
                    project: 123,
                    user: user,
                },
            ],
        });
    });

    it('should return processed summaries', async () => {
        const rawData = await service.getRawDailySummaries('startDate', 'endDate', user);
        const result = await service.processTheRawSummaries(rawData);

        expect(result[0]).toEqual({
            date: 'Apr 23, 2021',
            duration: '25m',
            level: 1,
            timestamp: 1619107200000,
        });
        expect(result[1]).toEqual({
            date: 'Apr 21, 2021',
            duration: '3h20m',
            level: 4,
            timestamp: 1618934400000,
        });
    });

    it('should return longest day summary', async () => {
        const rawData = await service.getRawDailySummaries('startDate', 'endDate', user);
        const result = await service.getLongestDayRecord(rawData);

        expect(result).toEqual({
            date: '2021-04-02',
            duration: '4h30m',
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
            { project: 9, date: '2021-04-23', duration: 1500000, user: user },
        ]);

        expect(result).toEqual([
            {
                id: 9,
                project: 9,
                date: '2021-04-23',
                duration: 1500000,
                user: user,
            },
        ]);
    });

    it('should upsert failed and throw Validation error', async () => {
        await expect(async () => {
            await service.upsert([
                { project: 9, date: '123', duration: 1500000, user: user },
            ]);
        }).rejects.toThrow(ImATeapotException);
    });

    it('should upsert failed and throw out exception', async () => {
        const spyMockDSRepo = jest
            .spyOn(mockDailySummaryRepo, 'findOne')
            .mockImplementation(() => {
                throw ImATeapotException;
            });

        await expect(async () => {
            await service.upsert([
                { project: 9, date: '2021-04-23', duration: 1500000, user: user },
            ]);
        }).rejects.toThrow(ImATeapotException);
        spyMockDSRepo.mockReset();
    });
});
