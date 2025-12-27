# 착착(ChackChack) 배포 가이드

## 🚀 빠른 시작

### 최신 APK 다운로드
- **v1.0.2 (2025-08-24)**: https://expo.dev/artifacts/eas/iKb7bmpL3xC3nqV5UPPoPG.apk

## 📱 Frontend (React Native) 배포

### 1. 환경 변수 설정
```javascript
// eas.json - production 프로필
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "credentialsSource": "local"
      },
      "env": {
        "NODE_ENV": "production",
        "EXPO_PUBLIC_API_URL": "https://api.chackchack.co.kr",
        "EXPO_PUBLIC_KAKAO_REST_API_KEY": "your-key",
        "EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY": "your-key",
        "EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY": "your-key"
      }
    }
  }
}
```

### 2. 빌드 명령어
```bash
# 코드 정리
node remove-console-logs.js

# 프로덕션 APK 빌드
eas build --platform android --profile production --clear-cache

# AAB 빌드 (Google Play Store용)
eas build --platform android --profile production --clear-cache
# eas.json에서 buildType을 "app-bundle"로 변경 필요
```

### 3. 버전 관리
```json
// app.json
{
  "expo": {
    "version": "1.0.2",  // 사용자에게 보이는 버전
    "android": {
      "versionCode": 3   // 내부 버전 코드 (매번 증가)
    }
  }
}
```

## 🖥 Backend (NestJS) 배포

### 1. 서버 접속
```bash
ssh -i "/path/to/chackchack_back.pem" ec2-user@3.39.96.52
```

### 2. 코드 업데이트
```bash
# 로컬에서 압축
tar -czf backend-src.tar.gz --exclude=node_modules --exclude=.git --exclude=dist src/

# 서버로 전송
scp -i "/path/to/chackchack_back.pem" backend-src.tar.gz ec2-user@3.39.96.52:~/

# 서버에서 압축 해제 및 빌드
ssh -i "/path/to/chackchack_back.pem" ec2-user@3.39.96.52
cd ~/backend
tar -xzf ../backend-src.tar.gz
npm run build
```

### 3. 환경변수 확인 및 수정
```bash
# 현재 BASE_URL 확인
cat ~/backend/.env | grep BASE_URL

# BASE_URL이 IP 주소로 설정된 경우 도메인으로 수정
sed -i 's|BASE_URL=http://3.39.96.52:3000|BASE_URL=https://api.chackchack.co.kr|g' ~/backend/.env

# 수정 사항 확인
cat ~/backend/.env | grep BASE_URL
```

### 4. 서버 재시작
```bash
# 기존 프로세스 확인
ps aux | grep 'node dist/main'

# 기존 프로세스 종료 (PID는 실제 값으로 대체)
kill [PID]

# 새 프로세스 시작
cd ~/backend
nohup node dist/main > server.log 2>&1 &
```

### 5. 서버 상태 확인
```bash
# 프로세스 확인
ps aux | grep node

# 로그 확인
tail -f ~/backend/server.log

# API 테스트
curl https://api.chackchack.co.kr/auth
```

## 🌐 도메인 및 SSL

### Nginx 설정
```nginx
server {
    listen 443 ssl;
    server_name api.chackchack.co.kr;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Let's Encrypt SSL 갱신
```bash
certbot renew --nginx
```

## 📝 체크리스트

### 배포 전 확인사항
- [ ] console.log 제거
- [ ] 환경 변수 확인 (production)
- [ ] 버전 번호 업데이트
- [ ] API 엔드포인트 확인
- [ ] 테스트 완료

### 배포 후 확인사항
- [ ] APK 설치 및 실행 테스트
- [ ] 로그인 기능 테스트
- [ ] QR 생성/수정/삭제 테스트
- [ ] **QR URL 도메인 확인**: 로그인 상태에서 생성한 QR이 `https://api.chackchack.co.kr`로 시작하는지 확인
- [ ] 계정 탈퇴 테스트
- [ ] 서버 로그 확인

## 🐛 트러블슈팅

### QR URL이 IP 주소로 나오는 경우
```bash
# 프로덕션 서버의 환경변수 확인
ssh -i "/path/to/chackchack_back.pem" ec2-user@3.39.96.52 "cat ~/backend/.env | grep BASE_URL"

# IP 주소로 설정된 경우 도메인으로 수정
ssh -i "/path/to/chackchack_back.pem" ec2-user@3.39.96.52 "sed -i 's|BASE_URL=http://3.39.96.52:3000|BASE_URL=https://api.chackchack.co.kr|g' ~/backend/.env"

# 서버 재시작
ssh -i "/path/to/chackchack_back.pem" ec2-user@3.39.96.52 "pkill -f 'node dist/main' && cd ~/backend && nohup node dist/main > server.log 2>&1 &"
```

### APK 설치 실패
```bash
# 기존 앱 제거 후 재설치
adb uninstall com.chackchack.app
adb install chackchack-production.apk
```

### 서버 연결 실패
```bash
# 방화벽 규칙 확인
sudo iptables -L

# 포트 확인
netstat -tlnp | grep 3000
```

### 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -U chackchack_user -d chackchack
```

## 📞 지원

문제 발생 시:
1. 서버 로그 확인: `tail -f ~/backend/server.log`
2. 에러 메시지 캡처
3. GitHub Issues에 보고

---

*최종 업데이트: 2025-08-26*