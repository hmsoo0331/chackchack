# 착착 웹사이트 배포 가이드

## 📋 개요
착착 랜딩 페이지와 법적 고지 페이지를 AWS EC2 서버에 배포하는 가이드입니다.

## 🔄 변경사항
- `index.html` → 착착 랜딩 페이지 (신규)
- `privacy.html` → 개인정보처리방침 (기존 index.html에서 이름 변경)
- `withdrawal.html` → 회원탈퇴 안내 (기존 account-delete.html에서 이름 변경)

## 📦 준비된 파일
```
web/
├── index.html        # 랜딩 페이지 (메인)
├── privacy.html      # 개인정보처리방침
└── withdrawal.html   # 회원탈퇴 안내
```

## 🚀 배포 절차

### 1. 파일 업로드

```bash
# 1-1. 압축 파일 업로드 (이미 생성됨: web-deploy.tar.gz)
scp -i "/Users/hanmyungsoo/Downloads/chackchack_back.pem" web-deploy.tar.gz ec2-user@3.39.96.52:~/

# 1-2. 서버 접속
ssh -i "/Users/hanmyungsoo/Downloads/chackchack_back.pem" ec2-user@3.39.96.52

# 1-3. 압축 해제
tar -xzf web-deploy.tar.gz

# 1-4. 기존 public 폴더에 복사 (기존 파일 백업 권장)
cp -r web/* ~/backend/public/
```

### 2. Nginx 설정 수정

서버에서 Nginx 설정 파일을 수정합니다:

```bash
# Nginx 설정 파일 위치 확인
sudo nginx -t

# 설정 파일 편집 (보통 /etc/nginx/sites-available/default 또는 /etc/nginx/nginx.conf)
sudo nano /etc/nginx/sites-available/default
```

#### Nginx 설정 예시

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name api.chackchack.co.kr chackchack.co.kr;

    # SSL 인증서 설정 (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.chackchack.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.chackchack.co.kr/privkey.pem;

    # 정적 파일 경로
    root /home/ec2-user/backend/public;
    index index.html;

    # 정적 페이지 처리 (우선순위 높음)
    location / {
        try_files $uri $uri/ @backend;
    }

    # 특정 정적 페이지 명시
    location = / {
        try_files /index.html =404;
    }

    location = /privacy {
        try_files /privacy.html =404;
    }

    location = /privacy.html {
        try_files /privacy.html =404;
    }

    location = /withdrawal {
        try_files /withdrawal.html =404;
    }

    location = /withdrawal.html {
        try_files /withdrawal.html =404;
    }

    # 정적 자원 (CSS, JS, 이미지)
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API 요청은 백엔드로 프록시
    location @backend {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API 경로 명시 (선택사항)
    location /auth {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /accounts {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /qrcodes {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /notify {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP를 HTTPS로 리다이렉트
server {
    listen 80;
    server_name api.chackchack.co.kr chackchack.co.kr;
    return 301 https://$server_name$request_uri;
}
```

### 3. Nginx 재시작

```bash
# 설정 테스트
sudo nginx -t

# 문제 없으면 재시작
sudo systemctl reload nginx

# 또는
sudo service nginx reload
```

### 4. 도메인 설정 (선택사항)

chackchack.co.kr 도메인도 사용하려면:

```bash
# Route53 또는 도메인 관리 패널에서:
# A 레코드: chackchack.co.kr → 3.39.96.52
# CNAME 레코드: www.chackchack.co.kr → chackchack.co.kr

# SSL 인증서 발급 (Let's Encrypt)
sudo certbot --nginx -d chackchack.co.kr -d www.chackchack.co.kr
```

## 🧪 테스트

배포 후 다음 URL들이 정상 작동하는지 확인:

- https://api.chackchack.co.kr/ → 랜딩 페이지
- https://api.chackchack.co.kr/privacy.html → 개인정보처리방침
- https://api.chackchack.co.kr/withdrawal.html → 회원탈퇴 안내
- https://api.chackchack.co.kr/auth/guest → API 엔드포인트 (기존대로 작동)

## 📝 주의사항

1. **백업**: 기존 public 폴더를 백업하세요
   ```bash
   cp -r ~/backend/public ~/backend/public.backup.$(date +%Y%m%d)
   ```

2. **권한**: 파일 권한 확인
   ```bash
   chmod 644 ~/backend/public/*.html
   ```

3. **캐시**: 브라우저 캐시 때문에 변경사항이 바로 안 보일 수 있음
   - 강제 새로고침: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

4. **로그 확인**: 문제 발생시
   ```bash
   # Nginx 에러 로그
   sudo tail -f /var/log/nginx/error.log
   
   # 액세스 로그
   sudo tail -f /var/log/nginx/access.log
   ```

## 🔒 보안 고려사항

1. **CORS 설정**: API와 웹페이지가 같은 도메인에서 제공되므로 CORS 이슈 없음
2. **CSP 헤더**: 필요시 Content-Security-Policy 헤더 추가
3. **Rate Limiting**: DDoS 방지를 위한 rate limiting 설정 권장

## 📱 모바일 앱 연동

앱에서 웹페이지 링크:
- 개인정보처리방침: `https://api.chackchack.co.kr/privacy.html`
- 회원탈퇴: `https://api.chackchack.co.kr/withdrawal.html`

---

**작성일**: 2025-09-02
**버전**: 1.0.0