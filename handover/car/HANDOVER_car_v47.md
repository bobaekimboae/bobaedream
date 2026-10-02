# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v47`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v46.md`

## 1) 담당 범위

- 실제 사진·영상 커뮤니티 피드의 공개 배포 경로 교정 및 검수.

## 2) 현재 진행 상태

- 완료: GitHub Pages 배포 전처리가 빌드된 자바스크립트의 `/assets/` 문자열까지 치환하는 원인 확인.
- 완료: 슬래시 문자를 런타임에 생성하고 호스트별 자산 루트를 결정하도록 수정.
- 완료: 로컬은 `/assets/`, 공개본은 `/bobaedream/assets/`를 사용하도록 분리.
- 진행 중: 공개 배포 후 사진·영상 최종 검수.

## 3) 결정된 사항과 그 이유

- 배포 전처리 대상 문자열을 소스와 빌드 결과 어디에도 직접 만들지 않아 저장소명이 중복되지 않게 한다.
- 영상은 프로젝트 내부 `community/media`의 실제 MP4 3개를 유지한다.

## 4) 미결 사항·막힌 점

- 없음.

## 5) 산출물 목록

- `public/community/bobaedream-pc-board-list.html`
- `public/community/bobaedream-pc-board-detail.html`
- `public/community/bobaedream-pc-interactions.js`
- `handover/car/HANDOVER_car_v47.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- 공개 재배포 후 검수 예정.

## 8) 다음에 할 일

1. GitHub Pages 배포 완료를 확인한다.
2. 공개 피드에서 깨진 사진 0건과 실제 영상 3개 재생을 확인한다.
