import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Svg, { Rect, Path } from 'react-native-svg';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import KakaoLogins from '@react-native-seoul/kakao-login';
import { useStore } from '../store/useStore';
import { authAPI } from '../api/auth';
import { qrcodesAPI } from '../api/qrcodes';
import { accountsAPI } from '../api/accounts';
import { colors, typography, spacing, borderRadius } from '../theme';
import { signInWithKakao } from '../services/kakaoAuth';
import { features } from '../config/environment';
// Mock 로그인은 개발 환경에서만 import
const signInWithKakaoCustom = features.enableMockLogin 
  ? require('../services/kakaoAuthCustom').signInWithKakaoCustom 
  : null;

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

  // 하드웨어 뒤로가기 버튼 제어
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MyQRList' }],
        });
        return true; // 기본 뒤로가기 동작 방지
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      
      return () => backHandler.remove();
    }, [navigation])
  );

  // 소셜 로그인 초기화 (현재는 mock 버전)
  // React.useEffect(() => {
  //   GoogleSignin.configure({
  //     webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID',
  //   });
  // }, []);

  const handleKakaoLogin = async () => {
    try {
      console.log('카카오 로그인 시작...');
      
      // 실제 카카오 OAuth 로그인 시도
      let kakaoResult = await signInWithKakao();
      
      // 로그인 실패 처리
      if (!kakaoResult.success) {
        console.error('카카오 로그인 실패:', kakaoResult.error);
        
        // 개발 환경에서만 Mock 로그인 폴백 제공
        if (features.enableMockLogin && signInWithKakaoCustom) {
          console.log('개발 환경: Mock 로그인으로 폴백 시도');
          
          const mockChoice = await new Promise((resolve) => {
            Alert.alert(
              '개발 모드',
              'Expo Go 환경에서는 실제 카카오 로그인이 제한됩니다.\nMock 로그인을 사용하시겠습니까?',
              [
                { text: '취소', onPress: () => resolve(false), style: 'cancel' },
                { text: 'Mock 로그인 사용', onPress: () => resolve(true) }
              ]
            );
          });
          
          if (mockChoice) {
            kakaoResult = await signInWithKakaoCustom();
            if (!kakaoResult.success) {
              throw new Error('Mock 로그인도 실패했습니다.');
            }
          } else {
            return; // 사용자가 취소
          }
        } else {
          // 프로덕션 환경: 사용자 친화적 에러 메시지
          let errorMessage = '카카오 로그인에 실패했습니다.';
          
          if (kakaoResult.error?.includes('KOE')) {
            if (kakaoResult.error.includes('KOE006')) {
              errorMessage = '앱 설정 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.';
            } else if (kakaoResult.error.includes('KOE101')) {
              errorMessage = '앱 인증 정보가 올바르지 않습니다.';
            }
          } else if (kakaoResult.error === 'USER_CANCELLED') {
            console.log('사용자가 로그인을 취소했습니다.');
            return;
          }
          
          Alert.alert(
            '로그인 실패',
            errorMessage,
            [{ text: '확인', style: 'default' }]
          );
          return;
        }
      }

      // 카카오 로그인 성공
      console.log('카카오 로그인 성공! 🎉');

      // 카카오 사용자 정보 추출
      const { userInfo, accessToken: kakaoAccessToken } = kakaoResult;
      const email = userInfo?.kakao_account?.email || `kakao_${userInfo?.id}@kakao.com`;
      const nickname = userInfo?.properties?.nickname || 
                       userInfo?.kakao_account?.profile?.nickname || 
                       '카카오 사용자';

      console.log('카카오 로그인 성공:', { 
        email, 
        nickname, 
        isReal: !kakaoResult.isMock,
        userId: userInfo?.id 
      });

      // 백엔드로 소셜 로그인 정보 전송
      const authResult = await authAPI.socialLogin(
        email,
        nickname,
        'kakao',
        kakaoAccessToken // 카카오 액세스 토큰도 함께 전송
      );

      // 앱 상태 업데이트
      await setAuth(authResult.accessToken, authResult.owner);
      
      // 카카오 액세스 토큰 저장 (로그아웃 시 필요)
      await AsyncStorage.setItem('kakaoAccessToken', kakaoAccessToken);
      
      await handleLoginSuccess();
    } catch (error) {
      console.error('카카오 로그인 에러:', error);
      
      // 상세한 에러 메시지 표시
      const errorMessage = error.message?.includes('Network Error') 
        ? '네트워크 연결을 확인해주세요.' 
        : '카카오 로그인에 실패했습니다.';
        
      Alert.alert('오류', errorMessage);
    }
  };

  // 네이버, 구글 로그인은 추후 구현 예정

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
          onPress={() => navigation.reset({
            index: 0,
            routes: [{ name: 'MyQRList' }],
          })}
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
            <View style={styles.kakaoButtonContent}>
              <View style={styles.kakaoIcon}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path 
                    d="M12 3C16.97 3 21 6.155 21 10c0 2.41-1.553 4.546-3.94 5.83l-.64 2.87c-.062.28-.36.41-.61.27l-3.657-2.06c-.384.032-.775.05-1.153.05-4.97 0-9-3.155-9-7S7.03 3 12 3z"
                    fill="#3C1E1E"
                  />
                </Svg>
              </View>
              <Text style={[styles.socialButtonText, styles.kakaoButtonText]}>카카오톡으로 시작하기</Text>
            </View>
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
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kakaoButton: {
    backgroundColor: '#F7E600', // 채도가 낮은 카카오 노란색
    borderWidth: 1,
    borderColor: '#E6D200',
  },
  kakaoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  kakaoIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(60, 30, 30, 0.1)',
    borderRadius: 12,
  },
  socialButtonText: {
    ...typography.styles.buttonPrimary,
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  kakaoButtonText: {
    color: '#3C1E1E', // 갈색 텍스트
    fontWeight: '700',
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