#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// app.json에서 패키지 정보 읽기
const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

console.log('🔍 착착 앱 정보 확인');
console.log('='.repeat(50));
console.log('📱 앱 이름:', appJson.expo.name);
console.log('📦 Android 패키지명:', appJson.expo.android.package);
console.log('🏷️  iOS Bundle ID:', appJson.expo.ios.bundleIdentifier);
console.log('🔧 App Slug:', appJson.expo.slug);
console.log('🌐 URL Scheme:', appJson.expo.scheme);

console.log('\n🔐 카카오 로그인 설정 확인');
console.log('='.repeat(50));

// Expo Auth Proxy 리다이렉트 URI (개발용)
const devRedirectUri = `https://auth.expo.io/@hmsoo0331/${appJson.expo.slug}`;
console.log('📍 개발용 Redirect URI:', devRedirectUri);

// 프로덕션용 리다이렉트 URI (Custom Scheme)
const prodRedirectUri = `${appJson.expo.scheme}://oauth`;
console.log('📍 프로덕션용 Redirect URI:', prodRedirectUri);

console.log('\n🔑 키 해시 생성 (Android)');
console.log('='.repeat(50));

// EAS 빌드용 임시 키 해시 (실제로는 EAS에서 확인해야 함)
console.log('⚠️  실제 키 해시는 다음 명령어로 확인하세요:');
console.log('   eas credentials -p android');
console.log('   또는 APK에서 직접 추출해야 합니다.');

console.log('\n📋 카카오 개발자센터 설정 체크리스트');
console.log('='.repeat(50));
console.log('1. ✅ 앱 키 확인');
console.log('   - REST API 키: 환경변수 EXPO_PUBLIC_KAKAO_REST_API_KEY');
console.log('2. ✅ 플랫폼 등록');
console.log('   - Android 플랫폼 추가');
console.log('   - 패키지명:', appJson.expo.android.package);
console.log('3. ✅ 키 해시 등록');
console.log('   - 빌드된 APK의 실제 키 해시 필요');
console.log('4. ✅ Redirect URI 등록');
console.log('   - 개발:', devRedirectUri);
console.log('   - 프로덕션:', prodRedirectUri);

console.log('\n🎯 다음 단계');
console.log('='.repeat(50));
console.log('1. 카카오 개발자센터(developers.kakao.com) 접속');
console.log('2. 내 애플리케이션 > 착착 앱 선택');
console.log('3. 앱 설정 > 플랫폼 에서 Android 플랫폼 확인/추가');
console.log('4. 패키지명과 키 해시 정확히 입력');
console.log('5. 제품 설정 > 카카오 로그인 에서 Redirect URI 등록');