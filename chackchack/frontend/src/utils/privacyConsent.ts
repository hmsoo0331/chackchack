import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIVACY_CONSENT_KEY = 'privacy_consent_given';

/**
 * 로컬 저장소에서 개인정보 동의 상태 확인 (게스트용)
 */
export const getLocalPrivacyConsent = async (): Promise<boolean> => {
  try {
    const consentStatus = await AsyncStorage.getItem(PRIVACY_CONSENT_KEY);
    return consentStatus === 'true';
  } catch (error) {
    console.error('Failed to get local privacy consent:', error);
    return false;
  }
};

/**
 * 로컬 저장소에 개인정보 동의 상태 저장 (게스트용)
 */
export const setLocalPrivacyConsent = async (consent: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(PRIVACY_CONSENT_KEY, consent.toString());
  } catch (error) {
    console.error('Failed to set local privacy consent:', error);
    throw error;
  }
};

/**
 * 로컬 저장소에서 개인정보 동의 상태 제거 (로그아웃 시)
 */
export const clearLocalPrivacyConsent = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PRIVACY_CONSENT_KEY);
  } catch (error) {
    console.error('Failed to clear local privacy consent:', error);
  }
};