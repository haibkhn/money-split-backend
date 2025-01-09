import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
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

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column()
  currency: string;

  @Column('decimal', { precision: 10, scale: 2 })
  convertedAmount: number;

  @Column()
  date: Date;

  @ManyToOne(() => Group, (group) => group.expenses)
  group: Group;

  @Column()
  groupId: string;

  @OneToMany(() => Payer, (payer) => payer.expense, {
    cascade: true,
    eager: true,
  })
  payers: Payer[];

  @OneToMany(() => Participant, (participant) => participant.expense, {
    cascade: true,
    eager: true,
  })
  participants: Participant[];
}
