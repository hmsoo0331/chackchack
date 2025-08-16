#!/bin/bash

# 새 APK 분석 스크립트

APK_PATH="/Users/hanmyungsoo/Downloads/application-12f9f9da-4aeb-4dc7-a072-717527cb5d32.apk"
WORK_DIR="/tmp/apk_analysis_$$"

echo "📱 착착 APK 파일 분석"
echo "========================================"
echo "📦 APK 파일: $(basename "$APK_PATH")"
echo "📏 파일 크기: $(ls -lh "$APK_PATH" | awk '{print $5}')"
echo "📅 빌드 시간: $(ls -lT "$APK_PATH" | awk '{print $6, $7, $8, $9}')"
echo ""

# 작업 디렉토리 생성
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo "🔍 1. 패키지 정보 추출"
echo "----------------------------------------"
# aapt가 없으면 기본 정보만 추출
if command -v aapt &> /dev/null; then
    aapt dump badging "$APK_PATH" | grep -E "package:|application-label:|versionCode|versionName|native-code|sdkVersion"
else
    echo "⚠️  aapt가 설치되지 않음. 기본 분석만 수행합니다."
fi

echo ""
echo "🔐 2. 인증서 및 키 해시 추출"
echo "----------------------------------------"

# APK에서 인증서 추출
unzip -q -j "$APK_PATH" META-INF/*.RSA META-INF/*.DSA 2>/dev/null

# 인증서 파일 찾기
CERT_FILE=""
for file in *.RSA *.DSA; do
    if [ -f "$file" ]; then
        CERT_FILE="$file"
        break
    fi
done

if [ -n "$CERT_FILE" ]; then
    echo "📄 인증서 파일: $CERT_FILE"
    
    # 인증서를 PEM 형식으로 변환
    openssl pkcs7 -inform DER -in "$CERT_FILE" -print_certs -out cert.pem 2>/dev/null
    
    if [ -f "cert.pem" ]; then
        # 인증서 정보 출력
        echo "📝 인증서 정보:"
        openssl x509 -in cert.pem -noout -subject -issuer -dates | sed 's/^/   /'
        
        # SHA1 해시 추출
        SHA1_HASH=$(openssl x509 -inform PEM -in cert.pem -noout -fingerprint -sha1 | cut -d= -f2 | tr -d ':')
        
        # SHA256 해시 추출  
        SHA256_HASH=$(openssl x509 -inform PEM -in cert.pem -noout -fingerprint -sha256 | cut -d= -f2 | tr -d ':')
        
        # Base64 인코딩 (카카오용)
        KEY_HASH=$(echo -n "$SHA1_HASH" | xxd -r -p | base64)
        
        echo ""
        echo "🔑 키 해시:"
        echo "   SHA1: $SHA1_HASH"
        echo "   SHA256: $SHA256_HASH"
        echo "   카카오용 Base64: $KEY_HASH"
    fi
else
    echo "❌ 인증서를 찾을 수 없습니다."
fi

echo ""
echo "📋 3. AndroidManifest.xml 정보"
echo "----------------------------------------"

# AndroidManifest.xml 추출
unzip -q -j "$APK_PATH" AndroidManifest.xml 2>/dev/null

if [ -f "AndroidManifest.xml" ]; then
    echo "✅ AndroidManifest.xml 추출 완료"
    
    # scheme 정보 확인 (바이너리 파일이라 strings로 확인)
    echo "🔗 URL Scheme 검색:"
    strings AndroidManifest.xml | grep -E "chackchack|scheme" | head -5 | sed 's/^/   /'
    
    echo ""
    echo "📦 패키지명 검색:"
    strings AndroidManifest.xml | grep -E "com\.chackchack" | head -3 | sed 's/^/   /'
else
    echo "❌ AndroidManifest.xml을 찾을 수 없습니다."
fi

echo ""
echo "🎯 4. APK 내용 요약"
echo "----------------------------------------"

# APK 내 주요 파일들 확인
echo "📂 주요 디렉토리 구조:"
unzip -l "$APK_PATH" | grep -E "^[[:space:]]+[0-9]+" | awk '{print $4}' | cut -d/ -f1 | sort -u | head -10 | sed 's/^/   /'

echo ""
echo "🔄 5. 이전 APK와 비교"
echo "----------------------------------------"

OLD_APK="/Users/hanmyungsoo/project/chackchack/chackchack-v1.0.0-universal.apk"
if [ -f "$OLD_APK" ]; then
    OLD_SIZE=$(ls -l "$OLD_APK" | awk '{print $5}')
    NEW_SIZE=$(ls -l "$APK_PATH" | awk '{print $5}')
    
    echo "📊 파일 크기 비교:"
    echo "   이전 APK: $(echo $OLD_SIZE | awk '{printf "%.1f MB", $1/1024/1024}')"
    echo "   새 APK: $(echo $NEW_SIZE | awk '{printf "%.1f MB", $1/1024/1024}')"
    
    # 키 해시 비교를 위해 이전 APK 키 해시 추출
    OLD_WORK_DIR="/tmp/old_apk_$$"
    mkdir -p "$OLD_WORK_DIR"
    cd "$OLD_WORK_DIR"
    
    unzip -q -j "$OLD_APK" META-INF/*.RSA META-INF/*.DSA 2>/dev/null
    OLD_CERT_FILE=""
    for file in *.RSA *.DSA; do
        if [ -f "$file" ]; then
            OLD_CERT_FILE="$file"
            break
        fi
    done
    
    if [ -n "$OLD_CERT_FILE" ]; then
        openssl pkcs7 -inform DER -in "$OLD_CERT_FILE" -print_certs -out old_cert.pem 2>/dev/null
        OLD_SHA1=$(openssl x509 -inform PEM -in old_cert.pem -noout -fingerprint -sha1 | cut -d= -f2 | tr -d ':')
        OLD_KEY_HASH=$(echo -n "$OLD_SHA1" | xxd -r -p | base64)
        
        echo ""
        echo "🔑 키 해시 비교:"
        echo "   이전 APK: $OLD_KEY_HASH"
        echo "   새 APK: $KEY_HASH"
        
        if [ "$OLD_KEY_HASH" = "$KEY_HASH" ]; then
            echo "   ✅ 키 해시 동일 (같은 서명)"
        else
            echo "   ⚠️  키 해시 다름 (다른 서명)"
        fi
    fi
    
    cd "$WORK_DIR"
    rm -rf "$OLD_WORK_DIR"
else
    echo "⚠️  이전 APK 파일을 찾을 수 없습니다."
fi

echo ""
echo "✨ 6. 카카오 로그인 설정 확인사항"
echo "----------------------------------------"
echo "📋 카카오 개발자센터에 등록해야 할 정보:"
echo "   1. 패키지명: com.chackchack.app"
echo "   2. 키 해시: $KEY_HASH"
echo "   3. Redirect URI: chackchack://oauth"
echo ""
echo "🔧 앱 설정 확인사항:"
echo "   - URL Scheme: chackchack"
echo "   - Intent Filter: 설정됨"
echo "   - 버전: 확인 필요"

# 정리
cd /
rm -rf "$WORK_DIR"

echo ""
echo "========================================"
echo "✅ APK 분석 완료!"