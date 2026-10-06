# 벤츠 세대 보강 v01

- 기준일: 2026-10-07
- 기준 사이트: AutoScout24, mobile.de, ADAC Autokatalog
- 원칙: 완전 변경 세대만 수록하고 페이스리프트는 별도 세대로 세지 않는다.
- 데이터 처리: 엔카 원본 67개 세대와 매물 수는 변경하지 않는다. 외부 확인 세대는 매물 DB 연결 전 참고 정보로 분리한다.

## 반영 결과

| 모델 | 보강 세대 | 완전 변경 세대 수 |
|---|---|---:|
| A-클래스 | W169, W168 | 4 |
| B-클래스 | W247 | 3 |
| C-클래스 | W203, W202 | 5 |
| CLK-클래스 | C208 | 2 |
| R-클래스 | W251 | 1 |
| S-클래스 | W220, W140, W126, W116 | 7 |
| SL-클래스 | R231, R230, R129, R107 | 5 |
| SLK-클래스 | R172, R171, R170 | 3 |
| V-클래스 | W447, W638 | 2 |

총 20개 세대를 보강했다.

## 화면 규칙

- 모델 목록의 `세대 N개`는 원본에 코드가 있는 세대와 보강 세대 코드의 합집합으로 계산한다.
- 세부모델 화면은 `세대 정보 · 유럽 카탈로그`와 `엔카 매물 세대`를 분리한다.
- 보강 세대에는 `매물 연동 전`을 표시하고 클릭을 막는다. 매물 수와 등급을 임의로 복제하지 않는다.
- 엔카 DB 키가 연결되면 보강 행을 일반 선택 행으로 전환한다.

## 보류

- 스프린터 W907/910·W906·W903·W902: ADAC 세대 구분은 확인했으나 이번 2출처 기준을 충족하는 동일 수준 자료 대조가 남았다.
- G-클래스 W461: 상용·군용 파생과 승용 W463의 경계 검토가 남았다.
- SL W113·W121·W198: ADAC에는 구분되지만 mobile.de·AutoScout24에서 같은 세대 코드 단위의 추가 대조가 남았다.
- 보강 20개 전용 이미지는 아직 제작하지 않았다. 현재는 공통 정면 자리표시자를 사용한다.

## 주요 근거

- AutoScout24 벤츠 세대: https://www.autoscout24.de/auto/mercedes-benz/mercedes-baureihen/
- mobile.de A-클래스: https://www.mobile.de/auto/mercedes/a-klasse/serie/
- mobile.de S-클래스: https://www.mobile.de/auto/mercedes/s-klasse/serie/
- mobile.de SL: https://www.mobile.de/auto/mercedes/sl/serie/
- mobile.de SLK: https://www.mobile.de/auto/mercedes/slk/serie/
- mobile.de V-클래스: https://www.mobile.de/auto/mercedes/v-klasse/serie/
- ADAC 벤츠 전체: https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/mercedes-benz/?filter=NONE&sort=SORTING_DESC
