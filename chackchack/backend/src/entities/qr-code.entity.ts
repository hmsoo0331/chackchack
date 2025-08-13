import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Owner } from './owner.entity';
import { BankAccount } from './bank-account.entity';
import { PaymentNotification } from './payment-notification.entity';

@Entity('qr_codes')
export class QrCode {
  @PrimaryGeneratedColumn('uuid', { name: 'qr_id' })
  qrId: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @Column({ name: 'qr_name' })
  qrName: string;

  @Column({ name: 'base_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  baseAmount: number;

  @Column({ name: 'discount_type', nullable: true })
  discountType: string;

  @Column({ name: 'discount_value', type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountValue: number;

  @Column({ name: 'style_config_json', type: 'jsonb', nullable: true })
  styleConfigJson: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Owner, owner => owner.qrCodes)
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @ManyToOne(() => BankAccount, bankAccount => bankAccount.qrCodes)
  @JoinColumn({ name: 'account_id' })
  bankAccount: BankAccount;

  @OneToMany(() => PaymentNotification, notification => notification.qrCode)
  paymentNotifications: PaymentNotification[];
}