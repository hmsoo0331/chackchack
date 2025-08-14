import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

// 카카오 OAuth 설정
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

// 실제 작동하는 리다이렉트 URI (카카오 개발자센터에 등록 필요)
const REDIRECT_URI = 'https://auth.expo.io/@hmsoo0331/chackchack';

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
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
    };
    email?: string;
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
  };
}

/**
 * 실제 카카오 OAuth 로그인 구현
 * WebBrowser를 사용하여 인증 후 수동으로 코드 추출
 */
export const signInWithKakaoReal = async () => {
  try {
    console.log('실제 카카오 로그인 시작...');
    
    if (!KAKAO_REST_API_KEY) {
      throw new Error('카카오 REST API 키가 설정되지 않았습니다.');
    }

    // 카카오 인증 URL 생성
    const authUrl = `https://kauth.kakao.com/oauth/authorize?` +
      `client_id=${KAKAO_REST_API_KEY}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=profile_nickname,account_email`;

    console.log('카카오 인증 URL:', authUrl);

    // WebBrowser로 카카오 로그인 페이지 열기
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      REDIRECT_URI,
      {
        showTitle: true,
        showInRecents: true,
      }
    );

    console.log('WebBrowser 결과:', result);

    if (result.type === 'success' && result.url) {
      console.log('인증 성공! URL:', result.url);
      
      // URL에서 인증 코드 추출
      const code = extractAuthCode(result.url);
      
      if (code) {
        console.log('인증 코드 추출 성공:', code);
        
        // 액세스 토큰으로 교환
        const tokenData = await exchangeCodeForToken(code);
        
        if (tokenData) {
          console.log('토큰 교환 성공');
          
          // 사용자 정보 가져오기
          const userInfo = await fetchUserInfo(tokenData.access_token);
          
          if (userInfo) {
            return {
              success: true,
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              userInfo,
            };
          } else {
            throw new Error('사용자 정보 조회 실패');
          }
        } else {
          throw new Error('토큰 교환 실패');
        }
      } else {
        throw new Error('인증 코드를 찾을 수 없습니다.');
      }
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      console.log('사용자가 로그인을 취소했거나 Expo Auth 프록시 이슈가 발생했습니다.');
      return {
        success: false,
        error: 'EXPO_AUTH_PROXY_ERROR',
      };
    } else {
      // Expo Auth 프록시 이슈가 발생한 경우
      console.log('Expo Auth 프록시 이슈 - 자동 폴백 준비');
      
      return {
        success: false,
        error: 'EXPO_AUTH_PROXY_ERROR',
      };
    }
  } catch (error) {
    console.error('카카오 실제 로그인 오류:', error);
    
    return {
      success: false,
      error: error.message || 'KAKAO_AUTH_ERROR',
    };
  }
};

/**
 * URL에서 인증 코드 추출
 */
const extractAuthCode = (url: string): string | null => {
  try {
    console.log('코드 추출 대상 URL:', url);
    
    // URL 파싱하여 code 파라미터 추출
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    
    if (code) {
      console.log('코드 추출 성공:', code);
      return code;
    }
    
    // 쿼리 스트링에서 직접 추출 (백업)
    const match = url.match(/[?&]code=([^&]+)/);
    if (match) {
      console.log('정규식으로 코드 추출 성공:', match[1]);
      return match[1];
    }
    
    console.log('URL에서 코드를 찾을 수 없음');
    return null;
  } catch (error) {
    console.error('코드 추출 중 오류:', error);
    return null;
  }
};

/**
 * 인증 코드를 액세스 토큰으로 교환
 */
const exchangeCodeForToken = async (code: string): Promise<KakaoTokenResponse | null> => {
  try {
    console.log('토큰 교환 시작...');
    
    const tokenUrl = 'https://kauth.kakao.com/oauth/token';
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY!,
      redirect_uri: REDIRECT_URI,
      code,
    });

    console.log('토큰 교환 요청:', {
      url: tokenUrl,
      params: params.toString(),
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    console.log('토큰 교환 응답 상태:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('토큰 교환 실패:', errorText);
      return null;
    }

    const tokenData: KakaoTokenResponse = await response.json();
    console.log('토큰 교환 성공:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    });
    
    return tokenData;
  } catch (error) {
    console.error('토큰 교환 중 오류:', error);
    return null;
  }
};

/**
 * 카카오 사용자 정보 조회
 */
const fetchUserInfo = async (accessToken: string): Promise<KakaoUserInfo | null> => {
  try {
    console.log('사용자 정보 조회 시작...');
    
    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    console.log('사용자 정보 조회 응답 상태:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('사용자 정보 조회 실패:', errorText);
      return null;
    }

    const userInfo: KakaoUserInfo = await response.json();
    console.log('사용자 정보 조회 성공:', {
      id: userInfo.id,
      hasNickname: !!userInfo.properties?.nickname,
      hasEmail: !!userInfo.kakao_account?.email,
    });
    
    return userInfo;
  } catch (error) {
    console.error('사용자 정보 조회 중 오류:', error);
    return null;
  }
};

/**
 * 수동 인증 코드 입력을 위한 헬퍼 함수
 * Expo Go 환경에서 프록시 이슈 시 사용
 */
export const processManualAuthCode = async (authCode: string) => {
  try {
    console.log('수동 인증 코드 처리:', authCode);
    
    // 토큰 교환
    const tokenData = await exchangeCodeForToken(authCode);
    
    if (tokenData) {
      // 사용자 정보 조회
      const userInfo = await fetchUserInfo(tokenData.access_token);
      
      if (userInfo) {
        return {
          success: true,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          userInfo,
        };
      }
    }
    
    return {
      success: false,
      error: 'MANUAL_CODE_PROCESSING_FAILED',
    };
  } catch (error) {
    console.error('수동 코드 처리 오류:', error);
    return {
      success: false,
      error: error.message || 'MANUAL_CODE_ERROR',
    };
  }
};