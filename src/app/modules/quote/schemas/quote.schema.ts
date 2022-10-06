import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuoteDocument = Quote & Document;

@Schema()
export class Quote {
    @Prop()
    text: string;

    @Prop()
    author: string;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
