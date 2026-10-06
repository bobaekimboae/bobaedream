# 벤츠 세대 차수 표시 검수 보고 v01

- 작성일: 2026-10-07
- 대상: `maker-model-skeleton-v01.html`
- 원칙: 엔카 원본명과 `catalog.json`은 수정하지 않고 표시용 매핑만 추가한다.

## 적용 결과

- 엔카 벤츠 모델그룹: 33개
- 엔카 세대 행: 67개
- 단일 세대 숫자 확정: 59개
- 엔카 통합 항목으로 범위 표시: 8개
- 미확인·누락: 0개
- 외부 카탈로그 보강 세대: 20개, 세대 숫자 누락 0개

표시 형식은 단일 세대 `4세대 (W177)`, 통합 항목 `1~2세대 (W202·W203)`로 통일했다. 통합 항목에 임의의 단일 숫자를 만들지 않았다.

## 검증 기준

- 독일차: mobile.de, ADAC, AutoScout24의 모델 계보·차체 코드·생산 기간을 교차 확인한다.
- 일본차 후속 작업: Goo-net을 1차 카탈로그로 사용하고 독일 3개 카탈로그에서 확인 가능한 자료를 보조로 대조한다.
- 완전변경 차체 코드만 세대 차수를 올리고 페이스리프트는 동일 세대로 본다.
- 엔카가 여러 완전변경 세대를 한 행에 합친 경우 범위로 표시한다.

## 자동 검수

- `npm run verify:qf`: 통과
- 360px 전체 모델그룹 순회: 33개 모델, 표시 행 87개, 세대 차수 누락 0개
- 가로 넘침: 0px
- 콘솔 오류: 0개
- 엔카 원본 `catalog.json` 변경: 0건

## 출처

- mobile.de: https://www.mobile.de/auto/
- ADAC: https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/?filter=ONLY_RECENT&sort=SORTING_DESC
- AutoScout24: https://www.autoscout24.de/auto/?genlnk=navi&genlnkorigin=de-vm-opt-uc-mmc-auto-home
- Goo-net: https://www.goo-net.com/catalog/

