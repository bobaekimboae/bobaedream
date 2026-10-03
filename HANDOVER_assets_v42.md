# HANDOVER_assets_v42

## 1) 담당 범위

- 모바일 목록 제어행의 정렬 버튼 위치 변경

## 2) 현재 진행 상태

- 완료: `영상 매물 → 개인 → 딜러 → 정렬 → 보기 방식` 순서 적용
- 유지: 세로 구분선 없음
- 유지: 선택 항목의 Airbnb형 흰 배경·`#222` 외곽선

## 3) 결정된 사항과 그 이유

- 영상·판매자 조건을 왼쪽에 먼저 모으고 정렬과 보기 방식은 오른쪽 목록 제어 영역에 배치한다.
- 좁은 화면에서는 왼쪽 탭 묶음만 스크롤되고 정렬·보기 방식은 항상 보이게 한다.

## 4) 미결 사항·막힌 점

- 없음

## 5) 산출물 목록

- `src/prototype/listing/bbm-list.tsx` v42
- `src/prototype/listing/bbm-tokens.css` v42
- `docs/quick-filter-spec.md` v42
- `design-qa.md` v42
- `CHANGELOG_assets.md` v42
- `HANDOVER_assets_v42.md` v42

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 없음

## 7) 검수 상태

- 미검수

## 8) 다음에 할 일

1. 360px·384px 순서와 넘침 확인
2. GitHub Pages 배포 및 공개 화면 재검증
