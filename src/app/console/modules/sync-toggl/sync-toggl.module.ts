import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SyncTogglService } from './sync-toggl.service';
import { SummariesModule } from 'src/app/modules/summaries';

@Module({
    imports: [SummariesModule, ConfigModule],
    providers: [SyncTogglService],
    exports: [SyncTogglService],
})
export class SyncTogglModule {}
