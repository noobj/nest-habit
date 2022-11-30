import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/users.entity';

@Entity({ name: 'projects' })
export class Project {
    @PrimaryColumn({ generated: 'increment' })
    id: number;

    @Column()
    name: string;

    @OneToOne(() => User)
    @JoinColumn({
        name: 'user_id',
        referencedColumnName: 'id'
    })
    user: User;

    @Column()
    last_updated: Date;

    @Column()
    project_id: number;
}
