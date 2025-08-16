#!/bin/bash

# 착착 앱 키 해시 추출 스크립트

echo "🔑 착착 APK 키 해시 추출"
echo "========================================"

APK_PATH="chackchack-v1.0.0-universal.apk"

if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK 파일을 찾을 수 없습니다: $APK_PATH"
    echo "현재 디렉토리의 APK 파일들:"
    ls -la *.apk 2>/dev/null || echo "APK 파일이 없습니다."
    exit 1
fi

echo "📦 APK 파일: $APK_PATH"

# 1. APK에서 인증서 추출
echo "🔍 1단계: APK에서 인증서 추출 중..."
unzip -j "$APK_PATH" META-INF/*.RSA META-INF/*.DSA 2>/dev/null

# 2. 인증서 파일 찾기
CERT_FILE=""
for file in *.RSA *.DSA; do
    if [ -f "$file" ]; then
        CERT_FILE="$file"
        break
    fi
done

if [ -z "$CERT_FILE" ]; then
    echo "❌ 인증서 파일을 찾을 수 없습니다."
    exit 1
fi

echo "📄 인증서 파일: $CERT_FILE"

# 3. 인증서를 PEM 형식으로 변환
echo "🔄 2단계: 인증서를 PEM 형식으로 변환..."
openssl pkcs7 -inform DER -in "$CERT_FILE" -print_certs -out cert.pem 2>/dev/null

if [ ! -f "cert.pem" ]; then
    echo "❌ 인증서 변환에 실패했습니다."
    exit 1
fi

# 4. SHA1 해시 추출
echo "🔐 3단계: SHA1 해시 계산..."
SHA1_HASH=$(openssl x509 -inform PEM -in cert.pem -noout -fingerprint -sha1 | cut -d= -f2 | tr -d ':')

if [ -z "$SHA1_HASH" ]; then
    echo "❌ SHA1 해시 추출에 실패했습니다."
    exit 1
fi

# 5. Base64 인코딩 (카카오용)
echo "📝 4단계: Base64 인코딩..."
KEY_HASH=$(echo -n "$SHA1_HASH" | xxd -r -p | base64)

echo ""
echo "✅ 키 해시 추출 완료!"
echo "========================================"
echo "🔑 SHA1 Fingerprint: $SHA1_HASH"
echo "🔐 카카오용 키 해시: $KEY_HASH"
echo ""
echo "📋 다음 작업:"
echo "1. 카카오 개발자센터 접속"
echo "2. 내 애플리케이션 > 착착 선택"
echo "3. 앱 설정 > 플랫폼 > Android"
echo "4. 패키지명: com.chackchack.app"
echo "5. 키 해시: $KEY_HASH"
echo ""

# 임시 파일 정리
rm -f *.RSA *.DSA cert.pem

echo "🧹 임시 파일 정리 완료"