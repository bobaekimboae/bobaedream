# 보배드림 차량이력조회

GitHub Pages에서 독립 경로로 실행되는 차량이력 조회 화면입니다.

- 공개 경로: `/bobaedream/vehicle-history/`
- 국토부 기준 조회 유형 지원: 번호판 단독 조회 / 소유자 확인 조회
- 실제 연동: `config.js`의 `BOBAE_HISTORY_API_URL`에 공개 API 게이트웨이 주소 설정

## 국토부 기준 입력 공식

| 국토부 조회 유형 | 보배드림 화면 공식 | 입력값 | 요청 목적값 |
| --- | --- | --- | --- |
| 매매용차량 | 딜러 상품용 번호판 단독 조회 | `plate` | `USED_CAR_DEALER_LISTING_CHECK` |
| 타인차량조회(소유자미동의) | 공개 일부이력 번호판 단독 조회 | `plate` | `USED_CAR_DEALER_LISTING_CHECK` |
| 본인차량조회 | 소유자 확인 조회 | `plate`, `owner` | `OWNER_VERIFIED_HISTORY_CHECK` |
| 타인차량조회(소유자동의) | 소유자 확인 조회 | `plate`, `owner` | `OWNER_VERIFIED_HISTORY_CHECK` |

## API 요청 예시

### 번호판 단독 조회

```json
{
  "plate": "370도3826",
  "consentId": "uuid",
  "purpose": "USED_CAR_DEALER_LISTING_CHECK",
  "molitLookupType": "SALE_VEHICLE_OR_OWNER_UNCONSENTED"
}
```

### 소유자 확인 조회

```json
{
  "plate": "56마2883",
  "owner": "홍길동",
  "consentId": "uuid",
  "purpose": "OWNER_VERIFIED_HISTORY_CHECK",
  "molitLookupType": "OWNER_CONSENTED_OR_SELF"
}
```

API 키와 기관 인증서는 프론트엔드나 GitHub에 저장하지 않습니다. 보배드림 서버가 카히스토리·국토교통부 API를 호출하고, 이 화면에는 통합된 결과만 반환해야 합니다.

## 포함 기능

- 차량번호 한글 입력
- 국토부 기준 조회 유형 선택
- 딜러 상품 차량번호 기반 조회 동의
- 소유자 확인 조회 시 소유자명 입력
- 위험등급과 핵심 지표
- 19개 차량이력 전체 표시
- 보험사고별 부품비·공임·도장비
- 주행거리 그래프와 통합 타임라인
- 카히스토리·국토부 부분 실패 표시
- 브라우저 검색이력 최대 10건
- PDF 인쇄·저장
- 모바일·PC 반응형 화면
