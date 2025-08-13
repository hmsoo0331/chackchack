import { IsEmail, IsString, IsOptional } from 'class-validator';

export class SocialLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  nickname: string;

  @IsString()
  authProvider: string;

  @IsOptional()
  @IsString()
  deviceToken?: string;
}