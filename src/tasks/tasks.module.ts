import { Module, HttpModule } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { SummariesModule } from '../summaries/summaries.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [HttpModule, SummariesModule, ConfigModule],
    providers: [TasksService],
    exports: [TasksService],
})
export class TasksModule {}
