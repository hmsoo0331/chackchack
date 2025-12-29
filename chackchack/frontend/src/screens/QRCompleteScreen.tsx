import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useStore } from '../store/useStore';
import { qrcodesAPI } from '../api/qrcodes';
import { accountsAPI } from '../api/accounts';
import { colors, typography, spacing, borderRadius } from '../theme';
import PrintableQRTemplate from '../components/PrintableQRTemplate';

// 예금주 이름 마스킹 함수
function maskAccountHolderName(name: string | undefined | null): string {
  // null, undefined, 빈 문자열 처리
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return '';
  }

  // 공백 제거
  const trimmedName = name.trim();
  const length = trimmedName.length;
  
  // 1글자 처리
  if (length === 1) {
    return trimmedName;
  }
  
  if (length === 2) {
    // 2글자: 한수 → 한*
    return trimmedName[0] + '*';
  } else if (length === 3) {
    // 3글자: 한명수 → 한*수
    return trimmedName[0] + '*' + trimmedName[2];
  } else {
    // 4글자 이상: 남궁명수 → 남**수, 홍길동김 → 홍**김
    const firstChar = trimmedName[0];
    const lastChar = trimmedName[length - 1];
    const middleLength = length - 2;
    const maskedMiddle = '*'.repeat(middleLength);
    
    return firstChar + maskedMiddle + lastChar;
  }
}

