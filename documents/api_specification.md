# 착착(ChackChack) API 명세서

**Version**: 1.1  
**Date**: 2025-08-13  
**Base URL**: `http://localhost:3000`

## 개요

착착(ChackChack)은 로그인 없는 첫 경험을 제공하는 계좌이체 QR코드 생성 앱입니다. 소상공인을 위한 간편한 QR 결제 솔루션을 제공합니다.

## 인증

- **방식**: JWT Bearer Token
- **헤더**: `Authorization: Bearer <token>`
- **게스트/소셜 로그인** 지원

---

## API 엔드포인트

### 🔐 인증 (Authentication)

#### 1. 게스트 계정 생성
```http
POST /auth/guest
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceToken": "string"
}
```

**Response:**
```json
{
  "accessToken": "string",
  "owner": {
    "ownerId": "uuid",
    "deviceToken": "string", 
    "email": null,
    "nickname": null,
    "authProvider": "guest",
    "createdAt": "ISO 8601",
    "lastLoginAt": "ISO 8601"
  }
}
```

#### 2. 소셜 로그인
```http
POST /auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "string",
  "nickname": "string", 
  "authProvider": "kakao|naver|google",
  "deviceToken": "string"
}
```

**Response:**
```json
{
  "accessToken": "string",
  "owner": {
    "ownerId": "uuid",
    "deviceToken": "string",
    "email": "string",
    "nickname": "string", 
    "authProvider": "string",
    "createdAt": "ISO 8601",
    "lastLoginAt": "ISO 8601"
  }
}
```

