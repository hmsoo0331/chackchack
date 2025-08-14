import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

// 카카오 OAuth 설정
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
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
  };
}

/**
 * WebBrowser를 사용한 카카오 로그인
 */
export const signInWithKakaoWeb = async () => {
  try {
    console.log('카카오 웹 로그인 시작...');
    
    // 카카오 인증 URL 생성 (스코프를 간소화)
    const authUrl = `https://kauth.kakao.com/oauth/authorize?` +
      `client_id=${KAKAO_REST_API_KEY}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code`;

    console.log('Auth URL:', authUrl);

    // 웹 브라우저로 카카오 로그인 페이지 열기
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      REDIRECT_URI,
      {
        showTitle: false,  // 타이틀 바 제거로 더 많은 공간 확보
        showInRecents: true,
        createTask: false,  // Android에서 별도 태스크 생성 방지
      }
    );

    console.log('WebBrowser Result:', JSON.stringify(result, null, 2));

    if (result.type === 'success') {
      // result.url이 없을 수도 있으므로 체크
      if (!result.url) {
        console.error('Success but no URL returned');
        return {
          success: false,
          error: 'NO_URL_RETURNED',
        };
      }
      
      // URL에서 인증 코드 추출
      const code = extractCodeFromUrl(result.url);
      
      if (code) {
        console.log('인증 코드 획득:', code);
        
        // 액세스 토큰 교환
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
        } else {
          console.error('토큰 교환 실패');
          return {
            success: false,
            error: 'TOKEN_EXCHANGE_FAILED',
          };
        }
      } else {
        console.error('URL에서 인증 코드를 찾을 수 없음');
        return {
          success: false,
          error: 'NO_CODE_IN_URL',
        };
      }
    } else if (result.type === 'cancel') {
      console.log('사용자가 로그인을 취소했습니다.');
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
    console.error('카카오 웹 로그인 오류:', error);
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
    console.log('Extracting code from URL:', url);
    
    // URL에서 코드 파라미터 추출 (다양한 형식 지원)
    const codeMatch = url.match(/[?&#]code=([^&#]+)/);
    if (codeMatch) {
      console.log('Found code:', codeMatch[1]);
      return codeMatch[1];
    }
    
    // URL 객체로도 시도
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      if (code) {
        console.log('Found code via URL object:', code);
        return code;
      }
    } catch (e) {
      // URL 파싱 실패시 정규식으로만 처리
    }
    
    console.log('No code found in URL');
    return null;
  } catch (error) {
    console.error('URL 파싱 오류:', error);
    return null;
  }
};

/**
 * 인증 코드를 액세스 토큰으로 교환
 */
const exchangeCodeForToken = async (code: string): Promise<KakaoTokenResponse | null> => {
  try {
    const tokenUrl = 'https://kauth.kakao.com/oauth/token';
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY!,
      redirect_uri: REDIRECT_URI,
      code,
    });

    console.log('토큰 교환 요청:', tokenUrl);

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