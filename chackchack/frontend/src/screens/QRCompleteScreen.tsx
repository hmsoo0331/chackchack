import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { useStore } from '../store/useStore';
import { qrcodesAPI } from '../api/qrcodes';
import { accountsAPI } from '../api/accounts';
import { colors, typography, spacing, borderRadius } from '../theme';

export default function QRCompleteScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { qrCode, isNewlyCreated = false } = route.params; // 새로 생성된 것인지 구분
  const { isAuthenticated, owner, setQrCodes, addLocalQrCode, loadLocalQrCodes } = useStore();

  // 디버깅을 위한 로그
  console.log('QRCompleteScreen - qrCode 데이터:', qrCode);
  console.log('QRCompleteScreen - qrCodeImage:', qrCode.qrCodeImage);

  const handleSaveToDevice = async () => {
    try {
      console.log('로컬 저장 시작 - qrCode 데이터:', qrCode);
      
      // 로컬 스토리지에 QR코드 저장
      await addLocalQrCode(qrCode);
      
      // 로컬 QR 목록 새로고침
      await loadLocalQrCodes();
      
      console.log('로컬 저장 완료');
      
      Alert.alert('저장 완룼', 'QR코드가 기기에 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            navigation.navigate('MyQRList');
          }
        }
      ]);
    } catch (error) {
      console.error('로컬 저장 실패:', error);
      Alert.alert('오류', 'QR코드 저장에 실패했습니다.');
    }
  };

  const handleLoginAndSave = async () => {
    console.log('로그인 및 저장 버튼 클릭 - 인증 상태:', { isAuthenticated, owner: owner?.authProvider });
    
    // 게스트가 아닌 실제 로그인 사용자인지 확인
    const isRealUser = isAuthenticated && owner && owner.authProvider !== 'guest';
    
    if (!isRealUser) {
      console.log('로그인 화면으로 이동');
      navigation.navigate('Login', { qrCodeToSave: qrCode });
    } else {
      try {
        console.log('서버에 QR 저장 시작... qrCode 데이터:', qrCode);
        console.log('bankAccount 데이터:', qrCode.bankAccount);
        
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
        
        // 저장된 QR 목록을 다시 불러오기
        const allQRCodes = await qrcodesAPI.getAll();
        setQrCodes(allQRCodes);
        
        Alert.alert('저장 완료', 'QR코드가 서버에 저장되었습니다.');
        navigation.navigate('MyQRList');
      } catch (error) {
        console.error('QR코드 저장 실패:', error);
        console.error('에러 상세:', error.response?.data);
        Alert.alert('오류', `QR코드 저장에 실패했습니다.\\n${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${qrCode.qrName} QR코드\n${qrCode.qrCodeImage}`,
      });
    } catch (error) {
      Alert.alert('오류', '공유에 실패했습니다.');
    }
  };

  const handleEdit = () => {
    console.log('편집하기 버튼 클릭 - QR 데이터:', qrCode);
    navigation.navigate('CreateQR', { editingQrCode: qrCode });
  };

  const handleDelete = () => {
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
          onPress: () => {
            Alert.alert('삭제 완료', 'QR코드가 삭제되었습니다.');
            navigation.goBack();
            // TODO: 실제 삭제 로직 구현
          },
        },
      ]
    );
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
          <Text style={styles.holderInfo}>{qrCode.bankAccount?.accountHolder}</Text>
          
          {/* 지정 금액 표시 */}
          {qrCode.baseAmount && (
            <Text style={styles.amountInfo}>
              지정 금액: {Math.floor(qrCode.baseAmount).toLocaleString()}원
            </Text>
          )}
          
          {/* 할인 정보 표시 */}
          {qrCode.discountType && qrCode.discountValue && (
            <Text style={styles.discountInfo}>
              할인: {qrCode.discountType === 'percentage' 
                ? `${qrCode.discountValue}%` 
                : `${Math.floor(qrCode.discountValue).toLocaleString()}원`}
              {qrCode.discountType === 'percentage' ? ' 할인' : ' 할인'}
            </Text>
          )}
          
          {/* 최종 금액 계산 및 표시 (지정 금액과 할인이 모두 있을 때만) */}
          {qrCode.baseAmount && qrCode.discountType && qrCode.discountValue && (
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
                    <TouchableOpacity style={styles.primaryButton} onPress={handleSaveToDevice}>
                      <Text style={styles.primaryButtonText}>QR 이미지 저장</Text>
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
});