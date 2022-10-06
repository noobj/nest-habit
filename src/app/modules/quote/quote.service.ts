import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Quote, QuoteDocument } from './schemas/quote.schema';
import { Model } from 'mongoose';
// import { Quote } from './quote.entity';

@Injectable()
export class QuoteService {
    constructor(
        @InjectModel(Quote.name)
        private quoteModel: Model<QuoteDocument>
    ) {}

    public randomFetchQuote(): Promise<Quote> {
        return this.quoteModel
            .aggregate([{ $sample: { size: 1 } }])
            .exec()
            .then((res: Quote[]) => res[0]);
    }
}
