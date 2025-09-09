import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Owner } from '../entities/owner.entity';
import { BankAccount } from '../entities/bank-account.entity';
import { QrCode } from '../entities/qr-code.entity';
import { PaymentNotification } from '../entities/payment-notification.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Owner)
    private ownerRepository: Repository<Owner>,
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(QrCode)
    private qrCodeRepository: Repository<QrCode>,
    @InjectRepository(PaymentNotification)
    private paymentNotificationRepository: Repository<PaymentNotification>,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  async createGuestOwner(deviceToken?: string): Promise<{ owner: Owner; accessToken: string }> {
    const owner = this.ownerRepository.create({
      deviceToken: deviceToken || uuidv4(),
      authProvider: 'guest',
    });

    await this.ownerRepository.save(owner);

    const payload = { ownerId: owner.ownerId, deviceToken: owner.deviceToken };
    const accessToken = this.jwtService.sign(payload);

    return { owner, accessToken };
  }

  async socialLogin(
    email: string,
    nickname: string,
    authProvider: string,
    deviceToken?: string,
  ): Promise<{ owner: Owner; accessToken: string }> {
    let owner = await this.ownerRepository.findOne({ where: { email, authProvider } });

    if (!owner) {
      owner = this.ownerRepository.create({
        email,
        nickname,
        authProvider,
        deviceToken,
      });
    } else {
      owner.lastLoginAt = new Date();
      if (deviceToken) {
        owner.deviceToken = deviceToken;
      }
    }

    await this.ownerRepository.save(owner);

    const payload = { ownerId: owner.ownerId, email: owner.email };
    const accessToken = this.jwtService.sign(payload);

    return { owner, accessToken };
  }

  async validateOwner(ownerId: string): Promise<Owner> {
    const owner = await this.ownerRepository.findOne({ where: { ownerId } });
    if (!owner) {
      throw new UnauthorizedException('Invalid owner');
    }
    return owner;
  }

  async logout(ownerId: string): Promise<{ message: string }> {
    // JWT는 stateless이므로 서버에서 토큰을 무효화할 수 없습니다.
    // 실제 구현에서는 Redis blacklist나 토큰 만료 시간을 짧게 설정하는 방법을 고려할 수 있습니다.
    // 현재는 클라이언트에서 토큰을 삭제하는 것으로 처리합니다.
    
    // 마지막 로그인 시간 업데이트 (로그아웃 시간으로 활용)
    await this.ownerRepository.update(ownerId, { lastLoginAt: new Date() });
    
    return { message: 'Logout successful' };
  }

  async updatePrivacyConsent(ownerId: string): Promise<{ message: string }> {
    const owner = await this.ownerRepository.findOne({ where: { ownerId } });
    if (!owner) {
      throw new UnauthorizedException('User not found');
    }

    await this.ownerRepository.update(ownerId, {
      isPrivacyConsentGiven: true,
      privacyConsentDate: new Date(),
    });

    return { message: 'Privacy consent updated successfully' };
  }

  async getPrivacyConsentStatus(ownerId: string): Promise<{ isConsentGiven: boolean; consentDate?: Date }> {
    const owner = await this.ownerRepository.findOne({ 
      where: { ownerId },
      select: ['isPrivacyConsentGiven', 'privacyConsentDate']
    });
    
    if (!owner) {
      throw new UnauthorizedException('User not found');
    }

    return {
      isConsentGiven: owner.isPrivacyConsentGiven,
      consentDate: owner.privacyConsentDate,
    };
  }

  async deleteAccount(ownerId: string): Promise<{ message: string }> {
    // 트랜잭션으로 안전하게 처리
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 사용자 존재 확인
      const owner = await queryRunner.manager.findOne(Owner, { where: { ownerId } });
      if (!owner) {
        throw new UnauthorizedException('User not found');
      }

      // 1. 먼저 PaymentNotifications 삭제 (QrCode를 참조)
      const qrCodes = await queryRunner.manager.find(QrCode, { where: { owner: { ownerId } } });
      for (const qr of qrCodes) {
        await queryRunner.manager.delete(PaymentNotification, { qrCode: { qrId: qr.qrId } });
      }

      // 2. QrCodes 삭제 (BankAccount를 참조)
      await queryRunner.manager.delete(QrCode, { owner: { ownerId } });

      // 3. BankAccounts 삭제 (Owner를 참조)
      await queryRunner.manager.delete(BankAccount, { owner: { ownerId } });

      // 4. 마지막으로 Owner 삭제
      await queryRunner.manager.delete(Owner, { ownerId });

      await queryRunner.commitTransaction();
      return { message: 'Account deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}