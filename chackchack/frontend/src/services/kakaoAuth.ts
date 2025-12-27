/**
 * 카카오 로그인 서비스
 * @react-native-seoul/kakao-login 라이브러리 사용
 *
 * 공식 문서: https://github.com/react-native-seoul/react-native-kakao-login
 */

import { login, logout, getProfile, unlink } from '@react-native-seoul/kakao-login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

export interface KakaoLoginResult {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}

/**
 * 카카오 로그인 서비스 클래스
 */
class KakaoAuthService {

  /**
   * 카카오 로그인 실행
   * 카카오톡 앱이 설치되어 있으면 카카오톡으로, 없으면 카카오계정으로 로그인
   */
  async signInWithKakao(): Promise<KakaoLoginResult> {
    try {
      console.log('🚀 [KakaoAuth] 카카오 로그인 시작');

      // 1. 카카오 SDK로 로그인 (카카오톡 or 카카오계정)
      const kakaoToken = await login();
      console.log('✅ [KakaoAuth] 카카오 로그인 성공');
      console.log('🔑 [KakaoAuth] Access Token:', kakaoToken.accessToken.substring(0, 20) + '...');

      // 2. 카카오 사용자 프로필 정보 가져오기
      const profile = await getProfile();
      console.log('👤 [KakaoAuth] 사용자 프로필:', {
        id: profile.id,
        nickname: profile.nickname,
        email: profile.email,
      });

      // 3. 백엔드로 로그인 정보 전송하여 자체 JWT 토큰 받기
      const email = profile.email || `kakao_${profile.id}@chackchack.com`;
      const nickname = profile.nickname || '카카오 사용자';

      console.log('🌐 [KakaoAuth] 백엔드 로그인 요청:', {
        authProvider: 'kakao',
        email,
        nickname,
      });

      const response = await apiClient.post('/auth/login', {
        authProvider: 'kakao',
        email: email,
        nickname: nickname,
      });

      const { accessToken, owner } = response.data;
      console.log('✅ [KakaoAuth] 백엔드 로그인 성공');

      // 4. 토큰 및 사용자 정보 저장
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(owner));

      // 5. API 클라이언트에 토큰 설정
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      console.log('🎉 [KakaoAuth] 로그인 프로세스 완료');

      return {
        success: true,
        token: accessToken,
        user: owner,
      };

    } catch (error: any) {
      console.error('❌ [KakaoAuth] 카카오 로그인 실패:', error);

      // 에러 메시지 처리
      let errorMessage = '카카오 로그인에 실패했습니다.';

      if (error.code === 'E_CANCELLED_OPERATION') {
        errorMessage = '로그인을 취소했습니다.';
      } else if (error.code === 'E_KAKAO_LOGIN_FAILED') {
        errorMessage = '카카오 로그인에 실패했습니다. 다시 시도해주세요.';
      } else if (error.message?.toLowerCase().includes('network')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      } else if (error.response?.status) {
        errorMessage = `서버 연결 실패: ${error.response.status}`;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 카카오 로그아웃
   */
  async signOut(): Promise<void> {
    try {
      console.log('🔓 [KakaoAuth] 로그아웃 시작');

      // 1. 카카오 SDK 로그아웃
      await logout();
      console.log('✅ [KakaoAuth] 카카오 SDK 로그아웃 완료');

      // 2. 로컬 스토리지 정리
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');

      // 3. API 클라이언트 헤더 제거
      delete apiClient.defaults.headers.common['Authorization'];

      console.log('✅ [KakaoAuth] 로그아웃 완료');

    } catch (error) {
      console.error('❌ [KakaoAuth] 로그아웃 오류:', error);

      // 에러가 있어도 로컬 데이터는 반드시 삭제
      try {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('user');
        delete apiClient.defaults.headers.common['Authorization'];
      } catch (cleanupError) {
        console.error('❌ [KakaoAuth] 로컬 데이터 정리 실패:', cleanupError);
      }

      throw error;
    }
  }

  /**
   * 카카오 연결 해제 (회원 탈퇴)
   * 주의: 로컬 데이터는 삭제하지 않습니다.
   * 계정 탈퇴 시에는 clearAllData()에서 처리합니다.
   */
  async unlinkKakao(): Promise<void> {
    try {
      console.log('🔗 [KakaoAuth] 카카오 연결 해제 시작');

      // 카카오 SDK 연결 해제만 수행
      // 로컬 데이터는 삭제하지 않음 (계정 탈퇴 API 호출 시 토큰 필요)
      await unlink();
      console.log('✅ [KakaoAuth] 카카오 연결 해제 완료');

    } catch (error) {
      console.error('❌ [KakaoAuth] 연결 해제 오류:', error);
      throw error;
    }
  }

  /**
   * 현재 카카오 프로필 정보 가져오기
   */
  async getCurrentProfile() {
    try {
      const profile = await getProfile();
      console.log('👤 [KakaoAuth] 프로필 조회 성공:', profile.nickname);
      return profile;
    } catch (error) {
      console.error('❌ [KakaoAuth] 프로필 조회 실패:', error);
      return null;
    }
  }

  /**
   * 로그인 상태 확인
   */
  async checkLoginStatus(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        return false;
      }

      // API 클라이언트에 토큰 설정
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;

    } catch (error) {
      console.error('❌ [KakaoAuth] 로그인 상태 확인 오류:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export default new KakaoAuthService();
