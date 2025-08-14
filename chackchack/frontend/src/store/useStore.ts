import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Owner, BankAccount, QrCode } from '../types';

interface AppState {
  isAuthenticated: boolean;
  accessToken: string | null;
  owner: Owner | null;
  bankAccounts: BankAccount[];
  qrCodes: QrCode[];
  localQrCodes: QrCode[];
  
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
}

export const useStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  accessToken: null,
  owner: null,
  bankAccounts: [],
  qrCodes: [],
  localQrCodes: [],
  
  setAuth: async (token: string, owner: Owner) => {
    console.log('setAuth 호출됨 - token:', token, 'owner:', owner);
    await AsyncStorage.setItem('accessToken', token);
    await AsyncStorage.setItem('owner', JSON.stringify(owner));
    set({ isAuthenticated: true, accessToken: token, owner });
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
      console.log('중복된 QR 코드 추가 시도 방지:', qrCode.qrId);
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
          console.log(`중복 QR 코드 제거: ${qrCodes.length} → ${uniqueQrCodes.length}`);
          await AsyncStorage.setItem('localQrCodes', JSON.stringify(uniqueQrCodes));
        }
        
        console.log('로컬 QR 코드 로드됨:', uniqueQrCodes);
        set({ localQrCodes: uniqueQrCodes });
      }
    } catch (error) {
      console.error('Error loading local QR codes:', error);
    }
  },

  initializeAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const ownerStr = await AsyncStorage.getItem('owner');
      
      if (token && ownerStr) {
        const owner = JSON.parse(ownerStr);
        console.log('저장된 인증 정보 복원:', { token: token.substring(0, 20) + '...', owner });
        set({ isAuthenticated: true, accessToken: token, owner });
      } else {
        console.log('저장된 인증 정보 없음');
        set({ isAuthenticated: false, accessToken: null, owner: null });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isAuthenticated: false, accessToken: null, owner: null });
    }
  },

  clearAllData: async () => {
    try {
      console.log('모든 데이터 삭제 시작...');
      
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
      
      console.log('모든 데이터 삭제 완료');
    } catch (error) {
      console.error('Error clearing all data:', error);
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
      
      console.log('로컬 QR 코드 업데이트됨:', qrId);
    } catch (error) {
      console.error('Error updating local QR code:', error);
    }
  },

  removeLocalQrCode: async (qrId: string) => {
    try {
      const currentLocal = get().localQrCodes;
      const filteredLocal = currentLocal.filter(qr => qr.qrId !== qrId);
      
      await AsyncStorage.setItem('localQrCodes', JSON.stringify(filteredLocal));
      set({ localQrCodes: filteredLocal });
      
      console.log('로컬 QR 코드 삭제됨:', qrId);
    } catch (error) {
      console.error('Error removing local QR code:', error);
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
          console.log(`중복 데이터 정리: ${qrCodes.length} → ${uniqueQrCodes.length}`);
          await AsyncStorage.setItem('localQrCodes', JSON.stringify(uniqueQrCodes));
          set({ localQrCodes: uniqueQrCodes });
        }
      }
    } catch (error) {
      console.error('Error cleaning up duplicate QR codes:', error);
    }
  },

  // 로컬 QR 데이터를 서버와 동기화
  syncLocalQrCodesToServer: async () => {
    const { localQrCodes } = get();
    
    if (!localQrCodes || localQrCodes.length === 0) {
      console.log('동기화할 로컬 QR 코드가 없음');
      return { syncedCount: 0, skippedCount: 0, allQrCodes: [] };
    }

    try {
      console.log(`로컬 QR 동기화 시작: ${localQrCodes.length}개`);
      
      // 서버 동기화 API 호출
      const { qrcodesAPI } = await import('../api/qrcodes');
      const result = await qrcodesAPI.sync(localQrCodes);
      
      // 서버 QR 데이터로 업데이트
      set({ qrCodes: result.allQrCodes });
      
      // 로컬 QR 데이터 삭제
      await AsyncStorage.removeItem('localQrCodes');
      set({ localQrCodes: [] });
      
      console.log(`동기화 완료: ${result.syncedCount}개 추가, ${result.skippedCount}개 건너뜀`);
      
      return result;
    } catch (error) {
      console.error('QR 동기화 오류:', error);
      console.error('에러 세부사항:', error.response?.data);
      throw error;
    }
  }
}));