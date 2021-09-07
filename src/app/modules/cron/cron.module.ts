import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SummariesModule } from 'src/app/modules/summaries/summaries.module';
import { UsersModule } from '../users';
import { CronService } from './cron.service';

@Module({
    imports: [SummariesModule, UsersModule, ScheduleModule.forRoot()],
    providers: [CronService]
})
export class CronModule {}
