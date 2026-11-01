# Design QA — 보배드림 모바일 커뮤니티 / 치지직 게시판 기준

## 비교 대상

- source visual truth path: `C:\codex-work\bobaedream-community-baidu-menu\nuxt-community\artifacts\chzzk-phone-source-1080x2340.png`
- implementation URL: `http://127.0.0.1:5203/bobaedream/nuxt-community/`
- implementation screenshot path: `C:\codex-work\bobaedream-community-baidu-menu\nuxt-community\artifacts\chzzk-mobile-390x844.png`
- full-view comparison evidence: `C:\codex-work\bobaedream-community-baidu-menu\nuxt-community\artifacts\chzzk-comparison-full.png`
- focused header/list comparison evidence: `C:\codex-work\bobaedream-community-baidu-menu\nuxt-community\artifacts\chzzk-comparison-header-list.png`
- viewport: CSS `390 × 844`, device scale factor `1`
- source pixels: `1080 × 2340`; OS 상태바·내비게이션을 제외하도록 `y=95, h=2095`로 자른 뒤 `390 × 756`으로 정규화
- implementation pixels: CUA 브라우저 캡처 `390 × 843`; 비교에서는 상단 `390 × 756` 사용
- state: 치지직은 게시판 탭의 스크롤 중 상태, 구현은 게시판 탭의 첫 진입 상태. 고정 헤더·탭·필터 행·클린봇·목록 행은 같은 화면 영역으로 정규화했다.

## 필수 충실도 표면

- Fonts and typography: Pretendard 우선 스택을 사용했다. 제목 `16/21px`, 메타 `12/16px`, 대메뉴 `18px`, 헤더 `21px`로 원본의 위계와 한 줄 말줄임을 재현했다. 플랫폼명과 게시글 문구는 보배드림 데이터로 의도적으로 교체했다.
- Spacing and layout rhythm: 헤더 `58px`, 대메뉴 `52px`, 게시판 선택 행 `56px`, 클린봇 `58px`, 게시글 행 최소 `70px`, 우측 썸네일 `52px`로 맞췄다. 390px 화면에서 가로 오버플로는 없다.
- Colors and visual tokens: 원본의 흰 배경, `#222` 활성선/글쓰기 버튼, `#f4f5f6` 클린봇 배경, `#238fe3` 댓글 수, `#dedfe1` 행 구분선을 적용했다. 보배드림 블루는 이 목록 화면에서 불필요하게 추가하지 않았다.
- Image quality and asset fidelity: 뒤로·검색·메뉴·추천·조회·설정·글쓰기 아이콘은 기존 실자산을 재사용했다. 클린봇은 연결된 폰 원본에서 같은 밀도로 추출한 소스 아이콘을 사용했다. 썸네일은 보배드림 차량 콘텐츠로 교체했으며 52px 정사각 크롭을 유지한다.
- Copy and content: 화면 구조·상태 문구는 치지직과 동일한 역할을 유지하고, 서비스명·탭명·게시글은 보배드림 커뮤니티의 실제 정보 구조로 치환했다.

## 비교 이력

### 1차 — blocked

- [P1] 게시판 목록인데 `홈` 탭이 활성화되어 원본의 `게시판` 활성 상태와 달랐다.
- [P1] 원본의 파란 댓글 수가 빠져 게시물 제목 행의 정보 밀도가 달랐다.
- [P2] 클린봇 로봇 아이콘이 없고 안내 상자의 높이가 작았다.
- [P2] 게시글 썸네일이 `48px`, 원본 기준은 `52px`였고 행 구분선이 너무 옅었다.

적용한 수정:

- `게시판` 탭을 활성화하고 52px 대메뉴/4px 활성선을 유지했다.
- 제목 우측에 `#238fe3` 댓글 수를 추가했다.
- 연결된 폰 원본의 클린봇 아이콘을 적용하고 상자를 `58px`로 교정했다.
- 목록 행 `70px`, 썸네일 `52px`, 구분선 `#dedfe1`로 교정했다.

### 2차 — passed

- post-fix evidence: `chzzk-comparison-full.png`, `chzzk-comparison-header-list.png`
- 폰 원본과 구현을 하나의 780px 비교 이미지로 결합해 헤더, 탭, 필터 행, 클린봇, 제목/메타/썸네일을 재검토했다.
- 남은 차이는 보배드림 브랜드명·게시글 데이터·차량 썸네일과 원본 캡처의 스크롤 위치뿐이며 의도된 제품 차이다.
- actionable P0/P1/P2 findings: 없음.

## 인터랙션 및 런타임 검증

- 게시글 옵션 바텀시트 열기/닫기: passed
- 게시판 햄버거 드로어 열기/닫기: passed
- 플로팅 글쓰기 버튼 → `#/write`: passed
- 브라우저 콘솔 error: 0
- `pnpm test`: 3 passed
- `pnpm typecheck`: passed
- `pnpm generate`: passed (Nuxt 정적 생성 경고만 존재, 실패 없음)

## Follow-up polish

- [P3] 실제 운영 데이터가 늘어나면 제목 길이·댓글 수 세 자리·썸네일 없음 조합을 추가 시각 회귀 테스트한다.

final result: passed
