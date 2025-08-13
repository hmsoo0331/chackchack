import { IsOptional, IsString } from 'class-validator';

export class CreateGuestDto {
  @IsOptional()
  @IsString()
  deviceToken?: string;
}