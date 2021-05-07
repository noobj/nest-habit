import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { UsersModule } from './users/users.module';
import { SummariesModule } from './summaries/summaries.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { SummariesController } from './summaries/summaries.controller';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './tasks/tasks.module';
import configuration from './config/configuration';

@Module({
    imports: [
        TypeOrmModule.forRoot(),
        UsersModule,
        SummariesModule,
        AuthModule,
        ConfigModule.forRoot({ load: [configuration] }),
        ScheduleModule.forRoot(),
        TasksModule,
    ],
    controllers: [AppController],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(LoggerMiddleware)
            .forRoutes(SummariesController, AppController);
    }
}
