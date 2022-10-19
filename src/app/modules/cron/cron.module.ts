import { BullModule } from '@nestjs/bull';
import { DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SummariesModule } from 'src/app/modules/summaries/summaries.module';
import { QuoteModule } from '../quote/quote.module';
import { UsersModule } from '../users';
import { CronService } from './cron.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from '../../../schemas/notification.schema';
import { MysqlUserId, MysqlUserIdSchema } from '../../../schemas/mysqlUserId.schema';

@Module({})
export class CronModule {
    static register(): DynamicModule {
        const enable =
            process.env.NODE_ENV != 'test' && process.env.CRON_ENABLE === 'true';

        if (enable) {
            return {
                module: CronModule,
                imports: [
                    SummariesModule,
                    UsersModule,
                    ScheduleModule.forRoot(),
                    BullModule.registerQueue({
                        name: 'summary'
                    }),
                    QuoteModule,
                    MongooseModule.forFeature([
                        { name: Notification.name, schema: NotificationSchema },
                        { name: MysqlUserId.name, schema: MysqlUserIdSchema }
                    ])
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
