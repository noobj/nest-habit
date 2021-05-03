import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Project } from './project.entity';

@Entity('daily_summaries')
export class DailySummary {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    date: string;

    @ManyToOne(type => Project, project => project.summaries)
    project: number;

    @Column()
    duration: number;
}
