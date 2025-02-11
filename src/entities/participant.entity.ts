import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Expense } from './expense.entity';
import { Member } from './member.entity';

@Entity()
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  share: number;

  @ManyToOne(() => Member, { eager: true }) // Add eager: true here
  member: Member;

  @ManyToOne(() => Expense, (expense) => expense.participants)
  expense: Expense;
}
