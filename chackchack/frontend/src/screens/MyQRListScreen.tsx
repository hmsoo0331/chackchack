import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { qrcodesAPI } from '../api/qrcodes';
import { authAPI } from '../api/auth';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';

export default function MyQRListScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated, owner, qrCodes, localQrCodes, setQrCodes, loadLocalQrCodes, removeLocalQrCode, logout: storeLogout } = useStore();
  const [loading, setLoading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        console.log('MyQRListScreen 포커스 - 데이터 새로고침');
        console.log('인증 상태:', { isAuthenticated, owner });
        
        // 게스트가 아닌 실제 로그인 사용자만 서버 QR 사용
        const isRealUser = isAuthenticated && owner && owner.authProvider !== 'guest';
        console.log('isRealUser:', isRealUser);
        
        if (isRealUser) {
          await loadServerQRCodes();
        } else {
          console.log('로컬 QR 코드 불러오기');
          await loadLocalQrCodes();
        }
      };
      
      refreshData();
    }, [isAuthenticated, owner?.authProvider]) // localQrCodes와 loadLocalQrCodes 제거
  );

  useEffect(() => {
    const isRealUser = isAuthenticated && owner && owner.authProvider !== 'guest';
    if (isRealUser) {
      loadServerQRCodes();
    }
  }, [isAuthenticated, owner]);

  const loadServerQRCodes = async () => {
    try {
      console.log('서버 QR 코드 불러오기 시작');
      setLoading(true);
      const codes = await qrcodesAPI.getAll();
      console.log('서버에서 불러온 QR 코드:', codes);
      setQrCodes(codes);
    } catch (error) {
      console.error('서버 QR 코드 불러오기 실패:', error);
      Alert.alert('오류', 'QR코드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 게스트가 아닌 실제 로그인 사용자만 서버 QR 사용
  const isRealUser = isAuthenticated && owner && owner.authProvider !== 'guest';
  const rawQRCodes = isRealUser ? qrCodes : localQrCodes;
  
  // 추가 안전장치: 중복 제거 (qrId 기준)
  const displayQRCodes = rawQRCodes.reduce((acc: any[], current: any) => {
    const existingIndex = acc.findIndex(item => item.qrId === current.qrId);
    if (existingIndex === -1) {
      acc.push(current);
    }
    return acc;
  }, []);

  const handleDeleteQrCode = (item: any) => {
    Alert.alert(
      'QR코드 삭제',
      `"${item.qrName}"을 삭제하시겠습니까?`,
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
              if (isRealUser) {
                // 서버 QR 코드 삭제
                await qrcodesAPI.delete(item.qrId);
                // 목록 새로고침
                await loadServerQRCodes();
                Alert.alert('삭제 완료', 'QR코드가 삭제되었습니다.');
              } else {
                // 로컬 QR 코드 삭제
                await removeLocalQrCode(item.qrId);
                Alert.alert('삭제 완료', 'QR코드가 삭제되었습니다.');
              }
            } catch (error) {
              console.error('QR 삭제 오류:', error);
              Alert.alert('오류', 'QR코드 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              // 서버에 로그아웃 요청 (실제 로그인 사용자만)
              if (isRealUser) {
                await authAPI.logout();
              }
              
              // 로컬 상태 초기화
              await storeLogout();
              
              // 더보기 메뉴 닫기
              setShowMoreMenu(false);
              
              // 홈 화면으로 이동
              navigation.reset({
                index: 0,
                routes: [{ name: 'MyQRList' }],
              });
            } catch (error) {
              console.error('로그아웃 오류:', error);
              // 서버 오류가 있어도 로컬 로그아웃은 진행
              await storeLogout();
              setShowMoreMenu(false);
              navigation.reset({
                index: 0,
                routes: [{ name: 'MyQRList' }],
              });
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      '계정 탈퇴',
      '정말 탈퇴하시겠습니까?\n\n모든 QR코드 정보가 영구적으로 삭제되며, 복구할 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            try {
              // 서버에 계정 삭제 요청
              await authAPI.deleteAccount();
              
              // 로컬 상태 초기화
              await storeLogout();
              
              // 더보기 메뉴 닫기
              setShowMoreMenu(false);
              
              Alert.alert(
                '탈퇴 완료',
                '계정이 성공적으로 삭제되었습니다.',
                [
                  {
                    text: '확인',
                    onPress: () => {
                      // 홈 화면으로 이동
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home' }],
                      });
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('계정 삭제 오류:', error);
              Alert.alert('오류', '계정 삭제에 실패했습니다.\n다시 시도해주세요.');
            }
          },
        },
      ]
    );
  };

  const renderQRItem = ({ item }: { item: any }) => (
    <View style={styles.qrItem}>
      <TouchableOpacity 
        style={styles.qrContent}
        onPress={() => {
          console.log('QR 아이템 클릭:', item);
          navigation.navigate('QRComplete', { qrCode: item, isNewlyCreated: false });
        }}
      >
        <View style={styles.qrPreview}>
          {item.qrCodeImage ? (
            item.qrCodeImage.startsWith('data:image') ? (
              <Image
                source={{ uri: item.qrCodeImage }}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
            ) : (
              <QRCode value={item.qrCodeImage} size={80} />
            )
          ) : (
            <View style={{ width: 80, height: 80, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 12, color: '#666' }}>QR</Text>
            </View>
          )}
        </View>
        <View style={styles.qrInfo}>
          <Text style={styles.qrName}>{item.qrName}</Text>
          <Text style={styles.qrBank}>
            {item.bankAccount?.bankName} | {item.bankAccount?.accountNumber}
          </Text>
          {item.baseAmount && (
            <Text style={styles.qrAmount}>
              지정 금액: {Math.floor(item.baseAmount).toLocaleString()}원
            </Text>
          )}
          {item.discountType && item.discountValue && (
            <Text style={styles.qrDiscount}>
              할인: {item.discountType === 'percentage' 
                ? `${item.discountValue}%` 
                : `${Math.floor(item.discountValue).toLocaleString()}원`}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteQrCode(item)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>내 QR코드</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateQR')}
          >
            <Text style={styles.addButtonText}>+ 새 QR</Text>
          </TouchableOpacity>
          {/* 로그인 사용자만 더보기 메뉴 표시 */}
          {isRealUser && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => setShowMoreMenu(true)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isRealUser && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            로그인하지 않은 상태입니다. QR코드가 기기에만 저장됩니다.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      )}

      {displayQRCodes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>가장 쉬운 계좌이체{'\n'}QR 만들기</Text>
          <Text style={styles.emptyText}>
            아직 생성한 QR코드가 없습니다.{'\n'}
            {isRealUser 
              ? '아래 버튼을 눌러 첫 QR코드를 만들어보세요.' 
              : '로그인 없이 즉시 시작하세요'
            }
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateQR')}
          >
            <Text style={styles.createButtonText}>+ 첫 QR코드 만들기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayQRCodes}
          keyExtractor={(item, index) => `${item.qrId}-${index}`}
          renderItem={renderQRItem}
          contentContainerStyle={styles.listContainer}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
      
      {/* 더보기 메뉴 모달 */}
      <Modal
        visible={showMoreMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View style={styles.moreMenuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.menuItemLogout}>로그아웃</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={styles.menuItemDelete}>계정 탈퇴</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  title: {
    ...typography.styles.heading2,
    color: colors.textPrimary,
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    ...typography.styles.buttonSecondary,
    color: colors.white,
  },
  warningBanner: {
    backgroundColor: colors.warning,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    ...typography.styles.small,
    color: colors.textPrimary,
  },
  loginLink: {
    ...typography.styles.small,
    color: colors.info,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.sm,
  },
  listContainer: {
    padding: spacing.lg,
  },
  qrItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.gray800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  qrContent: {
    flex: 1,
    flexDirection: 'row',
    padding: spacing.lg,
  },
  qrPreview: {
    marginRight: spacing.lg,
  },
  qrInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  qrName: {
    ...typography.styles.listItem,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  qrBank: {
    ...typography.styles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  qrAmount: {
    ...typography.styles.body,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  qrDiscount: {
    ...typography.styles.caption,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.styles.heading1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyText: {
    ...typography.styles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['4xl'] + spacing.xl,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing['4xl'],
    paddingVertical: spacing.lg + 2,
    borderRadius: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    ...typography.styles.buttonPrimary,
    color: colors.white,
  },
  deleteButton: {
    padding: spacing.md,
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: spacing.xl * 3, // 헤더 아래쪽에 위치
    paddingRight: spacing.xl,
  },
  moreMenuContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    shadowColor: colors.gray800,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 120,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  menuItemLogout: {
    ...typography.styles.body,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  menuItemDelete: {
    ...typography.styles.body,
    color: colors.error,
    fontWeight: typography.weights.medium,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});