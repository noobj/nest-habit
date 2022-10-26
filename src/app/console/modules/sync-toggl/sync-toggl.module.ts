import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SyncTogglService } from './sync-toggl.service';
import { SummariesModule } from 'src/app/modules/summaries';

import { User, UserSchema } from 'src/schemas/user.schema';
import { Project as MongoPrject, ProjectSchema } from 'src/schemas/project.schema';
import { Summary, SummarySchema } from 'src/schemas/summary.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [
        forwardRef(() => SummariesModule),
        ConfigModule,
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Summary.name, schema: SummarySchema },
            { name: MongoPrject.name, schema: ProjectSchema }
        ])
    ],
    providers: [SyncTogglService],
    exports: [SyncTogglService]
})
export default class SyncTogglModule {}
