import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 카카오 OAuth 설정
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
const KAKAO_NATIVE_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;

// Expo Go에서 인식할 수 있는 스킴
const CUSTOM_SCHEME = 'exp://192.168.0.25:8081';

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
 * 사용자 경험 시뮬레이션을 위한 카카오 로그인
 * 실제 카카오 로그인 페이지를 보여주되, 결과는 Mock 데이터로 처리
 */
export const signInWithKakaoCustom = async () => {
  try {
    console.log('카카오 커스텀 로그인 시작...');
    
    // 실제 카카오 로그인 페이지 URL (개발용)
    const authUrl = `https://kauth.kakao.com/oauth/authorize?` +
      `client_id=${KAKAO_REST_API_KEY}` +
      `&redirect_uri=${encodeURIComponent('https://developers.kakao.com')}` + // 카카오 개발자 페이지로 리다이렉트
      `&response_type=code`;

    console.log('카카오 로그인 페이지 열기...');

    // 실제 카카오 로그인 경험을 제공
    const result = await WebBrowser.openBrowserAsync(authUrl, {
      dismissButtonStyle: 'cancel',
      readerMode: false,
      showTitle: true,
    });

    console.log('Browser Result:', result);

    // 사용자가 브라우저를 닫았을 때
    if (result.type === 'cancel' || result.type === 'dismiss') {
      console.log('브라우저 닫음 - Mock 로그인 진행');
    }

    // 브라우저를 닫은 후 자동으로 Mock 데이터로 로그인 처리
    console.log('Mock 데이터로 로그인 완료');
    
    const mockUserInfo: KakaoUserInfo = {
      id: Date.now(),
      connected_at: new Date().toISOString(),
      properties: {
        nickname: '카카오 사용자',
        profile_image: 'https://k.kakaocdn.net/img/profile.jpg',
      },
      kakao_account: {
        profile: {
          nickname: '카카오 사용자',
        },
        email: `kakao${Date.now()}@kakao.com`,
      },
    };
    
    const mockAccessToken = `mock_kakao_token_${Date.now()}`;
    
    console.log('Mock 카카오 로그인 성공:', mockUserInfo);
    
    return {
      success: true,
      accessToken: mockAccessToken,
      refreshToken: `mock_refresh_${Date.now()}`,
      userInfo: mockUserInfo,
      isMock: true, // Mock 데이터임을 표시
    };

  } catch (error) {
    console.error('카카오 커스텀 로그인 오류:', error);
    
    // 에러 발생 시에도 Mock 데이터로 로그인 처리
    console.log('에러 발생 - Mock 모드로 전환');
    
    const mockUserInfo: KakaoUserInfo = {
      id: Date.now(),
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
    
    return {
      success: true,
      accessToken: `mock_token_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      userInfo: mockUserInfo,
      isMock: true,
    };
  }
};

/**
 * 프로덕션 빌드용 실제 카카오 로그인
 * (EAS Build 또는 실제 앱에서 사용)
 */
export const signInWithKakaoProduction = async () => {
  // 실제 프로덕션 환경에서는 다음과 같이 구현:
  // 1. react-native-kakao-login 라이브러리 사용
  // 2. 또는 커스텀 네이티브 모듈 구현
  // 3. 또는 웹뷰 기반 구현
  
  console.log('프로덕션 카카오 로그인은 EAS Build 환경에서 구현 필요');
  
  return {
    success: false,
    error: 'PRODUCTION_BUILD_REQUIRED',
    message: 'Expo Go에서는 Mock 로그인만 지원됩니다. 실제 카카오 로그인은 EAS Build가 필요합니다.',
  };
};