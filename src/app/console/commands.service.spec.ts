import { Test, TestingModule } from '@nestjs/testing';
import { CommandsService } from './commands.service';

describe('CommandsService', () => {
    let service: CommandsService;

    const mockCommand = {
        run: jest.fn((argv) => Promise.resolve(argv))
    };

    const mockArgv = ['test', '123'];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommandsService,
                {
                    provide: 'COMMAND',
                    useValue: mockCommand
                },
                {
                    provide: 'ARGV',
                    useValue: mockArgv
                }
            ]
        }).compile();

        service = module.get<CommandsService>(CommandsService);
    });

    it('should be defined and able to run', async () => {
        expect(service).toBeDefined();
        await service.runCommand();
        expect(mockCommand.run).toBeCalledTimes(1);
    });
});
