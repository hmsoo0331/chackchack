/**
 * 환경별 설정 관리
 */

// 현재 환경 확인
export const isDevelopment = __DEV__;
export const isProduction = !__DEV__;

// Expo Go 환경인지 확인
export const isExpoGo = (() => {
  try {
    // Expo Go에서만 사용 가능한 기능 체크
    const Constants = require('expo-constants');
    return Constants.default?.appOwnership === 'expo';
  } catch {
    return false;
  }
})();

// 환경별 기능 플래그
export const features = {
  // Mock 로그인은 개발 환경 + Expo Go에서만 활성화
  enableMockLogin: isDevelopment && isExpoGo,
  
  // 디버그 로그
  enableDebugLogs: isDevelopment,
  
  // 에러 리포팅
  enableErrorReporting: isProduction,
  
  // 애널리틱스
  enableAnalytics: isProduction,
};

// 환경별 설정값
export const config = {
  // OAuth Redirect URI
  kakaoRedirectUri: 'https://auth.expo.io/@hmsoo0331/chackchack',  // Expo 프록시 URI 사용
    
  // API 타임아웃
  apiTimeout: isDevelopment ? 30000 : 10000,
  
  // 에러 메시지
  showDetailedErrors: isDevelopment,
};

export default {
  isDevelopment,
  isProduction,
  isExpoGo,
  features,
  config,
};