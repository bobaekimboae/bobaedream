# HANDOVER_assets_v41

## 1) 담당 범위

- 모바일 목록 제어행을 초톳 원본 방식으로 복구하고 선택 색상만 보배드림 Airbnb형으로 유지

## 2) 현재 진행 상태

- 완료: `정렬 → 영상 매물 → 개인 → 딜러 → 보기 방식` 순서 유지
- 완료: 정렬 뒤에 추가했던 세로 구분선 제거
- 유지: 선택 항목의 흰 배경, `#222` 글자·2px 외곽선·12% 그림자

## 3) 결정된 사항과 그 이유

- 구조와 간격은 초톳 원본을 따르고, 제품 고유 차이는 선택 색상에만 둔다.
- 원본에 없는 장식 요소를 추가하지 않는다.

## 4) 미결 사항·막힌 점

- 없음

## 5) 산출물 목록

- `src/prototype/listing/bbm-list.tsx` v41
- `src/prototype/listing/bbm-tokens.css` v41
- `docs/quick-filter-spec.md` v41
- `design-qa.md` v41
- `CHANGELOG_assets.md` v41
- `HANDOVER_assets_v41.md` v41

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 없음

## 7) 검수 상태

- 미검수

## 8) 다음에 할 일

1. 360px·384px 모바일 넘침과 순서 확인
2. GitHub Pages 배포 및 공개 화면 재검증
