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
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Payer)
    private payerRepository: Repository<Payer>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
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
      group,
      groupId: group.id,
    });

    // Save expense first to get ID
    const savedExpense = await this.expenseRepository.save(expense);

    // Create and save payers with convertedAmount
    const payers = await Promise.all(
      createExpenseDto.payers.map(async (payerDto) => {
        const member = await this.memberRepository.findOne({
          where: { id: payerDto.memberId },
        });
        if (!member) {
          throw new NotFoundException(`Member not found: ${payerDto.memberId}`);
        }
        return this.payerRepository.create({
          amount: payerDto.amount,
          convertedAmount: payerDto.convertedAmount,
          member,
          expense: savedExpense,
        });
      }),
    );
    savedExpense.payers = await this.payerRepository.save(payers);

    // Create and save participants
    const participants = await Promise.all(
      createExpenseDto.participants.map(async (participantDto) => {
        const member = await this.memberRepository.findOne({
          where: { id: participantDto.memberId },
        });
        if (!member) {
          throw new NotFoundException(
            `Member not found: ${participantDto.memberId}`,
          );
        }
        return this.participantRepository.create({
          share: participantDto.share,
          member,
          expense: savedExpense,
        });
      }),
    );
    savedExpense.participants =
      await this.participantRepository.save(participants);

    // Update member balances
    await this.updateMemberBalances(group.id);

    // Return the complete expense with all relations
    return this.expenseRepository.findOne({
      where: { id: savedExpense.id },
      relations: [
        'payers',
        'payers.member',
        'participants',
        'participants.member',
      ],
    });
  }

  private async updateMemberBalances(groupId: string) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: [
        'members',
        'expenses',
        'expenses.payers',
        'expenses.payers.member',
        'expenses.participants',
        'expenses.participants.member',
      ],
    });

    if (!group) return;

    // Reset all balances to 0
    group.members.forEach((member) => {
      member.balance = 0;
    });

    // Recalculate balances based on all expenses
    group.expenses.forEach((expense) => {
      // Add paid amounts using converted amounts when available
      expense.payers.forEach((payer) => {
        const member = group.members.find((m) => m.id === payer.member.id);
        if (member) {
          // Use convertedAmount when currencies differ, amount when same
          const amount =
            expense.currency !== group.currency
              ? Number(payer.convertedAmount || 0)
              : Number(payer.amount || 0);
          member.balance = Number(member.balance || 0) + amount;
        }
      });

      // Subtract shares
      expense.participants.forEach((participant) => {
        const member = group.members.find(
          (m) => m.id === participant.member.id,
        );
        if (member) {
          member.balance =
            Number(member.balance || 0) - Number(participant.share);
        }
      });
    });

    // Round balances to 2 decimal places before saving
    group.members.forEach((member) => {
      member.balance = Number(Number(member.balance).toFixed(2));
    });

    await this.memberRepository.save(group.members);
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
    const expenses = await this.expenseRepository.find({
      where: { groupId },
      relations: [
        'group',
        'payers',
        'payers.member',
        'participants',
        'participants.member',
      ],
      order: { date: 'DESC' },
    });

    return expenses;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.findOne(id);
    const group = await this.groupRepository.findOne({
      where: { id: expense.groupId },
      relations: ['members'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

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
            convertedAmount: payerDto.convertedAmount, // Added this line
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
    await this.updateMemberBalances(savedExpense.groupId);

    return this.expenseRepository.findOne({
      where: { id: savedExpense.id },
      relations: [
        'payers',
        'payers.member',
        'participants',
        'participants.member',
      ],
    });
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
    // First get the group to know its currency
    const group = await this.groupRepository.findOne({
      where: { id: expense.groupId },
    });

    if (!group) return;

    const memberIds = new Set([
      ...expense.payers.map((p) => p.member.id),
      ...expense.participants.map((p) => p.member.id),
    ]);

    for (const memberId of memberIds) {
      const member = await this.memberRepository.findOne({
        where: { id: memberId },
      });

      if (member) {
        // Calculate paid amount
        const paid = expense.payers
          .filter((p) => p.member.id === memberId)
          .reduce((sum, p) => {
            const paymentAmount =
              expense.currency !== group.currency
                ? Number(p.convertedAmount || 0)
                : Number(p.amount || 0);
            return Number(sum) + paymentAmount;
          }, 0);

        // Calculate owed amount (participant shares are already in group currency)
        const owed = expense.participants
          .filter((p) => p.member.id === memberId)
          .reduce((sum, p) => Number(sum) + Number(p.share), 0);

        // Update balance
        const currentBalance = Number(member.balance || 0);
        const adjustedBalance = currentBalance - Number(paid) + Number(owed);
        member.balance = Number(adjustedBalance.toFixed(2));

        await this.memberRepository.save(member);
      }
    }
  }
}
