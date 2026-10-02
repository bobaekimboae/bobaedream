# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v45`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v44.md`

## 1) 담당 범위

- 레딧형 커뮤니티 피드의 실제 사진·영상 자산과 영상 재생 동작.

## 2) 현재 진행 상태

- 완료: Pixabay 차량 MP4 3개를 프로젝트 내부 자산으로 저장.
- 완료: 영상 썸네일을 실제 HTML5 영상 플레이어로 교체.
- 완료: 영상 카드 안에서 재생·일시정지·탐색·전체화면 컨트롤 제공.
- 완료: 실제 차량 사진·갤러리와 텍스트 전용 카드 유지.
- 완료: 로컬 재생·이미지·콘솔·전체 빌드 검수.
- 진행 중: GitHub Pages 공개 배포.

## 3) 결정된 사항과 그 이유

- 외부 스트리밍 URL 대신 MP4를 저장소에 포함해 공개 배포의 안정성을 확보한다.
- 자동재생은 사용하지 않고 사용자가 직접 재생하는 방식으로 데이터 사용량과 주의 분산을 줄인다.
- 영상은 `preload=metadata`, `playsinline`, 포스터 이미지, 기본 컨트롤을 사용한다.
- 영상 컨트롤과 게시글 링크가 충돌하지 않도록 카드 전체 링크를 제목 링크로 변경한다.
- 영상 출처와 라이선스는 `public/community/media/README.md`에 기록한다.

## 4) 미결 사항·막힌 점

- 없음.

## 5) 산출물 목록

- `public/community/media/car-driving-road-v01.mp4`
- `public/community/media/car-desert-drone-v01.mp4`
- `public/community/media/car-sunset-drive-v01.mp4`
- `public/community/media/README.md`
- `public/community/bobaedream-pc-board-list.html`
- `public/community/bobaedream-pc-board-detail.html`
- `public/community/bobaedream-pc-interactions.js`
- `handover/car/HANDOVER_car_v45.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- 영상 3개 모두 `readyState=4` 확인.
- 재생 길이 42.5초·10.63초·10.92초 확인.
- 첫 영상 재생 후 시간이 0초에서 0.37초로 진행되는 것 확인.
- 깨진 이미지 0건.
- 브라우저 콘솔 오류 0건.
- `npm run verify:qf` 통과.

## 8) 다음에 할 일

1. GitHub Pages 공개 배포를 완료한다.
2. 공개 주소에서 영상 3개의 재생과 미디어 파일 응답을 검수한다.
