import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Expense } from './expense.entity';
import { Member } from './member.entity';

@Entity()
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal')
  share: number;

  @ManyToOne(() => Member)
  member: Member;

  @ManyToOne(() => Expense, (expense) => expense.participants)
  expense: Expense;
}
