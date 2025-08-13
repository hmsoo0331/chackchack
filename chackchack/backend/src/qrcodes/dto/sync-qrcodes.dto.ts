import { IsArray } from 'class-validator';

export class SyncQrCodesDto {
  @IsArray()
  localQrCodes: Array<{
    qrId: string;
    qrName: string;
    bankAccount: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    };
    baseAmount?: number;
    discountType?: string;
    discountValue?: number;
    createdAt: string;
  }>;
}