import client from './client';
import { BankAccount } from '../types';

export const accountsAPI = {
  create: async (data: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isDefault?: boolean;
  }) => {

    const response = await client.post<BankAccount>('/accounts', data);

    return response.data;
  },

  getAll: async () => {
    const response = await client.get<BankAccount[]>('/accounts');
    return response.data;
  },
};