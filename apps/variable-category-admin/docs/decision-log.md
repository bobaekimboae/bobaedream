# 확정 결정과 HOLD

## 확정

- GitHub 저장소는 공개한다.
- 실데이터·시크릿·내부 URL·미승인 라이선스 자료는 공개하지 않는다.
- 판매자는 `seller_type`, `business_category`, `certification` 3계층으로 표현한다.
- 전체 매물은 `ALL_VEHICLES` Placement로 제공한다.
- EV는 독립 원장 유형이 아니라 `EV_OVERLAY`로 파생할 수 있다.
- Predicate는 JSON AST와 허용 연산자만 사용한다.
- 기존 매물 시스템은 Listing Contract를 통해서만 연결한다.
- Publish는 Release Bundle 단위이며 current/candidate/previous pointer를 사용한다.
- 관리자 첫 화면은 단순 통계가 아니라 SLA 기반 작업 큐와 current/candidate/previous 상태를 우선 노출한다.
- 다중 차량유형 설정은 카드 나열이 아닌 정책 매트릭스와 우측 상속 검사 패널로 비교한다.
- 위험한 변경은 릴리스 센터에서 영향 매물·검증·담당자·리스크를 확인한 뒤 승인한다.

## 사업 승인 전 HOLD

- 수입차 전문관과 일반 수입차 메뉴의 실제 UI 차이
- 럭셔리·슈퍼·하이퍼 판정 기준
- 클래식카 연식과 희소성 기준
- ATV/UTV의 BIKE 승격 조건
- 자재운반장비의 독립 vehicle_type 승격
- 어태치먼트 부품 진입점·거래정책
- 개인·업체 판매자 인증·거래 제한
- 유형별 유료상품과 무료 등록 한도
- SOLD_CAR 브라우징 카테고리 운영 여부

HOLD 항목은 DB 재설계 없이 설정과 새 Release Bundle로 반영할 수 있어야 한다.
