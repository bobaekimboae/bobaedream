# Design QA — 커뮤니티 정본 v9758e99 → Nuxt 4 이식

## 기준과 구현

- source visual truth: `https://bobaekimboae.github.io/bobaedream/community/naver-cafe-list.html?board=free&v=9758e99`
- local implementation: `http://127.0.0.1:5203/bobaedream/nuxt-community/?board=free`
- 대상: 사용자 프론트
- 적용 스택: Nuxt `4.6.2`, Vue `3.5.33`, TypeScript `6.0.3`, pnpm `10.33.0`
- 검증 화면: 모바일 CSS viewport `393 × 852`, PC 기본 viewport의 393px 중앙 콘텐츠 셸

## 시각 대조

- 상단 햄버거·검색·프로필과 빠른 게시판 탭의 크기, 간격, 활성 밑줄을 정본에 맞췄다.
- 자유게시판 히어로, `LIFE` 키커, 설명, 팔로워/게시물 정보, 팔로우 버튼을 이식했다.
- 정본의 말머리 칩과 게시글 옵션 진입점을 동일한 순서로 구성했다.
- 피드형 카드의 말머리, 프로필, 작성자·시간, 제목·본문, 3:2 차량 이미지, 추천·비추천·댓글·조회 정보를 이식했다.
- 단일 사진에는 수량 배지를 숨기고, 복수 사진만 `1/N`으로 표기한다.
- 정본의 로컬 배너·프로필·피드 미디어·UI 아이콘을 Nuxt `public/community/media`로 복사해 외부 핫링크에 의존하지 않는다. 이 경로는 GitHub Pages의 `/assets/` 치환 규칙과 충돌하지 않는다.

## 인터랙션 검증

- 게시글 옵션 바텀시트 열기/닫기: passed
- 보기 방식(텍스트만·간결형·목록형·피드형) 즉시 반영: passed
- 말머리 선택 시 바텀시트 닫힘과 목록 즉시 필터링: passed
- 게시판 바로가기 드로어 열기/닫기: passed
- 최근 방문, 즐겨찾기, 전체 게시판 그룹: passed
- 홈·전체는 전체 게시물 집계, 베스트는 인기글 집계: passed
- 모바일 393px 가로 오버플로: 없음
- 브라우저 콘솔 error: 0

## 코드 검증

- `corepack pnpm typecheck`: passed
- `corepack pnpm test`: passed — 2 files, 8 tests
- `corepack pnpm generate`: passed — `.output/public` 생성
- `git diff --check`: passed

## 범위와 남은 계약

- 이번 작업은 정본 UI·상호작용·정적 데이터의 Nuxt 4 이식이다.
- 운영 글쓰기, 로그인, 팔로우, 즐겨찾기 영속화, 검색 및 게시글 API는 Laravel 12 계약과 연결해야 한다.
- 현재 즐겨찾기/최근 방문은 브라우저 로컬 저장소를 사용하며 운영 DB 완료를 의미하지 않는다.
- 기존 HTML 정본과 레거시 React 시안은 변경하지 않았다.

final result: passed