#### 3. 로그아웃
```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

#### 4. 계정 탈퇴
```http
DELETE /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Account deleted successfully"
}
```

**에러 응답:**
- **401**: 인증되지 않은 사용자
- **404**: 사용자를 찾을 수 없음

**주의사항:**
- 계정 삭제 시 관련된 모든 데이터(은행계좌, QR코드, 결제알림)가 함께 삭제됩니다
- 삭제된 데이터는 복구할 수 없습니다

---

### 💳 계좌 관리 (Bank Accounts)

#### 1. 계좌 추가
```http
POST /accounts
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "bankName": "string",
  "accountNumber": "string", 
  "accountHolder": "string",
  "isDefault": false
}
```

**Response:**
```json
{
  "accountId": "uuid",
  "ownerId": "uuid",
  "bankName": "string",
  "accountNumber": "string",
  "accountHolder": "string", 
  "isDefault": boolean
}
```

#### 2. 계좌 목록 조회
```http
GET /accounts
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "accountId": "uuid",
    "ownerId": "uuid", 
    "bankName": "string",
    "accountNumber": "string",
    "accountHolder": "string",
    "isDefault": boolean
  }
]
```

---

### 📱 QR코드 관리 (QR Codes)

#### 1. QR코드 생성
```http
POST /qrcodes
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "accountId": "uuid",
  "qrName": "string",
  "baseAmount": 10000,
  "discountType": "percentage|fixed",
  "discountValue": 10
}
```

**Response:**
```json
{
  "qrId": "uuid",
  "ownerId": "uuid",
  "accountId": "uuid",
  "qrName": "string",
  "baseAmount": 10000,
  "discountType": "percentage",
  "discountValue": 10,
  "styleConfigJson": null,
  "createdAt": "ISO 8601",
  "bankAccount": {
    "accountId": "uuid",
    "bankName": "string", 
    "accountNumber": "string",
    "accountHolder": "string",
    "isDefault": boolean
  },
  "qrCodeImage": "data:image/png;base64,..."
}
```

#### 2. 내 QR코드 목록 조회
```http
GET /qrcodes
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "qrId": "uuid",
    "ownerId": "uuid",
    "accountId": "uuid", 
    "qrName": "string",
    "baseAmount": 10000,
    "discountType": "percentage",
    "discountValue": 10,
    "styleConfigJson": null,
    "createdAt": "ISO 8601",
    "bankAccount": {
      "accountId": "uuid",
      "bankName": "string",
      "accountNumber": "string", 
      "accountHolder": "string",
      "isDefault": boolean
    },
    "qrCodeImage": "data:image/png;base64,..."
  }
]
```

#### 3. QR코드 상세 조회 (손님용)
```http
GET /qrcodes/:id
```

**Response:**
```json
{
  "qrId": "uuid",
  "ownerId": "uuid",
  "accountId": "uuid",
  "qrName": "string", 
  "baseAmount": 10000,
  "discountType": "percentage",
  "discountValue": 10,
  "styleConfigJson": null,
  "createdAt": "ISO 8601",
  "bankAccount": {
    "accountId": "uuid",
    "bankName": "string",
    "accountNumber": "string",
    "accountHolder": "string",
    "isDefault": boolean
  },
  "qrCodeImage": "data:image/png;base64,..."
}
```

#### 4. QR코드 삭제
```http
DELETE /qrcodes/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "QR code deleted successfully"
}
```

**에러 응답:**
- **404**: QR코드를 찾을 수 없음
- **403**: 본인의 QR코드가 아님

#### 5. QR코드 동기화
```http
POST /qrcodes/sync
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "localQrCodes": [
    {
      "qrId": "uuid",
      "qrName": "string",
      "bankAccount": {
        "bankName": "string",
        "accountNumber": "string",
        "accountHolder": "string"
      },
      "baseAmount": 10000,
      "discountType": "percentage",
      "discountValue": 10,
      "createdAt": "ISO 8601"
    }
  ]
}
```

**Response:**
```json
{
  "message": "동기화 완료: 3개 추가, 2개 건너뜀",
  "syncedCount": 3,
  "skippedCount": 2,
  "allQrCodes": [
    {
      "qrId": "uuid",
      "ownerId": "uuid",
      "accountId": "uuid",
      "qrName": "string",
      "baseAmount": 10000,
      "discountType": "percentage",
      "discountValue": 10,
      "styleConfigJson": null,
      "createdAt": "ISO 8601",
      "bankAccount": {
        "accountId": "uuid",
        "bankName": "string",
        "accountNumber": "string",
        "accountHolder": "string",
        "isDefault": boolean
      },
      "qrCodeImage": "data:image/png;base64,..."
    }
  ]
}
```

**동기화 규칙:**
- 동일한 QR 이름 + 계좌 정보를 가진 QR코드는 중복 제거
- 중복되지 않은 로컬 QR코드만 서버에 추가
- 동기화 완료 후 전체 QR코드 목록 반환

---

### 🔔 알림 (Notifications)

#### 1. 결제 알림 전송 (손님용)
```http
POST /notify/:qrId
```

**Response:**
```json
{
  "notificationId": "uuid",
  "qrId": "uuid", 
  "notifiedAt": "ISO 8601",
  "payerIpAddress": "string"
}
```

#### 2. 알림 내역 조회
```http
GET /notifications
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "notificationId": "uuid",
    "qrId": "uuid",
    "notifiedAt": "ISO 8601", 
    "payerIpAddress": "string",
    "qrCode": {
      "qrId": "uuid",
      "qrName": "string",
      "bankAccount": {
        "bankName": "string",
        "accountNumber": "string", 
        "accountHolder": "string"
      }
    }
  }
]
```

---

## 에러 응답

모든 에러는 다음 형식으로 응답됩니다:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### 주요 에러 코드

- **400 Bad Request**: 잘못된 요청 데이터
- **401 Unauthorized**: 인증 실패 또는 토큰 만료
- **404 Not Found**: 리소스를 찾을 수 없음
- **500 Internal Server Error**: 서버 오류

---

## 데이터 타입

### UUID
- 형식: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- 예시: `550e8400-e29b-41d4-a716-446655440000`

### ISO 8601 날짜
- 형식: `YYYY-MM-DDTHH:mm:ss.sssZ`
- 예시: `2025-08-13T10:30:00.000Z`

### Base64 이미지
- 형식: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...`

---

## 변경 이력

### Version 1.1 (2025-08-13)
- **QR코드 동기화 API 추가**: `POST /qrcodes/sync` (로컬 데이터를 서버와 병합)
- **계정 탈퇴 API 추가**: `DELETE /auth/me` (인증 필요, CASCADE 삭제)
- **로그아웃 API 추가**: `POST /auth/logout` (인증 필요)
- **QR코드 삭제 API 추가**: `DELETE /qrcodes/:id` (인증 필요)
- **보안 강화**: 본인 소유 QR코드만 삭제 가능
- **데이터 무결성**: 계정 삭제 시 관련 데이터 자동 정리, 동기화 시 중복 방지
- **에러 처리 개선**: 401, 403, 404 에러 케이스 명시

### Version 1.0 (2025-08-13)
- 초기 API 명세서 작성
- 인증, 계좌, QR코드, 알림 API 정의