import { TextStyle } from 'react-native';

export const typography = {
  // Font Weights (Using system fonts with Pretendard-like weights)
  weights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
  },
  
  // Font Sizes
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },
  
  // Typography Styles
  styles: {
    // 화면 제목 - Bold (700)
    heading1: {
      fontSize: 32,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 40,
    },
    heading2: {
      fontSize: 28,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 36,
    },
    heading3: {
      fontSize: 24,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 32,
    },
    
    // 버튼 텍스트, 필드 제목 - Medium (500)
    buttonPrimary: {
      fontSize: 18,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 24,
    },
    buttonSecondary: {
      fontSize: 16,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 22,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 20,
    },
    listItem: {
      fontSize: 16,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 24,
    },
    
    // 보조 설명 텍스트 - Regular (400)
    body: {
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 16,
    },
  },
} as const;