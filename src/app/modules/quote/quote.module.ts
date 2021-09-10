import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './quote.entity';
import { QuoteService } from './quote.service';

@Module({
    imports: [TypeOrmModule.forFeature([Quote]), ScheduleModule.forRoot()],
    providers: [QuoteService],
    exports: [QuoteService]
})
export class QuoteModule {}
