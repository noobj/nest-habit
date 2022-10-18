import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ThirdPartyServiceKeys } from '../ThirdParty/third-party.factory';

export type UserDocument = User & Document;

@Schema()
export class User {
    @Prop()
    account: string;

    @Prop()
    email: string;

    @Prop()
    password: string;

    @Prop()
    toggl_token: string;

    @Prop()
    refresh_token?: string;

    @Prop()
    third_party_service?: ThirdPartyServiceKeys;
}

export const UserSchema = SchemaFactory.createForClass(User);
