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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_login_at' })
  lastLoginAt: Date;

  @OneToMany(() => BankAccount, bankAccount => bankAccount.owner)
  bankAccounts: BankAccount[];

  @OneToMany(() => QrCode, qrCode => qrCode.owner)
  qrCodes: QrCode[];
}