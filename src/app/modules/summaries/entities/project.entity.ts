import { Entity, Column, PrimaryColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users';

import { DailySummary } from './daily_summary.entity';

@Entity({ name: 'projects' })
export class Project {
    @PrimaryColumn({ generated: 'increment' })
    id: number;

    @Column()
    name: string;

    @OneToMany(() => DailySummary, (summary) => summary.project)
    summaries?: DailySummary[];

    @OneToOne(() => User)
    @JoinColumn({
        name: 'user_id',
        referencedColumnName: 'id',
    })
    user: User;

    @Column()
    last_updated: Date;

    @Column()
    project_id: number;
}
