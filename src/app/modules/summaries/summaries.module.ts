import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';

import { SummariesService } from './summaries.service';
import { SummariesController } from './summaries.controller';
import { ProjectService } from './projects.service';
import { Project, DailySummary } from './entities';
import { Interfaces } from './constants';
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

const providers: Provider[] = [
    SummariesService,
    ProjectService,
    SummariesGateway,
    { provide: Interfaces.IBasicService, useClass: SummariesService }
];

if (configs.telegram.bot_enable === true && configs.node_env !== 'test')
    providers.push(SummariesUpdate);

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'summary'
        }),
        TypeOrmModule.forFeature([DailySummary, Project]),
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
            { name: User.name, schema: UserSchema }
        ])
    ],
    providers,
    controllers: [SummariesController],
    exports: [SummariesService, ProjectService]
})
export class SummariesModule {}
