import { IsString, IsOptional, IsNumber, IsObject, IsUUID } from 'class-validator';

export class CreateQrCodeDto {
  @IsUUID()
  accountId: string;

  @IsString()
  qrName: string;

  @IsOptional()
  @IsNumber()
  baseAmount?: number;

  @IsOptional()
  @IsString()
  discountType?: string;

  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @IsOptional()
  @IsObject()
  styleConfigJson?: any;
}