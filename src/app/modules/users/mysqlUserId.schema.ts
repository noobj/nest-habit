import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MysqlUserIdDocument = MysqlUserId & Document;

@Schema()
export class MysqlUserId {
    @Prop({ unique: true, required: true })
    uid: string;

    @Prop({ unique: true, required: true })
    mysqlUid: number;
}

export const MysqlUserIdSchema = SchemaFactory.createForClass(MysqlUserId);
