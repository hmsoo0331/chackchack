# 착착 앱 테스트 가이드

## 1. 스마트폰으로 테스트하기 (추천)

### 준비
1. iPhone/Android에 **Expo Go** 앱 설치
   - iPhone: App Store → "Expo Go"
   - Android: Play Store → "Expo Go"

### 실행 방법
1. 터미널에서 frontend 폴더로 이동:
   ```bash
   cd /Users/hanmyungsoo/project/chackchack/chackchack/frontend
   ```

2. 개발 서버 시작:
   ```bash
   npm start
   ```

3. QR코드가 터미널에 나타나면 Expo Go 앱으로 스캔
   - iPhone: Expo Go 앱에서 "Scan QR Code" 버튼
   - Android: Expo Go 앱에서 "Scan QR Code" 버튼

4. 앱이 폰에서 실행됩니다!

## 2. iOS 시뮬레이터로 테스트하기

### 준비 (한번만)
1. App Store에서 **Xcode** 설치 (무료, 용량 큼)
2. Xcode 실행 후 라이선스 동의
3. 터미널에서 실행:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

### 실행 방법
```bash
cd /Users/hanmyungsoo/project/chackchack/chackchack/frontend
npm run ios
```

## 3. Android 에뮬레이터로 테스트하기

### 준비 (한번만)
1. Android Studio 설치
2. AVD Manager에서 가상기기 생성

### 실행 방법
```bash
cd /Users/hanmyungsoo/project/chackchack/chackchack/frontend
npm run android
```

## 4. 웹 브라우저로 테스트하기 (제한적)

```bash
cd /Users/hanmyungsoo/project/chackchack/chackchack/frontend
npm run web
```
*주의: 일부 네이티브 기능은 웹에서 작동하지 않을 수 있습니다*

## 추천 순서
1. **스마트폰 + Expo Go** (가장 쉽고 실제 환경)
2. **iOS 시뮬레이터** (Mac에서 iPhone 환경 테스트)
3. **Android 에뮬레이터** (안드로이드 환경 테스트)
4. **웹 브라우저** (빠른 UI 확인용)

## 백엔드 서버도 함께 실행하기

다른 터미널에서:
```bash
cd /Users/hanmyungsoo/project/chackchack/chackchack/backend
npm run start:dev
```

이제 앱에서 QR코드 생성, 로그인 등 모든 기능을 테스트할 수 있습니다!