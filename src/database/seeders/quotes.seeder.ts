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
                text: 'You can’t stop the waves, but you can learn to surf',
                author: 'Jon Kabat-Zinn'
            },
            {
                text: "it's not what happens to you but how you react to it that matters",
                author: 'Epictetus'
            },
            {
                text: "Breathing is central to every aspect of meditation training. It's a wonderful place to focus in training the mind to be calm and concentrated",
                author: 'Jon Kabat-Zinn'
            },
            {
                text: 'Thought can be so seductive and hypnotic that it absorbs your attention totally, so you become your thoughts',
                author: 'Eckhart Tolle'
            }
        ];
        const result = await this.repository.save(quotes);
        console.log(result);
    }
}
