import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserDocument } from 'src/schemas/user.schema';

export type ProjectDocument = Project & Document;

@Schema()
export class Project {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    user: UserDocument;

    @Prop()
    name: string;

    @Prop()
    lastUpdated: Date;

    @Prop()
    thirdPartyId: number;

    @Prop()
    mysqlId: number;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
