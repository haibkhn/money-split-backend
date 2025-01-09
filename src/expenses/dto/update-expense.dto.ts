import { ParticipantDto, PayerDto } from './create-expense.dto';

export class UpdateExpenseDto {
  description?: string;
  totalAmount?: number;
  currency?: string;
  convertedAmount?: number;
  date?: Date;
  payers?: PayerDto[];
  participants?: ParticipantDto[];
}
