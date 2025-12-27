import { BankAccount } from '../types';

export const generateQRData = (
  bankAccount: BankAccount,
  qrId?: string,
  baseAmount?: number,
  discountType?: string,
  discountValue?: number
) => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.chackchack.co.kr';

  let url = `${baseUrl}/payer.html?bank=${encodeURIComponent(bankAccount.bankName)}&account=${encodeURIComponent(
    bankAccount.accountNumber
  )}&holder=${encodeURIComponent(bankAccount.accountHolder)}`;

  if (qrId) {
    url += `&qrId=${qrId}`;
  }

  if (baseAmount) {
    let finalAmount = baseAmount;

    if (discountType && discountValue) {
      if (discountType === 'percentage') {
        finalAmount = baseAmount * (1 - discountValue / 100);
      } else if (discountType === 'fixed') {
        finalAmount = Math.max(0, baseAmount - discountValue);
      }
    }

    url += `&amount=${Math.round(finalAmount)}`;
  }

  return url;
};