import {
  IsString,
  IsNumber,
  IsDate,
  IsArray,
  ValidateNested,
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
  description: string;

  @IsNumber()
  totalAmount: number;

  @IsString()
  currency: string;

  @IsNumber()
  convertedAmount: number;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsUUID()
  groupId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayerDto)
  payers: PayerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants: ParticipantDto[];
}
