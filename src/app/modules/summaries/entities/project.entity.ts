import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { DailySummary } from './daily_summary.entity';

@Entity({ name: 'projects' })
export class Project {
    @PrimaryColumn({ generated: 'increment' })
    id: number;

    @Column()
    name: string;

    @OneToMany(() => DailySummary, (summary) => summary.project)
    summaries: DailySummary[];
}
