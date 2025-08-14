import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 카카오 OAuth 설정
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
const REDIRECT_URI = 'https://auth.expo.io/@hmsoo0331/chackchack';

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
 * 시스템 브라우저를 사용한 카카오 로그인 (대안)
 */
export const signInWithKakaoSystem = async () => {
  try {
    console.log('카카오 시스템 브라우저 로그인 시작...');
    
    // 상태 값 생성 (CSRF 방지)
    const state = Math.random().toString(36).substring(7);
    await AsyncStorage.setItem('kakao_oauth_state', state);
    
    // 카카오 인증 URL 생성
    const authUrl = `https://kauth.kakao.com/oauth/authorize?` +
      `client_id=${KAKAO_REST_API_KEY}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&state=${state}` +
      `&scope=profile_nickname,account_email`;

    console.log('Opening URL:', authUrl);

    // 시스템 브라우저로 열기
    const canOpen = await Linking.canOpenURL(authUrl);
    if (canOpen) {
      await Linking.openURL(authUrl);
      
      // 딥링크 리스너 설정
      const handleUrl = async (url: string) => {
        console.log('Received URL:', url);
        
        // URL에서 코드 추출
        const code = extractCodeFromUrl(url);
        const receivedState = extractStateFromUrl(url);
        const savedState = await AsyncStorage.getItem('kakao_oauth_state');
        
        if (code && receivedState === savedState) {
          console.log('인증 코드 획득:', code);
          
          // 액세스 토큰 교환
          const tokenResponse = await exchangeCodeForToken(code);
          
          if (tokenResponse) {
            // 사용자 정보 가져오기
            const userInfo = await fetchKakaoUserInfo(tokenResponse.access_token);
            
            // 상태 정리
            await AsyncStorage.removeItem('kakao_oauth_state');
            
            return {
              success: true,
              accessToken: tokenResponse.access_token,
              refreshToken: tokenResponse.refresh_token,
              userInfo,
            };
          }
        }
      };
      
      // URL 리스너 등록
      const subscription = Linking.addEventListener('url', (event) => {
        handleUrl(event.url);
      });
      
      // 타임아웃 설정 (3분)
      setTimeout(() => {
        subscription.remove();
      }, 180000);
      
      return {
        success: false,
        error: 'WAITING_FOR_REDIRECT',
        message: '브라우저에서 로그인을 완료해주세요.',
      };
    }

    return {
      success: false,
      error: 'CANNOT_OPEN_URL',
    };
  } catch (error) {
    console.error('카카오 시스템 브라우저 로그인 오류:', error);
    return {
      success: false,
      error: error.message || 'KAKAO_AUTH_ERROR',
    };
  }
};

/**
 * URL에서 인증 코드 추출
 */
const extractCodeFromUrl = (url: string): string | null => {
  try {
    const match = url.match(/[?&]code=([^&]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('URL 파싱 오류:', error);
    return null;
  }
};

/**
 * URL에서 state 추출
 */
const extractStateFromUrl = (url: string): string | null => {
  try {
    const match = url.match(/[?&]state=([^&]+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

/**
 * 인증 코드를 액세스 토큰으로 교환
 */
const exchangeCodeForToken = async (code: string): Promise<any> => {
  try {
    const tokenUrl = 'https://kauth.kakao.com/oauth/token';
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY!,
      redirect_uri: REDIRECT_URI,
      code,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('토큰 교환 실패:', errorData);
      return null;
    }

    const tokenData = await response.json();
    console.log('토큰 교환 성공');
    
    return tokenData;
  } catch (error) {
    console.error('토큰 교환 오류:', error);
    return null;
  }
};

/**
 * 카카오 사용자 정보 가져오기
 */
const fetchKakaoUserInfo = async (accessToken: string): Promise<KakaoUserInfo | null> => {
  try {
    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('사용자 정보 조회 실패:', errorData);
      return null;
    }

    const userInfo: KakaoUserInfo = await response.json();
    console.log('카카오 사용자 정보:', userInfo);
    
    return userInfo;
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return null;
  }
};