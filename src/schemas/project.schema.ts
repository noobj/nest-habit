import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/schemas/user.schema';

export type ProjectDocument = Project & Document;

@Schema()
export class Project {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    user: User;

    @Prop()
    name: string;

    @Prop()
    lastUpdated: Date;

    @Prop()
    thirdPartyId: number;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
