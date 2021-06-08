import { Module } from '@nestjs/common';

import { TogglService } from './toggl.service';

@Module({
    providers: [TogglService],
    exports: [TogglService],
})
export class TogglModule {}
