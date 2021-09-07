import { DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SummariesModule } from 'src/app/modules/summaries/summaries.module';
import { UsersModule } from '../users';
import { CronService } from './cron.service';

@Module({})
export class CronModule {
    static register(): DynamicModule {
        const enable = process.env.CRON_ENABLE === 'true';

        if (enable) {
            return {
                module: CronModule,
                imports: [SummariesModule, UsersModule, ScheduleModule.forRoot()],
                providers: [CronService]
            };
        } else {
            return {
                module: CronModule,
                imports: [],
                providers: []
            };
        }
    }
}
