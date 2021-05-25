import { Entity, Column, ManyToOne, JoinColumn, Unique, PrimaryColumn } from 'typeorm';
import { User } from '../../users';

import { Project } from './project.entity';

@Entity({ name: 'daily_summaries' })
@Unique('uni_prj_date', ['project', 'date'])
export class DailySummary {
    @PrimaryColumn({ generated: 'increment' })
    id: number;

    @Column()
    date: string;

    @ManyToOne(() => Project, (project) => project.summaries)
    @JoinColumn({
        name: 'project_id',
        referencedColumnName: 'id',
    })
    project: number;

    @Column()
    duration: number;

    @ManyToOne(() => User, (user) => user.summaries)
    @JoinColumn({
        name: 'user_id',
        referencedColumnName: 'id',
    })
    user: User;
}
