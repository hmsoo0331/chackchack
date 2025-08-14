# 카카오 로그인 구현 가이드

## ✅ 구현 완료 사항

### 1. 패키지 설치
- `expo-auth-session`: OAuth 2.0 인증 처리
- `expo-crypto`: 보안 처리
- `expo-web-browser`: 웹 브라우저 제어

### 2. 환경 변수 설정
`.env.development` 및 `.env.production` 파일에 카카오 API 키 추가:
```env
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=6b016d71ce5ad1c2b457a87013388800
EXPO_PUBLIC_KAKAO_REST_API_KEY=59c2d66ca38802a0850eccde7da4a597
EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY=971f3aac1092af4f9c28a72f3bd02493
```

### 3. 카카오 인증 서비스
`src/services/kakaoAuth.ts` 파일 생성:
- `signInWithKakao()`: 카카오 로그인 처리
- `exchangeCodeForToken()`: 인증 코드 → 액세스 토큰 교환
- `fetchKakaoUserInfo()`: 사용자 정보 조회
- `signOutFromKakao()`: 로그아웃
- `unlinkKakaoAccount()`: 연결 끊기 (회원 탈퇴)

### 4. LoginScreen 통합
- 실제 카카오 OAuth 로그인 구현
- 카카오 공식 색상 적용 (#FEE500)
- 사용자 정보 백엔드 전송

### 5. 카카오 개발자센터 설정
#### Redirect URI
- 메인: `https://auth.expo.io/@hmsoo0331/chackchack`
- 커스텀: `chackchack://auth/kakao`

#### 플랫폼
- Android: `com.chackchack.app`
- iOS: `com.chackchack.app`

## 🚀 테스트 방법

### 1. 개발 서버 실행
```bash
cd chackchack/frontend
npx expo start
```

### 2. Expo Go 앱에서 테스트
1. Expo Go 앱 실행
2. QR 코드 스캔
3. 로그인 화면에서 "카카오톡으로 시작하기" 버튼 클릭
4. 카카오 로그인 페이지에서 인증
5. 앱으로 자동 리다이렉트

### 3. 콘솔 로그 확인
```javascript
// 확인 가능한 로그
- Kakao Redirect URI: [실제 리다이렉트 URI]
- 카카오 로그인 시작...
- Kakao Auth Result: [인증 결과]
- 카카오 사용자 정보: [사용자 데이터]
- 카카오 로그인 성공: {email, nickname}
```

## ⚠️ 주의사항

### Expo Go 제한사항
- Expo Go에서는 `exp://` 스킴 사용
- 독립 앱 빌드 시 `chackchack://` 스킴 사용

### 토큰 관리
- 카카오 액세스 토큰: AsyncStorage에 저장
- 앱 자체 JWT 토큰: 별도 관리

### 에러 처리
- 사용자 취소: USER_CANCELLED
- 네트워크 오류: 적절한 에러 메시지 표시
- 토큰 만료: 리프레시 토큰으로 갱신

## 📱 실제 배포 시

### 1. EAS Build
```bash
eas build --platform android
eas build --platform ios
```

### 2. 앱 스토어 등록
- Google Play Store: 패키지명 등록
- Apple App Store: 번들 ID 등록

### 3. 카카오 개발자센터 업데이트
- 앱 스토어 URL 추가
- 실제 배포용 키 해시 등록

## 🔧 추가 구현 가능 기능

1. **카카오 친구 목록**: 친구에게 QR 공유
2. **카카오페이 연동**: 직접 결제 기능
3. **카카오톡 메시지**: QR 코드 전송
4. **카카오 스토리**: QR 코드 공유

## 📞 지원

문제 발생 시 다음을 확인하세요:
1. 카카오 개발자센터 설정
2. 환경 변수 파일
3. 네트워크 연결 상태
4. Expo Go 앱 버전

---

*Last Updated: 2025-08-14*
*ChackChack v1.0*