export default function QRCompleteScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { qrCode, isNewlyCreated = false } = route.params; // 새로 생성된 것인지 구분
  const { isAuthenticated, owner, setQrCodes, addLocalQrCode, loadLocalQrCodes, removeLocalQrCode } = useStore();
  const printableViewShotRef = useRef<ViewShot>(null); // 인쇄용 템플릿을 위한 ref

  // 디버깅을 위한 로그

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

  const handleSaveToDevice = async () => {
    try {

      // 로컬 스토리지에 QR코드 저장
      await addLocalQrCode(qrCode);

      // 로컬 QR 목록 새로고침
      await loadLocalQrCodes();

      Alert.alert('저장 완룼', 'QR코드가 기기에 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MyQRList' }],
            });
          }
        }
      ]);
    } catch (error) {

      Alert.alert('오류', 'QR코드 저장에 실패했습니다.');
    }
  };

  const handleLoginAndSave = async () => {

    // 게스트가 아닌 실제 로그인 사용자인지 확인
    const isRealUser = isAuthenticated && owner && owner.authProvider !== 'guest';

    if (!isRealUser) {

      navigation.navigate('Login', { qrCodeToSave: qrCode });
    } else {
      try {

        // 1. 먼저 계좌 정보를 서버에 저장
        const savedAccount = await accountsAPI.create({
          bankName: qrCode.bankAccount.bankName,
          accountNumber: qrCode.bankAccount.accountNumber,
          accountHolder: qrCode.bankAccount.accountHolder,
          isDefault: false,
        });

        // 2. 계좌 정보가 저장된 후 QR 코드 저장
        const savedQR = await qrcodesAPI.create({
          accountId: savedAccount.accountId,
          qrName: qrCode.qrName,
          baseAmount: qrCode.baseAmount,
          discountType: qrCode.discountType,
          discountValue: qrCode.discountValue,
        });

        // 저장된 QR 목록을 다시 불러오기
        const allQRCodes = await qrcodesAPI.getAll();
        setQrCodes(allQRCodes);

        Alert.alert('저장 완료', 'QR코드가 서버에 저장되었습니다.');
        navigation.navigate('MyQRList');
      } catch (error) {

        Alert.alert('오류', `QR코드 저장에 실패했습니다.\\n${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleShare = async () => {
    try {
      // 1. 공유 기능이 지원되는지 확인
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('오류', '이 기기에서는 공유 기능을 사용할 수 없습니다.');
        return;
      }

      // 2. ViewShot으로 QR 이미지 캡처
      if (!printableViewShotRef.current) {
        Alert.alert('오류', '이미지 캡처에 실패했습니다.');
        return;
      }

      const uri = await printableViewShotRef.current.capture();

      // 3. expo-sharing으로 이미지 파일 공유
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `${qrCode.qrName} QR코드 공유`,
      });

    } catch (error) {
      Alert.alert('오류', '공유에 실패했습니다.');
    }
  };

  const handleEdit = () => {

    navigation.navigate('CreateQR', { editingQrCode: qrCode });
  };

  const handleDelete = async () => {
    Alert.alert(
      'QR코드 삭제',
      '정말로 이 QR코드를 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // 서버에서 QR 삭제
              if (qrCode.qrId) {
                await qrcodesAPI.delete(qrCode.qrId);

                // 서버에서 최신 QR 목록 가져오기
                const updatedQRCodes = await qrcodesAPI.getAll();
                setQrCodes(updatedQRCodes);
              } else {
                // 로컬 QR인 경우
                await removeLocalQrCode(qrCode.qrId);
              }

              // 먼저 화면 이동
              navigation.reset({
                index: 0,
                routes: [{ name: 'MyQRList' }],
              });

              // 이동 후 성공 메시지 (짧은 지연 후)
              setTimeout(() => {
                Alert.alert('삭제 완료', 'QR코드가 삭제되었습니다.');
              }, 100);

            } catch (error) {

              // 404 에러는 이미 삭제된 것으로 처리
              if (error.response?.status === 404) {
                // 이미 삭제되었으므로 목록 화면으로 이동
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MyQRList' }],
                });
                setTimeout(() => {
                  Alert.alert('삭제 완료', 'QR코드가 삭제되었습니다.');
                }, 100);
              } else {
                Alert.alert('오류', `QR코드 삭제에 실패했습니다.\n${error.response?.data?.message || error.message}`);
              }
            }
          },
        },
      ]
    );
  };

  const handleSaveImage = async () => {
    try {
      // 1. 미디어 라이브러리 권한 확인 및 요청
      let permissionResult = await MediaLibrary.getPermissionsAsync();
      
      if (!permissionResult.granted) {
        // 권한이 없으면 요청 (writeOnly 옵션으로 부분 권한도 허용)
        permissionResult = await MediaLibrary.requestPermissionsAsync(true);
        
        if (!permissionResult.granted) {
          Alert.alert(
            '권한 필요', 
            '갤러리에 이미지를 저장하려면 사진첩 접근 권한이 필요합니다.',
            [
              { text: '취소', style: 'cancel' },
              { 
                text: '허용하기',
                onPress: async () => {
                  // 한 번 더 시도
                  const retryResult = await MediaLibrary.requestPermissionsAsync(true);
                  if (retryResult.granted) {
                    handleSaveImage(); // 재귀 호출로 저장 시도
                  }
                }
              }
            ]
          );
          return;
        }
      }

      // 2. 인쇄용 템플릿 캡처 (기존 기능을 인쇄용으로 완전 대체)
      if (!printableViewShotRef.current) {
        Alert.alert('오류', '이미지 캡처에 실패했습니다.');
        return;
      }

      const uri = await printableViewShotRef.current.capture();

      // 3. 갤러리에 저장
      const asset = await MediaLibrary.createAssetAsync(uri);

      // 4. 성공 피드백
      Alert.alert(
        '저장 완료',
        '인쇄용 QR코드 이미지가 갤러리에 저장되었습니다.\n현장에서 바로 인쇄하여 사용하세요!',
        [{ text: '확인' }]
      );

    } catch (error) {

      Alert.alert(
        '저장 실패', 
        '이미지 저장 중 오류가 발생했습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
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
        <Text style={styles.headerTitle}>
          {isNewlyCreated ? 'QR 생성 완료' : 'QR코드 정보'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.content}>
        {/* 기존 화면 표시용 UI (캡처하지 않음) */}
        <View style={styles.captureArea}>
          <Text style={styles.qrNameTitle}>{qrCode.qrName}</Text>

          <View style={styles.qrContainer}>
            {qrCode.qrCodeImage ? (
              // base64 이미지인 경우 Image 컴포넌트 사용, URL인 경우 QRCode 컴포넌트 사용
              qrCode.qrCodeImage.startsWith('data:image') ? (
                <Image
                  source={{ uri: qrCode.qrCodeImage }}
                  style={{ width: 250, height: 250 }}
                  resizeMode="contain"
                />
              ) : (
                <QRCode
                  value={qrCode.qrCodeImage}
                  size={250}
                  backgroundColor="white"
                  color="black"
                />
              )
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: '#666' }}>QR 코드를 생성 중입니다...</Text>
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.bankInfo}>
              {qrCode.bankAccount?.bankName} | {qrCode.bankAccount?.accountNumber}
            </Text>
            <Text style={styles.holderInfo}>{maskAccountHolderName(qrCode.bankAccount?.accountHolder)}</Text>

            {/* 지정 금액 표시 */}
            {qrCode.baseAmount > 0 && (
              <Text style={styles.amountInfo}>
                지정 금액: {Math.floor(qrCode.baseAmount).toLocaleString()}원
              </Text>
            )}

            {/* 할인 정보 표시 */}
            {qrCode.discountType && qrCode.discountValue > 0 && (
              <Text style={styles.discountInfo}>
                할인: {qrCode.discountType === 'percentage' 
                  ? `${qrCode.discountValue}% 할인` 
                  : `${Math.floor(qrCode.discountValue).toLocaleString()}원 할인`}
              </Text>
            )}

            {/* 최종 금액 계산 및 표시 (지정 금액과 할인이 모두 있을 때만) */}
            {qrCode.baseAmount > 0 && qrCode.discountType && qrCode.discountValue > 0 && (
              <Text style={styles.finalAmountInfo}>
                최종 금액: {(() => {
                  const baseAmount = qrCode.baseAmount;
                  const discountValue = qrCode.discountValue;
                  let finalAmount = baseAmount;

                  if (qrCode.discountType === 'percentage') {
                    finalAmount = baseAmount * (1 - discountValue / 100);
                  } else {
                    finalAmount = baseAmount - discountValue;
                  }

                  return Math.floor(Math.max(0, finalAmount)).toLocaleString();
                })()}원
              </Text>
            )}
          </View>
        </View>

        {/* 화면에는 보이지 않지만 캡처용 인쇄 템플릿 */}
        <View style={styles.hiddenContainer}>
          <ViewShot 
            ref={printableViewShotRef} 
            options={{ format: "png", quality: 1.0 }}
            style={styles.printableContainer}
          >
            <PrintableQRTemplate qrCode={qrCode} />
          </ViewShot>
        </View>

        <View style={styles.buttonContainer}>
          {isNewlyCreated ? (
            // A. 신규 생성 직후
            (() => {
              const isRealUser = isAuthenticated && owner && owner.authProvider !== 'guest';

              if (isRealUser) {
                // 로그인 사용자는 이미 서버에 저장됨
                return (
                  <>
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
                      <Text style={styles.secondaryButtonText}>공유하기</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('MyQRList')}>
                      <Text style={styles.primaryButtonText}>내 QR코드 보기</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.accentButton} onPress={() => navigation.navigate('CreateQR')}>
                      <Text style={styles.accentButtonText}>새 QR 만들기</Text>
                    </TouchableOpacity>
                  </>
                );
              } else {
                // 게스트 사용자
                return (
                  <>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleSaveImage}>
                      <Text style={styles.primaryButtonText}>이미지 저장</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
                      <Text style={styles.secondaryButtonText}>공유하기</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.accentButton} onPress={handleLoginAndSave}>
                      <Text style={styles.accentButtonText}>로그인하고 영구 보관</Text>
                    </TouchableOpacity>
                  </>
                );
              }
            })()
          ) : (
            // B. 목록에서 기존 QR 조회 시
            <>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
                <Text style={styles.secondaryButtonText}>공유하기</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveImage}>
                <Text style={styles.secondaryButtonText}>이미지 저장</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={handleEdit}>
                <Text style={styles.primaryButtonText}>편집하기</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>삭제하기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.gray100,
  },
  captureArea: {
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingVertical: spacing.lg,
  },
  qrNameTitle: {
    ...typography.styles.heading2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  qrContainer: {
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    shadowColor: colors.gray800,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: spacing['3xl'],
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  bankInfo: {
    ...typography.styles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  holderInfo: {
    ...typography.styles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  amountInfo: {
    ...typography.styles.listItem,
    color: colors.primary,
    marginTop: spacing.md,
  },
  discountInfo: {
    ...typography.styles.listItem,
    color: colors.accent,
    marginTop: spacing.sm,
  },
  finalAmountInfo: {
    ...typography.styles.listItem,
    color: colors.primary,
    fontWeight: typography.weights.bold,
    marginTop: spacing.sm,
    fontSize: typography.sizes.large,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  // Primary Button (메인 액션)
  primaryButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    ...typography.styles.buttonPrimary,
    color: colors.white,
  },
  // Secondary Button (보조 액션)
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.lg + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...typography.styles.buttonPrimary,
    color: colors.primary,
  },
  // Accent Button (특별한 액션)
  accentButton: {
    backgroundColor: colors.accent,
    padding: spacing.lg + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  accentButtonText: {
    ...typography.styles.buttonPrimary,
    color: colors.white,
  },
  // Delete Button (위험한 액션)
  deleteButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.error,
    padding: spacing.lg + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  deleteButtonText: {
    ...typography.styles.buttonPrimary,
    color: colors.error,
  },
  // 화면에 보이지 않는 인쇄용 템플릿 컨테이너
  hiddenContainer: {
    position: 'absolute',
    left: -9999, // 화면 밖으로 숨기기
    top: -9999,
  },
  printableContainer: {
    backgroundColor: 'white',
  },
});