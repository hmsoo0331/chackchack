import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Owner } from './owner.entity';
import { QrCode } from './qr-code.entity';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid', { name: 'account_id' })
  accountId: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ name: 'bank_name' })
  bankName: string;

  @Column({ name: 'account_number' })
  accountNumber: string;

  @Column({ name: 'account_holder' })
  accountHolder: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @ManyToOne(() => Owner, owner => owner.bankAccounts)
  @JoinColumn({ name: 'owner_id' })
  owner: Owner;

  @OneToMany(() => QrCode, qrCode => qrCode.bankAccount)
  qrCodes: QrCode[];
}