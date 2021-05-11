import { Module } from '@nestjs/common';
import { SyncTogglService } from './sync-toggl.service';
import { SummariesModule } from '../../../modules/summaries/summaries.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [SummariesModule, ConfigModule],
    providers: [SyncTogglService],
    exports: [SyncTogglService],
})
export class SyncTogglModule {}
