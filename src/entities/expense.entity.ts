import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { Payer } from './payer.entity';
import { Participant } from './participant.entity';

@Entity()
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column('decimal')
  totalAmount: number;

  @Column()
  currency: string;

  @Column('decimal')
  convertedAmount: number;

  @Column()
  date: Date;

  @OneToMany(() => Payer, (payer) => payer.expense)
  payers: Payer[];

  @OneToMany(() => Participant, (participant) => participant.expense)
  participants: Participant[];

  @ManyToOne(() => Group, (group) => group.expenses)
  group: Group;
}
