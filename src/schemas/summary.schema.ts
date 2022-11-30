import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { Project } from './project.schema';

export type SummaryDocument = Summary & Document;

@Schema()
export class Summary {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    user: User;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project' })
    project: Project;

    @Prop()
    date: string;

    @Prop()
    duration: number;
}

export const SummarySchema = SchemaFactory.createForClass(Summary);
