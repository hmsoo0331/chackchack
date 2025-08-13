import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  bankName: string;

  @IsString()
  accountNumber: string;

  @IsString()
  accountHolder: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}