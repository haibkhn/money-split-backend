import {
  IsString,
  IsNumber,
  IsDate,
  IsArray,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PayerDto {
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsOptional()
  convertedAmount?: number;
}

export class ParticipantDto {
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsNumber()
  @IsNotEmpty()
  share: number;
}

export class CreateExpenseDto {
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsNumber()
  @IsNotEmpty()
  convertedAmount: number;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  date: Date;

  @IsString()
  @IsOptional()
  splitType?: string;

  @IsUUID()
  @IsNotEmpty()
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
