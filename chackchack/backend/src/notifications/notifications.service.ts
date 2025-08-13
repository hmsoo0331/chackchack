import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentNotification } from '../entities/payment-notification.entity';
import { QrCode } from '../entities/qr-code.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(PaymentNotification)
    private notificationRepository: Repository<PaymentNotification>,
    @InjectRepository(QrCode)
    private qrCodeRepository: Repository<QrCode>,
  ) {}

  async createNotification(qrId: string, ipAddress?: string): Promise<PaymentNotification> {
    const qrCode = await this.qrCodeRepository.findOne({ where: { qrId } });
    
    if (!qrCode) {
      throw new NotFoundException('QR code not found');
    }

    const notification = this.notificationRepository.create({
      qrId,
      payerIpAddress: ipAddress,
    });

    return this.notificationRepository.save(notification);
  }

  async getNotifications(ownerId: string): Promise<PaymentNotification[]> {
    return this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.qrCode', 'qrCode')
      .leftJoinAndSelect('qrCode.bankAccount', 'bankAccount')
      .where('qrCode.ownerId = :ownerId', { ownerId })
      .orderBy('notification.notifiedAt', 'DESC')
      .getMany();
  }
}