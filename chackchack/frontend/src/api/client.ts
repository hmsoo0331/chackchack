import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

console.log('API_BASE_URL:', API_BASE_URL);
console.log('process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  console.log('토큰 확인:', token ? '토큰 있음' : '토큰 없음');
  console.log('API 요청:', config.method?.toUpperCase(), config.url);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    console.log('API 응답 성공:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.log('API 에러:', error.config?.url, error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default client;