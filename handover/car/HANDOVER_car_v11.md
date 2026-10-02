# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v11`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v10.md`

## 1) 담당 범위

- 중고차 실제 메인의 모바일 상단 타이틀과 우측 액션 영역 및 공개 배포를 담당한다.

## 2) 현재 진행 상태

- 완료: 당근 기준 64px 상단과 44px 우측 액션 적용.
- 완료: 노션 원본 즐겨찾기·메뉴 SVG 적용.
- 완료: GitHub Pages 공개 배포 및 공개 화면 확인.

## 3) 결정된 사항과 그 이유

- 상단 높이 64px, 보배드림 타이틀 114×28px, 우측 터치 영역 44×44px, 아이콘 24×24px를 사용한다.
- 통합 검색바와 기능이 겹치던 헤더 검색은 즐겨찾기로 교체한다.
- 즐겨찾기와 메뉴는 노션 원본 SVG의 `#222` 색상을 유지한다.

## 4) 미결 사항·막힌 점

- 즐겨찾기·메뉴의 실제 목적지와 상태 동작은 미확인이다.
- 인앱 브라우저 보안 정책으로 원본·수정본의 한 화면 병렬 캡처는 미완료다.

## 5) 산출물 목록

- `src/main-home/MainHome.tsx`
- `src/main-home/main-home.css`
- `public/prototypes/autotrader-bobaedream-main/index.html`
- `public/prototypes/autotrader-bobaedream-main/icons/menu.svg`
- `public/prototypes/autotrader-bobaedream-main/icons/favorite.svg`
- `handover/car/HANDOVER_car_v11.md`
- 공개 URL: `https://bobaekimboae.github.io/bobaedream/`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 최신 `main`의 바이크·건설 변경을 보존해 병합했다.
- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- `npm run test:sites`: 4건 통과.
- 프로덕션 빌드 통과.
- GitHub Pages 배포 작업 성공.
- 공개 화면에서 즐겨찾기·메뉴 SVG, 타이틀 정렬, 통합 검색바, 서비스 칩 확인.

## 8) 다음에 할 일

1. 즐겨찾기·메뉴의 실제 목적지와 상태 동작을 확정한다.
2. 허용된 캡처 수단으로 당근 원본과 공개본의 병렬 비교를 완료한다.
