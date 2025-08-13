import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { QrCode } from './qr-code.entity';

@Entity('payment_notifications')
export class PaymentNotification {
  @PrimaryGeneratedColumn('uuid', { name: 'notification_id' })
  notificationId: string;

  @Column({ name: 'qr_id' })
  qrId: string;

  @CreateDateColumn({ name: 'notified_at' })
  notifiedAt: Date;

  @Column({ name: 'payer_ip_address', nullable: true })
  payerIpAddress: string;

  @ManyToOne(() => QrCode, qrCode => qrCode.paymentNotifications)
  @JoinColumn({ name: 'qr_id' })
  qrCode: QrCode;
}