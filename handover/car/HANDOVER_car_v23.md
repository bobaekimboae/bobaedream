# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v23`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v22.md`

## 1) 담당 범위

- 보배드림 메인과 기존 커뮤니티 시안의 진입·복귀 동선을 연결한다.

## 2) 현재 진행 상태

- 완료: 커뮤니티 원본 저장소 커밋 `4da92c4`와 전달 문서 `BOBAE_PRODUCTION_HANDOFF.md` 확인.
- 완료: 모바일 목록·상세 및 PC 목록·상세 시안을 메인 저장소 정적 경로로 이관.
- 완료: 메인 GNB의 `커뮤니티` 칩에서 화면 너비에 맞는 커뮤니티 시안으로 진입하도록 연결.
- 완료: PC 커뮤니티의 보배드림 로고와 중고차 메뉴, 모바일 목록의 뒤로 버튼에 메인 복귀 동선 연결.
- 완료: 로컬 빌드·사이트 검사·PC 및 모바일 목록→상세 브라우저 검수.
- 미착수: GitHub Pages 공개 배포.

## 3) 결정된 사항과 그 이유

- 커뮤니티 진입점은 `public/community/index.html` 한 곳으로 두고 `768px` 기준으로 PC/모바일 목록을 분기한다. 메인 GNB가 디바이스별 파일명을 알 필요 없이 같은 URL을 사용하게 하기 위함이다.
- 전달받은 커뮤니티 시안의 레이아웃과 시나리오는 변경하지 않고 원본 파일을 그대로 이관했다.
- Vite 개발 서버의 SPA 폴백을 피하기 위해 메인에서는 디렉터리 경로가 아닌 `./community/index.html`을 명시했다.

## 4) 미결 사항·막힌 점

- 공개 배포는 사용자 요청 전이라 수행하지 않았다.
- 커뮤니티 시안의 로그인·글쓰기·검색 등 서버 기능은 정적 UI 시나리오이며 실제 백엔드 연동은 미확인이다.

## 5) 산출물 목록

- `src/main-home/MainHome.tsx`
- `public/community/index.html`
- `public/community/naver-cafe-list.html`
- `public/community/naver-cafe-detail.html`
- `public/community/bobaedream-pc-board-list.html`
- `public/community/bobaedream-pc-board-detail.html`
- `public/community/*.js`
- `public/community/*.css`
- `public/community/assets/**`
- `handover/car/HANDOVER_car_v23.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 외부 커뮤니티 저장소의 커밋 `4da92c4` 및 `BOBAE_PRODUCTION_HANDOFF.md`를 기준 자료로 사용.
- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- `npm run verify:qf`: 통과.
- `npm run test:sites`: 4건 통과.
- 정적 상대경로 검사: 누락 0건.
- 빌드 산출물 `dist/client/community/`: 32개 파일 확인.
- PC 목록→상세 진입 및 메인·중고차 복귀 링크 확인 완료.
- 모바일 목록→상세 진입 및 메인 복귀 버튼 확인 완료.
- 공개 배포: 미검수.

## 8) 다음에 할 일

1. 사용자 확인 후 GitHub Pages에 배포한다.
2. 공개 URL에서 모바일·PC 진입 분기와 정적 자산 404 여부를 재검수한다.
