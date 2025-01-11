import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  groupId: string;
}
