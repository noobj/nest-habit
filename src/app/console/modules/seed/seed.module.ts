import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeedService } from './seed.service';
import { Project } from 'src/app/modules/summaries/entities';

@Module({
    imports: [TypeOrmModule.forFeature([Project])],
    providers: [SeedService],
    exports: [SeedService],
})
export class SeedModule {}
