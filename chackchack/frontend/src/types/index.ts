export interface Owner {
  ownerId: string;
  deviceToken?: string;
  email?: string;
  nickname?: string;
  authProvider?: string;
}

export interface BankAccount {
  accountId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
}

export interface QrCode {
  qrId: string;
  qrName: string;
  accountId: string;
  baseAmount?: number;
  discountType?: string;
  discountValue?: number;
  styleConfigJson?: any;
  createdAt: string;
  qrCodeImage?: string;
  bankAccount?: BankAccount;
}

export interface PaymentNotification {
  notificationId: string;
  qrId: string;
  notifiedAt: string;
  payerIpAddress?: string;
  qrCode?: QrCode;
}