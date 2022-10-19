import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SeedMongoService } from './seed-mongo.service';

@Module({
    imports: [MongooseModule.forFeature()],
    providers: [SeedMongoService],
    exports: [SeedMongoService]
})
export default class SeedModule {}
