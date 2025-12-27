# 손님용 송금 페이지 개선 가이드

## 📋 개선 배경
v1.0.3에서 손님이 QR코드를 스캔한 후 마주하는 송금 페이지의 사용자 경험을 저해하는 7가지 주요 이슈를 발견하고 전면 개선하였습니다.

## 🎯 개선된 7가지 핵심 사항

### 1. UI 개선: 카카오페이 팝업 최소 너비 설정

**문제점**
- 팝업 가로폭이 내용 길이에 따라 너무 좁아져 어색한 표시

**해결방법**
```css
min-width: 320px;
width: auto;
```

**결과**
- 내용이 짧아도 안정적인 팝업 크기 유지

### 2. UX 개선: 토스 버튼 로딩 표시 추가

**문제점**
- 버튼 클릭 후 토스 앱 열리기까지 시각적 피드백 없음

**해결방법**
```css
.btn-loading::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: btn-spin 1s linear infinite;
}
```

**결과**
- 클릭 즉시 로딩 스피너 표시
- 3초 후 자동 해제

### 3. 로직 변경: 할인만 적용된 QR의 금액 계산

**문제점**
- 기본 금액 없이 할인만 있는 QR이 일반 QR과 동일하게 보임

**해결방법**
```javascript
// 할인만 있는 케이스 처리
else if (data.discountType && data.discountValue) {
    document.getElementById('inputAmountRow').style.display = 'flex';
    document.getElementById('discountRow').style.display = 'flex';
    document.getElementById('finalAmountRow').style.display = 'flex';
    
    // 버튼 비활성화
    document.getElementById('tossBtn').disabled = true;
    document.getElementById('kakaoPayBtn').disabled = true;
}
```

**결과**
- 상품 금액 입력 필드 표시
- 실시간 할인 계산 및 최종 금액 표시
- 입력 완료 전까지 버튼 비활성화

### 4. 버그 수정: 금액 소수점 표시 제거

**문제점**
- 30000.00원과 같이 불필요한 소수점 표시

**해결방법**
```javascript
Math.floor(finalAmount).toLocaleString() + '원'
```

**결과**
- 30,000원으로 깔끔한 표시

### 5. 버그 수정: 금액+할인 동시 적용 시 최종 금액 계산

**문제점**
- 할인이 적용되지 않은 원금만 표시

**해결방법**
```javascript
// 금액 + 할인 케이스 (둘 다 있는 경우)
if (data.baseAmount && data.discountType && data.discountValue) {
    const finalAmount = calculateFinalAmount(data.baseAmount, data.discountType, data.discountValue);
    document.getElementById('amount').textContent = Math.floor(finalAmount).toLocaleString() + '원';
    calculatedAmount = Math.floor(finalAmount);
}
```

**결과**
- 할인이 적용된 정확한 최종 금액 표시

### 6. 기능 수정: 토스 딥링크에 금액 정보 추가

**문제점**
- 토스 앱에 계좌 정보만 전달되고 금액은 비어있음

**해결방법**
```javascript
const amount = calculatedAmount || qrCodeData.baseAmount || '';
const tossDeepLink = `supertoss://send?bank=${encodeURIComponent(bankName)}&accountNo=${encodeURIComponent(accountNumber)}${amount ? `&amount=${amount}` : ''}`;
```

**결과**
- 토스 앱 열릴 때 금액까지 자동 입력

### 7. 서버 설정 수정: QR 생성 URL을 도메인으로 변경

**문제점**
- QR코드에 서버 IP 주소(3.39.96.52:3000) 포함

**해결방법**
```typescript
// qrcodes.service.ts
const baseUrl = process.env.BASE_URL || 'https://api.chackchack.co.kr';
let paymentUrl = `${baseUrl}/payer.html?qrId=${qrCode.qrId}...`;

// 할인 정보도 URL에 추가
if (qrCode.discountType && qrCode.discountValue) {
  paymentUrl += `&discountType=${encodeURIComponent(qrCode.discountType)}&discountValue=${qrCode.discountValue}`;
}
```

**결과**
- 공식 도메인 https://api.chackchack.co.kr 사용
- QR URL에 할인 정보 포함으로 완전한 데이터 전달

## 🔧 기술적 구현 세부사항

### 할인 계산 로직
```javascript
function calculateFinalAmount(baseAmount, discountType, discountValue) {
    if (discountType === 'percentage') {
        return baseAmount * (1 - discountValue / 100);
    } else {
        return baseAmount - discountValue;
    }
}
```

### URL 파라미터 처리
- `qrId`: 서버 QR코드 ID
- `bank`, `account`, `holder`: 계좌 정보
- `amount`: 기본 금액
- `discountType`: 할인 유형 (percentage/fixed)
- `discountValue`: 할인 값

### 화면 상태 관리
1. **금액만 있는 경우**: 바로 금액 표시
2. **할인만 있는 경우**: 입력 필드 + 계산 로직
3. **금액+할인**: 최종 계산된 금액 표시

## 📱 사용자 플로우

### Case 1: 기본 금액만 있는 QR
1. QR 스캔 → 페이지 로드
2. 계좌 정보 + 고정 금액 표시
3. 토스/카카오페이 버튼 클릭 → 앱으로 이동

### Case 2: 할인만 있는 QR
1. QR 스캔 → 페이지 로드
2. 계좌 정보 + 할인 정보 표시
3. 상품 금액 입력 (버튼 비활성화)
4. 실시간 최종 금액 계산
5. 버튼 활성화 → 앱으로 이동

### Case 3: 금액 + 할인 QR
1. QR 스캔 → 페이지 로드
2. 계좌 정보 + 할인된 최종 금액 표시
3. 토스/카카오페이 버튼 클릭 → 앱으로 이동

## 🚀 성능 및 호환성

### 브라우저 호환성
- 모든 모바일 브라우저 지원
- iOS Safari, Android Chrome 최적화
- 구형 디바이스에서도 안정적 작동

### 로딩 성능
- CSS 애니메이션으로 부드러운 로딩 표시
- 3초 자동 타임아웃으로 무한 로딩 방지

### 접근성
- 명확한 버튼 상태 표시
- 색상 대비 고려한 디자인
- 터치 친화적 UI 크기

## 🐛 버그 수정

### 딥링크 중복 리다이렉트 문제 해결 (v1.0.3 추가 수정)

**문제점**
- 앱이 정상 실행됨과 동시에 브라우저가 플레이스토어로 중복 이동

**해결방법**
```javascript
function openAppOrStore(appUrl, storeUrlAndroid, storeUrlIOS) {
    const clickedAt = new Date().getTime();
    
    // 1. 먼저 앱을 열도록 시도
    window.location.href = appUrl;
    
    // 2. 2.5초 후에 스토어로 이동하는 타이머 설정
    setTimeout(function() {
        const timeElapsed = new Date().getTime() - clickedAt;
        // 3초 미만이면 앱이 설치되지 않은 것으로 판단
        if (timeElapsed < 3000) {
            // 플랫폼별 스토어 이동
        }
    }, 2500);
}
```

**결과**
- 앱이 열리면 브라우저가 백그라운드로 전환되어 스토어 이동 방지
- 앱이 없으면 2.5초 후 자연스럽게 스토어로 이동
- 사용자 경험 크게 개선

---

*최종 업데이트: 2025-08-24*
*적용 버전: v1.0.3*