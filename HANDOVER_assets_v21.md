# HANDOVER_assets_v21

## 1) 담당 범위

- 가격 필터를 모바일과 PC의 공통 필터 구조로 개선

## 2) 현재 진행 상태

- 완료: 모바일 상단 가격 칩과 전체 필터에서 동일한 가격 바텀시트 사용
- 완료: PC 상단 가격 칩과 좌측 가격 필터에서 동일한 중앙 모달 사용
- 완료: 직접 입력, 일반·리스/렌트 탭, 가격 구간 칩, 초기화, 결과 대수 적용
- 진행 중: 없음
- 미착수: 연식과 차량 상태 필터 공통화

## 3) 결정된 사항과 그 이유

- 모바일과 PC는 `PriceFinalPanel` 하나를 공유해 표시값과 동작 차이를 없앤다.
- 닫기, 배경 클릭, Esc는 임시값을 버리고 `N대 보기`만 적용한다.
- 제조사·모델·세부모델만 전용 이미지 탐색을 유지하고 가격은 공통 모달 방식으로 전환한다.

## 4) 미결 사항·막힌 점

- 외부 배포는 사용자 승인 전까지 미실행

## 5) 산출물 목록

- `src/prototype/filters/bbm-price.tsx`
- `src/prototype/filters/bbm-price.css`
- `src/prototype/listing/index.tsx`
- `src/prototype/listing/pc-bbmuseum.tsx`
- `docs/quick-filter-spec.md`
- `qa/price-filter-qa-v01.mjs`
- `artifacts/price-filter-v01/result.json`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 없음

## 7) 검수 상태

- `npm run verify:qf` 통과
- PC 1440×1000, 모바일 393×852 자동 화면 검수 통과
- 잘못된 가격 범위 적용 차단, 닫기 시 임시값 폐기, 구간 적용 결과 확인

## 8) 다음에 할 일

1. 사용자 검수 후 배포
2. 다음 순서인 연식과 차량 상태 필터를 동일 구조로 개선
