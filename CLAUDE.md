# 착착(ChackChack) 프로젝트 상태 및 컨텍스트

## 프로젝트 개요
- **버전**: v1.3
- **핵심 컨셉**: 로그인 없는 첫 경험을 제공하는 계좌이체 QR코드 생성 앱
- **대상**: IT 기기 사용이 서툰 소상공인 (사장님)
- **수익 모델**: 사장님용 앱 무료, 손님 웹페이지 광고 수익

## 기술 스택

### Backend (NestJS)
- **프레임워크**: NestJS 11.0.1
- **데이터베이스**: PostgreSQL + TypeORM 0.3.25
- **인증**: JWT (passport-jwt)
- **위치**: `/chackchack/backend/`
- **실행**: `npm run start:dev`

### Frontend (React Native)
- **프레임워크**: React Native 0.79.5 + Expo 53.0.20
- **상태관리**: Zustand 5.0.7
- **네비게이션**: React Navigation
- **QR 생성**: react-native-qrcode-svg
- **위치**: `/chackchack/frontend/`
- **실행**: `npm start`

## 데이터베이스 구조

### 주요 엔티티
1. **Owner**: 사용자 정보 (게스트/소셜 로그인)
2. **BankAccount**: 은행 계좌 정보
3. **QrCode**: QR코드 정보 (금액, 할인, 스타일)
4. **PaymentNotification**: 결제 알림 내역

## API 엔드포인트

### 인증
- `POST /auth/guest` - 게스트 계정 생성
- `POST /auth/login` - 소셜 로그인

### 계좌 관리
- `POST /accounts` - 계좌 추가 (인증 필요)
- `GET /accounts` - 계좌 목록 조회 (인증 필요)

### QR코드
- `POST /qrcodes` - QR 생성 (인증 필요)
- `GET /qrcodes` - QR 목록 조회 (인증 필요)
- `GET /qrcodes/:id` - QR 상세 조회 (손님용)
- `PUT /qrcodes/:id` - QR 수정 (인증 필요) ✨ v1.3 신규
- `DELETE /qrcodes/:id` - QR 삭제 (인증 필요)

### 알림
- `POST /notify/:qrId` - 결제 알림 전송 (손님용)
- `GET /notifications` - 알림 내역 조회 (인증 필요)

## 주요 화면 구성

### 모바일 앱 (사장님용) - v1.3 업데이트
1. **SplashScreen**: 시작 화면, 자동 라우팅
2. **MyQRListScreen**: 메인 화면, QR 목록 관리
3. **CreateQRScreen**: QR 생성/편집 폼 ✨ 편집 기능 추가
4. **QRCompleteScreen**: 생성/조회 완료, 저장/공유/편집
5. **LoginScreen**: 소셜 로그인 옵션

### 웹 페이지 (손님용)
- `/public/payer.html`: QR 스캔 시 보이는 송금 페이지
- 송금 앱 이동 버튼 클릭 후 '사장님께 알리기' 버튼 활성화

## v1.3 주요 변경사항 ✨

### 완성된 기능
- **QR 코드 편집**: 모든 정보(이름, 계좌, 금액, 할인) 수정 가능
- **편집 UI/UX**: 기존 데이터로 자동 입력, 직관적 편집 흐름
- **PUT API**: RESTful QR 수정 엔드포인트 완성
- **독립적 토글**: 금액 지정과 할인 설정 개별 제어

## v1.2 주요 변경사항

### 완성된 사항
- **UX 개선**: 독립적 토글, 메인 화면 최적화
- **버그 수정**: 할인 정보 표시, 스크롤 기능 추가
- **라우팅 개선**: HomeScreen 제거, 직접적인 사용자 경험

## v1.1 주요 변경사항

### 완성된 사항
- **입금 알림 UX 개선**: 송금 앱 이동 버튼 클릭 전까지 알림 버튼 비활성화
- 버튼 클릭 후 활성화되어 사장님께 푸시 알림 전송

## 프로젝트 페르소나

1. **박복례 (60대 노점상)**: 극도의 단순함 필요, 복잡한 기능 회피
2. **최철민 (40대 대리기사)**: 속도와 효율성 중시, 여러 QR 관리
3. **김아름 (20대 플리마켓 셀러)**: 디자인과 브랜드 감성 중요

## 개발 시 유의사항

### 원칙
- 로그인 없는 첫 경험 제공이 최우선
- 극도로 단순한 UI/UX 유지
- 기술 용어 최소화
- 로컬 저장 우선, 클라우드는 선택사항

### 테스트
- Backend: `npm run test`, `npm run test:e2e`
- Frontend: 테스트 가이드 참조 (`/frontend/test-guide.md`)

### 디렉토리 구조
```
chackchack/
├── backend/           # NestJS 백엔드
│   ├── src/
│   │   ├── auth/     # 인증 모듈
│   │   ├── accounts/ # 계좌 관리
│   │   ├── qrcodes/  # QR 코드 관리
│   │   ├── notifications/ # 알림
│   │   └── entities/ # TypeORM 엔티티
│   └── public/       # 정적 파일 (손님용 웹)
├── frontend/         # React Native 앱
│   └── src/
│       ├── screens/  # 화면 컴포넌트
│       ├── api/      # API 클라이언트
│       ├── store/    # Zustand 상태 관리
│       └── utils/    # 유틸리티 함수
└── ui/              # UI 디자인 참고 자료
```

## 현재 구현 상태

### 완료된 기능
- ✅ 게스트 계정 생성 및 JWT 인증
- ✅ 은행 계좌 CRUD
- ✅ QR코드 생성, 조회, 수정, 삭제 (Full CRUD)
- ✅ QR 편집 UI/UX 완성
- ✅ 독립적 금액/할인 토글 시스템
- ✅ 손님용 송금 페이지
- ✅ 결제 알림 API
- ✅ 로컬 스토리지 ↔ 서버 동기화

### 진행 중/미구현
- 🔄 푸시 알림 실제 전송 (FCM/APNS)
- 🔄 QR 코드 스타일링 (로고, 색상)
- 🔄 소셜 로그인 실제 연동

## 주요 명령어

### Backend
```bash
cd chackchack/backend
npm run start:dev    # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run lint         # 린트 검사
npm run test         # 단위 테스트
```

### Frontend
```bash
cd chackchack/frontend
npm start           # Expo 개발 서버
npm run ios         # iOS 시뮬레이터
npm run android     # Android 에뮬레이터
npm run web         # 웹 브라우저
```

## 환경 설정

### Backend (.env 필요)
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=chackchack
JWT_SECRET=your_jwt_secret
```

### Frontend
- API 엔드포인트: `/src/api/client.ts`에서 설정
- 기본값: `http://localhost:3000`

---

*이 문서는 새 세션 시작 시 프로젝트 컨텍스트를 빠르게 파악하기 위한 참고 자료입니다.*
*최종 업데이트: 2025-08-13 (v1.3 QR 편집 기능 완성)*