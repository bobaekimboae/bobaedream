# HANDOVER_assets_v23

## 1) 담당 범위
- 코덱스-자료(`assets`) 차량 카테고리 퀵필터 UI 보완

## 2) 현재 진행 상태
- 완료: 상위 카테고리 아이콘 줄 가로 스크롤 복구
- 완료: 하위 알약칩 줄 독립 가로 스크롤 유지

## 3) 결정된 사항과 그 이유
- 상위 아이콘과 하위 칩이 서로의 스크롤 위치에 영향을 주지 않도록 각각 `overflow-x:auto`를 적용한다.
- 스크롤바는 숨기되 터치·트랙패드 가로 이동은 유지한다.

## 4) 미결 사항·막힌 점
- 없음

## 5) 산출물 목록
- `src/prototype/listing/stable-top.css`
- `CHANGELOG_assets.md`
- `HANDOVER_assets_v23.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청
- 코덱스-중고차 검수 대기

## 7) 검수 상태
- `vehicle category horizontal scroll / v06`: 미검수

## 8) 다음에 할 일
1. 모바일 실제 스와이프 검증
2. 빌드 검증
3. 재배포 및 라이브 확인
