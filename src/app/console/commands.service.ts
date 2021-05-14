import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ICommand } from './interfaces/command.interface';

@Injectable()
export class CommandsService {
    private readonly logger = new Logger(CommandsService.name);

    constructor(
        @Inject('COMMAND') private command: ICommand,
        @Inject('ARGV') private argv: string[]
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_10PM)
    async runCommand() {
        await this.command.run(this.argv);
    }
}
