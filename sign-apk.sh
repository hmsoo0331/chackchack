#!/bin/bash

# APK 서명 스크립트

echo "🔐 착착 APK 서명 프로세스"
echo "========================================"

# 변수 설정
UNSIGNED_APK="/Users/hanmyungsoo/Downloads/application-12f9f9da-4aeb-4dc7-a072-717527cb5d32.apk"
KEYSTORE="/Users/hanmyungsoo/project/chackchack/chackchack/frontend/chakchak-release.keystore"
SIGNED_APK="/Users/hanmyungsoo/project/chackchack/chackchack-v1.0.1-signed.apk"
ALIGNED_APK="/Users/hanmyungsoo/project/chackchack/chackchack-v1.0.1-aligned.apk"

# 1. 키스토어 확인
echo "🔑 1단계: 키스토어 확인"
echo "----------------------------------------"

if [ -f "$KEYSTORE" ]; then
    echo "✅ 키스토어 파일 발견: $KEYSTORE"
    echo "📝 키스토어 정보:"
    keytool -list -keystore "$KEYSTORE" -storepass chakchak123 2>/dev/null | grep -E "Alias|Entry type|Creation" | head -5
else
    echo "❌ 키스토어 파일을 찾을 수 없습니다."
    echo ""
    echo "🔧 새 키스토어 생성이 필요합니다:"
    echo "keytool -genkeypair -v -keystore chakchak-release.keystore -alias chakchak-release -keyalg RSA -keysize 2048 -validity 10000"
    exit 1
fi

echo ""
echo "📦 2단계: APK 서명"
echo "----------------------------------------"

# APK 서명 (jarsigner 사용)
if command -v jarsigner &> /dev/null; then
    echo "🔏 APK 서명 중..."
    
    # 서명 실행
    jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
        -keystore "$KEYSTORE" \
        -storepass chakchak123 \
        -keypass chakchak123 \
        -signedjar "$SIGNED_APK" \
        "$UNSIGNED_APK" \
        chakchak-release
    
    if [ $? -eq 0 ]; then
        echo "✅ APK 서명 완료!"
    else
        echo "❌ APK 서명 실패"
        exit 1
    fi
else
    echo "❌ jarsigner가 설치되지 않았습니다."
    echo "Java JDK를 설치해주세요."
    exit 1
fi

echo ""
echo "🔧 3단계: APK 정렬 (zipalign)"
echo "----------------------------------------"

# zipalign 확인
if command -v zipalign &> /dev/null; then
    echo "📐 APK 정렬 중..."
    zipalign -v 4 "$SIGNED_APK" "$ALIGNED_APK"
    
    if [ $? -eq 0 ]; then
        echo "✅ APK 정렬 완료!"
        FINAL_APK="$ALIGNED_APK"
    else
        echo "⚠️  APK 정렬 실패 (서명된 APK는 사용 가능)"
        FINAL_APK="$SIGNED_APK"
    fi
else
    echo "⚠️  zipalign이 설치되지 않았습니다."
    echo "Android SDK Build Tools를 설치하면 최적화된 APK를 만들 수 있습니다."
    FINAL_APK="$SIGNED_APK"
fi

echo ""
echo "🔐 4단계: 서명된 APK 키 해시 추출"
echo "----------------------------------------"

# 서명된 APK에서 키 해시 추출
cd /tmp
unzip -q -j "$FINAL_APK" META-INF/*.RSA META-INF/*.DSA 2>/dev/null

CERT_FILE=""
for file in *.RSA *.DSA; do
    if [ -f "$file" ]; then
        CERT_FILE="$file"
        break
    fi
done

if [ -n "$CERT_FILE" ]; then
    openssl pkcs7 -inform DER -in "$CERT_FILE" -print_certs -out cert.pem 2>/dev/null
    SHA1_HASH=$(openssl x509 -inform PEM -in cert.pem -noout -fingerprint -sha1 | cut -d= -f2 | tr -d ':')
    KEY_HASH=$(echo -n "$SHA1_HASH" | xxd -r -p | base64)
    
    echo "🔑 카카오용 키 해시: $KEY_HASH"
    
    # 정리
    rm -f *.RSA *.DSA cert.pem
else
    echo "❌ 키 해시 추출 실패"
fi

echo ""
echo "📱 5단계: 최종 APK 정보"
echo "----------------------------------------"
echo "✅ 서명된 APK: $FINAL_APK"
echo "📏 파일 크기: $(ls -lh "$FINAL_APK" | awk '{print $5}')"
echo ""
echo "🎯 다음 단계:"
echo "1. 카카오 개발자센터에 키 해시 등록: $KEY_HASH"
echo "2. 패키지명 확인: com.chackchack.app"
echo "3. Redirect URI 등록: chackchack://oauth"
echo "4. APK 설치 및 테스트: adb install $FINAL_APK"
echo ""
echo "========================================"
echo "✅ APK 서명 프로세스 완료!"