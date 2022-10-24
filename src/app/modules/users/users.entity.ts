import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ThirdPartyServiceKeys } from '../ThirdParty/third-party.factory';

//pass the name of table inside @Entity() i.e "users", if you don't pass table name it will create "users_entity" table by default
@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    account: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column()
    toggl_token: string;

    @Column({
        nullable: true
    })
    @Exclude()
    refresh_token?: string;

    @Column({
        nullable: true
    })
    third_party_service?: ThirdPartyServiceKeys;
}
