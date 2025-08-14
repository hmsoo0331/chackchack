import * as WebBrowser from 'expo-web-browser';

// 카카오 OAuth 설정
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
// 실제 디바이스에서 리다이렉트 가능한 URL
const REDIRECT_URI = 'https://localhost:3000/auth/kakao/callback';

interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
  kakao_account?: {
    profile?: {
      nickname?: string;
    };
    email?: string;
  };
}

/**
 * 직접 처리 방식의 카카오 로그인
 */
export const signInWithKakaoDirect = async () => {
  try {
    console.log('카카오 직접 로그인 시작...');
    
    // Mock 인증 코드 생성 (테스트용)
    const mockCode = 'test_auth_code_' + Date.now();
    
    // 실제 환경에서는 카카오 로그인 페이지로 이동해야 하지만,
    // Expo Go 환경의 제약으로 Mock 데이터 사용
    console.log('Mock 인증 코드 생성:', mockCode);
    
    // Mock 사용자 정보
    const mockUserInfo: KakaoUserInfo = {
      id: Math.floor(Math.random() * 1000000),
      connected_at: new Date().toISOString(),
      properties: {
        nickname: '테스트 사용자',
        profile_image: 'https://k.kakaocdn.net/img/profile.jpg',
      },
      kakao_account: {
        profile: {
          nickname: '테스트 사용자',
        },
        email: `test${Date.now()}@kakao.com`,
      },
    };
    
    // Mock 액세스 토큰
    const mockAccessToken = 'mock_access_token_' + Date.now();
    
    console.log('Mock 로그인 성공:', mockUserInfo);
    
    return {
      success: true,
      accessToken: mockAccessToken,
      refreshToken: 'mock_refresh_token',
      userInfo: mockUserInfo,
    };
  } catch (error) {
    console.error('카카오 직접 로그인 오류:', error);
    return {
      success: false,
      error: error.message || 'KAKAO_AUTH_ERROR',
    };
  }
};