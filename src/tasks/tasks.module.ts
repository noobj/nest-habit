import { Module, HttpModule } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { SummariesModule } from '../summaries/summaries.module';

@Module({
    imports: [HttpModule, SummariesModule],
    providers: [TasksService],
    exports: [TasksService],
})
export class TasksModule {}
