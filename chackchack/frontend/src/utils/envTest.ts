/**
 * 환경 변수 설정 테스트 유틸리티
 * 개발 시 환경 변수가 제대로 로드되는지 확인하기 위한 헬퍼 함수
 */

export const testEnvironmentSetup = () => {
  console.log('=== 환경 변수 설정 테스트 ===');
  console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
  console.log('EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
  console.log('예상 동작:');
  console.log('- 개발 모드 (expo start): http://localhost:3000');
  console.log('- 배포 모드 (expo export): http://3.39.96.52:3000');
  console.log('===========================');
  
  return {
    nodeEnv: process.env.NODE_ENV,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development'
  };
};

export const getApiBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  console.log(`API Base URL resolved to: ${baseUrl}`);
  return baseUrl;
};