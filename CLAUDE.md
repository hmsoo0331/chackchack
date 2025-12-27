# 착착(ChackChack) 프로젝트 상태 및 컨텍스트

## 프로젝트 개요
- **버전**: v1.0.13 (2025-10-25)
- **핵심 컨셉**: 로그인 없는 첫 경험을 제공하는 계좌이체 QR코드 생성 앱
- **대상**: IT 기기 사용이 서툰 소상공인 (사장님)
- **수익 모델**: 사장님용 앱 무료, 손님 웹페이지 광고 수익
- **🎯 플레이스토어 제출용 AAB**: `/Users/hanmyungsoo/project/chackchack/apk/chackchack-v1.0.13-version16-final.aab` (버전코드 16)

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
- `POST /auth/logout` - 로그아웃 (인증 필요)
- `DELETE /auth/me` - 계정 탈퇴 (인증 필요) ✨ v1.0.2 신규

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

### 모바일 앱 (사장님용) - v1.0.2 업데이트
1. **SplashScreen**: 시작 화면, 자동 라우팅
2. **MyQRListScreen**: 메인 화면, QR 목록 관리
3. **CreateQRScreen**: QR 생성/편집 폼 ✨ 편집 기능 추가
4. **QRCompleteScreen**: 생성/조회 완료, 저장/공유/편집 ✨ 갤러리 저장 추가
5. **LoginScreen**: 소셜 로그인 옵션 ✨ 카카오 완전 구현

### 웹 페이지 (손님용) - v1.0.3 업데이트
- `/public/payer.html`: QR 스캔 시 보이는 송금 페이지 ✨ 7가지 UX/UI 개선 완료
- 할인만 있는 QR: 상품 금액 입력 → 할인 적용 → 최종 금액 계산
- 토스/카카오페이 딥링크 최적화, 로딩 상태 표시
- 금액 표시 개선 (콤마, 소수점 제거)

## v1.0.3 주요 변경사항 ✨ (2025-08-24)

### 완성된 기능
- **손님용 송금 페이지 완전 개선**: 7가지 핵심 UX/UI 이슈 해결
- **할인 기능 완전 구현**: 할인만 있는 QR에서 금액 입력 및 계산 지원
- **딥링크 최적화**: 토스 앱에 금액 정보 자동 전달
- **QR URL 도메인화**: https://api.chackchack.co.kr 도메인 사용

### 손님용 페이지 세부 개선사항
1. **UI 개선**: 카카오페이 팝업 최소 너비 설정 (320px)
2. **UX 개선**: 토스 버튼 클릭 시 로딩 스피너 표시
3. **로직 추가**: 할인만 설정된 QR에서 상품 금액 입력 기능
4. **버그 수정**: 금액 소수점 제거 및 천 단위 콤마 표시
5. **버그 수정**: 금액+할인 동시 적용 시 최종 금액 정확 계산
6. **기능 개선**: 토스 딥링크에 계산된 금액 파라미터 추가
7. **서버 개선**: QR 생성 URL을 IP에서 도메인으로 변경

## v1.0.2 주요 변경사항 ✨ (2025-08-24)

### 완성된 기능
- **계정 탈퇴 기능**: 트랜잭션 기반 안전한 데이터 삭제
- **QR 삭제 버그 수정**: Alert와 Navigation 순서 문제 해결
- **코드 정리**: 모든 console.log 제거, 프로덕션 최적화
- **서버 안정성**: 외래키 제약 조건 처리 개선

## v1.0.1 이전 주요 기능

### 완성된 사항
- **QR 갤러리 저장**: ViewShot + MediaLibrary로 휴대폰 갤러리 저장
- **카카오 소셜 로그인**: OAuth 2.0 완전 구현
- **QR 코드 편집**: 모든 정보(이름, 계좌, 금액, 할인) 수정 가능
- **개인정보처리방침**: 더보기 메뉴에서 웹브라우저 연동
- **HTTPS 설정**: api.chackchack.co.kr 도메인 적용
- **입금 알림 UX**: 송금 앱 이동 후 알림 버튼 활성화

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
- ✅ QR 갤러리 저장 기능
- ✅ 카카오 소셜 로그인 완전 구현
- ✅ 계정 탈퇴 기능 (v1.0.2)

### 진행 중/미구현
- 🔄 푸시 알림 실제 전송 (FCM/APNS) - API 호출만 구현됨
- 🔄 QR 코드 스타일링 (로고, 색상) - 기본 흑백 QR만 생성
- 🔄 네이버, 구글 소셜 로그인 - UI만 구현, 기능 준비중

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

