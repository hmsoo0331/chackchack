import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from '../entities/bank-account.entity';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
  ) {}

  async createAccount(ownerId: string, createAccountDto: CreateAccountDto): Promise<BankAccount> {
    if (createAccountDto.isDefault) {
      await this.bankAccountRepository.update(
        { ownerId },
        { isDefault: false },
      );
    }

    const account = this.bankAccountRepository.create({
      ...createAccountDto,
      ownerId,
    });

    return this.bankAccountRepository.save(account);
  }

  async getAccounts(ownerId: string): Promise<BankAccount[]> {
    return this.bankAccountRepository.find({
      where: { ownerId },
      order: { isDefault: 'DESC' },
    });
  }

  async updateAccount(
    ownerId: string,
    accountId: string,
    updateAccountDto: Partial<CreateAccountDto>,
  ): Promise<BankAccount> {
    const account = await this.bankAccountRepository.findOne({
      where: { accountId, ownerId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (updateAccountDto.isDefault) {
      await this.bankAccountRepository.update(
        { ownerId },
        { isDefault: false },
      );
    }

    Object.assign(account, updateAccountDto);
    return this.bankAccountRepository.save(account);
  }

  async deleteAccount(ownerId: string, accountId: string): Promise<void> {
    const result = await this.bankAccountRepository.delete({ accountId, ownerId });
    if (result.affected === 0) {
      throw new NotFoundException('Account not found');
    }
  }
}