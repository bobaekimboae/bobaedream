# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v31`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v30.md`

## 1) 담당 범위

- 보배드림 커뮤니티 PC 목록·상세 좌측 메뉴 폭과 GitHub Pages 자산 경로.

## 2) 현재 진행 상태

- 완료: 바이두 티에바 PC 참고 화면 기준 좌측 메뉴 폭을 210px로 확장.
- 완료: 중앙 게시글 영역 742px 유지, 전체 1280px 그리드 유지를 위해 우측 패널을 280px로 조정.
- 완료: GitHub Pages 경로 치환에 의해 깨진 햄버거 아이콘과 Pretendard 경로 교정.
- 완료: 로컬 브라우저 및 빌드 검수.
- 진행 중: 교정본 GitHub Pages 재배포 및 공개 화면 검수.

## 3) 결정된 사항과 그 이유

- 티에바 최신 PC 캡처 원본 1912px에서 좌측 카테고리 영역이 약 210px로 측정되어 동일 폭을 적용한다.
- 중앙 콘텐츠 밀도를 유지하기 위해 742px 게시글 영역은 변경하지 않는다.
- 배포 워크플로의 `/assets/` 일괄 치환을 피하도록 커뮤니티 내부 아이콘은 `assets/...`, 상위 공통 폰트는 `../%61ssets/...` 경로를 사용한다.

## 4) 미결 사항·막힌 점

- 바이두 티에바 실시간 페이지는 보안 인증 화면으로 차단되어 2025년 공개 PC 캡처를 측정 근거로 사용했다.

## 5) 산출물 목록

- `public/community/bobaedream-pc-board-list.html`
- `public/community/bobaedream-pc-board-detail.html`
- `public/community/naver-cafe-list.html`
- `public/community/naver-cafe-detail.html`
- `handover/car/HANDOVER_car_v31.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- `npm run verify:qf`: 통과.
- `npm run build`: 통과.
- PC 좌측 패널 210px, 중앙 742px 확인 완료.
- 로컬 햄버거 SVG: natural size 20×20, 표시 24×24px 확인 완료.
- 로컬 Pretendard Variable 로드 확인 완료.
- 공개 재배포: 진행 중.

## 8) 다음에 할 일

1. GitHub Pages 재배포 완료 후 공개 아이콘·폰트·패널 폭을 재검수한다.
