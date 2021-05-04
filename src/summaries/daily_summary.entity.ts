import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity('daily_summaries')
export class DailySummary {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    date: string;

    @ManyToOne(type => Project, project => project.summaries)
    @JoinColumn({
        name: "project_id",
        referencedColumnName: "id"
    })
    project: number;

    @Column()
    duration: number;
}
