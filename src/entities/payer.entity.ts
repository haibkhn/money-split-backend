import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Expense } from './expense.entity';
import { Member } from './member.entity';

@Entity()
export class Payer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal')
  amount: number;

  @ManyToOne(() => Member)
  member: Member;

  @ManyToOne(() => Expense, (expense) => expense.payers)
  expense: Expense;
}
