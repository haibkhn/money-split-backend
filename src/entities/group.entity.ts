import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from './member.entity';
import { Expense } from './expense.entity';

@Entity()
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  currency: string;

  @OneToMany(() => Member, (member) => member.group, {
    cascade: true,
    eager: true,
  })
  members: Member[];

  @OneToMany(() => Expense, (expense) => expense.group, {
    cascade: true,
    eager: true,
  })
  expenses: Expense[];
}
