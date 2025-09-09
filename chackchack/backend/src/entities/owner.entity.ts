import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BankAccount } from './bank-account.entity';
import { QrCode } from './qr-code.entity';

@Entity('owners')
export class Owner {
  @PrimaryGeneratedColumn('uuid', { name: 'owner_id' })
  ownerId: string;

  @Column({ name: 'device_token', nullable: true })
  deviceToken: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ name: 'auth_provider', nullable: true })
  authProvider: string;

  @Column({ name: 'is_privacy_consent_given', default: false })
  isPrivacyConsentGiven: boolean;

  @Column({ name: 'privacy_consent_date', nullable: true })
  privacyConsentDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_login_at' })
  lastLoginAt: Date;

  @OneToMany(() => BankAccount, bankAccount => bankAccount.owner, { 
    cascade: ['remove'],
    onDelete: 'CASCADE' 
  })
  bankAccounts: BankAccount[];

  @OneToMany(() => QrCode, qrCode => qrCode.owner, { 
    cascade: ['remove'],
    onDelete: 'CASCADE' 
  })
  qrCodes: QrCode[];
}