import { Connection, Model } from 'mongoose';

import { QuoteSchema, QuoteDocument, Quote } from 'src/schemas/quote.schema';
import { ISeeder } from '../seeders/seeder.interface';

export class QuoteSeeder implements ISeeder {
    private model: Model<QuoteDocument>;

    constructor(public connection: Connection) {
        this.model = connection.model<QuoteDocument>(Quote.name, QuoteSchema);
    }

    async run() {
        await this.model.deleteMany({});

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
        const result = await this.model.insertMany(quotes);
        console.log(result);
    }
}
