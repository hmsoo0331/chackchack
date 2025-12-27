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
  const { 
    addLocalQrCode, 
    updateLocalQrCode, 
    removeLocalQrCode, 
    loadLocalQrCodes, 
    isAuthenticated, 
    owner, 
    setQrCodes,
    checkPrivacyConsent,
    givePrivacyConsent,
    isPrivacyConsentGiven
  } = useStore();

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

  // 개인정보 동의 상태
  const [privacyCollectionConsent, setPrivacyCollectionConsent] = useState(false);
  const [privacyProvisionConsent, setPrivacyProvisionConsent] = useState(false);
  const [showPrivacyCollectionModal, setShowPrivacyCollectionModal] = useState(false);
  const [showPrivacyProvisionModal, setShowPrivacyProvisionModal] = useState(false);
  const [needsPrivacyConsent, setNeedsPrivacyConsent] = useState(false);
  const [showPrivacyConsentPopup, setShowPrivacyConsentPopup] = useState(false);

  // 개인정보 동의 상태 확인 (편집 모드가 아닐 때만)
  useEffect(() => {
    const checkConsentStatus = async () => {
      if (!isEditMode) {
        try {
          const hasConsented = await checkPrivacyConsent();
          setNeedsPrivacyConsent(!hasConsented);
          
          // 이미 동의한 경우 동의 체크박스 자동 체크
          if (hasConsented) {
            setPrivacyCollectionConsent(true);
            setPrivacyProvisionConsent(true);
          }
        } catch (error) {
          console.error('Failed to check consent status:', error);
          setNeedsPrivacyConsent(true); // 오류 시 동의 필요로 처리
        }
      }
    };
    
    checkConsentStatus();
  }, [isEditMode, checkPrivacyConsent]);

  // 편집 모드일 때 기존 데이터로 필드 미리 채우기
  useEffect(() => {
    if (isEditMode && editingQrCode) {
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
    if (!qrName || selectedBank === '은행 선택' || !accountNumber || !accountHolder) {
      Alert.alert('알림', '필수 정보를 모두 입력해주세요.');
      return;
    }

    // 편집 모드가 아닐 때만 개인정보 동의 확인
    if (!isEditMode) {
      try {
        const hasConsented = await checkPrivacyConsent();
        
        if (!hasConsented) {
          // 최초 1회 개인정보 동의가 필요한 경우
          // 기존 동의 화면 표시 (이미 구현된 UI 사용)
          if (!privacyCollectionConsent || !privacyProvisionConsent) {
            Alert.alert(
              '개인정보 동의 필요',
              '계좌 정보가 포함된 QR코드를 생성하려면 개인정보 수집 및 제공에 동의해주세요.',
              [{ text: '확인' }]
            );
            return;
          }
          
          // 두 항목 모두 동의한 경우 동의 상태 저장
          await givePrivacyConsent();
        }
      } catch (error) {
        console.error('Privacy consent check failed:', error);
        Alert.alert('오류', '개인정보 동의 처리 중 오류가 발생했습니다.');
        return;
      }
    }

    try {

      // 편집 모드가 아닐 때만 새 ID 생성
      const qrId = isEditMode ? editingQrCode.qrId : Crypto.randomUUID();

      // 게스트가 아닌 실제 로그인 사용자인지 확인
      const isRealUser = isAuthenticated && owner && owner.authProvider !== 'guest';

      if (isEditMode) {
        // 편집 모드 구분: 로컬 QR vs 서버 QR
        const isLocalQR = !isRealUser || !editingQrCode.accountId;

        if (isLocalQR) {
          // 로컬 QR 편집: 기존 로컬 QR 업데이트하고 새로 생성

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

          // 1. 먼저 계좌 정보를 서버에 저장/업데이트
          const savedAccount = await accountsAPI.create({
            bankName: selectedBank,
            accountNumber,
            accountHolder,
            isDefault: false,
          });

          // 2. QR 코드 업데이트
          const updatedQR = await qrcodesAPI.update(editingQrCode.qrId, {
            accountId: savedAccount.accountId,
            qrName,
            baseAmount: enableAmount ? Number(amount) : null,
            discountType: enableDiscount && discountType ? discountType : null,
            discountValue: enableDiscount && discountValue ? Number(discountValue) : null,
          });

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

        let savedQrCode = newQrCode;

        if (isRealUser) {

          try {
            // 1. 먼저 계좌 정보를 서버에 저장
            const savedAccount = await accountsAPI.create({
              bankName: selectedBank,
              accountNumber,
              accountHolder,
              isDefault: false,
            });

            // 2. QR 코드를 서버에 저장
            const savedQR = await qrcodesAPI.create({
              accountId: savedAccount.accountId,
              qrName,
              baseAmount: enableAmount ? Number(amount) : null,
              discountType: enableDiscount && discountType ? discountType : null,
              discountValue: enableDiscount && discountValue ? Number(discountValue) : null,
            });

            // 3. 저장된 QR 목록을 다시 불러오기
            const allQRCodes = await qrcodesAPI.getAll();
            setQrCodes(allQRCodes);

            savedQrCode = savedQR;
          } catch (error) {

            Alert.alert('오류', '서버 저장에 실패했습니다. 로컬에 저장합니다.');
            await addLocalQrCode(newQrCode);
          }
        } else {

          await addLocalQrCode(newQrCode);
        }

        // QR 완료 화면으로 이동하되, 스택을 리셋해서 뒤로가기 시 목록으로 이동하도록 함
        navigation.reset({
          index: 1,
          routes: [
            { name: 'MyQRList' },
            { name: 'QRComplete', params: { qrCode: savedQrCode, isNewlyCreated: true } }
          ],
        });

      }
    } catch (error) {

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
          onPress={async () => {
            // 편집 모드가 아니고 개인정보 동의가 필요한 경우 팝업 표시
            if (!isEditMode && needsPrivacyConsent) {
              setShowPrivacyConsentPopup(true);
            } else {
              handleCreateQR();
            }
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

      {/* 개인정보 수집 및 이용 동의 모달 */}
      <Modal
        visible={showPrivacyCollectionModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.privacyModalContent}>
            <Text style={styles.privacyModalTitle}>개인정보 수집 및 이용 동의</Text>
            <ScrollView style={styles.privacyScrollView}>
              <Text style={styles.privacyText}>
                '착착(Chakchak)'(이하 '회사')는 QR코드 생성 및 관련 서비스 제공을 위해 개인정보보호법 제15조에 따라 아래와 같이 귀하의 개인정보를 수집 및 이용하는 것에 대한 동의를 받고자 합니다.
                {"\n\n"}
                <Text style={styles.privacyTableHeader}>수집·이용 목적 | 수집 항목 | 보유 및 이용기간</Text>
                {"\n\n"}
                계좌이체 QR코드 생성 및 관련 서비스 제공 | 필수: 은행명, 계좌번호, 예금주명 | 회원 탈퇴 시까지. 단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안 보관합니다.
                {"\n\n"}
                <Text style={styles.privacyBold}>※ 동의 거부 권리 및 불이익 안내</Text>
                {"\n"}
                귀하는 위 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 동의를 거부하실 경우 QR코드 생성 및 관련 서비스 이용이 불가능합니다.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.privacyModalCloseButton}
              onPress={() => setShowPrivacyCollectionModal(false)}
            >
              <Text style={styles.modalCloseText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 개인정보 제3자 제공 동의 모달 */}
      <Modal
        visible={showPrivacyProvisionModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.privacyModalContent}>
            <Text style={styles.privacyModalTitle}>개인정보 제3자 제공 동의</Text>
            <ScrollView style={styles.privacyScrollView}>
              <Text style={styles.privacyText}>
                '회사'는 QR코드 스캔을 통한 원활한 계좌 정보 제공을 위해 개인정보보호법 제17조에 따라 아래와 같이 귀하의 개인정보를 제3자에게 제공하는 것에 대한 동의를 받고자 합니다.
                {"\n\n"}
                <Text style={styles.privacyTableHeader}>제공받는 자 | 제공 목적 | 제공 항목 | 보유 및 이용기간</Text>
                {"\n\n"}
                '착착' QR코드를 스캔하는 불특정 다수의 이용자 | QR코드 스캔을 통한 원활한 계좌이체 정보 확인 | 은행명, 계좌번호, 예금주명(가운데 글자 익명 처리, 예: 한*수) | 정보 확인 즉시 파기 (일회성 조회)
                {"\n\n"}
                <Text style={styles.privacyBold}>※ 동의 거부 권리 및 불이익 안내</Text>
                {"\n"}
                귀하는 위 개인정보 제3자 제공에 대한 동의를 거부할 권리가 있습니다. 다만, 동의를 거부하실 경우 QR코드 생성 및 관련 서비스 이용이 불가능합니다.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.privacyModalCloseButton}
              onPress={() => setShowPrivacyProvisionModal(false)}
            >
              <Text style={styles.modalCloseText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 개인정보 동의 통합 팝업 */}
      <Modal
        visible={showPrivacyConsentPopup}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.privacyConsentPopupContent}>
            <Text style={styles.privacyConsentPopupTitle}>개인정보 처리 동의</Text>
            <Text style={styles.privacyConsentPopupDescription}>
              QR코드 생성을 위해 개인정보 수집 및 제공이 필요합니다.
            </Text>
            
            <TouchableOpacity 
              style={styles.consentRow}
              onPress={() => setPrivacyCollectionConsent(!privacyCollectionConsent)}
            >
              <View style={styles.checkboxContainer}>
                <View style={[styles.checkbox, privacyCollectionConsent && styles.checkboxChecked]}>
                  {privacyCollectionConsent && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </View>
              <Text style={styles.consentText}>
                <Text style={styles.requiredTag}>[필수]</Text> 개인정보 수집 및 이용에 동의합니다.
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.detailLink}
              onPress={() => {
                setShowPrivacyConsentPopup(false);
                setShowPrivacyCollectionModal(true);
              }}
            >
              <Text style={styles.detailLinkText}>자세히 보기</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.consentRow}
              onPress={() => setPrivacyProvisionConsent(!privacyProvisionConsent)}
            >
              <View style={styles.checkboxContainer}>
                <View style={[styles.checkbox, privacyProvisionConsent && styles.checkboxChecked]}>
                  {privacyProvisionConsent && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </View>
              <Text style={styles.consentText}>
                <Text style={styles.requiredTag}>[필수]</Text> 개인정보 제3자 제공에 동의합니다.
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.detailLink}
              onPress={() => {
                setShowPrivacyConsentPopup(false);
                setShowPrivacyProvisionModal(true);
              }}
            >
              <Text style={styles.detailLinkText}>자세히 보기</Text>
            </TouchableOpacity>

            <View style={styles.privacyConsentPopupButtons}>
              <TouchableOpacity 
                style={styles.privacyConsentCancelButton}
                onPress={() => setShowPrivacyConsentPopup(false)}
              >
                <Text style={styles.privacyConsentCancelText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.privacyConsentConfirmButton,
                  (!privacyCollectionConsent || !privacyProvisionConsent) && styles.privacyConsentConfirmButtonDisabled
                ]}
                onPress={async () => {
                  if (!privacyCollectionConsent || !privacyProvisionConsent) {
                    Alert.alert('알림', '필수 동의 항목을 모두 체크해주세요.');
                    return;
                  }
                  setShowPrivacyConsentPopup(false);
                  handleCreateQR();
                }}
                disabled={!privacyCollectionConsent || !privacyProvisionConsent}
              >
                <Text style={[
                  styles.privacyConsentConfirmText,
                  (!privacyCollectionConsent || !privacyProvisionConsent) && styles.privacyConsentConfirmTextDisabled
                ]}>
                  동의하고 QR 생성하기
                </Text>
              </TouchableOpacity>
            </View>
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
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkboxContainer: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  consentText: {
    ...typography.styles.body,
    color: colors.textPrimary,
    flex: 1,
  },
  requiredTag: {
    color: colors.error,
    fontWeight: typography.weights.bold,
  },
  detailLink: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
    marginLeft: 32,
  },
  detailLinkText: {
    ...typography.styles.small,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  createButtonDisabled: {
    backgroundColor: colors.gray400,
    shadowColor: 'transparent',
    elevation: 0,
  },
  privacyModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '80%',
    height: '80%',
  },
  privacyModalTitle: {
    ...typography.styles.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    fontWeight: typography.weights.bold,
  },
  privacyScrollView: {
    flex: 1,
    marginBottom: spacing.xl,
  },
  privacyText: {
    ...typography.styles.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  privacyTableHeader: {
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  privacyBold: {
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  privacyModalCloseButton: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  privacyConsentPopupContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    margin: spacing.xl,
    maxHeight: '80%',
  },
  privacyConsentPopupTitle: {
    ...typography.styles.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  privacyConsentPopupDescription: {
    ...typography.styles.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  privacyConsentPopupButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  privacyConsentCancelButton: {
    flex: 1,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  privacyConsentCancelText: {
    ...typography.styles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  privacyConsentConfirmButton: {
    flex: 2,
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  privacyConsentConfirmButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  privacyConsentConfirmText: {
    ...typography.styles.body,
    color: colors.white,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    fontSize: 14,
  },
  privacyConsentConfirmTextDisabled: {
    color: colors.textDisabled,
  },
});