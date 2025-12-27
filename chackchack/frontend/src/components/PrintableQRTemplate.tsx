import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

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

interface PrintableQRTemplateProps {
  qrCode: any;
}

export default function PrintableQRTemplate({ qrCode }: PrintableQRTemplateProps) {
  return (
    <View style={styles.container}>
      {/* QR 이름 - 제일 상단에 배치 */}
      <Text style={styles.qrName}>{qrCode.qrName}</Text>
      
      {/* QR 코드 영역 */}
      <View style={styles.qrContainer}>
        {qrCode.qrCodeImage ? (
          qrCode.qrCodeImage.startsWith('data:image') ? (
            <Image
              source={{ uri: qrCode.qrCodeImage }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          ) : (
            <QRCode
              value={qrCode.qrCodeImage}
              size={200}
              backgroundColor="white"
              color="black"
            />
          )
        ) : (
          <Text style={styles.noQrText}>QR 코드 없음</Text>
        )}
      </View>
      
      {/* 은행 정보 */}
      <Text style={styles.bankName}>{qrCode.bankAccount?.bankName}</Text>
      <Text style={styles.accountNumber}>{qrCode.bankAccount?.accountNumber}</Text>
      <Text style={styles.accountHolder}>
        {qrCode.bankAccount?.accountHolder ? maskAccountHolderName(qrCode.bankAccount.accountHolder) : ''}
      </Text>
      
      {/* 하단 로고와 안내 문구 */}
      <View style={styles.footerContainer}>
        <Image 
          source={require('../../assets/icon.png')} 
          style={styles.logoIcon} 
          resizeMode="contain"
        />
        <Text style={styles.footerText}>착착으로 만들었어요</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: 350,
    minHeight: 500,
  },
  qrName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
    textAlign: 'center',
  },
  qrContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  noQrText: {
    width: 200,
    height: 200,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#666',
    fontSize: 16,
  },
  bankName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#006D77',
    marginBottom: 8,
    textAlign: 'center',
  },
  accountNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  accountHolder: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginBottom: 40,
    textAlign: 'center',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  logoIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
  },
});