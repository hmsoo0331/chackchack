import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  FlatList,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { generateQRData } from '../utils/qrGenerator';
import * as Crypto from 'expo-crypto';
import { colors, typography, spacing, borderRadius } from '../theme';
import { qrcodesAPI } from '../api/qrcodes';
import { accountsAPI } from '../api/accounts';

const BANKS = [
  '국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  '농협은행',
  '카카오뱅크',
  '토스뱅크',
  'IBK기업은행',
  'SC제일은행',
  '대구은행',
];

export default function CreateQRScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { addLocalQrCode, updateLocalQrCode, removeLocalQrCode, loadLocalQrCodes, isAuthenticated, owner, setQrCodes } = useStore();
  
  // 편집 모드 확인
  const editingQrCode = route.params?.editingQrCode;
  const isEditMode = !!editingQrCode;
  
  const [qrName, setQrName] = useState('');
  const [selectedBank, setSelectedBank] = useState('은행 선택');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [enableAmount, setEnableAmount] = useState(false);
  const [amount, setAmount] = useState('');
  const [enableDiscount, setEnableDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  
  // 포커스 상태 관리
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // 편집 모드일 때 기존 데이터로 필드 미리 채우기
  useEffect(() => {
    if (isEditMode && editingQrCode) {
      console.log('편집 모드 - QR 데이터 로드:', editingQrCode);
      setQrName(editingQrCode.qrName || '');
      setSelectedBank(editingQrCode.bankAccount?.bankName || '은행 선택');
      setAccountNumber(editingQrCode.bankAccount?.accountNumber || '');
      setAccountHolder(editingQrCode.bankAccount?.accountHolder || '');
      setEnableAmount(!!editingQrCode.baseAmount);
      setAmount(editingQrCode.baseAmount ? Math.floor(editingQrCode.baseAmount).toString() : '');
      setEnableDiscount(!!editingQrCode.discountType);
      setDiscountType(editingQrCode.discountType || null);
      setDiscountValue(editingQrCode.discountValue ? Math.floor(editingQrCode.discountValue).toString() : '');
    }
  }, [isEditMode, editingQrCode]);

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

  const handleCreateQR = async () => {
    console.log(isEditMode ? 'QR 수정 시작' : 'QR 생성 시작');
    console.log('qrName:', qrName);
    console.log('selectedBank:', selectedBank);
    console.log('accountNumber:', accountNumber);
    console.log('accountHolder:', accountHolder);

    if (!qrName || selectedBank === '은행 선택' || !accountNumber || !accountHolder) {
      console.log('필수 정보 누락');
      Alert.alert('알림', '필수 정보를 모두 입력해주세요.');
      return;
    }

    try {
      console.log(isEditMode ? 'QR 수정 중...' : 'QR 생성 중...');
      
      // 편집 모드가 아닐 때만 새 ID 생성
      const qrId = isEditMode ? editingQrCode.qrId : Crypto.randomUUID();
      
      // 게스트가 아닌 실제 로그인 사용자인지 확인
      const isRealUser = isAuthenticated && owner && owner.authProvider !== 'guest';
      
      if (isEditMode) {
        // 편집 모드 구분: 로컬 QR vs 서버 QR
        const isLocalQR = !isRealUser || !editingQrCode.accountId;
        console.log('편집 모드 - 로컬 QR인지:', isLocalQR);
        
        if (isLocalQR) {
          // 로컬 QR 편집: 기존 로컬 QR 업데이트하고 새로 생성
          console.log('로컬 QR 편집 - 새 QR로 생성');
          
          // 로컬 QR 편집을 위한 데이터 생성
          const bankAccount = {
            accountId: editingQrCode.bankAccount?.accountId || Crypto.randomUUID(),
            bankName: selectedBank,
            accountNumber,
            accountHolder,
            isDefault: false,
          };

          const qrData = generateQRData(
            bankAccount,
            qrId,
            enableAmount ? Number(amount) : null,
            enableDiscount && discountType ? discountType : null,
            enableDiscount && discountValue ? Number(discountValue) : null
          );

          const updatedQrCode = {
            ...editingQrCode,
            qrName,
            baseAmount: enableAmount ? Number(amount) : null,
            discountType: enableDiscount && discountType ? discountType : null,
            discountValue: enableDiscount && discountValue ? Number(discountValue) : null,
            qrCodeImage: qrData,
            bankAccount,
          };
          
          if (isRealUser) {
            // 로그인 사용자: 서버에 저장
            const savedAccount = await accountsAPI.create({
              bankName: selectedBank,
              accountNumber,
              accountHolder,
              isDefault: false,
            });
            
            const savedQR = await qrcodesAPI.create({
              accountId: savedAccount.accountId,
              qrName,
              baseAmount: enableAmount ? Number(amount) : null,
              discountType: enableDiscount && discountType ? discountType : null,
              discountValue: enableDiscount && discountValue ? Number(discountValue) : null,
            });
            
            // 기존 로컬 QR 삭제
            await removeLocalQrCode(editingQrCode.qrId);
            
            // 서버 QR 목록 새로고침
            const allQRCodes = await qrcodesAPI.getAll();
            setQrCodes(allQRCodes);
            
            Alert.alert('수정 완료', 'QR코드가 수정되었습니다.', [
              { text: '확인', onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'MyQRList' }],
              })}
            ]);
          } else {
            // 게스트: 로컬 업데이트
            await updateLocalQrCode(editingQrCode.qrId, updatedQrCode);
            await loadLocalQrCodes();
            
            Alert.alert('수정 완료', 'QR코드가 수정되었습니다.', [
              { text: '확인', onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'MyQRList' }],
              })}
            ]);
          }
        } else {
          // 서버 QR 편집: 기존 로직 유지
          console.log('서버 QR 편집 - 서버에 업데이트');
          
          // 1. 먼저 계좌 정보를 서버에 저장/업데이트
          const savedAccount = await accountsAPI.create({
            bankName: selectedBank,
            accountNumber,
            accountHolder,
            isDefault: false,
          });
          console.log('계좌 정보 서버 저장 완료:', savedAccount);
          
          // 2. QR 코드 업데이트
          const updatedQR = await qrcodesAPI.update(editingQrCode.qrId, {
            accountId: savedAccount.accountId,
            qrName,
            baseAmount: enableAmount ? Number(amount) : null,
            discountType: enableDiscount && discountType ? discountType : null,
            discountValue: enableDiscount && discountValue ? Number(discountValue) : null,
          });
          console.log('QR 코드 서버 업데이트 완료:', updatedQR);
          
          // 3. 저장된 QR 목록을 다시 불러오기
          const allQRCodes = await qrcodesAPI.getAll();
          setQrCodes(allQRCodes);
          
          // 수정 완료 후 QR 목록으로 이동
          Alert.alert('수정 완료', 'QR코드가 수정되었습니다.', [
            { text: '확인', onPress: () => navigation.navigate('MyQRList') }
          ]);
        }
        
      } else {
        // 생성 모드: 새 QR 코드 생성
        const bankAccount = {
          accountId: Crypto.randomUUID(),
          bankName: selectedBank,
          accountNumber,
          accountHolder,
          isDefault: false,
        };

        const qrData = generateQRData(
          bankAccount,
          qrId,
          enableAmount ? Number(amount) : null,
          enableDiscount && discountType ? discountType : null,
          enableDiscount && discountValue ? Number(discountValue) : null
        );

        console.log('QR 데이터 생성 완료:', qrData);

        const newQrCode = {
          qrId,
          qrName,
          accountId: bankAccount.accountId,
          baseAmount: enableAmount ? Number(amount) : null,
          discountType: enableDiscount && discountType ? discountType : null,
          discountValue: enableDiscount && discountValue ? Number(discountValue) : null,
          createdAt: new Date().toISOString(),
          qrCodeImage: qrData,
          bankAccount,
        };

        console.log('새 QR 코드 생성:', newQrCode);
        console.log('인증 상태:', { isAuthenticated, owner: owner?.authProvider });
        
        let savedQrCode = newQrCode;
        
        if (isRealUser) {
          console.log('로그인 사용자 - 서버에 저장');
          try {
            // 1. 먼저 계좌 정보를 서버에 저장
            const savedAccount = await accountsAPI.create({
              bankName: selectedBank,
              accountNumber,
              accountHolder,
              isDefault: false,
            });
            console.log('계좌 정보 서버 저장 완료:', savedAccount);
            
            // 2. QR 코드를 서버에 저장
            const savedQR = await qrcodesAPI.create({
              accountId: savedAccount.accountId,
              qrName,
              baseAmount: enableAmount ? Number(amount) : null,
              discountType: enableDiscount && discountType ? discountType : null,
              discountValue: enableDiscount && discountValue ? Number(discountValue) : null,
            });
            console.log('QR 코드 서버 저장 완료:', savedQR);
            
            // 3. 저장된 QR 목록을 다시 불러오기
            const allQRCodes = await qrcodesAPI.getAll();
            setQrCodes(allQRCodes);
            
            savedQrCode = savedQR;
          } catch (error) {
            console.error('서버 저장 실패:', error);
            Alert.alert('오류', '서버 저장에 실패했습니다. 로컬에 저장합니다.');
            await addLocalQrCode(newQrCode);
          }
        } else {
          console.log('게스트 사용자 - 로컬에만 저장');
          await addLocalQrCode(newQrCode);
        }
        
        console.log('QR 코드 저장 완료');
        
        // QR 완료 화면으로 이동하되, 스택을 리셋해서 뒤로가기 시 목록으로 이동하도록 함
        navigation.reset({
          index: 1,
          routes: [
            { name: 'MyQRList' },
            { name: 'QRComplete', params: { qrCode: savedQrCode, isNewlyCreated: true } }
          ],
        });
        console.log('QR 완료 페이지로 이동');
      }
    } catch (error) {
      console.error('QR 생성 오류:', error);
      Alert.alert('오류', 'QR코드 생성에 실패했습니다.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
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
          <Text style={styles.title}>{isEditMode ? 'QR 편집' : 'QR 생성'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>필수 정보</Text>
          
          <TextInput
            style={[
              styles.input,
              focusedField === 'qrName' && styles.focusedInput
            ]}
            placeholder="QR 이름 (예: 카페 결제용)"
            placeholderTextColor={colors.textDisabled}
            value={qrName}
            onChangeText={setQrName}
            onFocus={() => setFocusedField('qrName')}
            onBlur={() => setFocusedField(null)}
          />

          <Text style={styles.label}>은행 선택</Text>
          <TouchableOpacity
            style={[
              styles.dropdown,
              focusedField === 'bank' && styles.focusedInput
            ]}
            onPress={() => {
              setFocusedField('bank');
              setShowBankModal(true);
            }}
          >
            <Text style={[styles.dropdownText, selectedBank === '은행 선택' && styles.placeholder]}>
              {selectedBank}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>계좌번호 입력</Text>
          <TextInput
            style={[
              styles.input,
              focusedField === 'accountNumber' && styles.focusedInput
            ]}
            placeholder="예: 123456-01-123456"
            placeholderTextColor={colors.textDisabled}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
            onFocus={() => setFocusedField('accountNumber')}
            onBlur={() => setFocusedField(null)}
          />

          <Text style={styles.label}>예금주명</Text>
          <TextInput
            style={[
              styles.input,
              focusedField === 'accountHolder' && styles.focusedInput
            ]}
            placeholder="예금주 이름을 입력하세요"
            placeholderTextColor={colors.textDisabled}
            value={accountHolder}
            onChangeText={setAccountHolder}
            onFocus={() => setFocusedField('accountHolder')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.sectionTitle}>결제 금액 지정하기</Text>
            <Switch
              value={enableAmount}
              onValueChange={setEnableAmount}
              trackColor={{ false: colors.gray400, true: colors.primary }}
            />
          </View>

          {enableAmount && (
            <TextInput
              style={styles.input}
              placeholder="지정 금액 (원)"
              placeholderTextColor={colors.textDisabled}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <Text style={styles.sectionTitle}>할인 지정하기</Text>
            <Switch
              value={enableDiscount}
              onValueChange={setEnableDiscount}
              trackColor={{ false: colors.gray400, true: colors.primary }}
            />
          </View>

          {enableDiscount && (
            <View>
              <View style={styles.discountButtons}>
                <TouchableOpacity
                  style={[styles.discountButton, discountType === 'percentage' && styles.activeButton]}
                  onPress={() => setDiscountType('percentage')}
                >
                  <View style={styles.radioContainer}>
                    <View style={[styles.radioButton, discountType === 'percentage' && styles.radioButtonActive]}>
                      {discountType === 'percentage' && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={[styles.discountButtonText, discountType === 'percentage' && styles.activeButtonText]}>
                      퍼센트 할인 (%)
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.discountButton, discountType === 'fixed' && styles.activeButton]}
                  onPress={() => setDiscountType('fixed')}
                >
                  <View style={styles.radioContainer}>
                    <View style={[styles.radioButton, discountType === 'fixed' && styles.radioButtonActive]}>
                      {discountType === 'fixed' && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={[styles.discountButtonText, discountType === 'fixed' && styles.activeButtonText]}>
                      금액 할인 (원)
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {discountType && (
                <TextInput
                  style={styles.input}
                  placeholder={discountType === 'percentage' ? '할인율 (%)' : '할인 금액 (원)'}
                  placeholderTextColor={colors.textDisabled}
                  value={discountValue}
                  onChangeText={setDiscountValue}
                  keyboardType="numeric"
                />
              )}
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => {
            console.log('QR 생성하기 버튼 클릭됨');
            handleCreateQR();
          }}
        >
          <Text style={styles.createButtonText}>{isEditMode ? '수정 완료' : 'QR 생성하기'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showBankModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>은행 선택</Text>
            <FlatList
              data={BANKS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.bankItem, selectedBank === item && styles.selectedBank]}
                  onPress={() => {
                    setSelectedBank(item);
                    setShowBankModal(false);
                    setFocusedField(null); // 포커스 해제
                  }}
                >
                  <Text style={[styles.bankItemText, selectedBank === item && styles.selectedBankText]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowBankModal(false);
                setFocusedField(null); // 포커스 해제
              }}
            >
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xl * 2,
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
  title: {
    ...typography.styles.heading2,
    color: colors.textPrimary,
    flex: 1,
  },
  section: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.styles.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.styles.fieldLabel,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.styles.body,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  focusedInput: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  dropdownText: {
    ...typography.styles.body,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.textDisabled,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  discountButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  discountButton: {
    flex: 1,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  activeButton: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonActive: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  discountButtonText: {
    ...typography.styles.small,
    color: colors.textSecondary,
  },
  activeButtonText: {
    ...typography.styles.small,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  createButton: {
    backgroundColor: colors.primary,
    margin: spacing.xl,
    padding: spacing.lg + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    ...typography.styles.buttonPrimary,
    color: colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '70%',
  },
  modalTitle: {
    ...typography.styles.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  bankItem: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedBank: {
    backgroundColor: colors.accent,
  },
  bankItemText: {
    ...typography.styles.body,
    color: colors.textPrimary,
  },
  selectedBankText: {
    ...typography.styles.body,
    color: colors.white,
    fontWeight: typography.weights.medium,
  },
  modalCloseButton: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalCloseText: {
    ...typography.styles.body,
    color: colors.textPrimary,
  },
});