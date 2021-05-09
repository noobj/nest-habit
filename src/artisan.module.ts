import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './tasks/tasks.module';
import configuration from './config/configuration';

@Module({
    imports: [
        TypeOrmModule.forRoot(),
        TasksModule,
        ConfigModule.forRoot({ load: [configuration] }),
    ],
})
export class ArtisanModule {}
