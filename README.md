# 착착 (ChackChack) - 가장 쉬운 계좌이체 QR 만들기

소상공인을 위한 로그인 없는 첫 경험을 제공하는 계좌이체 QR코드 생성 앱

## 프로젝트 구조

```
chackchack/
├── backend/        # NestJS 백엔드 서버
├── frontend/       # React Native (Expo) 모바일 앱
└── ui/            # UI 디자인 참고 이미지
```

## 시작하기

### 백엔드 실행
```bash
cd chackchack/backend
npm install
npm run start:dev
```

### 프론트엔드 실행
```bash
cd chackchack/frontend
npm install
npm start
```

## 핵심 기능

- 로그인 없이 즉시 QR코드 생성 가능
- 기기 로컬 저장 지원
- 소셜 로그인 후 클라우드 동기화
- 금액/할인 설정 가능
- 손님용 빠른 송금 웹 인터페이스

## 기술 스택

- **Backend**: NestJS, TypeORM, PostgreSQL
- **Frontend**: React Native, Expo, TypeScript
- **State Management**: Zustand
- **Navigation**: React Navigation