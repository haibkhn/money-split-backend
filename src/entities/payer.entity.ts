import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Expense } from './expense.entity';
import { Member } from './member.entity';

@Entity()
export class Payer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @ManyToOne(() => Member, { eager: true })
  member: Member;

  @ManyToOne(() => Expense, (expense) => expense.payers)
  expense: Expense;
}
