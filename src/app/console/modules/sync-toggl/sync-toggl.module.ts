import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SyncTogglService } from './sync-toggl.service';
import { SummariesModule } from 'src/app/modules/summaries';
import { TogglModule } from 'src/app/modules/toggl/toggl.module';

@Module({
    imports: [forwardRef(() => SummariesModule), ConfigModule, TogglModule],
    providers: [SyncTogglService],
    exports: [SyncTogglService],
})
export default class SyncTogglModule {}
