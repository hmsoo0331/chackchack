import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Rect, Path } from 'react-native-svg';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import KakaoLogins from '@react-native-seoul/kakao-login';
import { useStore } from '../store/useStore';
import { authAPI } from '../api/auth';
import { qrcodesAPI } from '../api/qrcodes';
import { accountsAPI } from '../api/accounts';
import { colors, typography, spacing, borderRadius } from '../theme';

const ChakchakLogo = ({ size = 60 }) => (
  <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
    {/* 좌상단 */}
    <Rect x="24" y="24" width="92" height="92" rx="16" fill="none" stroke="#94A3B8" strokeWidth="10"/>
    <Rect x="44" y="44" width="52" height="52" rx="12" fill="#94A3B8"/>
    
    {/* 우상단 */}
    <Rect x="140" y="24" width="92" height="92" rx="16" fill="none" stroke="#94A3B8" strokeWidth="10"/>
    <Rect x="160" y="44" width="52" height="52" rx="12" fill="#94A3B8"/>

    {/* 좌하단 */}
    <Rect x="24" y="140" width="92" height="92" rx="16" fill="none" stroke="#94A3B8" strokeWidth="10"/>
    <Rect x="44" y="160" width="52" height="52" rx="12" fill="#94A3B8"/>

    {/* 우하단: 포인트 컬러 채움 + 체크 */}
    <Rect x="140" y="140" width="92" height="92" rx="16" fill="#006D77"/>
    <Path d="M156 186 l18 18 34-38" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { setAuth, setQrCodes, syncLocalQrCodesToServer } = useStore();
  const qrCodeToSave = route.params?.qrCodeToSave;

  const saveQRToServer = async (qrCode: any) => {
    try {
      console.log('로그인 후 QR 서버 저장 시작...', qrCode);
      
      // 1. 먼저 계좌 정보를 서버에 저장
      const savedAccount = await accountsAPI.create({
        bankName: qrCode.bankAccount.bankName,
        accountNumber: qrCode.bankAccount.accountNumber,
        accountHolder: qrCode.bankAccount.accountHolder,
        isDefault: false,
      });
      console.log('계좌 정보 저장 완료:', savedAccount);
      
      // 2. 계좌 정보가 저장된 후 QR 코드 저장
      const savedQR = await qrcodesAPI.create({
        accountId: savedAccount.accountId,
        qrName: qrCode.qrName,
        baseAmount: qrCode.baseAmount,
        discountType: qrCode.discountType,
        discountValue: qrCode.discountValue,
      });
      console.log('QR 코드 저장 완료:', savedQR);
      
      // 3. 저장된 QR 목록을 다시 불러오기
      const allQRCodes = await qrcodesAPI.getAll();
      setQrCodes(allQRCodes);
      
      Alert.alert('성공', 'QR코드가 서버에 저장되었습니다.');
    } catch (error) {
      console.error('QR코드 서버 저장 실패:', error);
      console.error('에러 상세:', error.response?.data);
      Alert.alert('오류', `QR코드 저장에 실패했습니다.\n${error.response?.data?.message || error.message}`);
    }
  };

  const handleLoginSuccess = async () => {
    // 로컬 QR 코드 동기화
    try {
      const syncResult = await syncLocalQrCodesToServer();
      if (syncResult.syncedCount > 0) {
        Alert.alert(
          '동기화 완료', 
          `로컬에 저장된 ${syncResult.syncedCount}개의 QR코드가 계정에 추가되었습니다.`,
          [{ text: '확인', onPress: () => navigation.navigate('MyQRList') }]
        );
        return;
      }
    } catch (error) {
      console.error('QR 동기화 실패:', error);
      // 동기화 실패해도 로그인은 계속 진행
    }

    if (qrCodeToSave) {
      await saveQRToServer(qrCodeToSave);
    }

    navigation.navigate('MyQRList');
  };

  // 소셜 로그인 초기화 (현재는 mock 버전)
  // React.useEffect(() => {
  //   GoogleSignin.configure({
  //     webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID',
  //   });
  // }, []);

  const handleKakaoLogin = async () => {
    try {
      // 현재는 Expo 환경에서 mock 버전으로 수행
      // 실제 배포 시에는 Expo dev build 또는 bare workflow로 변경 필요
      const userInfo = {
        email: 'kakao_user@kakao.com',
        nickname: '카카오 사용자',
        authProvider: 'kakao',
      };

      const authResult = await authAPI.socialLogin(
        userInfo.email,
        userInfo.nickname,
        userInfo.authProvider
      );

      await setAuth(authResult.accessToken, authResult.owner);
      await handleLoginSuccess();
    } catch (error) {
      console.error('카카오 로그인 에러:', error);
      Alert.alert('오류', '카카오 로그인에 실패했습니다.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // 현재는 Expo 환경에서 mock 버전으로 수행
      const userInfo = {
        email: 'google_user@gmail.com',
        nickname: '구글 사용자',
        authProvider: 'google',
      };
      
      const authResult = await authAPI.socialLogin(
        userInfo.email,
        userInfo.nickname,
        userInfo.authProvider
      );

      await setAuth(authResult.accessToken, authResult.owner);
      await handleLoginSuccess();
    } catch (error) {
      console.error('구글 로그인 에러:', error);
      Alert.alert('오류', '구글 로그인에 실패했습니다.');
    }
  };

  const handleNaverLogin = async () => {
    try {
      // 네이버 로그인은 모크 버전으로 구현
      const mockUserData = {
        email: 'user@naver.com',
        nickname: '네이버 사용자',
        authProvider: 'naver',
      };

      const result = await authAPI.socialLogin(
        mockUserData.email,
        mockUserData.nickname,
        mockUserData.authProvider
      );

      await setAuth(result.accessToken, result.owner);

      if (qrCodeToSave) {
        await saveQRToServer(qrCodeToSave);
      }

      navigation.navigate('MyQRList');
    } catch (error) {
      Alert.alert('오류', '네이버 로그인에 실패했습니다.');
    }
  };

  const handleGuestContinue = async () => {
    try {
      console.log('게스트 등록 시작...');
      const result = await authAPI.createGuest();
      console.log('게스트 등록 성공:', result);
      await setAuth(result.accessToken, result.owner);
      navigation.navigate('MyQRList');
    } catch (error) {
      console.error('게스트 등록 실패:', error);
      console.error('에러 세부정보:', error.response?.data);
      Alert.alert('오류', `게스트 등록에 실패했습니다.\n${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>로그인</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <ChakchakLogo size={80} />
        </View>
        <Text style={styles.title}>로그인</Text>
        <Text style={styles.subtitle}>
          로그인하면 QR코드를 안전하게 보관하고{'\n'}
          다른 기기에서도 사용할 수 있습니다.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.socialButton, styles.kakaoButton]}
            onPress={handleKakaoLogin}
          >
            <Text style={styles.socialButtonText}>카카오로 시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.naverButton]}
            onPress={handleNaverLogin}
          >
            <Text style={styles.socialButtonText}>네이버로 시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={handleGoogleLogin}
          >
            <Text style={styles.socialButtonText}>구글로 시작하기</Text>
          </TouchableOpacity>

        </View>

        <TouchableOpacity style={styles.guestButton} onPress={handleGuestContinue}>
          <Text style={styles.guestButtonText}>🚀 로그인 없이 바로 시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xl * 2,
    backgroundColor: colors.white,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.textPrimary,
    lineHeight: 32,
  },
  headerTitle: {
    ...typography.styles.heading2,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40, // backButton과 같은 크기로 중앙 정렬
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.styles.heading1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.styles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['4xl'],
    lineHeight: 24,
  },
  buttonContainer: {
    gap: spacing.lg,
    marginBottom: spacing['3xl'],
  },
  socialButton: {
    padding: spacing.lg - 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minHeight: 48,
  },
  kakaoButton: {
    backgroundColor: '#1DB5A6',
  },
  naverButton: {
    backgroundColor: '#0D9488',
  },
  googleButton: {
    backgroundColor: '#0F766E',
  },
  socialButtonText: {
    ...typography.styles.buttonPrimary,
    color: colors.white,
    fontWeight: '500',
  },
  guestButton: {
    padding: spacing.lg + 2,
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  guestButtonText: {
    ...typography.styles.buttonPrimary,
    color: colors.textSecondary,
  },
});