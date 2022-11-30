import { Test, TestingModule } from '@nestjs/testing';

import { SyncTogglService } from './sync-toggl.service';
import configuration from 'src/config/configuration';
import { ConfigModule } from '@nestjs/config';
import { ProjectService, SummariesService } from 'src/app/modules/summaries';
import { User } from 'src/app/modules/users';
import { ModuleRef } from '@nestjs/core';
import { User as UserMongo } from 'src/schemas/user.schema';

describe('SyncTogglService', () => {
    let service: SyncTogglService;
    const user: Omit<User, 'summaries'> = {
        id: 3,
        account: 'DGAF',
        email: 'marley.lemke@example.org',
        password: 'DGAF',
        toggl_token: 'DGAF'
    };

    const userMongo: UserMongo = {
        account: 'DGAF',
        email: 'marley.lemke@example.org',
        password: 'DGAF',
        toggl_token: 'DGAF',
        mysqlId: 3
    };

    const mockSummariesService = {
        syncWithThirdParty: jest.fn(() => Promise.resolve(3))
    };

    const mockProjectService = {
        getLeastUpdatedProjects: jest.fn(() =>
            Promise.resolve([
                {
                    _id: 157099012,
                    thirdPartyId: 123,
                    name: 'Meditation',
                    lastUpdated: new Date('2021-05-25T14:01:48.000Z'),
                    user: userMongo,
                    userMysql: user
                }
            ])
        )
    };

    const mockModuleRef = {
        get: jest.fn(() => {
            return mockProjectService;
        })
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ load: [configuration] })],
            providers: [
                SyncTogglService,
                ConfigModule,
                {
                    provide: SummariesService,
                    useValue: mockSummariesService
                },
                {
                    provide: ProjectService,
                    useValue: mockProjectService
                },
                {
                    provide: ModuleRef,
                    useValue: mockModuleRef
                }
            ]
        }).compile();

        service = module.get<SyncTogglService>(SyncTogglService);
        service.onModuleInit();
    });

    it('should run the command', async () => {
        await service.run();
        expect(mockSummariesService.syncWithThirdParty).toBeCalledWith(365, user, false);
    });
});
