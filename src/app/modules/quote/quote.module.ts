import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { QuoteService } from './quote.service';
import { Quote, QuoteSchema } from '../../../schemas/quote.schema';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        MongooseModule.forFeature([{ name: Quote.name, schema: QuoteSchema }])
    ],
    providers: [QuoteService],
    exports: [QuoteService]
})
export class QuoteModule {}
