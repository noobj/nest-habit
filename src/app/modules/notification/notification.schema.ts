import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema()
export class Notification {
    @Prop()
    user: number;

    @Prop()
    last_notify: string;

    @Prop()
    notify_id: string;

    @Prop()
    notify_time: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
