import { Test, TestingModule } from '@nestjs/testing';
import { SyncTogglService } from './sync-toggl.service';
import configuration from 'src/config/configuration';
import { ConfigModule } from '@nestjs/config';
import { SummariesService } from 'src/app/modules/summaries';
import { TogglClient } from './TogglClient';

describe('SyncTogglService', () => {
    let service: SyncTogglService;

    const mockSummariesService = {
        getProjectIdByName: jest.fn(() => Promise.resolve(157099012)),
        upsert: jest.fn(() => Promise.resolve('done')),
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
            ],
        }).compile();

        service = module.get<SyncTogglService>(SyncTogglService);
    });

    it('should run the command', async () => {
        const spyLog = jest.spyOn(console, 'log').mockImplementation();
        await service.run(['3']);
        expect(spyLog).toBeCalledWith('done');
    });
});