### Android 프로덕션 빌드
```bash
cd chackchack/frontend/android
./gradlew clean                    # 빌드 캐시 정리
NODE_ENV=production ./gradlew bundleRelease  # AAB 번들 생성

# 빌드 결과 위치:
# - AAB: ./app/build/outputs/bundle/release/app-release.aab
# - APK: ./app/build/outputs/apk/release/app-release.apk
```

**중요**: 빌드 전에 `android/app/build.gradle`에서 `signingConfig signingConfigs.release`가 설정되어 있는지 확인

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

### 카카오 OAuth 설정 🔑
**실제 착착(ChackChack) 프로젝트 카카오 앱 키**:
- **네이티브 앱 키**: `6b016d71ce5ad1c2b457a87013388800` (현재 사용 중 - dooboolab 테스트 키)
- **REST API 키**: `59c2d66ca38802a0850eccde7da4a597`
- **JavaScript 키**: `971f3aac1092af4f9c28a72f3bd02493`
- **어드민 키**: `9080b2e6b969605a5212841e7d728b98`

**⚠️ 현재 상태**:
- 카카오 개발자 콘솔에서는 "착착(chackchack)"으로 올바르게 등록됨
- 하지만 로그인 화면에서는 "dooboolab" 표시됨 (원인 불명)
- 어제까지 정상 작동했으나 오늘 갑자기 발생한 문제
- 카카오 네이티브 SDK로 완전 재구현 완료 (2025-09-25)

**🔍 문제 분석**:
- 앱 키 `6b016d71ce5ad1c2b457a87013388800`가 dooboolab과 착착 모두에 연관되어 있을 가능성
- 또는 카카오 서버 측 캐싱 문제

**✨ TODO**:
- 새 카카오 앱 생성 후 고유 키 발급 고려
- 또는 카카오 개발자 지원팀 문의

## 배포 정보

### 서버
- **API 서버**: https://api.chackchack.co.kr
- **EC2 인스턴스**: 3.39.96.52 (AWS Seoul Region)
- **SSL 인증서**: Let's Encrypt 적용

### Android 앱 서명 키스토어 🔑
- **프로덕션 키스토어**: `chakchak-release.keystore`
- **위치**: `/chackchack/frontend/chakchak-release.keystore`
- **패스워드**: `chakchak2024`
- **키 별칭**: `chakchak`
- **키 패스워드**: `chakchak2024`
- **SHA1 지문**: `96:3E:C2:8E:94:A4:EF:11:1E:36:70:DE:41:E2:7C:09:B4:EE:D0:F7`

**⚠️ 중요: 모든 프로덕션 빌드는 반드시 이 키스토어를 사용해야 함**

### 빌드 출력물 관리 📦
- **중앙화된 빌드 폴더**: `/Users/hanmyungsoo/project/chackchack/apk/`
- **포함 파일**: 모든 APK, AAB 빌드 결과물
- **명명 규칙**: `chackchack-v{버전}-{설명}-{날짜}.{apk|aab}`
- **주요 빌드 방법**:
  - **EAS Build**: `cd frontend && eas build -p android --profile preview` (권장, 진정한 standalone)
  - **Gradle Build**: `cd frontend/android && ./gradlew bundleRelease` (로컬 빌드)

### 최신 빌드
- **🎯 플레이스토어 제출용 AAB v1.0.13**: `/Users/hanmyungsoo/project/chackchack/apk/chackchack-v1.0.13-production-playstore.aab` (51MB)
- **EAS Build URL**: https://expo.dev/accounts/hanms/projects/chackchack/builds/63ff971f-30d2-4697-9df5-6aec721d7fcf
- **버전 코드**: 16
- **빌드 날짜**: 2025-10-25
- **서명**: 프로덕션 키스토어 (chakchak-release.keystore)
- **빌드 방식**: EAS Build production 프로필
- **상태**: ✅ 플레이스토어 제출 준비 완료

### 이전 빌드
- **프로덕션 AAB v1.0.9**: `/Users/hanmyungsoo/project/chackchack/apk/chackchack-v1.0.9-production-keystore.aab`
- **최신 Gradle 디버그**: `/Users/hanmyungsoo/project/chackchack/apk/chackchack-debug-gradle-20251025-191416.apk`

**⚠️ 주의**: Gradle로 빌드한 APK는 "Unable to load script" 에러 발생 (Metro 의존성 문제). 진정한 standalone APK는 EAS Build 사용 권장.

---

*이 문서는 새 세션 시작 시 프로젝트 컨텍스트를 빠르게 파악하기 위한 참고 자료입니다.*
*최종 업데이트: 2025-09-24 (v1.0.9 카카오 로그인 재구현 및 서명키 표준화)*