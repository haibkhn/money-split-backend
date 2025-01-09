import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../entities/expense.entity';
import { Group } from '../entities/group.entity';
import { Payer } from '../entities/payer.entity';
import { Participant } from '../entities/participant.entity';
import { Member } from '../entities/member.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Payer)
    private payerRepository: Repository<Payer>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  async create(createExpenseDto: CreateExpenseDto) {
    const group = await this.groupRepository.findOne({
      where: { id: createExpenseDto.groupId },
      relations: ['members'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Create the expense
    const expense = this.expenseRepository.create({
      description: createExpenseDto.description,
      totalAmount: createExpenseDto.totalAmount,
      currency: createExpenseDto.currency,
      convertedAmount: createExpenseDto.convertedAmount,
      date: createExpenseDto.date,
      group: group,
    });

    // Save the expense first to get its ID
    const savedExpense = await this.expenseRepository.save(expense);

    // Create and save payers
    if (createExpenseDto.payers?.length) {
      const payers = createExpenseDto.payers.map((payer) =>
        this.payerRepository.create({
          member: group.members.find((m) => m.id === payer.memberId),
          amount: payer.amount,
          expense: savedExpense,
        }),
      );
      savedExpense.payers = await this.payerRepository.save(payers);
    }

    // Create and save participants
    if (createExpenseDto.participants?.length) {
      const participants = createExpenseDto.participants.map((participant) =>
        this.participantRepository.create({
          member: group.members.find((m) => m.id === participant.memberId),
          share: participant.share,
          expense: savedExpense,
        }),
      );
      savedExpense.participants =
        await this.participantRepository.save(participants);
    }

    // Update member balances
    await this.updateMemberBalances(savedExpense);

    return savedExpense;
  }

  private async updateMemberBalances(expense: Expense) {
    // Get all involved members
    const memberIds = new Set([
      ...expense.payers.map((p) => p.member.id),
      ...expense.participants.map((p) => p.member.id),
    ]);

    for (const memberId of memberIds) {
      const member = await this.memberRepository.findOne({
        where: { id: memberId },
      });

      if (member) {
        // Calculate what they paid
        const paid = expense.payers
          .filter((p) => p.member.id === memberId)
          .reduce((sum, p) => sum + p.amount, 0);

        // Calculate what they owe
        const owe = expense.participants
          .filter((p) => p.member.id === memberId)
          .reduce((sum, p) => sum + p.share, 0);

        // Update balance
        member.balance = (member.balance || 0) + paid - owe;
        await this.memberRepository.save(member);
      }
    }
  }

  async findAll() {
    return this.expenseRepository.find({
      relations: [
        'group',
        'payers',
        'payers.member',
        'participants',
        'participants.member',
      ],
    });
  }

  async findOne(id: string) {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: [
        'group',
        'payers',
        'payers.member',
        'participants',
        'participants.member',
      ],
    });

    if (!expense) {
      throw new NotFoundException(`Expense not found`);
    }

    return expense;
  }

  async findByGroup(groupId: string) {
    return this.expenseRepository.find({
      where: { group: { id: groupId } },
      relations: [
        'payers',
        'payers.member',
        'participants',
        'participants.member',
      ],
      order: { date: 'DESC' },
    });
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.findOne(id);

    // First, revert the old balance changes
    await this.revertMemberBalances(expense);

    // Update basic expense details
    if (updateExpenseDto.description)
      expense.description = updateExpenseDto.description;
    if (updateExpenseDto.totalAmount)
      expense.totalAmount = updateExpenseDto.totalAmount;
    if (updateExpenseDto.currency) expense.currency = updateExpenseDto.currency;
    if (updateExpenseDto.convertedAmount)
      expense.convertedAmount = updateExpenseDto.convertedAmount;
    if (updateExpenseDto.date) expense.date = updateExpenseDto.date;

    // Update payers if provided
    if (updateExpenseDto.payers) {
      // Remove old payers
      await this.payerRepository.remove(expense.payers);

      // Create new payers
      const payers = await Promise.all(
        updateExpenseDto.payers.map(async (payerDto) => {
          const member = await this.memberRepository.findOne({
            where: { id: payerDto.memberId },
          });
          if (!member) throw new NotFoundException(`Member not found`);
          return this.payerRepository.create({
            amount: payerDto.amount,
            member,
            expense,
          });
        }),
      );
      expense.payers = await this.payerRepository.save(payers);
    }

    // Update participants if provided
    if (updateExpenseDto.participants) {
      // Remove old participants
      await this.participantRepository.remove(expense.participants);

      // Create new participants
      const participants = await Promise.all(
        updateExpenseDto.participants.map(async (participantDto) => {
          const member = await this.memberRepository.findOne({
            where: { id: participantDto.memberId },
          });
          if (!member) throw new NotFoundException(`Member not found`);
          return this.participantRepository.create({
            share: participantDto.share,
            member,
            expense,
          });
        }),
      );
      expense.participants =
        await this.participantRepository.save(participants);
    }

    // Save updated expense
    const savedExpense = await this.expenseRepository.save(expense);

    // Update member balances with new expense details
    await this.updateMemberBalances(savedExpense);

    return savedExpense;
  }

  async remove(id: string) {
    const expense = await this.findOne(id);

    // Revert balance changes before removing
    await this.revertMemberBalances(expense);

    // Remove expense and related entities
    await this.payerRepository.remove(expense.payers);
    await this.participantRepository.remove(expense.participants);
    return this.expenseRepository.remove(expense);
  }

  private async revertMemberBalances(expense: Expense) {
    const memberIds = new Set([
      ...expense.payers.map((p) => p.member.id),
      ...expense.participants.map((p) => p.member.id),
    ]);

    for (const memberId of memberIds) {
      const member = await this.memberRepository.findOne({
        where: { id: memberId },
      });

      if (member) {
        // Subtract what they paid
        const paid = expense.payers
          .filter((p) => p.member.id === memberId)
          .reduce((sum, p) => sum + p.amount, 0);

        // Add back what they owed
        const owed = expense.participants
          .filter((p) => p.member.id === memberId)
          .reduce((sum, p) => sum + p.share, 0);

        // Update balance (reverse of original calculation)
        member.balance = (member.balance || 0) - paid + owed;
        await this.memberRepository.save(member);
      }
    }
  }
}
