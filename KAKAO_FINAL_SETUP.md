# 🚨 카카오 OAuth 최종 설정 가이드

## 문제 해결
카카오는 **HTTP/HTTPS 프로토콜만** 리다이렉트 URI로 허용합니다.
`chackchack://` 같은 커스텀 스킴은 등록 불가능합니다.

## 해결 방법
백엔드 서버에 중간 리다이렉트 페이지를 만들어 해결했습니다.

## 설정 절차

### 1. 서버에 OAuth 콜백 페이지 업로드
```bash
# 서버에 파일 업로드
scp -i "/Users/hanmyungsoo/Downloads/chackchack_back.pem" \
    /Users/hanmyungsoo/project/chackchack/chackchack/backend/public/oauth-callback.html \
    ec2-user@3.39.96.52:~/backend/public/
```

### 2. 카카오 개발자 콘솔 설정

#### Redirect URI 등록
1. https://developers.kakao.com 접속
2. 내 애플리케이션 > 착착 선택
3. 카카오 로그인 > Redirect URI
4. 다음 URI 추가:
   ```
   http://3.39.96.52:3000/oauth-callback.html
   ```

#### 키 해시 확인 (Android)
플랫폼 > Android에 다음 키 해시가 모두 등록되어 있는지 확인:
- 디버그: `S9uCfbOxJC0KnxRxDF5sVtyBsso=`
- 릴리즈: `lj7CjpSk7xEeNnDeQeJ8CbTu0Pc=`

### 3. 동작 방식
1. 사용자가 카카오 로그인 시도
2. 카카오 로그인 페이지로 이동
3. 로그인 성공 시 `http://3.39.96.52:3000/oauth-callback.html`로 리다이렉트
4. 콜백 페이지가 자동으로 `chackchack://oauth?code=xxx` 딥링크로 앱 실행
5. 앱이 인증 코드를 받아 로그인 완료

### 4. 테스트
```bash
# 새 빌드 생성
eas build --platform android --profile preview

# 빌드 완료 후 APK 설치 및 테스트
```

## 체크리스트
- [ ] `oauth-callback.html` 파일 서버에 업로드
- [ ] 카카오 콘솔에 `http://3.39.96.52:3000/oauth-callback.html` 등록
- [ ] 릴리즈 키 해시 등록 확인
- [ ] 새 빌드 생성 및 테스트

## 주의사항
- HTTPS가 아닌 HTTP를 사용하므로 프로덕션에서는 HTTPS 도메인 필요
- 서버가 꺼지면 OAuth 로그인 불가능
- 서버 URL 변경 시 카카오 콘솔도 함께 업데이트 필요

---
마지막 업데이트: 2025-08-17