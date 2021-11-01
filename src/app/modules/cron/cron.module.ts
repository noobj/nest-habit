import { BullModule } from '@nestjs/bull';
import { DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SummariesModule } from 'src/app/modules/summaries/summaries.module';
import { NotificationModule } from '../notification/notification.module';
import { QuoteModule } from '../quote/quote.module';
import { UsersModule } from '../users';
import { CronService } from './cron.service';

@Module({})
export class CronModule {
    static register(): DynamicModule {
        const enable = process.env.CRON_ENABLE === 'true';

        if (enable) {
            return {
                module: CronModule,
                imports: [
                    NotificationModule,
                    SummariesModule,
                    UsersModule,
                    ScheduleModule.forRoot(),
                    BullModule.registerQueue({
                        name: 'summary'
                    }),
                    QuoteModule
                ],
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
