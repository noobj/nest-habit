import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncTogglService } from './modules/sync-toggl/sync-toggl.service';

@Injectable()
export class CommandsService {
    private readonly logger = new Logger(CommandsService.name);

    constructor(private syncTogglService: SyncTogglService) {}

    @Cron(CronExpression.EVERY_DAY_AT_10PM)
    async syncWithToggl() {
        await this.syncTogglService.syncWithToggl();
    }
}
