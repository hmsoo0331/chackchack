import client from './client';
import { Owner } from '../types';

export const authAPI = {
  createGuest: async (deviceToken?: string) => {
    const response = await client.post<{ owner: Owner; accessToken: string }>('/auth/guest', {
      deviceToken,
    });
    return response.data;
  },
  
  socialLogin: async (email: string, nickname: string, authProvider: string, socialAccessToken?: string, deviceToken?: string) => {
    const response = await client.post<{ owner: Owner; accessToken: string }>('/auth/login', {
      email,
      nickname,
      authProvider,
      socialAccessToken,
      deviceToken,
    });
    return response.data;
  },

  logout: async () => {
    const response = await client.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  deleteAccount: async () => {
    const response = await client.delete<{ message: string }>('/auth/me');
    return response.data;
  },
};