import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Rect, Path } from 'react-native-svg';
import { colors, typography, spacing } from '../theme';
import { useStore } from '../store/useStore';


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
  const slideUpValue = useRef(new Animated.Value(80)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const logoScaleValue = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('앱 초기화 시작');
      
      await Promise.all([
        initializeAuth(),
        loadLocalQrCodes(),
      ]);
      
      console.log('앱 초기화 완료 - 데이터 로드 완료');
      setIsDataLoaded(true);
    } catch (error) {
      console.error('앱 초기화 실패:', error);
      setIsDataLoaded(true);
    }
  };

  // 데이터 로딩 완료 후 네비게이션 결정
  useEffect(() => {
    if (!isDataLoaded || navigationStarted) return;

    console.log('데이터 로딩 완료 - MyQRList로 이동');
    console.log('인증 상태:', { isAuthenticated, owner: owner?.authProvider });
    console.log('QR 코드 개수:', { local: localQrCodes.length, server: qrCodes.length });
    
    setNavigationStarted(true);
    
    // v1.2: 항상 MyQRList로 이동 (HomeScreen 건너뛰기)
    console.log('스플래시 애니메이션 후 MyQRList로 이동');
    startLogoAnimation(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MyQRList' }],
      });
    });
  }, [isDataLoaded, navigationStarted, isAuthenticated, owner, localQrCodes.length, qrCodes.length]);

  const startLogoAnimation = (onComplete: () => void) => {
    Animated.parallel([
      Animated.timing(slideUpValue, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(logoScaleValue, {
        toValue: 1,
        duration: 500,
        delay: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(onComplete, 800);
    });
  };


  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.splashContent,
          {
            transform: [{ translateY: slideUpValue }],
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
    opacity: 0.95,
  },
});