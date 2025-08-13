import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrCodesController } from './qrcodes.controller';
import { QrCodesService } from './qrcodes.service';
import { QrCode } from '../entities/qr-code.entity';
import { BankAccount } from '../entities/bank-account.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QrCode, BankAccount]),
    AuthModule,
  ],
  controllers: [QrCodesController],
  providers: [QrCodesService],
  exports: [QrCodesService],
})
export class QrCodesModule {}