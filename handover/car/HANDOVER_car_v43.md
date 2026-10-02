# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v43`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v42.md`

## 1) 담당 범위

- 레딧형 피드 공개 배포 후 기존 방문자의 저장 상태 영향 제거.

## 2) 현재 진행 상태

- 완료: `layout=reddit` 첫 진입을 항상 전체 게시글 피드로 고정.
- 완료: 상호작용 스크립트 캐시 버전을 `reddit-feed-v43`으로 갱신.
- 진행 중: 공개 재배포 및 검수.

## 3) 결정된 사항과 그 이유

- 레딧형은 이전에 열었던 게시판의 로컬 저장값보다 전체 피드 진입 규칙을 우선한다.
- URL에 `board`가 명시된 경우에는 해당 게시판 피드를 유지한다.

## 4) 미결 사항·막힌 점

- 없음.

## 5) 산출물 목록

- `public/community/bobaedream-pc-board-list.html`
- `public/community/bobaedream-pc-board-detail.html`
- `public/community/bobaedream-pc-interactions.js`
- `handover/car/HANDOVER_car_v43.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- 공개 배포 후 검수 예정.

## 8) 다음에 할 일

1. GitHub Pages 배포 완료를 확인한다.
2. 기존 저장 상태가 있는 브라우저에서도 전체 피드 24건을 확인한다.
