# 착착 Backend

## 설정

1. PostgreSQL 데이터베이스 설정
2. `.env` 파일에서 데이터베이스 연결 정보 수정
3. 의존성 설치: `npm install`
4. 개발 서버 실행: `npm run start:dev`

## API 엔드포인트

- POST /auth/guest - 게스트 등록
- POST /auth/login - 소셜 로그인
- GET /qrcodes - QR코드 목록 조회
- POST /qrcodes - QR코드 생성
- GET /accounts - 계좌 목록 조회
- POST /accounts - 계좌 추가
- GET /notifications - 알림 목록 조회
- POST /notify/:qrId - 결제 알림 전송