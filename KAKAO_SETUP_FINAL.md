# 🚨 카카오 개발자 콘솔 최종 설정

## ✅ 필수 체크리스트

### 1. Android 플랫폼 설정
- **패키지명**: `com.chackchack.app`
- **키 해시** (2개 모두 등록):
  - 디버그: `S9uCfbOxJC0KnxRxDF5sVtyBsso=`
  - 릴리즈: `lj7CjpSk7xEeNnDeQeJ8CbTu0Pc=` ⚠️ 필수!

### 2. Redirect URI 설정
카카오는 **HTTP/HTTPS 프로토콜만 허용**합니다!
- **등록할 URI**: `https://auth.expo.io/@hmsoo0331/chackchack`
- ⚠️ `chackchack://oauth`는 등록 불가 (커스텀 스킴 지원 안됨)

### 3. 카카오 로그인 설정
- 카카오 로그인: **활성화**
- OpenID Connect: **비활성화**

### 4. 동의 항목
- 닉네임: 필수 동의
- 프로필 사진: 선택 동의
- 카카오계정(이메일): 선택 동의

---

## 🔧 해결 방법

### AuthSession + Expo Proxy 사용
1. 카카오는 커스텀 스킴(`chackchack://`)을 지원하지 않음
2. `auth.expo.io`를 프록시로 사용하여 리다이렉트 처리
3. Standalone 앱에서도 `useProxy: true` 설정으로 동작

### 코드 구현
```javascript
// 모든 환경에서 동일한 URI 사용
const REDIRECT_URI = 'https://auth.expo.io/@hmsoo0331/chackchack';

// AuthSession으로 처리
const result = await request.promptAsync(discovery, {
  useProxy: true, // auth.expo.io 프록시 사용
});
```

---

## ⚠️ 중요 사항

1. **Expo Proxy 의존성**: auth.expo.io 서버가 중간 다리 역할
2. **Standalone 앱 지원**: `useProxy: true`로 모든 환경에서 동작
3. **릴리즈 키 해시**: 프로덕션 빌드는 반드시 릴리즈 키 해시 등록

---

## 🔍 테스트 방법

1. 설정 확인 후 새 빌드:
   ```bash
   eas build --platform android --profile preview
   ```

2. APK 설치 후 카카오 로그인 테스트

3. 성공 시나리오:
   - 카카오 로그인 → auth.expo.io → 앱으로 자동 리다이렉트

---

마지막 업데이트: 2025-08-17