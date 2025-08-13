import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Rect, Path } from 'react-native-svg';
import { colors, typography, spacing } from '../theme';
import { useStore } from '../store/useStore';

const { height: screenHeight } = Dimensions.get('window');

const ChakchakLogo = ({ size = 120 }) => (
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

export default function SplashScreen() {
  const navigation = useNavigation<any>();
  const { loadLocalQrCodes, localQrCodes, qrCodes, isAuthenticated, owner, initializeAuth } = useStore();
  
  // 상태 관리
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [navigationStarted, setNavigationStarted] = useState(false);
  
  // 애니메이션 값들
  const slideUpValue = useRef(new Animated.Value(80)).current; // 로고와 텍스트의 슬라이드 업
  const fadeValue = useRef(new Animated.Value(0)).current; // 로고와 텍스트의 페이드 인/아웃
  const logoScaleValue = useRef(new Animated.Value(0.8)).current; // 로고 스케일 애니메이션
  const mainScreenSlideValue = useRef(new Animated.Value(screenHeight)).current; // 메인 화면 슬라이드 업

  useEffect(() => {
    // 앱 초기화 및 다음 화면 결정
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('앱 초기화 시작');
      
      // 앱 초기화 (데이터 로드)
      await Promise.all([
        initializeAuth(),
        loadLocalQrCodes(),
      ]);
      
      console.log('앱 초기화 완료 - 데이터 로드 완료');
      setIsDataLoaded(true);
    } catch (error) {
      console.error('앱 초기화 실패:', error);
      setIsDataLoaded(true); // 실패해도 진행
    }
  };

  // 데이터 로딩 완료 후 애니메이션 시작
  useEffect(() => {
    if (!isDataLoaded) return;

    console.log('데이터 로딩 완료, 다음 화면:', nextScreen);

    // 다음 화면에 따른 애니메이션 선택
    if (nextScreen === 'MyQRList') {
      console.log('저장된 QR이 있으므로 빠른 전환');
      setTimeout(() => {
        startFastTransition();
      }, 500); // 단축된 시간으로 빠른 전환
    } else {
      console.log('신규 사용자로 풀 애니메이션 진행');
      setTimeout(() => {
        startSplashSequence();
      }, 200);
    }
  }, [isDataLoaded, isAuthenticated, owner, localQrCodes.length, qrCodes.length]);

  const startSplashSequence = () => {
    // 1단계: 스플래시 요소들이 슬라이드 업하며 등장 (부드러운 easing 적용)
    Animated.parallel([
      Animated.timing(slideUpValue, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 700,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(logoScaleValue, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2.5초 대기 후 다음 단계 (로고를 충분히 보여준다)
      setTimeout(() => {
        // 2단계: 스플래시 요소들이 페이드 아웃
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          // 3단계: 메인 화면이 슬라이드 업하며 등장 (부드러운 전환)
          Animated.timing(mainScreenSlideValue, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }).start(() => {
            // 애니메이션 완료 후 QR 코드 여부에 따라 화면 이동
            setTimeout(() => {
              navigateToNextScreen();
            }, 300);
          });
        });
      }, 2500);
    });
  };

  const startFastTransition = () => {
    // 저장된 QR이 있는 경우 빠른 전환 (로고는 확실히 보이도록)
    Animated.parallel([
      Animated.timing(slideUpValue, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(logoScaleValue, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 1초간 로고 표시 후 전환
      setTimeout(() => {
        navigateToNextScreen();
      }, 1000);
    });
  };

  const startFastSplashSequence = () => {
    // 저장된 QR이 있는 경우 빠른 전환
    Animated.parallel([
      Animated.timing(slideUpValue, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(logoScaleValue, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 짧은 대기 후 바로 전환
      setTimeout(() => {
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // 바로 다음 화면으로 이동 (슬라이드 업 없이)
          navigateToNextScreen();
        });
      }, 800);
    });
  };

  const navigateToNextScreen = () => {
    console.log(`스플래시 완료, ${nextScreen} 화면으로 이동`);
    
    navigation.reset({
      index: 0,
      routes: [{ name: nextScreen }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 스플래시 콘텐츠 */}
      <Animated.View
        style={[
          styles.splashContent,
          {
            transform: [
              {
                translateY: slideUpValue,
              },
            ],
            opacity: fadeValue,
          },
        ]}
      >
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScaleValue }],
            },
          ]}
        >
          <ChakchakLogo size={120} />
        </Animated.View>
        
        <View style={styles.textContainer}>
          <Text style={styles.catchphrase}>착착, QR로 쉬워지는 계좌이체</Text>
        </View>
      </Animated.View>

      {/* 메인 화면 프리뷰 (슬라이드 업으로 등장) */}
      <Animated.View
        style={[
          styles.mainScreenPreview,
          {
            transform: [
              {
                translateY: mainScreenSlideValue,
              },
            ],
          },
        ]}
      >
        <View style={styles.mainScreenContent}>
          <Text style={styles.mainScreenTitle}>가장 쉬운{'\n'}계좌이체 QR 만들기</Text>
          <Text style={styles.mainScreenSubtitle}>
            로그인 없이도 바로 시작할 수 있어요
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  splashContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    marginBottom: spacing.xl * 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    // 로고에 미묘한 그림자 효과 추가
    shadowColor: colors.textPrimary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  catchphrase: {
    ...typography.styles.heading2,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.8,
    fontWeight: '600',
    // 텍스트에 미묘한 투명도 적용
    opacity: 0.95,
  },
  mainScreenPreview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  mainScreenContent: {
    alignItems: 'center',
  },
  mainScreenTitle: {
    ...typography.styles.heading1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 48,
    letterSpacing: -1.2,
    fontWeight: '700',
  },
  mainScreenSubtitle: {
    ...typography.styles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 24,
  },
});