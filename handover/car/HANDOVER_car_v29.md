# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v29`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v28.md`

## 1) 담당 범위

- 보배드림 커뮤니티 PC·모바일 목록 및 상세 화면의 공통 폰트.

## 2) 현재 진행 상태

- 완료: PC 목록·상세의 시스템·내비게이션·사이드 타이틀 폰트를 Pretendard Variable로 통일.
- 완료: 모바일 목록·상세의 외부 Pretendard CDN을 제거하고 저장소 내 로컬 폰트로 교체.
- 완료: 브라우저 계산값과 폰트 로드 상태 및 빌드 검수.
- 미착수: GitHub Pages 공개 배포.

## 3) 결정된 사항과 그 이유

- 화면 종류에 따라 다른 글꼴이 섞이지 않도록 커뮤니티 전체에 `Pretendard Variable`을 최우선으로 적용한다.
- 외부 CDN 대신 `public/assets/fonts/pretendard/pretendard-guazi.css`를 사용해 네트워크 상태와 무관하게 동일한 폰트를 제공한다.
- Pretendard 로드 실패 시에는 Pretendard, 시스템 폰트, Apple SD Gothic Neo, Noto Sans KR 순으로 대체한다.

## 4) 미결 사항·막힌 점

- 없음.

## 5) 산출물 목록

- `public/community/bobaedream-pc-board-list.html`
- `public/community/bobaedream-pc-board-detail.html`
- `public/community/naver-cafe-list.html`
- `public/community/naver-cafe-detail.html`
- `handover/car/HANDOVER_car_v29.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- `npm run verify:qf`: 통과.
- PC 본문·타이틀·알약 메뉴 계산 폰트: `Pretendard Variable` 확인 완료.
- 모바일 본문·타이틀 계산 폰트: `Pretendard Variable` 확인 완료.
- `document.fonts.check`: PC·모바일 모두 `true` 확인 완료.
- 공개 배포: 미검수.

## 8) 다음에 할 일

1. 사용자 확인 후 GitHub Pages에 배포한다.
