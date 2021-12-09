import { Module } from '@nestjs/common';

import { ThirdPartyFactory } from './third-party.factory';

@Module({
    providers: [ThirdPartyFactory],
    exports: [ThirdPartyFactory]
})
export class ThirdPartyModule {}
