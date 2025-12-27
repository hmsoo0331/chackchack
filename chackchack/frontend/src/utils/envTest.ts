/**
 * 환경 변수 설정 테스트 유틸리티
 * 개발 시 환경 변수가 제대로 로드되는지 확인하기 위한 헬퍼 함수
 */

export const testEnvironmentSetup = () => {

  return {
    nodeEnv: process.env.NODE_ENV,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development'
  };
};

export const getApiBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.chackchack.co.kr';

  return baseUrl;
};