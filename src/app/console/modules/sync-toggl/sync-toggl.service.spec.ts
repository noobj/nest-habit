import { Test, TestingModule } from '@nestjs/testing';
import { SyncTogglService } from './sync-toggl.service';
import configuration from 'src/config/configuration';
import { ConfigModule } from '@nestjs/config';
import { SummariesService } from 'src/app/modules/summaries';
import { TogglClient } from './TogglClient';
jest.mock('./TogglClient.ts');

describe('SyncTogglService', () => {
    let service: SyncTogglService;

    const mockSummariesService = {
        getProjectIdByName: jest.fn(() => Promise.resolve(157099012)),
        upsert: jest.fn(() => Promise.resolve('done')),
    };

    TogglClient.mockImplementation(() => {
        return {
            getWorkSpaceId: () => 123,
            getDetails: () => ({
                data: [
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
                total_count: 3,
            }),
        };
    });

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
            ],
        }).compile();

        service = module.get<SyncTogglService>(SyncTogglService);
    });

    it('should run the command', async () => {
        const spyLog = jest.spyOn(console, 'log').mockImplementation();
        await service.run(['3']);
        expect(spyLog).toBeCalledWith('done');
        expect(mockSummariesService.upsert).toBeCalledWith([
            { date: '2021-01-10', project: 157099012, duration: 2000 },
            { date: '2021-01-11', project: 157099012, duration: 1000 },
        ]);
    });
});
