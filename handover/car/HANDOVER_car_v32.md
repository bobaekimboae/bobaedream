# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v32`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v31.md`

## 1) 담당 범위

- 보배드림 커뮤니티 PC 목록·상세 좌측 메뉴 폭과 공개 배포 검수.

## 2) 현재 진행 상태

- 완료: 바이두 티에바 참고 기준 좌측 메뉴 폭 210px 적용.
- 완료: 중앙 게시글 영역 742px 및 전체 1280px 그리드 유지.
- 완료: 햄버거 아이콘과 Pretendard 공개 자산 경로 교정.
- 완료: GitHub Pages 배포 및 공개 화면 검수.

## 3) 결정된 사항과 그 이유

- 좌측 패널은 티에바 PC 공개 캡처 측정값에 맞춰 210px로 사용한다.
- 중앙 게시글 영역은 정보 밀도 보존을 위해 742px로 유지하고 우측 패널을 280px로 조정한다.
- 커뮤니티 하위 자산은 `assets/...`, 상위 공통 폰트는 `../%61ssets/...`로 지정해 Pages의 `/assets/` 자동 치환을 피한다.

## 4) 미결 사항·막힌 점

- `npm run verify`의 카테고리 관리자 헬스 엔드포인트 테스트가 기존 `404` 문제로 실패한다. 이번 커뮤니티 변경과 무관하며 `verify:qf`, Pages 빌드·배포는 통과했다.

## 5) 산출물 목록

- `public/community/bobaedream-pc-board-list.html`
- `public/community/bobaedream-pc-board-detail.html`
- `public/community/naver-cafe-list.html`
- `public/community/naver-cafe-detail.html`
- `handover/car/HANDOVER_car_v31.md`
- `handover/car/HANDOVER_car_v32.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 원격의 트럭 퀵필터 변경을 보존한 상태로 배포 완료.
- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- `npm run verify:qf`: 통과.
- `npm run build`: 통과.
- GitHub Pages 실행 `36982184877`: 성공.
- 공개 커밋: `edfab8d`.
- 공개 좌측 패널 210px, 중앙 742px 확인 완료.
- 공개 햄버거 SVG natural 20×20px / 표시 24×24px 확인 완료.
- 공개 Pretendard Variable 로드 확인 완료.
- 최상단 글로벌 헤더 미노출 확인 완료.

## 8) 다음에 할 일

1. 햄버거 메뉴 클릭 시 표시할 메뉴 패널의 구성과 동작을 확정한다.
