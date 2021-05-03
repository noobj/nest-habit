import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { UsersModule } from './users/users.module';
import { SummariesModule } from './summaries/summaries.module';

@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule, SummariesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
