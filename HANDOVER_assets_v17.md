# HANDOVER_assets_v17

## 1) 담당 범위

- 초톳 모바일 기준의 필터 카테고리 바텀시트와 통합 검색 상호작

## 2) 현재 진행 상태

### 완료

- 목록 화면 위 하단 고정 카테고리 시트
- 32px 알약 칩과 선택 상태
- 검색 포커스 추천, 입력 중 관련어, 지우기, 뒤로 닫기
- 반응형 390×844 실측 대조

### 진행 중

- 없음

### 미착수

- 없음

## 3) 결정된 사항과 그 이유

- 카테고리 칩은 전체 필터 화면을 거치지 않고 바로 하단 시트를 연다. 초톳의 목록 문맥유지 방식과 같다.
- 칩은 32px·14px·`#222222` 선택 상태로 고정했다. 초톳 실측값과 일치한다.
- 검색은 매물 목록 필터링을 유지하면서 포커스 시 추천 패널을 추가했다.

## 4) 미결 사항·막힌 점

- 없음

## 5) 산출물 목록

- `src/prototype/listing/index.tsx`
- `src/prototype/listing/bbm-list.tsx`
- `src/prototype/listing/shell.css`
- `src/prototype/listing/bbm-tokens.css`
- `src/prototype/filters/bbm-filter-parts.tsx`
- `src/prototype/filters/bbm-filter-parts.css`
- `scripts/audit-filter-bottomsheet-v01.mjs`
- `reports/filter-bottomsheet-v01/`
- `design-qa.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 없음

## 7) 검수 상태

- 초톳 라이브를 직접 조작해 열림·닫힘·선택·검색 입력·지우기를 확인
- 카테고리 시트 핵심 측정값 일치
- 빌드 통과
- 최종 디자인 QA 통과

## 8) 다음에 할 일

1. 공개 배포 후 모바일 실주소에서 재검증한다.
2. 사용자 검수 시 추천어 우선순위만 데이터 기반으로 교체한다.
