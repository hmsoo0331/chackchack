# Android Studio 에뮬레이터 설정 가이드

## 1. 설치 진행 상황
- ⏳ **Android Studio**: 설치 중 (brew install --cask android-studio)
- ⏳ **OpenJDK 17**: 설치 중 (brew install openjdk@17)

## 2. 설치 완료 후 설정 단계

### 2.1 Android Studio 초기 설정
1. **Android Studio 실행**
   ```bash
   open /Applications/Android\ Studio.app
   ```

2. **초기 설정 마법사**
   - "Import Android Studio Settings" → "Do not import settings"
   - "Install Type" → "Standard"
   - UI Theme 선택 (Light/Dark)
   - SDK Components Setup 확인
   - License Agreement 동의

### 2.2 SDK 및 에뮬레이터 설정
1. **SDK Manager 열기**
   - Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
   
2. **필수 SDK 설치**
   - Android 14 (API 34) - 최신
   - Android 13 (API 33) - 착착 앱 타겟
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android Emulator
   - Intel x86 Emulator Accelerator (HAXM) - Intel Mac용
   
3. **SDK Tools 탭에서 설치**
   - Android SDK Command-line Tools
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools

### 2.3 AVD (Android Virtual Device) 생성
1. **AVD Manager 열기**
   - Tools → AVD Manager
   
2. **Create Virtual Device**
   - Phone → Pixel 6 또는 Pixel 7 선택
   - System Image: API 33 (Android 13) 선택
   - AVD Name: "ChackChack_Test"
   - Advanced Settings:
     - RAM: 2048 MB
     - VM heap: 256 MB
     - Internal Storage: 2048 MB

### 2.4 환경 변수 설정
`.zshrc` 파일에 추가:
```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Java
export JAVA_HOME=/usr/local/opt/openjdk@17
export PATH=$PATH:$JAVA_HOME/bin
```

설정 적용:
```bash
source ~/.zshrc
```

## 3. React Native 프로젝트 연동

### 3.1 프로젝트 디렉토리로 이동
```bash
cd /Users/hanmyungsoo/project/chackchack/chackchack/frontend
```

### 3.2 Metro 서버 시작
```bash
npx react-native start
# 또는
npm start
```

### 3.3 에뮬레이터 실행
새 터미널에서:
```bash
# 에뮬레이터 목록 확인
emulator -list-avds

# 에뮬레이터 실행
emulator -avd ChackChack_Test
```

### 3.4 앱 실행
```bash
npx react-native run-android
# 또는
npm run android
```

## 4. 디버깅 도구

### 4.1 Chrome DevTools
- 에뮬레이터에서 Cmd+M (Mac) 또는 Ctrl+M (Windows/Linux)
- "Debug with Chrome" 선택

### 4.2 React Native Debugger
```bash
brew install --cask react-native-debugger
```

### 4.3 Logcat 로그 확인
```bash
adb logcat | grep -i kakao  # 카카오 관련 로그만
adb logcat | grep -i chackchack  # 착착 앱 로그만
```

## 5. 문제 해결

### 5.1 에뮬레이터가 느린 경우
- AVD 설정에서 Graphics: Hardware - GLES 2.0 선택
- Cold Boot 대신 Quick Boot 사용

### 5.2 Metro 서버 연결 실패
```bash
adb reverse tcp:8081 tcp:8081
```

### 5.3 빌드 에러
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## 6. 카카오 로그인 테스트

### 6.1 에뮬레이터에서 카카오 앱 설치
1. APK 다운로드 (선택사항)
2. 또는 웹 브라우저로 로그인 테스트

### 6.2 디버깅 로그 확인
```bash
# 카카오 OAuth 관련 로그
adb logcat | grep -E "kakao|oauth|auth"

# 네트워크 요청 확인
adb logcat | grep -E "http|network"
```

---

**참고**: 
- M1/M2 Mac: ARM 기반 에뮬레이터 이미지 사용
- Intel Mac: x86/x86_64 이미지 사용
- 에뮬레이터 대신 실제 기기 사용 가능 (USB 디버깅 활성화 필요)