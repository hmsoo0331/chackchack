import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCodeLib from 'qrcode';
import { QrCode } from '../entities/qr-code.entity';
import { BankAccount } from '../entities/bank-account.entity';
import { CreateQrCodeDto } from './dto/create-qrcode.dto';

@Injectable()
export class QrCodesService {
  constructor(
    @InjectRepository(QrCode)
    private qrCodeRepository: Repository<QrCode>,
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
  ) {}

  async createQrCode(ownerId: string, createQrCodeDto: CreateQrCodeDto): Promise<QrCode> {
    const bankAccount = await this.bankAccountRepository.findOne({
      where: { accountId: createQrCodeDto.accountId, ownerId },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    const qrCode = this.qrCodeRepository.create({
      ...createQrCodeDto,
      ownerId,
    });

    const savedQrCode = await this.qrCodeRepository.save(qrCode);
    
    // 관계 데이터와 함께 다시 로드
    const qrCodeWithRelations = await this.qrCodeRepository.findOne({
      where: { qrId: savedQrCode.qrId },
      relations: ['bankAccount'],
    });
    
    if (!qrCodeWithRelations) {
      throw new BadRequestException('Failed to create QR code');
    }
    
    return qrCodeWithRelations;
  }

  async getQrCodes(ownerId: string): Promise<QrCode[]> {
    return this.qrCodeRepository.find({
      where: { ownerId },
      relations: ['bankAccount'],
      order: { createdAt: 'DESC' },
    });
  }

  async getQrCode(qrId: string): Promise<QrCode> {
    const qrCode = await this.qrCodeRepository.findOne({
      where: { qrId },
      relations: ['bankAccount'],
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }

    return qrCode;
  }

  async generateQrCodeImage(qrCode: QrCode): Promise<string> {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    let paymentUrl = `${baseUrl}/payer.html?qrId=${qrCode.qrId}&bank=${encodeURIComponent(qrCode.bankAccount.bankName)}&account=${encodeURIComponent(qrCode.bankAccount.accountNumber)}&holder=${encodeURIComponent(qrCode.bankAccount.accountHolder)}`;
    
    if (qrCode.baseAmount) {
      const finalAmount = this.calculateFinalAmount(
        qrCode.baseAmount,
        qrCode.discountType,
        qrCode.discountValue,
      );
      paymentUrl += `&amount=${finalAmount}`;
    }

    try {
      const qrCodeDataUrl = await QRCodeLib.toDataURL(paymentUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataUrl;
    } catch (error) {
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  async updateQrCode(ownerId: string, qrId: string, updateQrCodeDto: CreateQrCodeDto): Promise<QrCode> {
    // QR 코드가 존재하고 해당 사용자의 것인지 확인
    const existingQrCode = await this.qrCodeRepository.findOne({
      where: { qrId },
      relations: ['bankAccount'],
    });

    if (!existingQrCode) {
      throw new NotFoundException('QR code not found');
    }

    if (existingQrCode.ownerId !== ownerId) {
      throw new ForbiddenException('You can only update your own QR codes');
    }

    // 새 계좌 정보 확인
    const bankAccount = await this.bankAccountRepository.findOne({
      where: { accountId: updateQrCodeDto.accountId, ownerId },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    // QR 코드 업데이트
    await this.qrCodeRepository.update(qrId, {
      ...updateQrCodeDto,
      ownerId, // 소유자는 변경되지 않음
    });

    // 업데이트된 QR 코드 반환
    const updatedQrCode = await this.qrCodeRepository.findOne({
      where: { qrId },
      relations: ['bankAccount'],
    });

    if (!updatedQrCode) {
      throw new BadRequestException('Failed to update QR code');
    }

    return updatedQrCode;
  }

  async deleteQrCode(ownerId: string, qrId: string): Promise<void> {
    // QR 코드가 존재하고 해당 사용자의 것인지 확인
    const qrCode = await this.qrCodeRepository.findOne({
      where: { qrId },
    });

    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }

    if (qrCode.ownerId !== ownerId) {
      throw new ForbiddenException('You can only delete your own QR codes');
    }

    // QR 코드 삭제 (CASCADE 설정으로 관련 알림도 자동 삭제됨)
    await this.qrCodeRepository.delete(qrId);
  }

  async syncLocalQrCodes(ownerId: string, localQrCodes: any[]): Promise<{ 
    message: string; 
    syncedCount: number; 
    skippedCount: number;
    allQrCodes: QrCode[];
  }> {
    let syncedCount = 0;
    let skippedCount = 0;

    // 입력 데이터 검증
    if (!Array.isArray(localQrCodes)) {
      throw new BadRequestException('localQrCodes must be an array');
    }

    if (localQrCodes.length === 0) {
      const allQrCodes = await this.getQrCodes(ownerId);
      return {
        message: '동기화할 QR 코드가 없습니다',
        syncedCount: 0,
        skippedCount: 0,
        allQrCodes,
      };
    }

    for (const localQr of localQrCodes) {
      try {
        // 중복 체크: qrName과 계좌 정보가 동일한 QR이 이미 있는지 확인
        const existingQrCode = await this.qrCodeRepository.findOne({
          where: { 
            ownerId,
            qrName: localQr.qrName,
          },
          relations: ['bankAccount'],
        });

        // 동일한 이름과 계좌 정보를 가진 QR이 있으면 건너뛰기
        if (existingQrCode && 
            existingQrCode.bankAccount.bankName === localQr.bankAccount.bankName &&
            existingQrCode.bankAccount.accountNumber === localQr.bankAccount.accountNumber &&
            existingQrCode.bankAccount.accountHolder === localQr.bankAccount.accountHolder) {
          skippedCount++;
          continue;
        }

        // 계좌 정보 먼저 생성 또는 찾기
        let bankAccount = await this.bankAccountRepository.findOne({
          where: {
            ownerId,
            bankName: localQr.bankAccount.bankName,
            accountNumber: localQr.bankAccount.accountNumber,
            accountHolder: localQr.bankAccount.accountHolder,
          },
        });

        if (!bankAccount) {
          bankAccount = this.bankAccountRepository.create({
            ownerId,
            bankName: localQr.bankAccount.bankName,
            accountNumber: localQr.bankAccount.accountNumber,
            accountHolder: localQr.bankAccount.accountHolder,
            isDefault: false,
          });
          await this.bankAccountRepository.save(bankAccount);
        }

        // QR 코드 생성
        const qrCode = this.qrCodeRepository.create({
          ownerId,
          accountId: bankAccount.accountId,
          qrName: localQr.qrName,
          baseAmount: localQr.baseAmount,
          discountType: localQr.discountType,
          discountValue: localQr.discountValue,
        });

        await this.qrCodeRepository.save(qrCode);
        syncedCount++;

      } catch (error) {
        console.error('로컬 QR 동기화 오류:', error);
        skippedCount++;
      }
    }

    // 동기화 완료 후 전체 QR 목록 반환
    const allQrCodes = await this.getQrCodes(ownerId);

    return {
      message: `동기화 완료: ${syncedCount}개 추가, ${skippedCount}개 건너뜀`,
      syncedCount,
      skippedCount,
      allQrCodes,
    };
  }

  private calculateFinalAmount(baseAmount: number, discountType?: string, discountValue?: number): number {
    if (!discountType || !discountValue) {
      return baseAmount;
    }

    if (discountType === 'percentage') {
      return baseAmount * (1 - discountValue / 100);
    } else if (discountType === 'fixed') {
      return Math.max(0, baseAmount - discountValue);
    }

    return baseAmount;
  }
}