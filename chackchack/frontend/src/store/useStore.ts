import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Owner, BankAccount, QrCode } from '../types';
import { getLocalPrivacyConsent, setLocalPrivacyConsent } from '../utils/privacyConsent';
import { authAPI } from '../api/auth';

interface AppState {
  isAuthenticated: boolean;
  accessToken: string | null;
  owner: Owner | null;
  bankAccounts: BankAccount[];
  qrCodes: QrCode[];
  localQrCodes: QrCode[];
  isPrivacyConsentGiven: boolean;

  setAuth: (token: string, owner: Owner) => void;
  logout: () => void;
  setBankAccounts: (accounts: BankAccount[]) => void;
  setQrCodes: (qrCodes: QrCode[]) => void;
  addLocalQrCode: (qrCode: QrCode) => void;
  updateLocalQrCode: (qrId: string, updatedData: QrCode) => Promise<void>;
  loadLocalQrCodes: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearAllData: () => Promise<void>;
  removeLocalQrCode: (qrId: string) => Promise<void>;
  checkPrivacyConsent: () => Promise<boolean>;
  givePrivacyConsent: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  accessToken: null,
  owner: null,
  bankAccounts: [],
  qrCodes: [],
  localQrCodes: [],
  isPrivacyConsentGiven: false,

