import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, OneToOne } from 'typeorm';

import { User } from '../users';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User)
    @JoinColumn({
        name: 'user_id',
        referencedColumnName: 'id'
    })
    user: User;

    @Column()
    last_notify?: Date;

    @Column()
    notify_id: string;
}
