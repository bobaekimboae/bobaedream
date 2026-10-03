# HANDOVER_assets_v46

## 1) 담당 범위

- 전체 카테고리·전체 뎁스 퀵필터의 좌측 제목 제거
- 제목 제거 뒤 초톳식 이미지·로고·알약 슬롯 정렬

## 2) 현재 진행 상태

- 완료: 유형·세부유형·제조사·모델·세부모델·트림·연식·차종 요약 좌측 제목 제거
- 완료: 일반형과 Guazi형, 모바일과 PC 모두 단일 열 레일로 통일
- 완료: 모바일 첫 슬롯 16px, PC 첫 슬롯 20px
- 완료: 카테고리 하위 알약 줄의 좌측 제목 제거
- 완료: 접근성 `aria-label` 보존

## 3) 결정된 사항과 그 이유

- 현재 초톳 모바일처럼 시각 제목 슬롯을 없애 가로 공간을 이미지·로고·알약에 사용한다.
- 뎁스 문맥은 선택 칩과 각 레일의 접근성 이름으로 유지한다.
- 건설기계의 상단 퀵필터 헤딩은 좌측 슬롯 제목이 아니므로 유지한다.

## 4) 미결 사항·막힌 점

- 없음

## 5) 산출물 목록

- `src/prototype/listing/index.tsx` v46
- `src/prototype/listing/bbm-list.tsx` v46
- `src/prototype/listing/stable-top.tsx` v46
- `src/prototype/listing/qf-align.css` v46
- `src/prototype/quick-filter/rails.css` v46
- `scripts/stability-check.mjs` v46
- `docs/quick-filter-spec.md` v46
- `docs/보배드림_차량이미지_로고_에셋지침_v1.md` v46
- `reports/quickfilter-title-audit-20261004.md` v46
- `design-qa.md` v46

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 기존 안정성 검사의 모바일 상단 레이어 높이·페이지 제목 항목은 이번 좌측 슬롯 변경과 무관한 선행 불일치로 남아 있다. v46에서 바꾼 제목 없는 첫 슬롯 정렬 항목은 PC·모바일 전부 통과했다.

## 7) 검수 상태

- 자체 검증 완료, 상호 검수 미검수

## 8) 다음에 할 일

1. 코덱스-중고차 상호 검수
2. 사용자 요청 시 PR·배포
