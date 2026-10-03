# Design QA — category bottom sheet shell v02

## 기준과 범위

- 기준: 확정된 주행거리 필터 바텀시트(`MileageFinalSheet`)
- 적용: 모바일 카테고리 바텀시트의 외형만 변경
- 유지: 카테고리 즉시 선택·초기화·닫기 동작과 통합 검색 동작
- 뷰포트: 393×852 CSS px, 1x

## 산출물

- 기준 캡처: `reports/filter-bottomsheet-v02/reference-mileage.png`
- 적용 캡처: `reports/filter-bottomsheet-v02/category-after.png`
- 동일 화면 대조: `reports/filter-bottomsheet-v02/comparison.png`
- 자동 측정값: `reports/filter-bottomsheet-v02/metrics.json`
- 자동 점검: `scripts/audit-filter-bottomsheet-v02.mjs`

## 자동 측정

| 항목 | 주행거리 기준 | 카테고리 적용 | 결과 |
|---|---:|---:|---|
| 상단 곡률 | 24px | 24px | passed |
| 헤더 높이 | 64px | 64px | passed |
| 제목 좌측 위치 | 24px | 24px | passed |
| 제목 | 20px / 28px / 750 / -0.35px | 동일 | passed |
| 닫기 터치영역 | 44×44px | 44×44px | passed |
| 닫기 우측 간격 | 20px hit area | 20px hit area | passed |
| 본문 여백 | 20px 16px 22px | 동일 | passed |
| 하단 영역 | 80px | 80px | passed |
| 초기화 버튼 | 92×52px | 92×52px | passed |
| 가로 넘침 | 없음 | 없음 | passed |
| 콘솔 오류 | 없음 | 없음 | passed |

## 최종 결과

passed