  setAuth: (token: string, owner: Owner) => {
    try {
      console.log('🔐 Setting auth state...', { token: token.substring(0, 10) + '...', ownerId: owner.ownerId });
      
      // 즉시 상태 업데이트 (UI 응답성 향상)
      set({ isAuthenticated: true, accessToken: token, owner });
      
      // AsyncStorage 저장은 백그라운드에서 실행
      Promise.all([
        AsyncStorage.setItem('accessToken', token),
        AsyncStorage.setItem('owner', JSON.stringify(owner))
      ]).then(() => {
        console.log('✅ Auth state saved to storage');
      }).catch(error => {
        console.error('❌ Failed to save auth state to storage:', error);
      });
      
      console.log('✅ Auth state updated successfully');
    } catch (error) {
      console.error('❌ Failed to set auth state:', error);
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('owner');
    set({ 
      isAuthenticated: false, 
      accessToken: null, 
      owner: null,
      bankAccounts: [],
      qrCodes: []
    });
  },

  setBankAccounts: (accounts: BankAccount[]) => {
    set({ bankAccounts: accounts });
  },

  setQrCodes: (qrCodes: QrCode[]) => {
    set({ qrCodes });
  },

  addLocalQrCode: async (qrCode: QrCode) => {
    const currentLocal = get().localQrCodes;
    // 중복 방지: 같은 qrId가 이미 있으면 추가하지 않음
    const existingIndex = currentLocal.findIndex(item => item.qrId === qrCode.qrId);
    if (existingIndex !== -1) {

      return;
    }
    const newLocal = [...currentLocal, qrCode];
    await AsyncStorage.setItem('localQrCodes', JSON.stringify(newLocal));
    set({ localQrCodes: newLocal });
  },

  loadLocalQrCodes: async () => {
    try {
      const stored = await AsyncStorage.getItem('localQrCodes');
      if (stored) {
        const qrCodes = JSON.parse(stored);

        // 중복 제거: qrId를 기준으로 중복된 항목 제거
        const uniqueQrCodes = qrCodes.reduce((acc: any[], current: any) => {
          const existingIndex = acc.findIndex(item => item.qrId === current.qrId);
          if (existingIndex === -1) {
            acc.push(current);
          }
          return acc;
        }, []);

        // 중복이 제거된 데이터가 원본과 다르면 저장소 업데이트
        if (uniqueQrCodes.length !== qrCodes.length) {

          await AsyncStorage.setItem('localQrCodes', JSON.stringify(uniqueQrCodes));
        }

        set({ localQrCodes: uniqueQrCodes });
      }
    } catch (error) {

    }
  },

  initializeAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const ownerStr = await AsyncStorage.getItem('owner');

      if (token && ownerStr) {
        const owner = JSON.parse(ownerStr);

        set({ isAuthenticated: true, accessToken: token, owner });
      } else {

        set({ isAuthenticated: false, accessToken: null, owner: null });
      }
    } catch (error) {

      set({ isAuthenticated: false, accessToken: null, owner: null });
    }
  },

  clearAllData: async () => {
    try {

      // AsyncStorage에서 모든 데이터 삭제
      await AsyncStorage.multiRemove([
        'accessToken',
        'owner', 
        'localQrCodes'
      ]);

      // 스토어 상태 초기화
      set({
        isAuthenticated: false,
        accessToken: null,
        owner: null,
        bankAccounts: [],
        qrCodes: [],
        localQrCodes: []
      });

    } catch (error) {

    }
  },

  updateLocalQrCode: async (qrId: string, updatedData: QrCode) => {
    try {
      const currentLocal = get().localQrCodes;
      const updatedLocal = currentLocal.map(qr => 
        qr.qrId === qrId ? { ...qr, ...updatedData } : qr
      );

      await AsyncStorage.setItem('localQrCodes', JSON.stringify(updatedLocal));
      set({ localQrCodes: updatedLocal });

    } catch (error) {

    }
  },

  removeLocalQrCode: async (qrId: string) => {
    try {
      const currentLocal = get().localQrCodes;
      const filteredLocal = currentLocal.filter(qr => qr.qrId !== qrId);

      await AsyncStorage.setItem('localQrCodes', JSON.stringify(filteredLocal));
      set({ localQrCodes: filteredLocal });

    } catch (error) {

    }
  },

  // 중복 데이터 정리 함수 (한번만 실행용)
  cleanupDuplicateQRCodes: async () => {
    try {
      const stored = await AsyncStorage.getItem('localQrCodes');
      if (stored) {
        const qrCodes = JSON.parse(stored);
        const uniqueQrCodes = qrCodes.reduce((acc: any[], current: any) => {
          const existingIndex = acc.findIndex(item => item.qrId === current.qrId);
          if (existingIndex === -1) {
            acc.push(current);
          }
          return acc;
        }, []);

        if (uniqueQrCodes.length !== qrCodes.length) {

          await AsyncStorage.setItem('localQrCodes', JSON.stringify(uniqueQrCodes));
          set({ localQrCodes: uniqueQrCodes });
        }
      }
    } catch (error) {

    }
  },

  // 로컬 QR 데이터를 서버와 동기화
  syncLocalQrCodesToServer: async () => {
    const { localQrCodes } = get();

    if (!localQrCodes || localQrCodes.length === 0) {

      return { syncedCount: 0, skippedCount: 0, allQrCodes: [] };
    }

    try {

      // 서버 동기화 API 호출
      const { qrcodesAPI } = await import('../api/qrcodes');
      const result = await qrcodesAPI.sync(localQrCodes);

      // 서버 QR 데이터로 업데이트
      set({ qrCodes: result.allQrCodes });

      // 로컬 QR 데이터 삭제
      await AsyncStorage.removeItem('localQrCodes');
      set({ localQrCodes: [] });

      return result;
    } catch (error) {

      throw error;
    }
  },

  // 개인정보 동의 상태 확인 (게스트/로그인 사용자 구분)
  checkPrivacyConsent: async (): Promise<boolean> => {
    const { isAuthenticated, owner } = get();
    
    try {
      if (isAuthenticated && owner && owner.authProvider !== 'guest') {
        // 로그인 사용자: 서버에서 동의 상태 확인
        const consentStatus = await authAPI.getPrivacyConsentStatus();
        const isConsented = consentStatus.isConsentGiven;
        set({ isPrivacyConsentGiven: isConsented });
        return isConsented;
      } else {
        // 게스트 사용자: 로컬 저장소에서 동의 상태 확인
        const isConsented = await getLocalPrivacyConsent();
        set({ isPrivacyConsentGiven: isConsented });
        return isConsented;
      }
    } catch (error) {
      console.error('Failed to check privacy consent:', error);
      return false;
    }
  },

  // 개인정보 동의 처리 (게스트/로그인 사용자 구분)
  givePrivacyConsent: async (): Promise<void> => {
    const { isAuthenticated, owner } = get();
    
    try {
      if (isAuthenticated && owner && owner.authProvider !== 'guest') {
        // 로그인 사용자: 서버에 동의 상태 저장
        await authAPI.updatePrivacyConsent();
      } else {
        // 게스트 사용자: 로컬 저장소에 동의 상태 저장
        await setLocalPrivacyConsent(true);
      }
      
      set({ isPrivacyConsentGiven: true });
    } catch (error) {
      console.error('Failed to give privacy consent:', error);
      throw error;
    }
  }
}));