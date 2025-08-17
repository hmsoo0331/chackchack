import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// WebBrowser 결과 완료 처리
WebBrowser.maybeCompleteAuthSession();

// WebBrowser 설정 (Android에서 Custom Tab 사용)
if (Platform.OS === 'android') {
  WebBrowser.warmUpAsync();
}

// 카카오 OAuth 설정
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth';
const KAKAO_API_URL = 'https://kapi.kakao.com';

// 카카오 개발자센터에 등록된 URI (HTTP/HTTPS만 허용)
// 백엔드 서버의 OAuth 콜백 페이지 사용
const SERVER_URL = process.env.EXPO_PUBLIC_API_URL || 'http://3.39.96.52:3000';
const REDIRECT_URI = `${SERVER_URL}/oauth-callback.html`;

console.log('SERVER_URL:', SERVER_URL);
console.log('REDIRECT_URI:', REDIRECT_URI);

// 앱 환경 확인
const isStandalone = Constants.appOwnership === 'standalone' || !Constants.appOwnership;

console.log('Kakao REST API Key:', KAKAO_REST_API_KEY);
console.log('Kakao Redirect URI:', REDIRECT_URI);
console.log('App Ownership:', Constants.appOwnership);
console.log('Is Standalone:', isStandalone);

// 타입 정의
interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  refresh_token_expires_in?: number;
}

interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    profile_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image?: boolean;
    };
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string;
  };
}

/**
 * 카카오 로그인 처리 - WebBrowser와 Linking 사용
 */
export const signInWithKakao = async () => {
  try {
    // API 키 확인
    if (!KAKAO_REST_API_KEY) {
      console.error('❌ KAKAO_REST_API_KEY가 설정되지 않았습니다!');
      return {
        success: false,
        error: 'NO_API_KEY',
      };
    }

    console.log('Starting Kakao OAuth with WebBrowser + Linking...');

    // 랜덤 state 생성
    const state = Math.random().toString(36).substring(7);
    
    // 카카오 OAuth URL 생성
    const authUrl = `${KAKAO_AUTH_URL}/authorize?` + new URLSearchParams({
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      state,
    }).toString();

    console.log('Opening Kakao auth URL:', authUrl);

    // 딥링크 처리를 위한 Promise
    const authCodePromise = new Promise<{ code?: string; error?: string }>((resolve) => {
      // 딥링크 리스너 설정
      const handleUrl = (url: string) => {
        console.log('Received deep link URL:', url);
        
        if (url.startsWith('chackchack://oauth')) {
          const urlParams = new URLSearchParams(url.split('?')[1]);
          const code = urlParams.get('code');
          const error = urlParams.get('error');
          const receivedState = urlParams.get('state');
          
          console.log('Deep link params:', { code: code ? 'received' : 'none', error, state: receivedState });
          
          if (receivedState === state || !receivedState) { // state가 없는 경우도 허용
            subscription.remove();
            resolve({ code: code || undefined, error: error || undefined });
          }
        }
      };

      // 리스너 등록
      const subscription = Linking.addEventListener('url', (event) => {
        handleUrl(event.url);
      });

      // 기존 URL 체크 (앱이 이미 열려있는 경우)
      Linking.getInitialURL().then((url) => {
        if (url) {
          handleUrl(url);
        }
      });

      // 타임아웃 설정 (5분)
      setTimeout(() => {
        subscription.remove();
        resolve({ error: 'TIMEOUT' });
      }, 300000);
    });

    // 브라우저 열기
    const browserResult = await WebBrowser.openAuthSessionAsync(authUrl, 'chackchack://oauth');
    
    console.log('Browser result:', browserResult);

    // 브라우저가 성공적으로 열렸거나 dismiss된 경우 딥링크 대기
    if (browserResult.type === 'success' || browserResult.type === 'dismiss') {
      const authResult = await authCodePromise;
      
      if (authResult.error) {
        console.error('카카오 OAuth 에러:', authResult.error);
        return {
          success: false,
          error: authResult.error,
        };
      }
      
      if (!authResult.code) {
        console.error('인증 코드가 없습니다.');
        return {
          success: false,
          error: 'NO_AUTH_CODE',
        };
      }
      
      console.log('인증 코드 획득:', authResult.code);
      
      // 인증 코드로 액세스 토큰 교환
      console.log('토큰 교환 시작 - 인증 코드:', authResult.code);
      const tokenResponse = await exchangeCodeForToken(authResult.code);
      
      if (tokenResponse) {
        console.log('토큰 교환 성공, 사용자 정보 요청 중...');
        // 사용자 정보 가져오기
        const userInfo = await fetchKakaoUserInfo(tokenResponse.access_token);
        
        if (userInfo) {
          console.log('카카오 사용자 정보 조회 성공:', { id: userInfo.id, nickname: userInfo.properties?.nickname });
          return {
            success: true,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            userInfo,
          };
        } else {
          console.error('카카오 사용자 정보 조회 실패');
          return {
            success: false,
            error: 'KAKAO_USER_INFO_FAILED',
          };
        }
      } else {
        console.error('토큰 교환 실패');
        return {
          success: false,
          error: 'TOKEN_EXCHANGE_FAILED',
        };
      }
    } else if (browserResult.type === 'cancel') {
      console.log('카카오 로그인 취소됨');
      return {
        success: false,
        error: 'USER_CANCELLED',
      };
    }

    console.error('예상치 못한 브라우저 결과:', browserResult);
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
    };
  } catch (error) {
    console.error('카카오 로그인 오류:', error);
    return {
      success: false,
      error: error.message || 'KAKAO_AUTH_ERROR',
    };
  }
};

/**
 * 인증 코드를 액세스 토큰으로 교환
 */
const exchangeCodeForToken = async (code: string): Promise<KakaoTokenResponse | null> => {
  try {
    const tokenUrl = `${KAKAO_AUTH_URL}/token`;
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY!,
      redirect_uri: REDIRECT_URI,
      code,
    });

    console.log('토큰 교환 요청:', tokenUrl);
    console.log('토큰 교환 파라미터:', {
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY!,
      redirect_uri: REDIRECT_URI,
      code: code.substring(0, 10) + '...', // 보안을 위해 일부만 표시
    });
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('토큰 교환 실패 상태:', response.status);
      console.error('토큰 교환 실패 응답:', data);
      return null;
    }
    
    console.log('토큰 교환 성공! 액세스 토큰 획득');
    return data as KakaoTokenResponse;
  } catch (error) {
    console.error('토큰 교환 네트워크 오류:', error);
    return null;
  }
};

/**
 * 카카오 사용자 정보 가져오기
 */
const fetchKakaoUserInfo = async (accessToken: string): Promise<KakaoUserInfo | null> => {
  try {
    const userInfoUrl = `${KAKAO_API_URL}/v2/user/me`;
    
    const response = await fetch(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('사용자 정보 가져오기 실패:', data);
      return null;
    }
    
    console.log('사용자 정보 가져오기 성공');
    return data as KakaoUserInfo;
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    return null;
  }
};

/**
 * 카카오 로그아웃
 */
export const signOutFromKakao = async (accessToken: string) => {
  try {
    const logoutUrl = `${KAKAO_API_URL}/v1/user/logout`;
    
    const response = await fetch(logoutUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('로그아웃 실패:', data);
      return false;
    }
    
    console.log('카카오 로그아웃 성공');
    return true;
  } catch (error) {
    console.error('카카오 로그아웃 오류:', error);
    return false;
  }
};