import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote } from './quote.entity';

@Injectable()
export class QuoteService {
    constructor(
        @InjectRepository(Quote)
        private quoteRepository: Repository<Quote>
    ) {}

    public randomFetchQuote(): Promise<Quote[]> {
        return this.quoteRepository.query(
            'Select text, author FROM quotes ORDER BY RAND() LIMIT 1'
        );
    }
}
