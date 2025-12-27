# 카카오 로그인 구현 가이드

## 개요
이 프로젝트는 `@react-native-seoul/kakao-login` 라이브러리를 사용하여 카카오 로그인을 구현합니다.

## 구현된 기능

### 1. 카카오 로그인 서비스 (`src/services/kakaoAuth.ts`)
- **signInWithKakao()**: 카카오 로그인 실행 (카카오톡 앱 or 카카오계정)
- **signOut()**: 로그아웃
- **unlinkKakao()**: 카카오 연결 해제
- **getCurrentProfile()**: 현재 사용자 프로필 조회
- **checkLoginStatus()**: 로그인 상태 확인

### 2. 로그인 화면 (`src/screens/LoginScreen.tsx`)
- 카카오 로그인 버튼 클릭 시 `kakaoAuth.signInWithKakao()` 호출
- 성공 시 백엔드 JWT 토큰 받아서 앱 상태 업데이트
- 실패 시 사용자에게 친절한 에러 메시지 표시

## Android 설정

### 1. AndroidManifest.xml
```xml
<meta-data
  android:name="com.kakao.sdk.AppKey"
  android:value="6b016d71ce5ad1c2b457a87013388800"/>

<activity
  android:name="com.kakao.sdk.auth.AuthCodeHandlerActivity"
  android:exported="true"
  android:launchMode="singleTask">
  <intent-filter android:priority="999">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
      android:host="oauth"
      android:scheme="kakao6b016d71ce5ad1c2b457a87013388800" />
  </intent-filter>
</activity>
```

### 2. strings.xml
```xml
<string name="kakao_app_key">6b016d71ce5ad1c2b457a87013388800</string>
```

### 3. app.json
```json
{
  "scheme": "kakao6b016d71ce5ad1c2b457a87013388800",
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "category": ["DEFAULT", "BROWSABLE"],
        "data": {
          "scheme": "kakao6b016d71ce5ad1c2b457a87013388800"
        }
      }
    ]
  }
}
```

## 빌드 및 테스트

### 1. 의존성 설치
```bash
cd frontend
npm install
```

### 2. Android 빌드 클린
```bash
cd android
./gradlew clean
```

### 3. 프로덕션 빌드 (AAB)
```bash
# 프로덕션 환경 변수 설정
export NODE_ENV=production

# AAB 번들 생성
./gradlew bundleRelease
```

빌드 결과: `android/app/build/outputs/bundle/release/app-release.aab`

### 4. 디버그 APK 빌드 (테스트용)
```bash
./gradlew assembleDebug
```

빌드 결과: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5. 실제 기기에서 테스트
```bash
# 1. USB로 기기 연결
# 2. 개발자 옵션 활성화
# 3. USB 디버깅 허용

# APK 설치
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 또는 Expo를 통한 실행
npm start
# a 키를 눌러 Android에서 실행
```

## 테스트 체크리스트

### 카카오톡 앱이 설치된 경우
- [ ] "카카오로 시작하기" 버튼 클릭
- [ ] 카카오톡 앱이 자동으로 열림
- [ ] 카카오톡에서 로그인 승인
- [ ] 앱으로 자동 복귀
- [ ] 메인 화면으로 이동 확인

### 카카오톡 앱이 없는 경우
- [ ] "카카오로 시작하기" 버튼 클릭
- [ ] 브라우저에서 카카오계정 로그인 페이지 열림
- [ ] 이메일/비밀번호로 로그인
- [ ] 앱으로 자동 복귀
- [ ] 메인 화면으로 이동 확인

### 에러 케이스
- [ ] 로그인 취소 시 적절한 메시지 표시
- [ ] 네트워크 오류 시 재시도 안내
- [ ] 백엔드 서버 오류 시 명확한 에러 메시지

## 문제 해결

### 1. "카카오톡 앱이 설치되어 있지 않거나 로그인에 실패했습니다" 에러
**원인:**
- 카카오 앱 키가 잘못 설정됨
- 키 해시가 카카오 개발자 콘솔에 등록되지 않음
- AndroidManifest.xml 설정 누락

**해결:**
1. 카카오 개발자 콘솔에서 앱 키 확인
2. 키 해시 등록 확인 (Debug/Release 각각)
3. AndroidManifest.xml의 scheme 확인: `kakao{앱_키}`

### 2. 키 해시 생성 방법
```bash
# Debug 키 해시
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64

# Release 키 해시
keytool -exportcert -alias chakchak -keystore ./chakchak-release.keystore | openssl sha1 -binary | openssl base64
```

### 3. 로그 확인
```bash
# 앱 실행 중 로그 확인
adb logcat | grep -E "KakaoAuth|ReactNativeJS"
```

## 카카오 개발자 콘솔 설정

1. **플랫폼 등록**
   - Android 플랫폼 추가
   - 패키지명: `com.chackchack.app`
   - 마켓 URL: (추후 플레이스토어 등록 후)
   - 키 해시: Debug와 Release 키 해시 모두 등록

2. **카카오 로그인 활성화**
   - 카카오 로그인 ON
   - Redirect URI: 기본값 사용

3. **동의 항목 설정**
   - 닉네임 (필수)
   - 이메일 (선택)

## 참고 자료
- [@react-native-seoul/kakao-login](https://github.com/react-native-seoul/react-native-kakao-login)
- [카카오 로그인 공식 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
