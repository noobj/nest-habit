import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserDocument } from 'src/app/modules/users/user.schema';

export type NotificationDocument = Notification & Document;

@Schema()
export class Notification {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    user: UserDocument;

    @Prop()
    last_notify: string;

    @Prop()
    notify_id: string;

    @Prop()
    notify_time: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
