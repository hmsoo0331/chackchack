import * as AuthSession from 'expo-auth-session';

/**
 * 현재 환경의 Redirect URI 확인
 * 카카오 개발자센터에 이 URI를 등록해야 함
 */
export const checkRedirectUri = () => {
  // 1. Expo 프록시 사용 (Expo Go 환경)
  const proxyUri = AuthSession.makeRedirectUri({
    useProxy: true,
  });

  // 2. 커스텀 스킴 사용 (독립 앱)
  const customUri = AuthSession.makeRedirectUri({
    scheme: 'chackchack',
    path: 'auth/kakao',
  });

  // 3. 기본 URI
  const defaultUri = AuthSession.makeRedirectUri();

  alert(`카카오 개발자센터에 등록할 URI:\n\n${proxyUri}`);

  return {
    proxyUri,
    customUri,
    defaultUri,
  };
};