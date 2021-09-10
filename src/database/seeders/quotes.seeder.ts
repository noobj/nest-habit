import { Repository, Connection } from 'typeorm';

import { Quote } from 'src/app/modules/quote/quote.entity';
import { ISeeder } from './seeder.interface';

export class QuoteSeeder implements ISeeder {
    private repository: Repository<Quote>;

    constructor(public connection: Connection) {
        this.repository = connection.getRepository(Quote);
    }

    async run() {
        await this.repository.delete({});

        const quotes = [
            {
                text: "Don't take your thoughts too seriously",
                author: 'Eckhart Tolle'
            },
            {
                text: 'If you stop trying to make yourself more than you are, out of fear that you are less than you are, whoever you really are will be a lot lighter and happier and easier to live with, too',
                author: 'Jon Kabat-Zinn'
            }
        ];
        const result = await this.repository.save(quotes);
        console.log(result);
    }
}
