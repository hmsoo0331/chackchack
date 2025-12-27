/**
 * 예금주 이름을 마스킹 처리하는 유틸리티 함수
 * 개인정보보호를 위해 가운데 글자를 '*'로 대체
 * 
 * @param name - 마스킹할 이름
 * @returns 마스킹된 이름
 * 
 * 예시:
 * - 한명수 → 한*수 (3글자)
 * - 한수 → 한* (2글자) 
 * - 남궁명수 → 남**수 (4글자)
 * - 홍길동김 → 홍**김 (4글자 이상)
 */
export function maskAccountHolderName(name: string): string {
  if (!name || name.length < 2) {
    return name;
  }

  const length = name.length;
  
  if (length === 2) {
    // 2글자: 한수 → 한*
    return name[0] + '*';
  } else if (length === 3) {
    // 3글자: 한명수 → 한*수
    return name[0] + '*' + name[2];
  } else {
    // 4글자 이상: 남궁명수 → 남**수, 홍길동김 → 홍**김
    const firstChar = name[0];
    const lastChar = name[length - 1];
    const middleLength = length - 2;
    const maskedMiddle = '*'.repeat(middleLength);
    
    return firstChar + maskedMiddle + lastChar;
  }
}

/**
 * QR 코드 데이터에서 예금주 이름을 마스킹하여 반환
 * 프론트엔드에서 QR 표시 시 사용
 */
export function getMaskedQrData(qrCodeData: any) {
  if (!qrCodeData?.bankAccount?.accountHolder) {
    return qrCodeData;
  }

  return {
    ...qrCodeData,
    bankAccount: {
      ...qrCodeData.bankAccount,
      accountHolder: maskAccountHolderName(qrCodeData.bankAccount.accountHolder)
    }
  };
}