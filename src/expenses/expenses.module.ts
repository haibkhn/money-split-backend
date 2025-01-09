import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { Expense } from '../entities/expense.entity';
import { Group } from '../entities/group.entity';
import { Member } from '../entities/member.entity';
import { Payer } from '../entities/payer.entity';
import { Participant } from '../entities/participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, Group, Member, Payer, Participant]),
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
