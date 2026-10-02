# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v46`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v45.md`

## 1) 담당 범위

- 실제 영상 피드 공개본의 차량 사진 경로 교정.

## 2) 현재 진행 상태

- 완료: GitHub Pages 경로 변환으로 중복된 `/bobaedream` 사진 경로 원인 확인.
- 완료: 자산 루트 문자열을 런타임에 조합해 로컬·공개 주소 모두 같은 상대 경로를 사용하도록 교정.
- 완료: 네 번째 영상형 시나리오를 단일 사진형으로 바로잡아 실제 MP4 영상 3개만 유지.
- 진행 중: 공개 재배포와 이미지·영상 최종 검수.

## 3) 결정된 사항과 그 이유

- 배포 전처리가 `../assets` 문자열을 재작성하지 못하도록 `feedAssetRoot`를 런타임에 조합한다.
- 영상 3개는 프로젝트 내부 `community/media` 경로를 그대로 사용한다.

## 4) 미결 사항·막힌 점

- 없음.

## 5) 산출물 목록

- `public/community/bobaedream-pc-board-list.html`
- `public/community/bobaedream-pc-board-detail.html`
- `public/community/bobaedream-pc-interactions.js`
- `handover/car/HANDOVER_car_v46.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- 공개 재배포 후 검수 예정.

## 8) 다음에 할 일

1. GitHub Pages 배포 완료를 확인한다.
2. 공개 피드에서 깨진 사진 0건과 실제 영상 재생을 확인한다.
