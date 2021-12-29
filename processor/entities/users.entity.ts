import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { DailySummary } from './daily_summary.entity';
import { ThirdPartyServiceKeys } from '../third-party.factory';

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

    @OneToMany(() => DailySummary, (summary) => summary.user)
    summaries?: DailySummary[];

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
