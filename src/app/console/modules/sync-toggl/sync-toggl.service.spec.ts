import { Test, TestingModule } from '@nestjs/testing';

import { SyncTogglService } from './sync-toggl.service';
import configuration from 'src/config/configuration';
import { ConfigModule } from '@nestjs/config';
import { ProjectService, SummariesService } from 'src/app/modules/summaries';
import { User } from 'src/app/modules/users';
import { ModuleRef } from '@nestjs/core';
import { TogglService } from 'src/app/modules/toggl/toggl.service';

describe('SyncTogglService', () => {
    let service: SyncTogglService;
    const user: Omit<User, 'summaries'> = {
        id: 3,
        account: 'DGAF',
        email: 'marley.lemke@example.org',
        password: 'DGAF',
        toggl_token: 'DGAF',
    };

    const mockTogglService = {
        fetch: () => [
            {
                start: '2021-01-10T11:00:51+08:00',
                dur: 1000,
            },
            {
                start: '2021-01-10T11:00:51+08:00',
                dur: 1000,
            },
            {
                start: '2021-01-11T11:00:51+08:00',
                dur: 1000,
            },
        ],
    };

    const mockSummariesService = {
        upsert: jest.fn(() =>
            Promise.resolve([
                { date: '2021-01-10', project: 157099012, duration: 2000, user: user },
            ])
        ),
    };

    const mockProjectService = {
        getLeastUpdatedProjects: jest.fn(() =>
            Promise.resolve([
                {
                    id: 157099012,
                    name: 'Meditation',
                    last_updated: '2021-05-25T14:01:48.000Z',
                    user: user,
                },
            ])
        ),
        updateProjectLastUpdated: jest.fn(() => {}),
    };

    const mockModuleRef = {
        get: jest.fn(() => {
            return mockProjectService;
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ load: [configuration] })],
            providers: [
                SyncTogglService,
                ConfigModule,
                {
                    provide: SummariesService,
                    useValue: mockSummariesService,
                },
                {
                    provide: ProjectService,
                    useValue: mockProjectService,
                },
                {
                    provide: ModuleRef,
                    useValue: mockModuleRef,
                },
                {
                    provide: TogglService,
                    useValue: mockTogglService,
                },
            ],
        }).compile();

        service = module.get<SyncTogglService>(SyncTogglService);
        service.onModuleInit();
    });

    it('should run the command', async () => {
        await service.run(['3']);
        expect(mockSummariesService.upsert).toBeCalledWith([
            { date: '2021-01-10', project: 157099012, duration: 2000, user: user },
            { date: '2021-01-11', project: 157099012, duration: 1000, user: user },
        ]);
    });
});
