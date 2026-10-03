# 코덱스-자료 인수인계 v30

## 1) 담당 범위

- 공통 퀵필터 UI와 이미지·로고 자료
- 이번 변경: 당근 중고차 기준 필터 정보 구조, 모바일 하단 시트, PC 좌측 필터 숨기기

## 2) 현재 진행 상태

- 완료: 당근 기본 필터 축 조사
- 완료: 모바일 당근형 전체 필터 하단 시트
- 완료: PC 기본 필터 축 축소와 `필터 더보기`
- 완료: PC 좌측 필터 숨기기·복원
- 완료: 모바일·PC 자동 검증
- 미착수: 총괄 검수

## 3) 결정된 사항과 이유

- 기본 노출은 상태·브랜드·차종·연료·가격·연식·주행거리·변속기·판매 방식으로 제한한다. 당근 중고차의 기본 필터 축과 맞추기 위함이다.
- 기존 보배드림 필터 데이터와 기능은 삭제하지 않고 `필터 더보기` 아래 보존한다.
- 모바일은 당근의 하단 시트 구조를 따르되 활성색은 보배드림 파랑을 유지한다.
- PC 1280px 이상 고정 사이드바에만 숨기기 기능을 제공하며 1024~1279px 서랍은 기존 동작을 유지한다.

## 4) 미결 사항·막힌 점

- 거래 가능 상태를 구분하는 가상 매물 필드가 없어 현재 샘플 64대는 모두 거래 가능으로 취급한다.
- 총괄 검수 미완료.

## 5) 산출물 목록

- `src/prototype/filters/bbm-filter-options.ts` / v12 / 기본·추가 필터 분리 규칙
- `src/prototype/filters/bbm-filter-parts.tsx` / v12 / 당근형 전체 필터 변형
- `src/prototype/filters/bbm-filter-parts.css` / v12 / 모바일 하단 시트 스타일
- `src/prototype/listing/pc-bbmuseum.tsx` / v12 / PC 계층·숨기기
- `src/prototype/listing/pc-bbmuseum.css` / v12 / PC 제어 스타일
- `scripts/audit-daangn-filter-v01.mjs` / v01 / 모바일 비교·동작 검증
- `reports/daangn-filter-v01/` / v01 / 기준·구현·비교 캡처와 측정값
- `design-qa.md` / v01 / 최종 디자인 QA

## 6) 주고받은 자료·대기 요청

- 참고: 당근 중고차 `https://www.daangn.com/kr/search/cars/`
- 대기: 코덱스-중고차 상호 검수

## 7) 검수 상태

- `CHANGELOG_assets.md` v12: 미검수
- `npm run verify:qf`: 통과
- `npm run check:sidebar`: 34/34 통과
- 모바일 당근형 필터 검사: 6/6 통과

## 8) 다음에 할 일

1. 코덱스-중고차 검수
2. 검수 지적 반영 시 v13으로 새 버전 작성
3. 실제 매물 상태 필드가 확정되면 `거래 가능만 보기`를 결과 대수와 연결
