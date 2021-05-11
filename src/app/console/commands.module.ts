import { Module } from '@nestjs/common';
import { CommandsService } from './commands.service';
import { SummariesModule } from '../modules/summaries/summaries.module';
import { ConfigModule } from '@nestjs/config';
import { SyncTogglModule } from './modules/sync-toggl/sync-toggl.module';

@Module({
    imports: [SummariesModule, ConfigModule, SyncTogglModule],
    providers: [CommandsService],
    exports: [CommandsService],
})
export class CommandsModule {}
