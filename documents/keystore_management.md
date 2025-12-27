# 착착(ChackChack) 키스토어 관리 가이드

**⚠️ 주의: 이 문서는 민감한 키스토어 정보를 포함하고 있습니다. 공개 저장소에 업로드하지 마세요.**

## 개요

Android 앱을 Google Play Store에 배포하려면 릴리즈 인증서로 서명된 AAB/APK 파일이 필요합니다. 이 문서는 착착 프로젝트의 키스토어 관리 및 앱 서명 과정을 설명합니다.

## 현재 키스토어 정보 (v1.0.0부터 사용)

### 📋 키스토어 파일 정보
- **파일명**: `chakchak-release-new.keystore`
- **위치**: `/Users/hanmyungsoo/project/chackchack/chackchack/frontend/`
- **생성 날짜**: 2025-08-26
- **키 별칭**: `chakchak-release`
- **키 타입**: RSA 2048비트
- **서명 알고리즘**: SHA256withRSA
- **유효 기간**: 10,000일 (약 27년)

### 🔐 인증서 정보
```
CN=ChackChack, OU=Development, O=ChackChack, L=Seoul, ST=Seoul, C=KR
```

### 🔑 키스토어 패스워드
- **스토어 패스워드**: `chackchack123`
- **키 패스워드**: `chackchack123`

## 키스토어 생성 명령어

```bash
# 키스토어 생성 (이미 생성됨 - 참고용)
keytool -genkeypair -v \
  -keystore chakchak-release-new.keystore \
  -alias chakchak-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass chackchack123 \
  -keypass chackchack123 \
  -dname "CN=ChackChack, OU=Development, O=ChackChack, L=Seoul, ST=Seoul, C=KR"
```

## Gradle 설정

`/chackchack/frontend/android/app/build.gradle`에 다음 설정이 적용되어 있습니다:

```gradle
android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file('../../chakchak-release-new.keystore')
            storePassword 'chackchack123'
            keyAlias 'chakchak-release'
            keyPassword 'chackchack123'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // 릴리즈 빌드에 릴리즈 키스토어 사용
            signingConfig signingConfigs.release
            shrinkResources (findProperty('android.enableShrinkResourcesInReleaseBuilds')?.toBoolean() ?: false)
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

## AAB 빌드 과정

### 1. 릴리즈 AAB 빌드
```bash
cd /Users/hanmyungsoo/project/chackchack/chackchack/frontend/android
NODE_ENV=production ./gradlew bundleRelease --no-daemon
```

### 2. AAB 파일 위치 확인
```bash
# 빌드된 AAB 파일 위치
/Users/hanmyungsoo/project/chackchack/chackchack/frontend/android/app/build/outputs/bundle/release/app-release.aab
```

### 3. 프로젝트 루트로 복사
```bash
cd /Users/hanmyungsoo/project/chackchack
cp "chackchack/frontend/android/app/build/outputs/bundle/release/app-release.aab" "chackchack-v1.0.0-final-signed.aab"
```

## 서명 검증 명령어

### AAB 파일 유효성 검사
```bash
java -jar bundletool.jar validate --bundle chackchack-v1.0.0-final-signed.aab
```

### 서명 인증서 확인
```bash
jarsigner -verify -verbose -certs chackchack-v1.0.0-final-signed.aab | grep "CN="
```

**기대 결과**: `X.509, CN=ChackChack, OU=Development, O=ChackChack, L=Seoul, ST=Seoul, C=KR`

## 문제 해결 가이드

### ❌ 디버그 인증서로 서명된 경우
**증상**: Google Play Console에서 "디버그 인증서로 서명됨" 오류

**해결 방법**:
1. `build.gradle`의 release buildType에서 `signingConfig signingConfigs.release` 확인
2. 키스토어 파일 경로가 올바른지 확인
3. clean 후 다시 빌드: `./gradlew clean && NODE_ENV=production ./gradlew bundleRelease`

### ❌ 키스토어 패스워드 오류
**증상**: `keystore password was incorrect`

**해결 방법**:
1. `build.gradle`에서 storePassword와 keyPassword 확인
2. 키스토어 파일이 손상되지 않았는지 확인:
   ```bash
   keytool -list -v -keystore chakchak-release-new.keystore -storepass chackchack123
   ```

### ❌ AAB 파일 손상
**증상**: `invalid entry compressed size` 또는 유사한 오류

**해결 방법**:
1. clean 빌드 실행: `./gradlew clean`
2. 새로 빌드: `NODE_ENV=production ./gradlew bundleRelease`

## 보안 주의사항

### 🔒 키스토어 파일 관리
1. **백업**: 키스토어 파일을 안전한 위치에 백업
2. **권한**: 파일 권한을 600으로 제한
3. **버전 관리**: .gitignore에 키스토어 파일 추가 (이미 적용됨)

### 📝 패스워드 관리
1. **문서화**: 이 문서에 기록 (비공개 저장소에서만)
2. **공유 금지**: 패스워드를 공개 채널에 공유하지 않기
3. **정기 변경**: 필요시 새 키스토어 생성 고려

## 권한 최적화 (v1.0.0)

### 🚫 제거된 불필요한 권한
Google Play Console의 최소 권한 원칙에 따라 다음 권한들을 제거했습니다:

1. **`android.permission.READ_MEDIA_VIDEO`** - 동영상 액세스 권한 (동영상 기능 없음)
2. **`android.permission.ACCESS_MEDIA_LOCATION`** - 미디어 위치 정보 (불필요)
3. **`android.permission.SYSTEM_ALERT_WINDOW`** - 시스템 오버레이 (사용하지 않음)
4. **`android.permission.VIBRATE`** - 진동 권한 (사용하지 않음)

### ✅ 유지된 필수 권한
```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

### 📱 Expo Media Library 설정 최적화
```json
{
  "isPhotosEnabled": true,
  "isVideosEnabled": false,
  "isAccessMediaLocationEnabled": false
}
```

## 버전 히스토리

### v1.0.0 (2025-08-26)
- **이슈 1**: 기존 키스토어 패스워드 불일치로 인한 Google Play Store 업로드 실패
- **해결 1**: 새로운 릴리즈 키스토어 `chakchak-release-new.keystore` 생성
- **이슈 2**: READ_MEDIA_VIDEO 권한으로 인한 최소 권한 원칙 위배
- **해결 2**: 불필요한 권한 4개 제거 및 expo-media-library 설정 최적화
- **결과**: Google Play Store 심사 통과 가능한 최적화된 AAB 파일 생성

### 향후 계획
- iOS 배포 시 Apple Developer Program 인증서 관리 필요
- 자동화된 CI/CD 파이프라인에서 키스토어 관리 고려

## 체크리스트 - Google Play Store 배포 전

- [ ] 키스토어 파일 존재 확인
- [ ] build.gradle 서명 설정 확인
- [ ] 릴리즈 빌드 성공 확인
- [ ] AAB 파일 서명 검증 완료
- [ ] bundletool 유효성 검사 통과
- [ ] 파일 크기 확인 (50MB 이하 권장)

---

**마지막 업데이트**: 2025-08-26  
**작성자**: Claude Code Assistant  
**용도**: 착착 프로젝트 키스토어 관리 및 배포 가이드  
**버전**: 1.0.0

**⚠️ 중요**: 이 문서의 키스토어 정보는 절대 외부에 공개하지 마세요. 키스토어를 분실하면 Google Play Store에서 앱을 업데이트할 수 없습니다.