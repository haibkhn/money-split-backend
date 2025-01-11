import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expenses')
export class ExpensesController {
  private readonly logger = new Logger(ExpensesController.name);

  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async create(@Body() createExpenseDto: CreateExpenseDto) {
    try {
      this.logger.debug('Received expense data:', createExpenseDto);

      // Validate required fields
      if (!createExpenseDto.description) {
        throw new BadRequestException('Description is required');
      }
      if (!createExpenseDto.totalAmount) {
        throw new BadRequestException('Total amount is required');
      }
      if (!createExpenseDto.groupId) {
        throw new BadRequestException('Group ID is required');
      }
      if (!createExpenseDto.payers || createExpenseDto.payers.length === 0) {
        throw new BadRequestException('At least one payer is required');
      }
      if (
        !createExpenseDto.participants ||
        createExpenseDto.participants.length === 0
      ) {
        throw new BadRequestException('At least one participant is required');
      }

      return await this.expensesService.create(createExpenseDto);
    } catch (error) {
      this.logger.error('Failed to create expense:', error);
      throw error;
    }
  }

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.expensesService.findOne(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Expense not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('group/:groupId')
  findByGroup(@Param('groupId') groupId: string) {
    return this.expensesService.findByGroup(groupId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    try {
      return await this.expensesService.update(id, updateExpenseDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update expense',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.expensesService.remove(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete expense',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
