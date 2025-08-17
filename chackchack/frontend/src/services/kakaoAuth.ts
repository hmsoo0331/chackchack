import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

// WebBrowser 결과 완료 처리
WebBrowser.maybeCompleteAuthSession();

// WebBrowser 설정 (Android에서 Custom Tab 사용)
if (Platform.OS === 'android') {
  WebBrowser.warmUpAsync();
}

// 카카오 OAuth 설정
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

// 환경별 Redirect URI 설정
import Constants from 'expo-constants';

// Expo Go vs Standalone 앱 구분
const isExpoGo = Constants.appOwnership === 'expo';
const isStandalone = Constants.appOwnership === 'standalone' || !Constants.appOwnership;

// 카카오 개발자센터에 이 URI들을 등록해야 함
// Expo Go: https://auth.expo.io/@hmsoo0331/chackchack
// Standalone: chackchack://oauth
const REDIRECT_URI = isStandalone ? 'chackchack://oauth' : 'https://auth.expo.io/@hmsoo0331/chackchack';

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
 * 카카오 로그인 처리 - WebBrowser와 Linking 직접 사용
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

    console.log('Starting Kakao OAuth with WebBrowser:', {
      clientId: KAKAO_REST_API_KEY,
      redirectUri: REDIRECT_URI,
    });

    // 상태값 생성
    const state = Math.random().toString(36).substring(7);
    
    // 카카오 OAuth URL 생성
    const authUrl = `${KAKAO_AUTH_URL}/authorize?` + 
      `client_id=${KAKAO_REST_API_KEY}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `state=${state}`;

    console.log('카카오 OAuth URL:', authUrl);

    // Promise로 리다이렉트 처리
    return new Promise((resolve) => {
      // 리다이렉트 URL 대기 설정
      const linkingSubscription = Linking.addEventListener('url', (event) => {
        console.log('딥링크 수신:', event.url);
        
        // chackchack:// 스킴으로 돌아왔을 때 처리
        if (event.url && event.url.startsWith('chackchack://')) {
          linkingSubscription?.remove();
          
          try {
            const url = new URL(event.url);
            const code = url.searchParams.get('code');
            const error = url.searchParams.get('error');
            const returnedState = url.searchParams.get('state');
            
            if (error) {
              console.error('카카오 OAuth 에러:', error);
              resolve({
                success: false,
                error: `KAKAO_OAUTH_ERROR: ${error}`,
              });
              return;
            }
            
            if (returnedState !== state) {
              console.error('상태값 불일치');
              resolve({
                success: false,
                error: 'STATE_MISMATCH',
              });
              return;
            }
            
            if (!code) {
              console.error('인증 코드가 없습니다.');
              resolve({
                success: false,
                error: 'NO_AUTH_CODE',
              });
              return;
            }
            
            console.log('인증 코드 획득:', code);
            
            // 인증 코드로 액세스 토큰 교환
            exchangeCodeForToken(code, REDIRECT_URI).then((tokenResponse) => {
              if (tokenResponse) {
                // 사용자 정보 가져오기
                fetchKakaoUserInfo(tokenResponse.access_token).then((userInfo) => {
                  resolve({
                    success: true,
                    accessToken: tokenResponse.access_token,
                    refreshToken: tokenResponse.refresh_token,
                    userInfo,
                  });
                });
              } else {
                resolve({
                  success: false,
                  error: 'TOKEN_EXCHANGE_FAILED',
                });
              }
            });
          } catch (error) {
            console.error('URL 파싱 오류:', error);
            resolve({
              success: false,
              error: 'URL_PARSE_ERROR',
            });
          }
        }
      });

      // Standalone 앱에서는 외부 브라우저 사용
      if (isStandalone) {
        // 외부 브라우저로 열기
        Linking.openURL(authUrl).then(() => {
          console.log('외부 브라우저에서 카카오 로그인 진행 중...');
          
          // 타임아웃 설정 (5분)
          setTimeout(() => {
            linkingSubscription?.remove();
            resolve({
              success: false,
              error: 'TIMEOUT',
            });
          }, 300000);
        }).catch((error) => {
          linkingSubscription?.remove();
          console.error('브라우저 열기 실패:', error);
          resolve({
            success: false,
            error: 'BROWSER_OPEN_FAILED',
          });
        });
      } else {
        // Expo Go에서는 WebBrowser 사용
        WebBrowser.openBrowserAsync(authUrl).then(() => {
          console.log('브라우저에서 카카오 로그인 진행 중...');
          
          // 타임아웃 설정 (5분)
          setTimeout(() => {
            linkingSubscription?.remove();
            resolve({
              success: false,
              error: 'TIMEOUT',
            });
          }, 300000);
        }).catch((error) => {
          linkingSubscription?.remove();
          console.error('브라우저 열기 실패:', error);
          resolve({
            success: false,
            error: 'BROWSER_OPEN_FAILED',
          });
        });
      }
    });
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
const exchangeCodeForToken = async (code: string, redirectUri?: string): Promise<KakaoTokenResponse | null> => {
  try {
    const tokenUrl = `${KAKAO_AUTH_URL}/token`;
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY!,
      redirect_uri: redirectUri || REDIRECT_URI,
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