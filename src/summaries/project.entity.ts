import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { DailySummary } from './daily_summary.entity';

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => DailySummary, summary => summary.project)
    summaries: DailySummary[];
}
