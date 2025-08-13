export const colors = {
  // Primary Colors
  primary: '#006D77',          // 짙은 청록색 - 메인 버튼, 액티브 상태
  primaryDark: '#005A63',      // 호버/눌림 상태
  primaryLight: '#E6F5F6',     // 배경색 (연한 버전)
  
  // Accent Colors
  accent: '#FFB703',           // 생생한 오렌지/골드 - 특별한 액션
  accentDark: '#E5A300',       // 호버/눌림 상태
  accentLight: '#FFF4E0',      // 배경색 (연한 버전)
  
  // Neutral Colors
  white: '#FFFFFF',
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',
  
  // Semantic Colors
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',
  
  // Text Colors
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textDisabled: '#ADB5BD',
  
  // Border Colors
  border: '#DEE2E6',
  borderLight: '#F1F3F4',
} as const;

export type ColorKey = keyof typeof colors;