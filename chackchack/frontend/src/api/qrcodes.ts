import client from './client';
import { QrCode } from '../types';

export const qrcodesAPI = {
  create: async (data: {
    accountId: string;
    qrName: string;
    baseAmount?: number;
    discountType?: string;
    discountValue?: number;
    styleConfigJson?: any;
  }) => {

    const response = await client.post<QrCode>('/qrcodes', data);

    return response.data;
  },

  getAll: async () => {
    const response = await client.get<QrCode[]>('/qrcodes');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await client.get<QrCode>(`/qrcodes/${id}`);
    return response.data;
  },

  update: async (id: string, data: {
    accountId: string;
    qrName: string;
    baseAmount?: number;
    discountType?: string;
    discountValue?: number;
    styleConfigJson?: any;
  }) => {

    const response = await client.put<QrCode>(`/qrcodes/${id}`, data);

    return response.data;
  },

  delete: async (id: string) => {
    const response = await client.delete<{ message: string }>(`/qrcodes/${id}`);
    return response.data;
  },

  sync: async (localQrCodes: any[]) => {

    const response = await client.post<{
      message: string;
      syncedCount: number;
      skippedCount: number;
      allQrCodes: any[];
    }>('/qrcodes/sync', { localQrCodes });

    return response.data;
  },
};