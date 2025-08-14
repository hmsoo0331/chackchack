import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// WebBrowser 결과 완료 처리
WebBrowser.maybeCompleteAuthSession();

// 카카오 OAuth 설정
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

// Expo Auth Proxy를 통한 Redirect URI 설정
// 카카오 개발자센터에 이 URI를 등록해야 함
const REDIRECT_URI = 'https://auth.expo.io/@hmsoo0331/chackchack';

// 개발 환경 확인용
const DEBUG_REDIRECT_URI = AuthSession.makeRedirectUri({
  useProxy: true,
});

console.log('Kakao REST API Key:', KAKAO_REST_API_KEY);
console.log('Kakao Redirect URI (Used):', REDIRECT_URI);
console.log('Debug Redirect URI:', DEBUG_REDIRECT_URI);

// 카카오 OAuth URL
const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth';

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
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
    profile_nickname_needs_agreement?: boolean;
    profile_image_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image?: boolean;
    };
    has_email?: boolean;
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string;
  };
}

/**
 * 카카오 로그인 처리
 */
export const signInWithKakao = async () => {
  try {
    console.log('Starting Kakao OAuth with:', {
      clientId: KAKAO_REST_API_KEY,
      redirectUri: REDIRECT_URI,
    });

    // Discovery 문서 사용 (카카오는 표준 OAuth2.0 지원)
    const discovery = {
      authorizationEndpoint: `${KAKAO_AUTH_URL}/authorize`,
      tokenEndpoint: `${KAKAO_AUTH_URL}/token`,
    };

    // AuthSession Request 생성
    const request = new AuthSession.AuthRequest({
      clientId: KAKAO_REST_API_KEY!,
      scopes: ['profile', 'account_email'],
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      prompt: AuthSession.Prompt.Login,
    });

    // 인증 요청 실행 (discovery 사용)
    const result = await request.promptAsync(discovery);

    console.log('Kakao Auth Result:', result);

    if (result.type === 'success') {
      const { code } = result.params;
      
      // 인증 코드로 액세스 토큰 교환
      const tokenResponse = await exchangeCodeForToken(code);
      
      if (tokenResponse) {
        // 사용자 정보 가져오기
        const userInfo = await fetchKakaoUserInfo(tokenResponse.access_token);
        
        return {
          success: true,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          userInfo,
        };
      }
    } else if (result.type === 'cancel') {
      console.log('카카오 로그인 취소됨');
      return {
        success: false,
        error: 'USER_CANCELLED',
      };
    }

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

    const tokenData: KakaoTokenResponse = await response.json();
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

/**
 * 카카오 로그아웃
 */
export const signOutFromKakao = async (accessToken: string) => {
  try {
    const response = await fetch('https://kapi.kakao.com/v1/user/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      console.log('카카오 로그아웃 성공');
      return true;
    }

    return false;
  } catch (error) {
    console.error('카카오 로그아웃 오류:', error);
    return false;
  }
};

/**
 * 카카오 연결 끊기 (회원 탈퇴)
 */
export const unlinkKakaoAccount = async (accessToken: string) => {
  try {
    const response = await fetch('https://kapi.kakao.com/v1/user/unlink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      console.log('카카오 연결 끊기 성공');
      return true;
    }

    return false;
  } catch (error) {
    console.error('카카오 연결 끊기 오류:', error);
    return false;
  }
};