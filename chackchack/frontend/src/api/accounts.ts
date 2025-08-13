import client from './client';
import { BankAccount } from '../types';

export const accountsAPI = {
  create: async (data: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isDefault?: boolean;
  }) => {
    console.log('accounts API 호출 - 데이터:', data);
    const response = await client.post<BankAccount>('/accounts', data);
    console.log('accounts API 응답:', response.data);
    return response.data;
  },
  
  getAll: async () => {
    const response = await client.get<BankAccount[]>('/accounts');
    return response.data;
  },
};