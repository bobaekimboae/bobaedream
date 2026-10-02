# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v25`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v24.md`

## 1) 담당 범위

- 보배드림 커뮤니티 PC·모바일 타이틀과 PC 하위 탐색 메뉴(SNB) 디자인.

## 2) 현재 진행 상태

- 완료: PC 목록·상세 히어로 타이틀을 `보배드림 커뮤니티`로 통일.
- 완료: PC·모바일 브라우저 문서 제목과 모바일 상세 앱바 명칭 통일.
- 완료: PC 히어로 하단 SNB를 36px 알약칩으로 변경.
- 완료: 현재 위치인 `게시판` 칩을 흰색 활성 상태로 구분.
- 완료: 로컬 빌드 및 브라우저 치수 검수.
- 미착수: GitHub Pages 공개 배포.

## 3) 결정된 사항과 그 이유

- 서비스 대표 명칭은 `보배드림 커뮤니티`로 사용하고 `AUTO · COMMUNITY` 보조 문구는 유지한다.
- SNB는 64px 바 안에 높이 36px, 8px 간격, 완전한 알약 곡률로 구성한다.
- 비활성 칩은 반투명 다크 배경, 활성 게시판 칩은 흰색 배경과 짙은 글자로 대비한다.

## 4) 미결 사항·막힌 점

- `npm run test:sites` 4건 중 1건은 커뮤니티와 무관한 카테고리 관리자 문구 기대값 불일치로 실패했다.

## 5) 산출물 목록

- `public/community/bobaedream-pc-board-list.html`
- `public/community/bobaedream-pc-board-detail.html`
- `public/community/naver-cafe-list.html`
- `public/community/naver-cafe-detail.html`
- `handover/car/HANDOVER_car_v25.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- `npm run verify:qf`: 통과.
- 브라우저 제목·히어로 타이틀 확인: 완료.
- SNB 실측: 바 64px, 칩 36px, 곡률 999px, 칩 간격 8px.
- `npm run test:sites`: 3/4 통과, 관리자 페이지 기존 문구 테스트 1건 실패.
- 공개 배포: 미검수.

## 8) 다음에 할 일

1. 사용자 확인 후 GitHub Pages에 배포한다.
