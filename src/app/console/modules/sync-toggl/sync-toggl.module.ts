import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SyncTogglService } from './sync-toggl.service';
import { SummariesModule } from 'src/app/modules/summaries';

@Module({
    imports: [forwardRef(() => SummariesModule), ConfigModule],
    providers: [SyncTogglService],
    exports: [SyncTogglService]
})
export default class SyncTogglModule {}
