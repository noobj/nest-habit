import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserDocument } from './user.schema';
import { ProjectDocument } from './project.schema';

export type SummaryDocument = Summary & Document;

@Schema()
export class Summary {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    user: UserDocument;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project' })
    project: ProjectDocument;

    @Prop()
    date: string;

    @Prop()
    duration: number;
}

export const SummarySchema = SchemaFactory.createForClass(Summary);
