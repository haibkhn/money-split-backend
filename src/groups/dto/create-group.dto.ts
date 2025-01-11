import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateGroupDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsOptional()
  @IsArray()
  members?: any[];

  @IsOptional()
  @IsArray()
  expenses?: any[];
}
