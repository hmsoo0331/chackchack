# 🚨 카카오 개발자 콘솔 필수 설정 (Critical)

## ✅ 체크리스트

### 1. Android 플랫폼 설정
- [ ] **패키지명**: `com.chackchack.app`
- [ ] **마켓 URL**: (선택사항)

### 2. 키 해시 등록 (모두 등록 필요!)
```
디버그 키 해시: (개발용)
S9uCfbOxJC0KnxRxDF5sVtyBsso=

릴리즈 키 해시: (프로덕션용) ⚠️ 필수!
lj7CjpSk7xEeNnDeQeJ8CbTu0Pc=
```

### 3. Redirect URI 등록 (2개 모두 필수!)
```
https://auth.expo.io/@hmsoo0331/chackchack  (Expo Go용)
chackchack://oauth                           (Standalone 앱용) ⚠️ 필수!
```

### 4. 카카오 로그인 활성화
- [ ] 카카오 로그인 ON
- [ ] OpenID Connect 활성화 OFF (사용 안함)

### 5. 동의 항목 설정
- [ ] 닉네임 (필수 동의)
- [ ] 프로필 사진 (선택 동의)
- [ ] 카카오계정(이메일) (선택 동의)

---

## 🔧 설정 방법

### 카카오 개발자 콘솔 접속
1. https://developers.kakao.com 접속
2. 내 애플리케이션 > 착착 앱 선택

### Android 플랫폼 등록
1. 플랫폼 > Android 플랫폼 등록
2. 패키지명: `com.chackchack.app` 입력
3. 키 해시 2개 모두 추가:
   - `S9uCfbOxJC0KnxRxDF5sVtyBsso=`
   - `lj7CjpSk7xEeNnDeQeJ8CbTu0Pc=`

### Redirect URI 등록
1. 카카오 로그인 > Redirect URI
2. 다음 2개 URI 추가:
   - `https://auth.expo.io/@hmsoo0331/chackchack`
   - `chackchack://oauth`

---

## ⚠️ 주의사항

1. **키 해시**: 릴리즈 키 해시 `lj7CjpSk7xEeNnDeQeJ8CbTu0Pc=`가 반드시 등록되어야 합니다.
2. **Redirect URI**: `chackchack://oauth`가 없으면 Standalone 앱에서 리다이렉트 실패합니다.
3. **패키지명**: 정확히 `com.chackchack.app`이어야 합니다.

---

## 🔍 검증 방법

1. 카카오 개발자 콘솔에서 위 설정들이 모두 저장되었는지 확인
2. 새 빌드 생성: `eas build --platform android --profile preview`
3. 빌드된 APK 설치 후 카카오 로그인 테스트
4. 성공 시: 앱으로 자동 리다이렉트됨
5. 실패 시: auth.expo.io 에러 페이지 표시

---

마지막 업데이트: 2025-08-16