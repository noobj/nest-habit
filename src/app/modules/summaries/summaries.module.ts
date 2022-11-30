import { Module, Provider } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';

import { SummariesService } from './summaries.service';
import { SummariesController } from './summaries.controller';
import { ProjectService } from './projects.service';
import { UsersModule } from '../users';
import { ThirdPartyModule } from '../ThirdParty/third-party.module';
import { SummariesGateway } from './summaries.gateway';
import { RedisModule } from '../redis/redis.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SummariesUpdate } from './summaries.update';
import { configs } from 'src/config/configuration';
import { Notification, NotificationSchema } from '../../../schemas/notification.schema';
import { MysqlUserId, MysqlUserIdSchema } from '../../../schemas/mysqlUserId.schema';
import { User, UserSchema } from '../../../schemas/user.schema';
import { Project as MongoPrject, ProjectSchema } from '../../../schemas/project.schema';
import { Summary, SummarySchema } from 'src/schemas/summary.schema';

const providers: Provider[] = [SummariesService, ProjectService, SummariesGateway];

// TODO: should fetch the configs depends on env
if (configs.telegram.bot_enable === true && configs.node_env !== 'test')
    providers.push(SummariesUpdate);

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'summary'
        }),
        UsersModule,
        ThirdPartyModule,
        RedisModule.forRootAsync({
            useFactory: async (configService: ConfigService) => ({
                host: configService.get('redis.host'),
                db: configService.get('redis.db')
            }),
            inject: [ConfigService],
            imports: [ConfigModule]
        }),
        ScheduleModule.forRoot(),
        MongooseModule.forFeature([
            { name: Notification.name, schema: NotificationSchema },
            { name: MysqlUserId.name, schema: MysqlUserIdSchema },
            { name: User.name, schema: UserSchema },
            { name: Summary.name, schema: SummarySchema },
            { name: MongoPrject.name, schema: ProjectSchema }
        ])
    ],
    providers,
    controllers: [SummariesController],
    exports: [SummariesService, ProjectService]
})
export class SummariesModule {}
