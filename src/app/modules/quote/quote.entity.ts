import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'quotes' })
export class Quote {
    @PrimaryColumn({ generated: 'increment' })
    id: number;

    @Column()
    text: string;

    @Column()
    author: string;
}
