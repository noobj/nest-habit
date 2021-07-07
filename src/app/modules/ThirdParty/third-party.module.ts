import { Module } from '@nestjs/common';

import { ThirdPartyService } from './third-party.service';

@Module({
    providers: [ThirdPartyService],
    exports: [ThirdPartyService],
})
export class ThirdPartyModule {}
