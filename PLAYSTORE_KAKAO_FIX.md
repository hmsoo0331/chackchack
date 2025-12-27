# 플레이스토어 카카오 로그인 에러 해결 가이드

## 문제 상황
- APK 직접 설치: 카카오 로그인 성공 ✅
- 플레이스토어 다운로드: 카카오 로그인 실패 ❌

## 원인
Google Play App Signing이 활성화되어 있어, 구글이 앱을 자체 키로 재서명합니다.
따라서 개발자 키스토어의 키 해시와 실제 배포 앱의 키 해시가 다릅니다.

## 해결 방법

### 1단계: Google Play Console에서 SHA-1 인증서 확인

1. [Google Play Console](https://play.google.com/console) 접속
2. 착착 앱 선택
3. 왼쪽 메뉴: **설정** → **앱 무결성(App Integrity)**
4. **App signing** 탭 선택
5. "**App signing key certificate**" 섹션에서 **SHA-1 인증서 지문** 복사

예시:
```
SHA-1: A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6:Q7:R8:S9:T0
```

### 2단계: SHA-1을 Base64로 변환

#### 방법 1: 온라인 도구 사용 (추천)
1. https://base64.guru/converter/encode/hex 접속
2. SHA-1 지문에서 콜론(:) 제거
   - `A1:B2:C3...` → `A1B2C3...`
3. 변환된 Base64 값 복사

#### 방법 2: 터미널 명령어 (macOS/Linux)
```bash
# SHA-1을 hex 파일로 저장 (콜론 제거)
echo "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0" > sha1.txt

# Base64로 변환
xxd -r -p sha1.txt | openssl base64

# 또는 한 줄로:
echo "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0" | xxd -r -p | openssl base64
```

### 3단계: 카카오 개발자 콘솔에 키 해시 등록

1. [카카오 개발자 콘솔](https://developers.kakao.com) 접속
2. 착착 앱 선택
3. **앱 설정** → **플랫폼** 메뉴
4. Android 플랫폼의 **키 해시** 필드에 추가
   - 기존 키 해시는 그대로 두고, 새로운 키 해시를 추가로 입력
   - 여러 개의 키 해시 등록 가능 (개행으로 구분)

예시:
```
Xo8WBi6jzSxKDVR4drqm84yr9iU=  (Debug 키)
oJqxBLMVz... (개발자 Release 키)
xKl2Ns9Pw... (Google Play 서명 키) ← 새로 추가!
```

5. **저장** 버튼 클릭

### 4단계: 테스트

1. 플레이스토어에서 앱 재설치 (또는 캐시 삭제)
2. 카카오 로그인 테스트
3. 성공! 🎉

## 빠른 참고

### 현재 등록된 키 해시 확인
카카오 개발자 콘솔에서 현재 등록된 키 해시 목록을 확인하세요.

### 여러 키 해시 등록하기
개발/테스트를 위해 여러 키 해시를 등록할 수 있습니다:
- Debug 키 (에뮬레이터/개발)
- Release 키 (APK 직접 설치)
- Google Play 키 (플레이스토어 배포)

## 추가 확인사항

### Google Play App Signing이 활성화되어 있는지 확인
Play Console → 앱 무결성 → App signing 탭에서:
- "App signing by Google Play" 상태가 "Active"인지 확인
- Upload key certificate와 App signing key certificate가 다른지 확인

### 문제가 계속되면
1. 카카오 개발자 콘솔에서 키 해시가 올바르게 저장되었는지 확인
2. 앱 캐시 삭제 후 재시도
3. 카카오톡 앱 재설치 후 재시도
4. 로그 확인: `adb logcat | grep -E "KakaoAuth|ReactNativeJS"`

## 참고 자료
- [카카오 로그인 - 키 해시 등록](https://developers.kakao.com/docs/latest/ko/getting-started/app#add-key-hash)
- [Google Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)
