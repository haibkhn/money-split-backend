import {
  IsString,
  IsNumber,
  IsDate,
  IsArray,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PayerDto {
  @IsUUID()
  memberId: string;

  @IsNumber()
  amount: number;
}

export class ParticipantDto {
  @IsUUID()
  memberId: string;

  @IsNumber()
  share: number;
}

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  totalAmount: number;

  @IsString()
  currency: string;

  @IsNumber()
  convertedAmount: number;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsString()
  splitType: string;

  @IsUUID()
  groupId: string;

  @IsArray()
  @Type(() => PayerDto)
  payers: PayerDto[];

  @IsArray()
  @Type(() => ParticipantDto)
  participants: ParticipantDto[];
}
