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
    console.log('qrcodes API 호출 - 데이터:', data);
    const response = await client.post<QrCode>('/qrcodes', data);
    console.log('qrcodes API 응답:', response.data);
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
    console.log('qrcodes 업데이트 API 호출 - ID:', id, '데이터:', data);
    const response = await client.put<QrCode>(`/qrcodes/${id}`, data);
    console.log('qrcodes 업데이트 API 응답:', response.data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await client.delete<{ message: string }>(`/qrcodes/${id}`);
    return response.data;
  },

  sync: async (localQrCodes: any[]) => {
    console.log('동기화 API 호출 - 로컬 QR 개수:', localQrCodes.length);
    const response = await client.post<{
      message: string;
      syncedCount: number;
      skippedCount: number;
      allQrCodes: any[];
    }>('/qrcodes/sync', { localQrCodes });
    console.log('동기화 API 응답:', response.data);
    return response.data;
  },
};