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

import { useStore } from '../store/useStore';
import { authAPI } from '../api/auth';
import { qrcodesAPI } from '../api/qrcodes';
import { accountsAPI } from '../api/accounts';
import { colors, typography, spacing, borderRadius } from '../theme';
import kakaoAuth from '../services/kakaoAuth';

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


  /**
   * QR 코드를 서버에 저장하는 함수
   */
  const saveQRToServer = async (qrCode: any) => {
    try {
      console.log('💾 Saving QR code to server...');

      // 1. 계좌 정보를 서버에 저장
      const savedAccount = await accountsAPI.create({
        bankName: qrCode.bankAccount.bankName,
        accountNumber: qrCode.bankAccount.accountNumber,
        accountHolder: qrCode.bankAccount.accountHolder,
        isDefault: false,
      });

      // 2. QR 코드 저장
      const savedQR = await qrcodesAPI.create({
        accountId: savedAccount.accountId,
        qrName: qrCode.qrName,
        baseAmount: qrCode.baseAmount,
        discountType: qrCode.discountType,
        discountValue: qrCode.discountValue,
      });

      // 3. QR 목록 새로고침
      const allQRCodes = await qrcodesAPI.getAll();
      setQrCodes(allQRCodes);

      Alert.alert('성공', 'QR코드가 서버에 저장되었습니다.');
    } catch (error) {
      console.error('❌ QR save error:', error);
      Alert.alert(
        '오류', 
        `QR코드 저장에 실패했습니다.\n${error.response?.data?.message || error.message}`
      );
    }
  };

  /**
   * 로그인 성공 후 처리
   */
  const handleLoginSuccess = async () => {
    try {
      console.log('🎯 Processing login success...');
      
      // 로컬 QR 코드 동기화
      const syncResult = await syncLocalQrCodesToServer();
      if (syncResult.syncedCount > 0) {
        console.log(`📋 Synced ${syncResult.syncedCount} QR codes to server`);
        Alert.alert(
          '동기화 완료', 
          `로컬에 저장된 ${syncResult.syncedCount}개의 QR코드가 계정에 추가되었습니다.`,
          [{ text: '확인', onPress: () => navigateToMain() }]
        );
        return;
      }

      // QR 코드 저장이 있는 경우
      if (qrCodeToSave) {
        await saveQRToServer(qrCodeToSave);
      }

      navigateToMain();
      
    } catch (error) {
      console.error('❌ Login success handler error:', error);
      // 에러가 있어도 메인 화면으로 이동
      navigateToMain();
    }
  };

  /**
   * 메인 화면으로 이동
   */
  const navigateToMain = () => {
    console.log('🚀 Navigating to MyQRList');
    navigation.reset({
      index: 0,
      routes: [{ name: 'MyQRList' }],
    });
  };

  /**
   * 하드웨어 뒤로가기 버튼 제어
   */
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigateToMain();
        return true; // 기본 뒤로가기 동작 방지
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [])
  );

  /**
   * 카카오 로그인 처리
   */
  const handleKakaoLogin = async () => {
    try {
      console.log('🚀 [LoginScreen] 카카오 로그인 시작');

      // 카카오 로그인 실행
      const result = await kakaoAuth.signInWithKakao();

      if (result.success && result.token && result.user) {
        console.log('✅ [LoginScreen] 카카오 로그인 성공');

        // 앱 상태 업데이트
        await setAuth(result.token, result.user);

        // 로그인 후 처리
        await handleLoginSuccess();
      } else {
        console.log('❌ [LoginScreen] 카카오 로그인 실패:', result.error);

        // 사용자에게 에러 안내
        if (result.error && result.error !== '로그인을 취소했습니다.') {
          Alert.alert(
            '카카오 로그인 실패',
            result.error + '\n\n다시 시도하거나 "게스트로 계속하기"를 이용해주세요.',
            [{ text: '확인' }]
          );
        }
      }
    } catch (error) {
      console.error('❌ [LoginScreen] 카카오 로그인 오류:', error);
      Alert.alert(
        '로그인 오류',
        '카카오 로그인 중 예상치 못한 오류가 발생했습니다.\n다시 시도해주세요.',
        [{ text: '확인' }]
      );
    }
  };

  /**
   * 게스트로 계속하기
   */
  const handleGuestContinue = async () => {
    try {
      console.log('👤 Creating guest account...');
      
      const result = await authAPI.createGuest();
      await setAuth(result.accessToken, result.owner);
      
      console.log('✅ Guest account created successfully');
      navigateToMain();
      
    } catch (error) {
      console.error('❌ Guest registration error:', error);
      Alert.alert(
        '오류', 
        `게스트 등록에 실패했습니다.\n${error.response?.data?.message || error.message}`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={navigateToMain}
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
              <Text style={[styles.socialButtonText, styles.kakaoButtonText]}>
                카카오로 시작하기
              </Text>
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
    width: 40,
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
    backgroundColor: '#F7E600',
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
    color: '#3C1E1E',
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