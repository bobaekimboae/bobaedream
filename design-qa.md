# 모델별 차량리뷰 목록·상세·댓글 QA · 2026-10-17

- source visual truth paths: `artifacts/dongchedi-model-review-1017/source/12-model-list-card.png`, `01-detail-top.png`, `04-detail-comments.png` (Android 원본 1080 × 2400px).
- browser-rendered implementation paths: `artifacts/dongchedi-model-review-1017/implementation/01-list-390x844.png`, `02-detail-top-390x844.png`, `03-comments-390x844.png`.
- combined comparison evidence: `artifacts/dongchedi-model-review-1017/comparisons/list-side-by-side.png`, `detail-side-by-side.png`, `comments-side-by-side.png`.
- viewport and normalization: 동처띠 1080 × 2400 원본을 390px 폭으로 고품질 정규화했고, 구현은 390 × 844 CSS px / DPR 1로 캡처해 동일 캔버스에서 비교했다.
- state: 모델별 리뷰 피드, BMW M3 실소유자 상세 상단, 댓글 4건과 답글 링크, 찬성 수가 보이는 상세 하단.
- primary interactions tested: 목록 50건 렌더, 카드→상세, 댓글 위치 이동, 댓글 등록과 수 증가, 구독·저장·도움/별로 상태, PC 1440 × 900 회귀.
- console and image checks: 콘솔 오류 0건, 깨진 이미지 0건, 자동 게이트 `PASS 21 / FAIL 0`.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 원본의 작성자 13~14px, 인증·모델 9~10px, 평점 15px, 본문 14~15px, 댓글 본문 13px 위계를 Pretendard로 맞췄다. 숫자 점수는 검정 카드에서 흰색 17px/700으로 고정해 대비 오류를 제거했다.
- spacing and layout rhythm: 목록은 `브랜드 엠블럼·작성자 → 황금 별점·평가어·연식/보유기간 → 제목 → 본문 → 3분할 사진 → 날짜·공유·댓글·도움` 순서다. 상세는 작성자 헤더→검정 점수/세부평가→구매정보→제목/본문/사진→댓글 순서를 유지한다.
- colors and visual tokens: 동처띠 노란 면색은 보배드림 Airbnb black으로 치환하고, 별점과 구독 상태만 황금색 Chợ Tốt 자산을 사용한다. 나머지 아이콘은 기존 Reddit·Chợ Tốt·AutoScout24 SVG다.
- image quality and asset fidelity: 제조사 브랜드 로고를 프사 슬롯에 사용하고, 각 모델의 실제 매물 사진 3장을 왜곡 없이 3열로 배치했다. 상세와 목록 모두 같은 모델 사진 원천을 공유한다.
- copy and content: 한국형 제목을 유지하면서 원본의 실소유자·연식·보유기간·구매시기·지역·가격·연료별 실사용 항목을 보존했다. 댓글에는 차주 인증, 날짜/지역, 답글 링크, 찬성 수를 포함한다.
- behavior and accessibility: 댓글 입력은 빈 값 등록이 비활성화되고 정상 등록 뒤 목록 첫 행과 하단 댓글 수가 즉시 갱신된다. 모든 행동 버튼에는 텍스트 또는 접근성 이름이 있다.

## Comparison history

- Pass 1: 기존 목록은 단일 대형 사진과 압축 메타만 있어 동처띠의 3분할 실차 사진·개별 반응 구조가 약했다(P1). 댓글은 회색 요약 상자에 텍스트만 추가돼 프사·인증·답글·찬성 구조가 없었다(P1).
- Fix: 실제 모델 사진 3장 갤러리와 공유/댓글/도움 반응을 추가하고, 상세 댓글을 독립 흰색 리스트로 재구성했다. 댓글 행에 브랜드 로고, 작성자 역할, 날짜/지역, 답글 수, 찬성 버튼을 넣었다.
- Pass 2: 상세 점수 카드는 숫자 대비는 통과했지만 세부 평점의 흰 배경이 동처띠 검정 카드와 분리돼 보였다(P2).
- Fix: 종합 점수와 세부 평점을 하나의 검정 카드처럼 연결하고 숫자·막대·보조문구 대비를 통일했다.
- Pass 3: 동일 폭 비교판에서 목록·상세·댓글의 정보 계층과 수직 리듬을 재검사했고 남은 P0/P1/P2가 없음을 확인했다.

final result: passed

---

## PC 메인 카와우·당근형 탑메뉴 아이콘 실험 · 2026-10-18

- source visual truth: `C:/Users/bobae/Downloads/Carwow_차량 카테고리 아이콘/04_Used_중고차.svg`, `05_Vans_밴.svg`, `06_SUVs_SUV.svg`와 저장소 기존 `public/assets/bbm/m-gnb-home.svg`, `public/assets/bbm/category-bike.svg`.
- mapping: 홈→홈, 전체차량→SUV 실루엣, 중고차→중고차, 트럭·특장→밴, 바이크→바이크, 중고부품→부품, 커뮤니티→커뮤니티, 더보기→더보기 아이콘으로 매핑했다.
- implementation URL: `http://127.0.0.1:4318/?qf=guazi&pc=1&v=carwow-nav-icons-2`.
- browser evidence: CUA 데스크톱 탭 38, 1280×720 CSS px, light theme, guest 상태, 전체차량 활성 화면. 원본 `04-used.svg` 직접 렌더 탭 41과 구현 화면을 같은 비교 출력에서 확인했다.
- typography: 기존 Pretendard 메뉴 타이포와 활성 상태 굵기를 유지했다. 메뉴 문구와 클릭 동작은 변경하지 않았다.
- spacing: 데스크톱 아이콘 20×20px, 아이콘-텍스트 간격 7px. 1199px 이하에서는 기존 반응형 규칙에 따라 16×16px로 축소된다.
- colors: 아이콘은 CSS mask로 `currentColor`를 사용해 일반 `#1a1a1a`, 활성 `#222`와 일치한다.
- active state reference: 당근 중고거래 검색 페이지의 활성 탭을 실측해 `38px` 높이, `12px` 좌우 패딩, `9999px` 반경, `rgb(42, 48, 56)` 배경, 흰색 글자·아이콘, `16px/700`을 적용했다. 기존 하단 밑줄은 제거했다.
- image fidelity: 제공 SVG 파일을 재그리지 않고 원본 그대로 복사해 사용했다. 홈·바이크·부품·커뮤니티·더보기는 저장소 기존 SVG를 재사용했다.
- interaction/runtime: 탑메뉴 8개 모두 노출, 더보기 숫자 배지 5 유지, 가로 넘침 없음, 콘솔 오류 0건.
- correction history: 1차 구현에서 기존 `.bbm-gnb-icon { display:none }` 규칙 때문에 핵심 요청인 아이콘이 보이지 않는 P1 문제가 발견됐다. 해당 숨김 규칙을 제거한 뒤 2차 캡처에서 8개 메뉴 아이콘 노출을 재확인했다.
- remaining findings: P0/P1/P2 없음.

final result: passed

## PC 메인 초톳형 회원 액션 · 2026-10-18

- source visual truth path: `C:/Users/bobae/Downloads/Tuyển-dụng-74-384-việc-làm-mới-nhất-cập-nhật-18-10-2026.png` (646 × 129px).
- browser-rendered implementation paths: `artifacts/design-qa/pc-header-chotot-actions-local-v2.png`(1280 × 720px), `artifacts/design-qa/pc-header-account-menu-local.png`.
- viewport and normalization: 구현은 1280 × 720 CSS px / device scale 1에서 캡처했다. 원본은 우측 회원 액션만 잘라낸 참조이므로 구현 전체 화면의 동일 헤더 영역을 같은 비교 입력에서 집중 확인했다.
- state: PC 메인 `?qf=guazi&pc=1`, 전체차량 활성, 검색창 기본, 회원 액션 기본 및 계정 메뉴 펼침.
- primary interactions tested: 관심 매물 패널 열림, 계정 메뉴 열림, 로그인·회원가입·고객센터 3개 메뉴 노출, 배지 접근성 이름.
- console errors checked: 0건.

### Findings

- P0/P1/P2 없음.
- fonts and typography: 기존 Pretendard를 유지하고 액션 텍스트를 14px/600, 알림 배지를 11px/700으로 맞췄다. 참조의 굵은 알약 텍스트 계층과 동일하다.
- spacing and layout rhythm: 모든 액션은 `y 16~56`, 높이 40px로 검색창과 같은 수평선을 사용한다. 순서는 관심→알림→연락→매물관리→무료 매물등록→계정이며 8px 간격이다.
- colors and visual tokens: 외곽선 `#e7e7e7`, 본문 `#222`, 알림 `#ef476f`, 주요 CTA와 프로필 엠블럼은 보배드림 블루 `#306bd9`를 사용했다.
- image quality and asset fidelity: 관심·알림·연락·화살표는 기존 보배드림 BB SVG 자산을 사용하고, 프로필에는 기존 보배드림 로고 엠블럼을 사용했다. 임시 문자·CSS 드로잉 아이콘은 없다.
- copy and content: 베트남 원문의 기능 의미를 한국 서비스에 맞춰 `연락`, `매물관리`, `무료 매물등록`으로 현지화했다.
- responsiveness: 1200px 미만에서는 매물관리부터 단계적으로 감추고, 1020px 미만에서는 핵심 등록·계정만 남겨 검색창과 충돌하지 않는다.

### Comparison history

- Pass 1: 참조의 그룹 구조와 순서는 일치했으나 계정 화살표가 시각 요소만 있고 펼침 상태가 없었다(P2 동작).
- Fix: 계정 버튼에 `aria-haspopup`, `aria-expanded`, 화살표 회전, 로그인·회원가입·고객센터 메뉴 및 바깥 클릭 닫기를 추가했다.
- Pass 2: 6개 액션의 높이·수평선·간격을 실측하고 계정 메뉴와 관심 패널 동작, 콘솔 오류 0건을 확인했다. 남은 P0/P1/P2는 없다.

### Follow-up Polish

- P3: 원본 캡처는 버튼이 약 50px로 보이지만 우리 헤더 검색창과 기존 컨트롤이 40px 기준이라 같은 40px 리듬을 유지했다.

final result: passed

## PC 메인 텍스트 GNB · VieclamTot 블루 검색 버튼 · 2026-10-17

- source visual truth: `qa/pc-main-search/vieclamtot-reference-1440x900.png`과 사용자 지시(탑메뉴 아이콘 제거, 검정 검색 버튼을 블루로 변경).
- implementation screenshot: `qa/pc-main-search/local-blue-button-1280x720.png`.
- combined comparison evidence: `qa/pc-main-search/comparison-blue-button-2432x720.png`; 참조 화면은 종횡비를 유지해 1152×720으로 정규화하고 구현 화면 1280×720과 나란히 비교했다.
- viewport/state: PC 메인 `?qf=guazi&pc=1`, 구현 캡처 1280×720 CSS px, device scale 1, 전체차량 메뉴 활성, 검색창 기본 상태.
- measured colors: VieclamTot 스타일 자산의 주 블루 `#306BD9`, 진한 단계 `#1952BA`를 확인해 검색 버튼·포커스와 호버에 각각 적용했다.
- typography: 기존 Pretendard GNB 15px 계층과 검색 입력 16/24px을 유지해 기능 변경 외 타이포그래피 드리프트가 없다.
- spacing/layout: 560×48px 검색창과 36×36px 원형 버튼은 유지하고, GNB 아이콘만 제거해 텍스트 간격과 좌측 정렬을 단순화했다.
- colors/tokens: 메뉴 활성은 `#222`로 유지하고 검색 CTA만 `#306BD9`로 분리해 활성 메뉴와 검색 행동의 의미가 겹치지 않는다.
- imagery/icons: GNB 장식 아이콘은 제거했으며 검색 돋보기·로고·찜·마이페이지 등 기능 아이콘은 기존 자산을 유지했다.
- copy/content: 메뉴명과 검색 안내 문구는 변경하지 않았다.
- interaction: `BMW` 입력 시 모델 추천 목록 노출, URL 검색어 반영, BMW 매물 필터링을 확인했다.
- runtime: 브라우저 콘솔 오류 0건, 모바일 런타임 보호 파일 28개 무결성 통과, `npm run verify:qf` 통과.
- findings: P0/P1/P2 없음. 블루 적용 범위를 검색 CTA에만 제한한 것은 의도된 브랜드 계층이다.

final result: passed

## 커뮤니티 글쓰기 투표 기능 · 2026-10-17

- source visual truth: 네이버 게임 라운지 FIFA ONLINE 4 글쓰기의 투표 편집 화면 `https://game.naver.com/lounge/FIFA_ONLINE4/write?boardId=-1&loungeId=FIFA_ONLINE4`.
- implementation: `/community/chzzk-write.html` → 투표 작성 → `/community/naver-cafe-list.html?view=naver-discussion` 목록 → `/community/chzzk-detail.html` 상세.
- source measurements: PC 모달 폭 570px, 모서리 12px, 기본 선택지 3개, 최대 20개, 선택지 이미지·순서 변경·복수 선택·무기명·결과 공개 시점·자동 종료 설정을 확인했다.
- implementation evidence: `artifacts/community-poll-1017/01-mobile-poll-editor.png`, `02-mobile-list-registered.png`, `03-mobile-detail-voted.png`, `04-desktop-poll-editor.png`.
- functional QA: 작성 유효성, 20개 제한, 드래그 순서 변경, 선택지 이미지, 특정 날짜 종료 입력, 실제 등록, 목록 최상단 노출, 상세 투표, 공개 시점, 종료, 새로고침 유지까지 자동 검증했다.
- responsive QA: 390×844 모바일과 1440×900 PC에서 가로 넘침 0, 런타임·콘솔 오류 0. PC 모달은 570px/12px를 유지한다.
- intentional adaptations: 네이버 상표·자산은 복제하지 않고 보배드림 편집기의 기존 글꼴·아이콘·색상 체계를 유지했다. 네이버 모바일 원본의 570px 모달 잘림은 재현하지 않고 모바일 전체 화면 시트로 반응형 개선했다.
- persistence note: 현재 GitHub Pages 시안은 브라우저 로컬 저장 방식이다. 실제 회원 간 공유·기기 간 동기화에는 게시글·투표 API 연결이 필요하다.

---

## 처즈왕 결함·불만 독립 게시판 · 2026-10-17

- source visual truth: `artifacts/chezhiwang-complaint-form-audit-20261017/00-current.png`, `04-quality-selector.png`, `07-service-selector.png`, `09-other-selector.png`, `10-comprehensive-branch.png`, `21-motorcycle-brand-selector.png`, `22-submit-validation.png`, `24-submit-validation-content.png`.
- implementation screenshots: `artifacts/chezhiwang-complaint-form-audit-20261017/implementation-list-393x844.png`, `implementation-detail-393x844.png`, `implementation-writer-393x844.png`.
- viewport and density: source Android capture 1080×2400px, implementation in-app browser 394×844 CSS px at 1×. Source was visually normalized to the 393px mobile content width; browser/device chrome was excluded from fidelity judgments.
- state: 독립 목록, `czw-1001` 상세, 바이크+종합 유형 등록 폼, 빈 제출 검증 상태.
- full-view comparison: 원본의 상단 제목/등록, 작성자→차량→업체→미디어→불만 내용 순서와 흰 바탕·얇은 구분선을 유지했다. 보배드림 기존 지침에 따라 중국 파란 활성색은 에어비앤비형 검정으로 치환하고 Pretendard를 사용했다.
- focused comparison: 작성자 필수값, 자동차/바이크 분기, 제조사·모델·세부 모델, 품질 8개·서비스 7개·기타 4개, 종합 동시 노출, 사진 6장/5MB·영상 50MB, 24자 짧은 설명과 인라인 오류를 각각 원본 캡처와 대조했다.
- typography: Pretendard Variable, 헤더 18px, 섹션 17px, 필드 14px, 안내·검증 11~12px. 한국어 글자폭에 맞춰 원본보다 입력 높이와 행간을 약간 늘렸다.
- spacing/layout: 393px 기준 좌우 16px, 헤더 54px, 입력 44px, CTA 48px. 가로 오버플로 없음(`bodyScrollWidth 378`, viewport 394).
- colors/tokens: 본문 `#17191e`, 보조 `#7a7f87`, 구분 `#e3e6e9`, 오류 `#df5d00`, 배경 `#f4f5f7`; 활성 칩·CTA는 사용자 지정 검정.
- image/icon fidelity: 기존 저장소의 Reddit 뒤로/쓰기/추천, Chotot 체크, 커뮤니티 댓글·카메라·저장 SVG와 실제 차량/브랜드 자산만 사용. 깨진 이미지 0건.
- copy/content: 원문 중국어와 한국형 문구, 모든 가변 항목과 제외 범위를 `docs/chezhiwang-complaint-form-audit-20261017.md`에 보존했다.
- interactions tested: 목록→상세, 댓글 입력 UI, 저장·공감 토글, 등록 진입, 자동차/바이크 카탈로그 전환, 종합 3개 그룹 노출, 종합 최소 2개 검증, 빈 제출 첫 오류 자동 이동.
- runtime: 콘솔 경고·오류 0건, 깨진 이미지 0건.
- comparison history: 1차 브라우저 캡처에서 공용 게시판 탭·배너와 독립 화면 헤더가 중복되는 P1을 발견했다. `chezhiwang-complaint-fixes.css`에서 독립 모드의 공용 탭/배너를 숨기고 재로드 후 중복 영역이 제거된 것을 DOM과 목록 캡처로 재확인했다. 이후 P0/P1/P2 없음.
- automated gate: `node qa/chezhiwang-complaint/flow-gate.mjs` PASS — 32 rows, 4 branches, isolated storage and routes.
- supplementary repository checks: `community:verify:boards`는 이 worktree에 `@playwright/test`가 설치되지 않아 시작 전 중단됐고, `test:sites`는 빌드 산출물 `dist/client/index.html`이 없는 상태라 2/4만 실행됐다. 두 실패 모두 현재 변경 코드 실행 전 환경 의존성/선행 빌드 누락이며, 실제 IAB 브라우저 검수와 전용 게이트는 통과했다.

final result: passed

## 커뮤니티 마이페이지 · Reddit 모바일 구조 (2026-10-17)

- source visual truth: 사용자 제공 Reddit 프로필 5화면(`1000018808.jpg`, `1000018810.jpg`, `1000018812.jpg`, `1000018814.jpg`, `1000018806.jpg`).
- implementation: `/community/reddit-profile.html`, `/community/reddit-profile-edit.html`.
- visual hierarchy: 대형 커버·원형 프로필·닉네임/소개·4분할 통계·게시물/댓글/저장 항목/정보 탭·하단 5탭 구조를 모바일 원본 순서대로 구현했다.
- product adaptation: Reddit 브랜드 문구와 샘플은 보배드림 커뮤니티 회원, 자동차 게시판, 차량 이미지로 치환했다. 커버에는 저장소의 자동차 전시장 이미지를 사용했다.
- interactions: 네 탭 즉시 전환, 숨김 동작, 피드/게시물 메뉴 피드백, 게시판·글쓰기 이동, 프로필 수정 이동을 확인했다.
- edit flow: 표시 이름·소개·소셜 링크·로컬 이미지 미리보기, 글자 수, 최대 5개 링크, localStorage 저장 후 프로필 화면 반영을 확인했다.
- responsive evidence: 360px·384px는 전체 폭, 412px는 제품 규칙인 393px 중앙 프레임이며 세 폭 모두 가로 넘침 0이다.
- assets: 기존 Reddit UI 아이콘·보배드림 GNB 아이콘·실제 프로필 아바타·차량 이미지를 재사용했고 깨진 이미지 0건이다.
- screenshots: `artifacts/community-reddit-profile-1017/profile-posts-384.png`, `profile-comments-384.png`, `profile-saved-384.png`, `profile-about-384.png`, `profile-edit-384.png`.
- automated verification: `node scripts/community-reddit-profile-check.mjs` 통과, 콘솔·런타임 오류 0건.
- final result: passed.

---

## 치지직 간결형 공지 제거 · 2026-10-17

- 사용자 결정에 따라 상단 고정 공지 3건과 공지 페이지 점을 제거했다.
- 공지 제거 뒤 회색 구분대와 빈 여백도 함께 제거해 게시판 선택 아래 14px 간격으로 클린봇이 바로 이어진다.
- 댓글 숫자 블루, 추천 아이콘, 70px 목록 행, 52×52px 우측 썸네일은 유지했다.
- 360·384·412px에서 공지 DOM 0건, 클린봇 간격 14px, 깨진 이미지·콘솔 오류 0건을 확인했다.
- final result: passed.

---

## 치지직 간결형 메타 아이콘 정렬 · 2026-10-17

- 목록 메타의 추천·조회 아이콘을 치지직 전용 `buff.svg`, `chzzk-view.svg`로 통일했다.
- 두 아이콘의 슬롯을 모두 16×16px로 맞추고 숫자와의 간격을 2px, 행 높이를 17px로 통일해 서로 다른 수직 위치와 광학 크기 문제를 제거했다.
- 댓글 숫자의 보배드림 블루는 사용자 지정 예외로 유지했다.
- 360·384·412px에서 추천·조회 아이콘 16×16px, 깨진 이미지·콘솔 오류 0건을 확인했다.
- final result: passed.

---

## 간결형 동영상 배지 교체 · 2026-10-17

- 썸네일 중앙을 가리던 26px 흰색 동영상 오버레이를 제거했다.
- 레딧 `video.svg`를 사용한 19×19px 반투명 검정 원형 배지를 썸네일 좌측 아래 3px 위치에 적용했다.
- 복수 사진 수와 링크 배지는 기존 우측 아래 위치를 유지해 서로 겹치지 않는다.
- 360·384·412px에서 기존 흰색 오버레이 0건, 레딧 동영상 배지 3건, 깨진 이미지·콘솔 오류 0건을 확인했다.
- final result: passed.

## 해외 자동차뉴스 Threads형 링크 카드 QA (2026-10-17)

- source visual truth: `C:\Users\bobae\OneDrive\문서\ChatGPT\퀵필터 제작\.codex-remote-attachments\01a10689-936d-7973-9ae7-047c763eeb65\a2ed51e8-0dbd-48b2-b904-7f1a656e094a\1-1000018728.jpg`
- implementation evidence: `reports/foreign-news-threads-card-1017/implementation-mobile.png`
- scope: Threads 링크 미리보기 카드와 해외 자동차뉴스 피드 카드만 비교했다. 상단 앱 내비게이션은 제품별 고유 영역이라 제외했다.
- image card: 대표 이미지를 카드 상단 전체 폭·1.88:1로 배치하고, 아래에 출처/파비콘 → 한국어 제목을 둔다.
- no-image card: 74px 링크 아이콘 영역과 출처·한국어 제목 영역으로 압축한다.
- Korean copy: 원문 URL·출처·대표 이미지는 유지하되 외국어 원문 제목은 숨기고, AI 한국어 제목과 정확히 3개 요약 줄만 노출한다.
- visual tokens: 흰 배경, `#e2e3e5` 1px 테두리, 16px 모서리, 제목 16/21px를 적용했다.
- verification: 모바일 390×844에서 한국어 제목/요약 3줄, 이미지형 카드, 링크 동작, 깨진 이미지 0, 콘솔 오류 0을 확인했다.

final result: passed

## 네이버 스포츠뉴스형 · 2026-10-17

- source visual truth: `https://m.sports.naver.com/wfootball/news`
- implementation: `/community/naver-cafe-list.html?view=naver-sports-news`
- 콘텐츠 정책: 네이버 기사·로고·사진은 복제하지 않고 기존 보배드림 게시물과 저장소 이미지로 치환했다.
- 모바일 원본 실측: 행 x=16px·폭 343.2px·높이 88px, 이미지 88×88px, 이미지-문자 간격 12px, 제목 16/23px 2줄, 매체·시간 15/18px.
- 모바일 구현 실측: 행 x=16px·폭 343.2px·높이 88px, 이미지 88×88px, 본문 x=116px·폭 243.2px, 제목 높이 46px으로 원본과 일치한다.
- 후속 메타 구성: 제목은 1줄 22건·2줄 35건을 섞어 표시한다. 제목 아래 첫 줄은 16px 원형 프사·게시판명·닉네임, 둘째 줄은 등록일·조회·추천이다.
- 모바일 글자 실측: 제목 15.5/21px(1줄 21px·2줄 42px), 신원·수치 메타 11.5px이며 88px 행 안에서 잘림과 가로 넘침이 없다.
- PC 원본: 옅은 회색 배경 위 흰 카드, 뉴스 2열, 왼쪽 이미지와 제목·요약·매체/시간의 3단 정보 구조.
- PC 구현 실측(1280×900): 콘텐츠 프레임 1024px, 카드 988px, 열 448px×2, 열 간격 44px, 행 106px, 이미지 80×80px. 프사는 18px, 신원 12.5px, 수치 메타 12px이다.
- interaction: 리그 7개 드롭다운, 최신순·인기순 정렬, 화보기사 제외 체크를 실제 클릭 검증했다. 전체에서 화보기사 3건이 제외되며, 인기순 전환 시 첫 게시물이 변경된다.
- responsive: 390px 1열과 1280px 2열을 각각 브라우저 렌더링하고 원본과 같은 비교 입력에서 나란히 확인했다.
- accessibility: 리그 버튼 `aria-expanded`, 정렬 `tablist/aria-selected`, 화보기사 필터 `role=checkbox/aria-checked`를 상태와 함께 갱신한다.
- console: 오류 0건. `node --check`, `git diff --check` 통과.
- comparison history: 1차에서 로컬 대체 이미지 파일명의 0 채움이 빠진 P1과 PC 필터 영역이 두 줄로 늘어난 P2를 발견했다. `post-01.webp` 형식으로 수정하고 PC 화보기사 토글을 같은 행에 배치했다.
- final result: passed

## 네이버카페 좌측 썸네일형 QA (2026-10-17)

- implementation: `/community/naver-cafe-list.html?view=feed-cafe-left`
- 기존 `피드 네이버 카페`는 유지하고 `네이버 카페 · 좌측 썸네일`을 별도 보기 방식으로 추가했다.
- information hierarchy: 좌측 이미지 → 말머리 → 제목 2줄 → 작성자·시간·댓글·조회 순서이며 순위 숫자는 표시하지 않는다.
- 모바일 390×844 실측: 행 x=20px·폭 335.2px, 썸네일 x=20px·74×74px, 제목 x=106px·높이 42px, 행 30개, 가로 넘침 0.
- responsive evidence: 360px에서는 썸네일 70×70px·제목 x=96px, 412px에서는 74×74px·제목 x=107.9px, 두 화면 모두 가로 넘침 0.
- interaction evidence: 전체 게시판 메뉴 → 보기 방식에서 새 유형이 노출되고 직접 링크로 연 상태가 선택(`aria-checked=true`)된다.
- accessibility: 목록 행을 상세 페이지 링크로 제공하고, 영상·사진 수 표기는 이미지 위 보조 정보로 유지했다.
- console warning/error 0건.
- automated verification: `node --check`, `npm run build`, `npm run test:sites`, `git diff --check` 통과.

final result: passed

## 네이버 뉴스형 · 순위 제거 + 좌측 썸네일 QA (2026-10-17)

- source visual truth: `https://media.naver.com/press/056/ranking?type=comment&date=20261017`
- implementation: `/community/naver-cafe-list.html?board=best&view=naver-ranking-news&ranking=comment`
- viewport and density: 원본·구현 모두 Chrome 390×844 CSS px, device scale 1. 콘텐츠 폭 375.2px.
- state: `댓글 많은` 탭 선택 상태. 원본의 행 리듬과 글꼴을 기준으로 삼고, 사용자의 명시적 변경인 `순위 숫자 제거`와 `썸네일 왼쪽 배치`를 적용했다.
- full-view comparison evidence: 동일 실행에서 KBS 댓글 많은 원본과 보배드림 구현을 같은 390×844 화면으로 연속 캡처해 탭·랭킹 제목·행 밀도·2줄 제목·반응 수·썸네일을 비교했다.
- focused region comparison evidence:
  - 행 x=20px·폭 335.2px·높이 75px, 이후 행 간격 13px, 구분선 없음.
  - 순위 요소 0개. 링크 접근성 이름에서도 순위 숫자가 제거됐다.
  - 썸네일 x=20px·74×74px·radius 4px, 제목/메타 x=106px·폭 249.2px.
  - 제목 16/21px·400, 메타 15/18px·400, 탭 15/21px·선택 700을 유지했다.
- interaction evidence: `ranking=comment` 직접 URL과 `댓글 많은` 선택 모두 `aria-selected=true`, 제목이 `댓글 많은 랭킹`으로 바뀌고 첫 결과가 댓글수 내림차순으로 갱신된다. 많이 본·추천 많은 탭도 기존 동작을 보존한다.
- responsive evidence: 360px에서 썸네일 70×70·텍스트 x=96px, 412px에서 썸네일 74×74·텍스트 x=107.9px. 두 폭 모두 가로 넘침 0.
- fonts and typography: 네이버 뉴스의 시스템 글꼴 스택과 16/21px 제목, 15/18px 반응 수 규격을 유지했다.
- spacing and layout rhythm: 원본 75px 행 높이와 13px 행 간격을 유지하되, 제거한 순위 34px 슬롯을 없애고 이미지와 본문 사이에 12px 간격을 적용했다.
- colors/tokens: 원본의 중립 회색 정보 계층을 유지하면서 보배드림 헤더·브랜드 색상은 보존했다.
- image quality and asset fidelity: 네이버 이미지는 복사·핫링크하지 않고 저장소의 보배드림 게시물 이미지 56개를 사용했다. 모든 썸네일은 cover와 4px radius로 표시된다.
- copy and content: 네이버 기사 문구는 복사하지 않고 보배드림 베스트글 시나리오를 사용했다. 반응 수에는 스크린리더용 `댓글수/조회수/추천수`를 보존했다.
- console: warning/error 0건.
- comparison history:
  - P1: 기존 구현이 순위 숫자 + 우측 썸네일이어서 사용자 확정안과 반대였다. 숫자 DOM을 제거하고 썸네일을 첫 그리드 열로 이동했다.
  - P2: 360px에서 74px 이미지를 그대로 쓰면 본문 폭이 빠듯해질 수 있어 70px 썸네일과 10px 간격으로 보정했다. 가로 넘침 0을 재확인했다.
- automated verification: `node --check`, `npm run build`, `npm run test:sites`, `git diff --check` 통과.

final result: passed

---

# 차량리뷰 50개 · 제목·연료 가변·원문 보존 QA · 2026-10-17

- source visual truth path: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/6ecd4d1c-3f97-422c-a969-d74e18bff0e5/1-1000018699.jpg` (591 × 1280px) 및 `artifacts/dongchedi-review-reaudit-1016/04-ev-form-selected.png`.
- browser-rendered implementation screenshots: `artifacts/community-review-conditions-1017/list-50-mobile-390x844.png`, `writer-ev-390x844.png`, `list-50-pc-1440x900.png`.
- combined comparison evidence: `artifacts/community-review-conditions-1017/comparison-list-source-vs-implementation.png`, `comparison-writer-source-vs-implementation.png`.
- viewport: 모바일 390 × 844 CSS px, device scale 1; PC 1440 × 900 CSS px. 591 × 1280 원본은 390 × 844로 고품질 정규화해 동일 캔버스에서 대조했다.
- state: 차량리뷰 독립 게시판 전체 필터, 실제 차량 사진 3장 카드, 등록 화면 전기차 실소유자 상태.
- primary interactions tested: 제목 우선 검증, 5개 동력 방식 모델 변경, 오너/비오너 전환, 선택 평가 펼침, 0.5~5.0 별점 100상태, 정상 등록→상세→테스트 글 삭제, 목록 필터, 50개 상세 경로.
- console errors checked: 모바일/PC/등록/상세 전 구간 0건.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 원본의 평가 라벨 13px/18px, 보조 문구 10px/14px, 등록 제목 16px 위계를 유지했다. 요청한 제목 입력은 첫 편집 필드로 추가해 원본 평가 흐름을 밀지 않도록 별도 흰 카드로 분리했다.
- spacing and layout rhythm: 목록 카드 내부 순서는 `프사·모델 → 평점·평가 → 제목 → 내용 → 3분할 사진 → 반응`으로 원본과 일치한다. 커뮤니티 배너·베스트글은 독립 게시판 문맥을 유지하기 위한 의도적 상위 셸이다.
- colors and visual tokens: 동처띠 노랑 CTA는 사용자 지시에 따라 Airbnb black으로 치환했고, 별점은 원본 의미를 살린 황금색 Chợ Tốt 자산을 유지했다.
- image quality and asset fidelity: 23대 실제 차량의 WebP 원본 115장을 순환해 50개 리뷰·150개 이미지 슬롯을 구성했다. 깨진 이미지 0건이며 카드마다 3장 갤러리가 노출된다.
- copy and content: 중국어 별점 원문 100행을 수정 없이 보존하고 한국어 적용문을 같은 점수 버킷에 병기했다. 제목 5자 이상, 본문 30자 이상 규칙과 오류 순서를 확인했다.
- behavior and accessibility: 전기차·PHEV·EREV·하이브리드·내연기관별 평가 항목/단위, 실소유자 구매정보, 비오너 숨김, 출시 예정 사진 필수, 키보드 접근 가능한 라디오 별점과 상태 텍스트를 확인했다.

## Comparison history

- Pass 1: 5개 고정 샘플만 있어 실제 차량·사진 다양성과 제목 정보가 부족했다(P1).
- Fix: 서울오토갤러리 실제 차량 23대와 실제 사진을 기준으로 리뷰 50개를 생성하고 제목을 필수 데이터로 추가했다.
- Pass 2: 동일 차량의 반복 리뷰가 같은 3장 사진을 사용해 피드 반복감이 컸다(P2).
- Fix: 리뷰 변형별로 5장 중 시작 사진을 순환해 고유 참조 115장, 전체 150슬롯으로 재생성했다.
- Pass 3: 50개 상세를 한 브라우저 세션에서 연속 탐색할 때 개발 서버 연결 자원 한도에 도달했다(테스트 인프라 P2).
- Fix: 10개 단위로 상세 검증 페이지를 교체해 50개 전부 제목·평점·사진을 재검사했다.
- Post-fix evidence: `PASS 164 / FAIL 0`, 상세 실패 0, 깨진 이미지 0, 콘솔 오류 0.

final result: passed

---
# 차량리뷰 전체 캡처·브랜드 로고 프사 QA · 2026-10-17

- source visual truth path: `artifacts/dongchedi-review-audit-1016/`의 PNG 164장.
- implementation screenshot path: `artifacts/community-review-audit-1016/01-community-list-390x844.png` ~ `06-community-list-1440x900.png`.
- combined comparison evidence: `artifacts/community-review-conditions-1017/all-screen-comparison.png`.
- complete source contact sheets: `artifacts/community-review-conditions-1017/source-contact-sheets/source-01.jpg` ~ `source-09.jpg`.
- viewport: 동처띠 384×853dp, 구현 모바일 390×844 CSS px(DPR 1), PC 1440×900 CSS px.
- source/implementation pixels: 원본 캡처는 1080×2400 계열을 연락시트 셀 180×400으로 정규화했고, 핵심 비교는 양쪽을 390×844 셀로 정규화했다. 구현 원본 캡처는 390×844 및 1440×900이다.
- state: 목록, 등록 기본, 모델/트림 선택, EV/PHEV/EREV/하이브리드/ICE, 오너/비오너, 구매정보 선택, 0.5~5.0 별점 문구, 모델 변경 확인, 검색, 필터, 상세, 댓글.
- primary interactions tested: 5개 동력원 전환, 오너 토글, 선택 평가 펼침, 0.5점 입력, 유효성 오류, 정상 등록·상세 이동·테스트 글 삭제, 50개 목록 필터와 상세 경로.
- browser evidence: 로컬 모바일 목록에서 브랜드 로고 프사 노출, 50개 카드, 9개 브랜드, 랭크 프사 0개를 확인했다. 자동 게이트 `PASS 167 / FAIL 0`, 콘솔 오류 0.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 동처띠의 16sp 제목, 13sp 평가 라벨, 10sp 평가 문구 계층을 16px/13px/10px로 유지했다. 한국어 Pretendard의 줄바꿈과 행간을 모바일 390px에서 확인했다.
- spacing and layout rhythm: 58px 상단바, 8px 카드 바깥 여백, 22px 별 크기, 8px 별 간격과 섹션 분리를 유지했다. 독립 피드 프사는 32px 슬롯에 24px 로고를 배치했다.
- colors and visual tokens: 동처띠의 평점 황금색은 프로젝트 Chợ Tốt 별 자산으로 유지하고, CTA는 요청에 따라 Airbnb black edition을 사용했다.
- image quality and asset fidelity: 사용자 프사 대신 프로젝트 AutoHome 브랜드 로고 원본을 사용했다. `object-fit: contain`으로 벤츠·벤틀리·재규어처럼 종횡비가 다른 로고도 잘리지 않는다. 차량 사진 150개와 로고 50개 모두 로드된다.
- copy and content: 중국어 원문 100개 평점 문구를 별도 보존하고 한국 문화에 맞는 한국어 문구를 0.5점 단위로 노출한다. 제목·모델·연식·오너 상태·본문 구조는 유지한다.
- accessibility and interaction: 각 프사 이미지의 대체 텍스트는 `{브랜드} 브랜드 로고`이며, 구독·필터·등록·카드 이동 동작을 유지했다.

## Comparison history

- Pass 1: 기존 독립 피드 카드의 무작위 랭크 프사가 차량 리뷰 맥락과 맞지 않는 P2를 확인했다.
- Fix: 각 리뷰의 `brandLogo`를 프사로 연결하고 32px 원형/24px contain 규칙을 적용했다.
- Pass 2: 164장 원본을 9장 연락시트로 모두 확인하고, 핵심 5상태를 한 장의 원본/구현 비교판에서 대조했다. 브랜드 로고 50개·9종·깨짐 0, 게이트 167/0을 확인했다.

final result: passed

---

# 차량리뷰 독립 테이블 · 피드 렌더링 잠금 QA · 2026-10-16

- source visual truth path: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/6ecd4d1c-3f97-422c-a969-d74e18bff0e5/1-1000018699.jpg` (591 × 1280px).
- implementation screenshot path: Codex 인앱 브라우저 `iab://tab/39/capture/vehicle-review-feed-fix-2`에서 브라우저 렌더 캡처.
- viewport: 390 × 844 CSS px, device scale 1. 원본은 591 × 1280px 축소 Android 캡처라 동일 모바일 폭 기준으로 정보 구조와 광학 크기를 정규화했다.
- state: `board=vehicle-review`, 전체 동력방식, 첫 실소유자 리뷰, 팔로우 해제.
- full-view comparison evidence: 원본과 구현을 열어 `프사/모델 → 황금 별점/점수/평가 → 연식/보유기간 → 본문 → 3분할 사진 → 날짜/공유·댓글·추천` 순서가 유지되는지 대조했다.
- focused region comparison evidence: 첫 카드에서 프사 32px, 별 아이콘 14px, 본문 15/23px 3줄, 3분할 갤러리 80px, 하단 반응 30px을 확인했다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 동처띠처럼 별점과 평가 문구가 본문보다 먼저 읽히고, 사용자명·모델 인증 문구는 한 단계 작은 위계로 유지된다.
- spacing and layout rhythm: 리뷰 데이터는 일반 목록 행이 아니라 회색 배경 위 독립 흰색 피드 카드로 렌더링된다. 카드 내부 순서와 간격은 원본의 세로 리듬을 따른다.
- colors and visual tokens: 동처띠 노랑 대신 보배드림 에어비앤비 블랙 헤더를 유지하고, 평점 별과 팔로우만 황금색 강조를 사용한다.
- image quality and assets: 사용자 프사는 프로젝트 프로필 자산, 별·공유·댓글·추천은 초톳/레딧 자산, 차량 이미지는 같은 BMW M3 원본 3장을 사용한다.
- copy and content: 상단 통계를 `구독 2.8만명 · 리뷰 5개`, 보기 상태를 `피드형 · 차량리뷰`로 고정했다.
- behavior and accessibility: 독립 `vehicle-review` 테이블 5행만 노출되며, 전기차 필터 1행, 팔로우→팔로잉, 카드→상세 이동, 상세 별점 3.92와 세부 평가, 콘솔 오류 0건을 확인했다.

## Comparison history

- Pass 1: 전용 피드가 먼저 렌더링된 뒤 네이버 토론 자동 초기화가 다시 실행되어 일반 게시글 카드로 덮였다(P1). 별점·평가·연식·보유기간이 목록에서 사라졌다.
- Fix: 현재 활성 독립 테이블을 전역 조회 가능하게 하고, `vehicle-review`일 때 네이버 토론 초기 렌더를 차단했다. 직접 호출되는 경우도 차량리뷰 전용 렌더러로 되돌린다.
- Pass 2: 피드와 별점은 복구됐지만 상단 구독/게시물 수가 일반 게시판 임의값으로 표시됐다(P2).
- Fix: 차량리뷰 전용 설명과 `구독 2.8만명 · 리뷰 5개` 통계를 프로필 맵에 등록했다.
- Pass 3: 390 × 844에서 전용 피드 카드 5개, 평점 행, 전기차 필터, 팔로우, 상세 진입, 콘솔 오류 0건을 다시 확인했다.

final result: passed

---

# 베스트글 독립 테이블 분리 QA · 2026-10-16

- 일반 게시글 원천 `BOBAE_POSTS`와 베스트글 원천 `BOBAE_BEST_POSTS`를 분리했다.
- 베스트글은 `data/best-posts.js`의 독립 6행을 순위 순으로 렌더링하며 일반 게시판 정렬·필터 결과에 의존하지 않는다.
- 화면에는 `베스트글 / 실시간` 독립 헤더, 1~6위 순위, 3행씩 2페이지를 표시한다.
- 상세 이동은 독립 행의 `sourcePostId`로 기존 게시물 상세를 연결한다.
- 384px 브라우저에서 1~3위와 4~6위 전환을 확인했다. 일반 목록은 테슬라 필터에서 30행→4행으로 바뀌지만 베스트글 행은 유지된다.
- 기존 유튜브 배너 340.8 × 106px, 가로 오버플로 0, 콘솔 경고·오류 0을 확인했다.

final result: passed

---

# 베스트게시판 · 네이버 라운지 인기글형 QA · 2026-10-16

- source visual truth path: `https://lounge.naver.com/` 상단 `지금 라운지 트렌드` 영역을 Chrome/CUA로 직접 캡처했다.
- implementation screenshot path: `http://127.0.0.1:4189/community/naver-cafe-list.html?board=best&v=loungebest1` 로컬 렌더링을 Chrome/CUA로 직접 캡처했다.
- viewport: 원본·구현 모두 390 × 844 CSS px, desktop 회귀 1280 × 900 CSS px.
- pixel dimensions and density: 둘 다 동일 Chrome viewport 설정으로 비교했고 추가 밀도 보정은 없다.
- state: 베스트글 독립 테이블 6건, 전체 말머리, 선정 기준 안내 닫힘 상태.
- full-view comparison evidence: 순위→제목·댓글→게시판·조회→우측 썸네일의 행 구성, 72~73px 수직 리듬, 하단 구분선을 동일 상태에서 비교했다.
- focused region comparison evidence: 원본/구현 모두 순위 x=20·폭 26px, 텍스트 x=58px, 썸네일 x=299.2px·56×56px. 제목 16/21px, 메타 13/18px, 댓글 필 24px을 확인했다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 원본의 Apple SD Gothic Neo 계열 대신 기존 보배드림 디자인 시스템의 Pretendard를 유지했다. 크기·줄높이·굵기 위계는 원본과 동일하다.
- spacing and layout rhythm: 모바일 행 73px, 좌우 20px, 순위 칸 26px, 텍스트 시작 58px, 우측 썸네일 56px이다. 가로 오버플로는 0px이다.
- colors and visual tokens: 원본의 빨간 `지금` 강조를 보배드림 블루 `#1677ff`로 치환했다. 중립 텍스트·구분선·필 배경은 원본 명도를 유지했다.
- image quality and asset fidelity: 베스트 독립 테이블의 실제 게시물 썸네일만 사용하며 네이버 자산은 복사하지 않았다. 기존 알림 SVG를 재사용했다.
- copy and content: `지금 보배드림 트렌드`, 현재 시간 기준, 선정 기준 설명으로 서비스 문구를 독자화했다.
- interaction: 선정 기준 팝오버 열기·닫기, 6개 상세 링크, 글쓰기 차단을 확인했다. 브라우저 console warning/error 0건이다.

## Comparison history

- Pass 1: 기존 네이버 토론형 카드는 프로필·본문·반응 영역이 포함돼 인기 순위를 빠르게 비교하기 어려웠다(P1).
- Fix: 베스트게시판에서만 라운지형 1행 랭킹 리스트로 렌더링하고 순위·제목·댓글·조회·썸네일을 73px에 정리했다.
- Pass 2: 390px에서 원본과 주요 x좌표·크기가 일치했고 1280px 회귀, 상세 링크 6건, 팝오버, 콘솔 오류 0건을 확인했다.

final result: passed

---

# 전체 게시글 · 유튜브 헤더 규격 복구 QA · 2026-10-16

- 사용자 확정 규칙: 유튜브형 헤더 배너 340.8 × 106px
- 유지: 제네시스 코리아 공식 여수 로드트립 이미지
- 복구: 14px 좌우 여백, 12px 라운드, 106px 높이, 중앙 제목 배치. 384px 실측 340.8 × 106px 일치
- 370px 이하: 12px 좌우 여백, 100px 높이
- 풀블리드 210px 변경은 폐기했다.

final result: passed

---

# 전체 게시글 · FINN형 몰입 배경 재검 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0fe77-a06f-7a82-91f7-7cb79bab19bf/ae5197df-59c5-415b-84f7-0b8fbc7c2181/1-1000018686.jpg` (591 × 1280px)
- target: `community/naver-cafe-list.html?view=compact`, 모바일 384·360 CSS px
- asset: 제네시스 코리아 공식 여수 로드트립 캠페인 사진, 한국인 뮤지션 3명과 GV60, 생성형 이미지 아님

## Findings

- P0/P1/P2 없음.
- 반복 제공된 FINN 참고 화면에서 핵심 차이를 이미지 소재가 아니라 상단 배경의 점유율로 재분류했다.
- 기존 340.8 × 106px 둥근 카드형 배너를 폭 100% × 210px의 모서리 없는 몰입형 헤더로 변경했다.
- 한국인 인물 3명과 GV60가 모바일 세로 비율에서도 함께 남도록 `object-fit: cover`와 중앙 정렬을 적용했다.
- 제목은 이미지 하단에 배치하고 이중 그라데이션을 적용해 밝은 배경 위에서도 읽히게 했다.
- 게시판 프로필은 헤더 바로 아래 붙여 FINN의 사진→콘텐츠 전환 리듬을 따랐다.

## Comparison history

- Pass 1: 메르세데스 가족 캠페인 이미지는 구도는 적합했으나 외국인 모델이며 106px 카드형이라 국내 커뮤니티 정서와 참고 화면 위계가 달랐다(P1).
- Fix: 제네시스 코리아의 한국인 로드트립 사진으로 교체하고 좌우 여백·라운드·그림자를 제거한 210px 풀블리드 헤더로 확장했다.
- Pass 2: 384px에서 368.8 × 210px, 360px에서 344.8 × 198px로 렌더링됐다. 원본 1600 × 562px 로딩, 피사체 크롭, 제목 가독성, 가로 오버플로 0, 콘솔 경고·오류 0을 확인했다.

final result: passed

---

# 차량리뷰 목록 카드 · 동처띠 구조 재대조 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/6ecd4d1c-3f97-422c-a969-d74e18bff0e5/1-1000018699.jpg` (591 × 1280px).
- browser-rendered implementation: `http://127.0.0.1:4311/community/naver-cafe-list.html?board=vehicle-review&v=naver24gold`, Codex 인앱 브라우저에서 현재 턴 캡처·검사.
- viewport and density: 구현의 모바일 콘텐츠 폭 393 CSS px. 원본은 Android 1080 × 2400 캡처가 591 × 1280으로 축소된 자료여서 카드 내부의 정보 순서와 CSS 광학 크기를 우선 정규화했다.
- state: 차량리뷰 전체 필터, 첫 실소유자 카드, 팔로우 해제.
- full-view comparison evidence: 원본 전체 화면과 구현 목록을 열고 카드의 `프사/사용자·모델 → 평점/연식/보유기간 → 본문 → 사진 → 날짜/반응` 순서를 대조했다.
- focused region evidence: 구현 첫 카드 377 × 314px, 프사 32px, 사용자 14/18px, 모델 11/15px, 별 14px, 본문 15/23px 3줄, 3분할 사진 353 × 80px, 하단 행동 30px을 브라우저 계산값으로 확인했다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 별점은 황금색 초톳 SVG, 2자리 점수, 따옴표 평가, 연식과 보유기간을 한 줄에 배치했다. 별도 리뷰 제목을 제거해 원본처럼 본문이 평점 바로 아래 시작한다.
- spacing and layout rhythm: 회색 목록 바탕 위 8px 카드 간격, 4px 카드 반경, 12px 좌우 안쪽 여백을 적용했다. 카드 하단을 가리던 고정 작성 버튼을 제거했다.
- colors and visual tokens: 프사·본문은 중립 검정/회색, 팔로우는 원본의 주황 강조를 절제한 `#b97800`, 추천 영역은 옅은 황금 배경을 사용한다.
- image quality and asset fidelity: 제조사 엠블럼을 프사로 쓰던 오류를 제거하고 프로젝트의 실제 프로필 자산을 연결했다. 차량 이미지는 같은 BMW M3 원본 3장을 왜곡 없이 분할했다.
- copy and content: 모델 보조문구는 `BMW M3 실소유자 · 인증`, 평점은 `3.92 “보통” 2025년식 보유 7개월` 순서로 고정했다. 지역과 별도 제목은 목록 카드에서 제외했다.
- interaction and accessibility: 팔로우→팔로잉→팔로우 전환, 카드→`sample-bmw-m3` 상세 이동·뒤로가기를 확인했다. 프로필·차량 사진 대체텍스트가 있으며 콘솔 오류 0건이다.
- P3: 원본의 실제 동처띠 회원 프사는 복제하지 않고 보배드림의 로컬 프로필 자산을 사용했다. 개인정보·브랜드 독립성을 위한 의도적 차이다.

## Comparison history

- Pass 1: 제조사 엠블럼을 프사로 사용했고, 평점 아래 별도 제목, 단일 174px 이미지, 요약형 메타가 있어 원본 카드 구조와 달랐다(P1).
- Fix: 사용자 프사와 모델 인증 문구를 분리하고, 제목을 제거했으며 3줄 본문·3분할 사진·날짜·공유/댓글·추천/비추천 순서로 재구성했다.
- Pass 2: 고정 `차량 리뷰 작성` 버튼이 첫 카드 하단 행동을 덮었다(P2).
- Fix: 상단 `리뷰 등록`을 유지하고 중복 고정 버튼을 제거했다.
- Pass 3: 최종 카드 구조, 텍스트 잘림, 팔로우 상태, 상세 진입, 이미지 로딩, 콘솔 오류를 재검사했다.

final result: passed

---

# 전체 게시글 · 가족형 럭셔리카 헤더 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0fe77-a06f-7a82-91f7-7cb79bab19bf/2367ca60-e6dc-44f6-a7c3-9c543babaca3/1-1000018686.jpg` (591 × 1280px)
- implementation: `community/naver-cafe-list.html?view=compact`, Chrome 384 × 812 CSS px
- focused evidence: 전체 게시글 상단 340.8 × 106px 헤더, `board-header-mercedes-glb-family.webp` 1600 × 476px
- asset source: Mercedes-Benz GLB 공식 가족 캠페인 영상 스틸. AI 생성 이미지가 아니다.

## Findings

- P0/P1/P2 없음.
- 참고 화면의 핵심인 가족·야외·차량이 한 장면에 함께 보이는 라이프스타일 방향을 반영했다.
- 차량 단독 보도사진 대신 인물과 생활 맥락이 있는 실제 브랜드 캠페인 장면을 사용했다.
- 원본 영상 하단 워드마크는 서비스 배너에 노출되지 않도록 크롭만 적용했고 합성·생성형 보정은 하지 않았다.
- 384px 화면에서 가족과 차량이 모두 남고, 좌측 흰 제목은 어두운 그라데이션 위에서 읽힌다.
- 이미지 원본 1600 × 476px이 깨짐 없이 로딩되고, 헤더는 기존 106px 높이와 목록 레이아웃을 유지한다.
- P3: 참고 화면은 숲속 피크닉, 구현은 놀이공원 장면이다. 가족 중심 자동차 라이프스타일이라는 시각 목적은 동일하며 공식 출처 우선 원칙에 따른 허용 차이다.

## Comparison history

- Pass 1: 아스톤마틴 DB12 차량 단독 사진은 브랜드 사진이지만 가족·생활 장면이 없어 사용자 참고 화면의 정서와 달랐다.
- Fix: Mercedes-Benz GLB 공식 가족 캠페인 스틸로 교체하고 1600 × 476px 헤더 비율로 크롭했다.
- Pass 2: Chrome 384px에서 가족·차량 동시 노출, 제목 가독성, 원본 크기, 깨진 이미지 여부를 확인했다.

final result: passed

---

# 치지직 간결형 댓글 블루 범위 정정 QA · 2026-10-16

- source visual truth: 사용자 정정 `치지직 간결 게시판만 댓글 파랑색`
- implementation: `public/community/naver-cafe-list.html?view=compact`
- viewport and density: 384 × 844 CSS px, DPR 1
- state: 치지직 간결형 목록과 네이버 토론형 반응 영역 교차검증
- focused evidence: 간결형 `.compactReply`만 `#238fe3`; 토론형 `[data-discussion-comment]`는 공통 회색을 상속한다.

## Findings

- P0/P1/P2 없음.
- 간결형 댓글 숫자만 보배드림 블루로 유지했다.
- 네이버 토론형 댓글 아이콘·숫자는 기존 회색으로 복원했다.
- 폰트·간격·이미지·문구는 변경하지 않았다.
- 새 탭 재검에서 console warning/error 0건을 확인했다.

## Comparison history

- Pass 1: 블루 범위를 네이버 토론형까지 잘못 확대했다.
- Fix: 토론형 전용 블루 규칙을 제거하고 간결형 `.compactReply` 블루만 유지했다.

final result: passed

---
# 동처띠 차량 리뷰 · 등록/목록/상세 최종 QA · 2026-10-16

- source visual truth: USB 연결 Android의 동처띠 `com.ss.android.auto`에서 직접 캡처한 등록·목록·상세 화면. 핵심 캡처는 `artifacts/dongchedi-review-reaudit-1016/04-ev-form-selected.png`, `05-ev-exterior-0_5.png`, `06-ev-exterior-5_0.png`, `artifacts/dongchedi-review-audit-1016/52-review-tab.png`, `60-single-review-entry.png`이다.
- browser-rendered implementation: `community/naver-cafe-list.html?board=vehicle-review`, `?board=vehicle-review&review=write`, `?board=vehicle-review&review=sample-bmw-m3`.
- viewport and density: 원본 1080×2400/384×853dp, 구현 모바일 390×844 CSS px, PC 1440×900 CSS px.
- full-view comparison evidence: 목록→등록→상세의 정보 순서, 카드 배경, 별점 스트립, 소유 정보, 본문, 하단 액션을 화면별 대조했다.
- focused comparison evidence: 등록 별 22px, 간격 8px, 전체 선택폭 142×30px; 목록·상세 별 20px; 평가 라벨 13px/18px; 코멘트 10px/14px을 실측했다.

## Findings

- P0/P1/P2 없음.
- 원본 별점 문구 경계는 `0.5~1.5 / 2~2.5 / 3~3.5 / 4~4.5 / 5`였다. 기존 구현이 반점수에서 한 단계 빨리 전환하던 P1을 수정했다.
- 전기 계열 8항목과 내연기관·하이브리드 고유 2항목의 0.5~5.0점 총 100상태를 검사했고 모든 문구가 보이며 잘리지 않았다.
- 실소유자/비오너, EV/PHEV/EREV/하이브리드/내연기관, 출시 전 차량의 입력 가변 요소를 확인했다.
- Chợ Tốt 별·체크·정보, Reddit 뒤로·댓글·추천·작성, AutoScout24 공유, AutoHome 엠블럼 자산을 사용하며 손그림 아이콘은 없다.
- 등록→상세→테스트 글 삭제까지 통과했고 최종 목록 5개, 테스트 데이터 잔존 0건, 깨진 이미지 0건, 콘솔 오류 0건이다.
- automated gate: `PASS 235 / FAIL 0 · rating states 100`.

final result: passed

---
# 네이버 종목토론 피드 규칙·황금 별점 QA · 2026-10-16

- source visual truth: `https://m.stock.naver.com/discussion/home/topic`의 게시글 작성자 메타 행과 프로필 이미지 비율.
- browser-rendered implementation: `http://127.0.0.1:4311/community/naver-cafe-list.html?view=naver-discussion&v=naver24gold` 및 `?board=vehicle-review&v=naver24gold`.
- viewport and density: Codex 인앱 브라우저의 393px 모바일 콘텐츠 폭에서 원본과 구현을 동일 브라우저로 비교했다.
- feed profile rule: 원형 프로필 24×24px, 작성자 13px/18px, 시간 12px/18px, 프로필·작성자 간격 6px, 메타 행 24px, 카드 좌우 16px.
- spacing and hierarchy: 말머리 다음 메타 행 상단 8px, 메타 다음 제목 상단 8px로 고정해 일반 피드와 우측 썸네일 피드가 같은 리듬을 공유한다.
- asset fidelity: 임시 글자형 인라인 SVG 프사를 제거하고 `assets/profile-avatars/`의 실제 프로필 자산을 사용한다.
- review icons: 별은 `icons/chotot/chotot-common-review-star-selected.svg`와 빈 별 SVG를 사용하며, 채운 별의 원본 황금색 `#FFBA00`을 보존한다. 나머지 리뷰 동작 아이콘은 기존 Reddit·초톳·AutoScout24 자산 매핑을 유지한다.
- measured implementation: 첫 피드 프로필 `24×24px`, border-radius `50%`, object-fit `cover`; 메타 행 `24px`, gap `6px`, margin-top `8px`. 리뷰 채운 별 `15×15px`, CSS filter `none`.
- interaction and console: 프로필 규격은 목록의 링크·추천·댓글 동작을 변경하지 않는다. 로컬 빌드 성공 및 브라우저 콘솔 오류 0건을 확인했다.

## Comparison history

- Pass 1: 일반 피드는 27px, 우측 썸네일 피드는 24px로 프로필 규격이 나뉘어 있었고 임시 생성 SVG가 섞여 있었다.
- Fix: 24px 토큰을 공통화하고 실제 프로필 자산으로 통일했다.
- Pass 2: 리뷰의 초톳 황금 별 SVG에 검정 필터가 덮여 있었다.
- Fix: 채운 별 필터를 제거해 `#FFBA00` 원색을 복원하고 빈 별만 회색으로 유지했다.

final result: passed

---

# 전체 게시글 · 치지직형 목록 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/4f8c42b6-2ce9-4ad1-ade6-f10423e892ce/1-1000018632.jpg` (591 × 1280px)
- browser-rendered implementation: `cua://browser/1/tab/229716870#viewport=393x844` (`http://127.0.0.1:4176/community/naver-cafe-list.html?view=compact`)
- viewport and density: 원본 591px 폭을 393px CSS 폭으로 정규화했다. 구현은 Chrome 393 × 844 CSS px, DPR 1이며 기기 상태 표시줄은 비교 대상에서 제외했다.
- state: 기본 진입 `전체 게시글`, 구독 해제, 말머리 축소, 인기글 첫 묶음, 목록 최상단.
- full-view comparison evidence: 원본을 `view_image` 원본 해상도로 열고 동일 턴의 CUA 393 × 844 전체 화면 캡처와 비교했다.
- focused region comparison evidence: 인기글 3행과 일반 게시글 첫 4행의 핀·추천·조회 아이콘, 제목/메타 글자 크기, 구분선을 확대 비교했다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: Pretendard를 유지하고 치지직 기준으로 일반 제목 16px/23px/500, 메타 13px/17px, 말머리 12px/22px으로 맞췄다. 제목은 한 줄 말줄임, 댓글 수는 초록색 보조 정보로 분리했다.
- spacing and layout rhythm: 인기글은 44px 행 3개, 일반 게시글은 70px 행, 좌우 15px, 1px 구분선으로 정규화한 원본의 목록 밀도와 일치한다. 배너 350 × 106px과 프로필 분리 간격도 유지했다.
- colors and visual tokens: 인기글의 파란 배경을 제거하고 흰 바탕, `#33343a` 핀 배지, `#e0e1e3` 구분선으로 교체했다. 메타는 `#777a80`, 댓글 수는 `#00a66a`로 정리했다.
- image quality and asset fidelity: 기존 1440 × 450 WebP 배너를 왜곡 없이 사용하며 배너 제목과 프로필 제목을 모두 `전체 게시글`로 동기화했다. 깨진 이미지 0건이다.
- icons: 인기글은 프로젝트 의존성의 Radix `DrawingPinFilledIcon` 자산을 14px로 사용하고, 일반 게시글 추천은 기존 치지직 상향 화살표 자산, 조회는 기존 눈 아이콘을 각각 14px로 통일했다.
- copy and content: 기본 진입명·배너 제목·대체 텍스트·설명·통계가 `전체 게시글` 상태로 일치한다. 개별 게시판 탭으로 이동하면 해당 게시판명으로 다시 동기화된다.
- interaction and responsiveness: `자유게시판 → 전체 게시글` 전환과 URL 상태 복귀를 확인했다. 393 × 844와 360 × 800 모두 가로 넘침 0px, 콘솔 오류 0건이다.

## Comparison history

- Pass 1: 기본 상태가 `자유게시판`이었고 인기글은 파란 배경의 `인기` 텍스트 배지, 일반 목록은 손 모양 추천 아이콘과 말머리 미노출 상태여서 P1/P2로 분류했다.
- Fix: 기본 게시판을 `전체 게시글`로 전환하고 배너·프로필·설명을 동기화했다. 인기글을 흰 바탕의 짙은 핀 행으로 바꾸고, 말머리 칩과 치지직 상향 화살표 아이콘을 추가했다.
- Pass 2: 393px에서 44px 인기글 행, 70px 일반 행, 16px 제목, 13px 메타를 확인했다. 360px에서도 동일한 계층과 오버플로 0px을 확인해 남은 P0/P1/P2가 없다.

final result: passed

---
# 커뮤니티 차량리뷰 독립 테이블 · 블랙 에디션 QA · 2026-10-16

- source visual truth: USB 재연결한 동처띠 `NewPublisherActivityV2` 등록 화면과 `artifacts/dongchedi-review-audit-1016` 전수 캡처.
- browser-rendered implementation: `community/naver-cafe-list.html?board=vehicle-review`, 등록·상세는 `?community=reviews&review=...&from=community`.
- viewport: 390×844, 1440×900.
- architecture: `data/boards/vehicle-review.csv`를 원본으로 한 커뮤니티 독립 테이블. 일반 게시글과 혼합하지 않음.
- visual tokens: 동처띠 옐로우 대신 `#222` Airbnb식 블랙 CTA·필터·평점 진행선. 흰 배경과 8px 회색 섹션 밴드 유지.
- asset fidelity: 초톳 별점 SVG, 레딧/치지직 반응·댓글·작성 SVG, 오토스카우트 공유 SVG, 프로젝트 오토홈 계열 브랜드 엠블럼만 사용. CSS/문자 별 없음.
- interaction: 필터·구독·등록·가변 평가·상세·테스트 삭제 전부 동작.
- automated result: PASS 225 / FAIL 0, 별점 상태 100/100 노출 및 무잘림, 깨진 이미지 0, 콘솔 오류 0.

## Comparison history

- Pass 1: 차량리뷰가 커뮤니티 독립 테이블이 아니라 별도 SPA로 연결된 구조 오류를 확인했다.
- Fix: `vehicle-review` 전용 CSV/JS 테이블과 커뮤니티 내부 렌더러를 추가하고 별도 목록 진입은 내부 게시판으로 리다이렉트했다.
- Pass 2: 옐로우 CTA와 직접 표현된 평점 강조가 브랜드 요청과 달랐다.
- Fix: 블랙 에디션 토큰과 실제 아이콘 파일만 쓰도록 수정했다.
- Pass 3: 등록한 테스트 리뷰가 상세로 이동하고 삭제 후 테이블 5건·저장소 0건으로 복귀하는 것을 확인했다.

final result: passed

---
# 커뮤니티 차량리뷰 · 동처띠 등록/목록/상세 QA · 2026-10-16

- source visual truth: `artifacts/dongchedi-review-audit-1016/15-score-3.png` 및 동 폴더의 전기·내연기관·오너·비오너 전수 캡처.
- browser-rendered implementation: `?community=reviews`, `?community=reviews&review=write`, 상세 `review=sample-bmw-m3`.
- viewport: 모바일 390×844, PC 1440×900.
- typography: 앱바 17/21/700, 평가명 13/18/700, 평가 문구 10/14/400, 본문 13/21 및 14/23. 평가 행 48px, 별점 터치영역 130×30px.
- copy: 10개 평가 항목의 5단계 원문 50개를 한국 문화화했고, 0.5점 단위 100상태를 실제 클릭해 노출과 무잘림을 확인했다.
- interaction: 커뮤니티→목록→등록→별점→오너/비오너→상세 경로, 동력원별 평가 항목과 실사용 단위를 확인했다.
- assets: Reddit·Chợ Tốt·AutoScout24 아이콘과 AutoHome 계열 브랜드 엠블럼을 유지했다.
- responsive: 모바일 단일 열과 PC 820px 중앙 콘텐츠를 확인했다.
- browser evidence: `artifacts/community-review-audit-1016/` 6개 캡처와 `results.json`.
- comparison history: P1 평점 코멘트 9px/92px 숨김·말줄임을 발견했다. 한국어 단문 사전, 10px/14px 인라인 구조, 선택 점수 팝업으로 수정했다. 중간 검사에서 `편의 사양이 만족스러워요` 한 건이 실제로 잘려 FAIL했고 `편의 사양 만족`으로 수정 후 재검사했다.
- automated result: PASS 215 / FAIL 0, rating states 100, broken images 0, console errors 0.

final result: passed

---

# 차량 리뷰 게시판 · 동처띠 교차검증 QA · 2026-10-16

- source visual truth: `artifacts/dongchedi-review-audit-1016/05-selected-vehicle-form.png`, `06-submit-empty-validation.png`, `10-owner-mode.png`, `15-score-3.png`, `16-form-lower-1.png`, `17-form-lower-2.png`, `53-review-detail-top.png`, `60-single-review-entry.png`
- browser-rendered implementation: `artifacts/dealer-review-crosscheck-1016/writer-top-390x844.png`, `writer-390x844.png`, `list-390x844.png`, `detail-390x844.png`, `list-1440x900.png`
- automated results: `artifacts/dealer-review-crosscheck-1016/results.json`
- viewport and density: 모바일 390×844, PC 1440×900, DPR 1
- state: 등록 초기·반점 별점·PHEV/EREV/HEV/ICE 전환·오너 OFF·출시 전 모델·목록 필터·상세 댓글

## Findings

- P0/P1/P2 없음.
- fonts and typography: 딜러 페이지 Pretendard 체계 안에서 등록 14~16px, 메타 9~11px, 목록 본문 14px/21px, 상세 점수 18~20px로 원본의 위계를 맞췄다.
- spacing and layout rhythm: 등록은 옅은 청회색 바탕과 흰 카드, 목록은 요약→필터→작성자 카드, 상세는 작성자 헤더→어두운 점수 카드→평가·오너정보 순서를 따른다.
- colors and visual tokens: 동처띠의 노란 CTA, 짙은 점수 카드, 흰 정보 카드, 회색 보조 텍스트를 기존 보배드림 화면 토큰과 조화되게 적용했다.
- image quality and asset fidelity: 차량 엠블럼은 프로젝트의 오토홈 계열 브랜드 자산을 사용한다. 화면 아이콘은 Reddit의 뒤로·작성·채팅·추천, ChoTot의 별점·체크·닫기·정보·북마크, AutoScout24의 공유 SVG를 재사용한다.
- copy and content: 중국어 원문은 조사 문서와 시트에 보존하고 서비스 화면에서는 10개 평가항목·50개 상태의 한국형 코멘트만 노출한다.
- interaction and responsiveness: EV/PHEV/EREV/HEV/ICE, 오너/비오너, 출시 예정 모델 분기와 0.5점 입력, 필수 별점·본문·사진 검증, 목록 필터, 상세 댓글을 확인했다.
- browser verification: 프로덕션 빌드 자동 검증 `PASS 29 / FAIL 0`, 모바일·PC 가로 깨짐 없음, 프로젝트 아이콘 경로 일치, 깨진 이미지·콘솔 오류 0건이다.

## Comparison history

- Pass 1: 원본 조사의 데이터 분기는 반영됐지만 목록 카드에 모델과 무관한 매물 사진이 순환될 수 있었고 필터 칩 폭이 압축됐다.
- Fix: 제조사·모델이 일치하는 보유 매물만 연결하고 필터 칩에 최소 내용 폭과 좌우 패딩을 부여했다.
- Pass 2: 임시 Radix 아이콘이 프로젝트의 기존 서비스 시각 언어와 달랐다.
- Fix: Reddit·ChoTot·AutoScout24 프로젝트 SVG로 전면 교체하고 11~22px 범위에서 용도별 광학 크기를 맞췄다.
- Final: 등록·목록·상세와 가변 시나리오 27개를 재검증해 남은 P0/P1/P2가 없다.

final result: passed

---

# 네이버 토론형 후속 시나리오 30개 추가 QA · 2026-10-16

- source visual truth: 공개 토론형 시안 390×844에서 카드·미디어·가로 스크롤·반응 아이콘 배치를 직접 확인했다.
- browser-rendered implementation: `community/naver-cafe-list.html?view=naver-discussion`.
- viewport and density: 360 / 390 / 412 CSS px, DPR 1.
- content: 기존 30개에 전기차 충전·중고차 점검·정비·블랙박스·캠핑·세차·타이어·안전 시나리오 30개를 추가해 총 60개다.
- media: 게시물별 전용 WebP 대표 이미지 60개를 1:1 연결했다. 다중 사진은 관련 시나리오끼리만 묶고 네이티브 자유 스크롤을 유지했다.

## Findings

- P0/P1/P2 없음.
- primary mapping: 게시물 ID와 `post-01.webp`~`post-60.webp` 대표 이미지 60/60 일치, 중복 0.
- interaction: 제목·사진 상세 진입, 댓글 진입, 반응 아이콘 상호 배타 선택, 영상 재생 전환을 검증했다.
- carousel: 강제 스냅·페이지 번호·도트가 없고 가변 폭 사진 레일이 끊김 없이 자유 이동한다.
- loading: 첫 대표 이미지만 eager/high priority, 나머지는 lazy loading이다.
- responsive: 360 / 390 / 412에서 가로 넘침 0, 깨진 이미지 0, 콘솔 오류 0을 기준으로 검사한다.

final result: passed

## 텍스트형 혼합·기존 프로필 복원

- 피드 60개를 텍스트 전용 18개 / 미디어 포함 42개로 재분류했다.
- 사진 없이 성립하는 보험·비용·소프트웨어·정비 질문은 본문을 별도로 작성하고 미디어 영역을 렌더링하지 않는다.
- 미디어 포함 42개는 단일 이미지·영상 12개 / 다중 미디어 30개이며 영상 8개를 유지한다.
- 작성자 프로필은 등급 배지형 PNG 대신 기존 `assets/profile-avatars/avatar-01.svg`~`avatar-48.svg`로 복원했다.
- 360 / 390 / 412px에서 텍스트/미디어 18/42, 대표 이미지 42/42, 로컬 프로필 34종, 깨짐·가로 넘침 0을 확인했다.

## 사진 좌우 이동 정상화

- 다중 사진 30개 레일을 MIT 라이선스의 Embla Carousel 8.6.0 `dragFree` 방식으로 교체했다.
- 손가락을 놓은 뒤 드래그 속도에 비례해 감속하고, 시작·끝에서는 경계 안으로 자연스럽게 복귀한다.
- `touch-action: pan-y pinch-zoom`으로 세로 피드 스크롤과 좌우 사진 이동의 충돌을 분리했다.
- 라이브러리는 `public/community/vendor/embla-carousel/`에 로컬 보관해 CDN 장애 영향을 없앴다.
- 360 / 390 / 412px에서 실제 포인터 드래그, 관성 이동, 끝 경계 복귀, 링크 오작동 없음, 가로 넘침 0을 자동 검증했다.

---

# 커뮤니티 치지직형 인기글 고정 행 QA · 2026-10-16

- source visual truth: 첨부 이미지 `1000018598.jpg`의 게시판 상단 고정 게시물 영역 (592 × 1280px)
- browser-rendered implementation: `artifacts/community-board-order-1015/mobile-384-top-menu-tiktok-text.png` (384 × 844px)
- focused source: `artifacts/community-popular-chzzk-pinned-1016/reference-pinned-384.png` (384 × 144px)
- focused implementation: `artifacts/community-popular-chzzk-pinned-1016/implementation-pinned-384.png` (384 × 163px)
- full-view comparison evidence: `artifacts/community-popular-chzzk-pinned-1016/comparison.png` (792 × 215px)
- viewport and density: 구현 384 × 844 CSS px, DPR 1. 첨부 화면의 고정 게시물 구간을 폭 384px로 정규화했다.
- state: 자유게시판, 인기글 첫 묶음 3개가 말머리 바로 아래에 놓인 기본 상태

## Findings

- P0/P1/P2 없음.
- fonts and typography: 15px/650 한 줄 제목과 13px 댓글 수를 사용해 치지직의 조밀한 공지 행 위계를 맞췄다.
- spacing and layout rhythm: 별도 카드·섹션 제목을 제거하고 44px 게시물 행 3개, 1px 구분선, 22px 페이지 표시로 일반 게시물 목록에 자연스럽게 이어지도록 했다.
- colors and visual tokens: 흰 배경, 짙은 핀 배지, 검정 제목, 초록 댓글 수, 연한 회색 구분선을 원본과 동일한 역할로 사용했다.
- image quality and asset fidelity: 핀 역할 배지는 기존 프로젝트 태그 SVG 자산을 재사용해 22px 정사각형 안에 배치했으며 래스터 왜곡이나 임시 도형이 없다.
- copy and content: 실제 인기 점수 상위 게시물 제목과 댓글 수를 표시하며 각 행을 `인기글`로 명확하게 접근성 라벨링했다.
- interaction: 각 행은 상세 페이지로 연결되고, 하단 페이지 표시 버튼을 누르면 상위 인기글 다음 3개로 전환된다.
- browser verification: Chrome 로컬 렌더에서 인기글 3개, 섹션 실측 높이 162px, 가로 넘침 없음, 전환 후 첫 인기글 변경, 콘솔 오류 0건을 확인했다.
- regression verification: `npm run check:runtime`, `npm run community:verify:board-order`, `node --check public/community/reddit-popular.js`, `git diff --check`가 통과했다.

## Comparison history

- Pass 1: 동처띠식 별도 카드 패널은 치지직 참고 화면처럼 게시물 목록 안에서 고정 행으로 읽히지 않았다.
- Fix: 섹션 제목·썸네일 패널을 제거하고 어두운 핀 배지, 한 줄 제목, 우측 댓글 수로 구성한 고정 게시물 행 3개로 교체했다.
- Pass 2: 52px 행은 참고 화면보다 세로 밀도가 낮았다.
- Fix: 행을 44px, 배지를 22px, 페이지 표시를 22px로 줄였다.
- Final: 정규화한 원본과 구현을 한 이미지에 나란히 비교한 결과 남은 P0/P1/P2는 없다.

final result: passed

---

# 네이버 토론형 시나리오 이미지 전면 교체 QA · 2026-10-16

- source visual truth: `public/community/scenario-data.js`의 게시물 1~30 제목·본문·카테고리
- generated media: `public/community/media/discussion-scenarios-v2/post-01.webp` ~ `post-30.webp`
- mapping manifest: `public/community/media/discussion-scenarios-v2/manifest.json`
- viewport: 360 / 390 / 412 × 844 CSS px
- state: 네이버 토론형 목록, 단일 이미지·복수 이미지·영상 카드, 좌우 자유 스크롤

## Findings

- 게시물 30개와 대표 이미지 30개를 ID 기준으로 1:1 고정했다.
- 기존 Unsplash와 슈퍼카 무작위 대체 사진을 토론형 목록에서 완전히 제거했다.
- 여러 장 카드의 추가 사진은 정비·충전·중고차·사고·튜닝 등 같은 주제군 안에서만 구성한다.
- 영상 4개는 주행 장면과 연결 가능한 게시물에만 배치하고, 각 영상 포스터는 해당 게시물 전용 이미지다.
- 모든 게시물에 최소 1개의 전용 미디어가 있고 대표 이미지 중복은 0건이다.
- 자유 관성 스크롤을 유지하며 강제 스냅·페이지 번호·도트는 없다.
- 30개 WebP 파일 존재, 대표 매핑 30/30, 무관 이미지 0, 깨진 이미지 0을 자동 검사한다.

## Comparison history

- Pass 1: 게시물 사진 수를 채우기 위해 무관한 슈퍼카 이미지를 순환 삽입해 시나리오가 섞였다.
- Fix: 30개 시나리오 전용 이미지를 생성하고 ID 고정 매핑 및 주제군 보조 매핑으로 교체했다.
- Pass 2: 30개 원본을 육안 대조하고 360/390/412px 자동 시나리오 검사로 대표 이미지·영상·스크롤·상세 연결을 재검증했다.

final result: passed

---

# 자유게시판 유튜브형 확정 헤더 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/49224cb7-8b54-4b78-8f7f-7e58114fdf36/2-1000018628.jpg`
- implementation screenshot: `artifacts/community-youtube-header-1016/implementation-393x844.png`
- comparison image: `artifacts/community-youtube-header-1016/comparison-reference-vs-implementation.png`
- generated hero asset: `public/community/assets/board-header-youtube-v2.webp` (1440 × 450px, built-in Image Gen)
- viewport and density: source 591 × 1280px를 393px 폭으로 정규화, 구현 393 × 844 CSS px, DPR 1.
- state: `자유게시판` 선택, 구독 해제, 말머리 축소, 인기글 첫 묶음.
- browser-rendered evidence: Chrome/CUA 393 × 844에서 기본 주소(별도 `header` 쿼리 없음)를 확인했다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: Pretendard 기반의 배너 제목 23px/820, 채널 제목 20px/800, 통계 12px 계층이 유튜브 채널 헤더의 제목 대비를 유지하면서 게시판 밀도에 맞게 축소됐다.
- spacing and layout rhythm: 배너는 350 × 106px, 좌우 14px, 반경 12px이다. `자유` 프로필은 56px이며 배너 하단에서 14px 떨어진 독립 행에 배치해 이미지와 프로필의 경계를 명확히 했다.
- colors and visual tokens: 흰 콘텐츠 바탕, 검정 구독 칩, 파란 자유 프로필과 야간 자동차 배너의 네이비·앰버 톤이 충돌 없이 이어진다.
- image quality and asset fidelity: 1440 × 450 WebP 원본을 `object-fit: cover`로 사용하며 깨진 이미지 0건, 왜곡·워터마크·브랜드 로고가 없다.
- copy and content: 배너에는 `자유게시판`, `자동차를 넘어, 사람 사는 이야기`를 배치했고 기존 구독 수·게시물 수·설명은 유지했다.
- interaction and responsiveness: 게시판 탭을 `자동차뉴스/토론`으로 전환하면 배너 제목도 동기화되고, 자유게시판 복귀와 구독/구독 취소가 정상 동작한다. 가로 오버플로는 0px이다.
- accessibility: 배너 이미지 대체 텍스트가 있고 제목은 실제 텍스트로 유지된다. 콘솔 오류 0건.

## Comparison history

- Pass 1 baseline: 기존 유튜브형은 80px 배너와 프로필이 분리돼 채널 헤더 결속이 약했고, 이미지 안에 게시판 타이틀이 없었다.
- Fix: 106px 전용 배너를 새로 제작하고 배너 제목·태그라인과 동적 게시판명 동기화를 추가했다. 후속 요청에 따라 프로필 겹침을 제거하고 배너 아래 14px 간격의 독립 행으로 분리했다.
- Pass 2: 기준 화면과 구현을 393px 폭으로 나란히 비교했다. 유튜브식 배너→채널 정체성→설명 흐름은 유지하면서 게시판 목록의 정보 밀도도 보존돼 남은 P0/P1/P2가 없다.

final result: passed

---

# 커뮤니티 게시판 헤더 · 유튜브형/레딧형 2안 QA · 2026-10-16

- source visual truth paths:
  - YouTube: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/49224cb7-8b54-4b78-8f7f-7e58114fdf36/2-1000018628.jpg` (592 × 1280px)
  - Reddit: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/49224cb7-8b54-4b78-8f7f-7e58114fdf36/1-1000018630.jpg` (592 × 1280px)
- browser-rendered implementation screenshots: CUA Chrome tabs `229716808` (YouTube) and `229716811` (Reddit), captured inline at 393 × 844 CSS px.
- implementation URLs:
  - `http://127.0.0.1:4176/community/naver-cafe-list.html?view=compact&board=free&header=youtube&v=local1`
  - `http://127.0.0.1:4176/community/naver-cafe-list.html?view=compact&board=free&header=reddit&v=local1`
- viewport and density: 구현 393 × 844 CSS px, Chrome DPR 1. 원본의 앱 상태바·하단 내비게이션은 비교에서 제외하고 상단 탭부터 프로필 설명까지의 콘텐츠 영역을 비율로 정규화했다.
- state: 자유게시판 선택, 구독 전, 말머리 첫 줄과 인기글 첫 묶음이 보이는 기본 상태.
- full-view comparison evidence: 두 원본 이미지를 원본 해상도로 열고, 같은 턴의 393px CUA 구현 캡처 2개와 함께 상단 구조·이미지 비율·프로필 행·설명 영역을 비교했다.
- focused region comparison evidence: 구현 유튜브 배너 361 × 80px(스크롤바 없는 실제 모바일 기준), 레딧 배너 393 × 102px. 프로필 아바타는 각각 62px, 56px이며 이미지 자연 크기는 1440 × 450px, 1440 × 432px이다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 기존 Pretendard 게시판 위계를 유지하며 채널명은 유튜브형 19px/780, 레딧형 18px/760, 통계는 12px으로 참고 화면의 제목·보조정보 대비를 맞췄다.
- spacing and layout rhythm: 탑메뉴 텍스트 탭 바로 아래에 헤더를 배치했다. 유튜브형은 좌우 16px과 12px 곡률, 레딧형은 전체 폭 무곡률로 플랫폼별 구도를 분리했다. 프로필은 두 참고 화면처럼 배너 아래 별도 행에 놓였다.
- colors and visual tokens: 기존 흰 배경·검정 활성 탭·검정 구독 칩을 유지해 새 이미지가 목록과 경쟁하지 않도록 했다.
- image quality and asset fidelity: 두 배너는 각 슬롯 비율에 맞춘 1440px 실사 WebP 자산이다. 확대·찌그러짐 없이 `object-fit: cover`로 표시되며 깨진 이미지 0건이다.
- copy and content: `자유게시판`, `구독 38.4만명 · 게시물 1,000개`, 기존 게시판 설명과 말머리를 유지해 헤더 비교 외 정보 구조가 바뀌지 않는다.
- interaction and accessibility: 게시판 탭 전환 후 `자동차뉴스/토론`에서 `자유게시판`으로 정상 복귀했고 구독 토글도 정상 작동한다. 배너에는 구체적인 대체 텍스트가 있다.
- browser verification: 두 안 모두 문서 가로 오버플로 0px, 깨진 이미지 0개, 콘솔 오류 0건이다.

## Comparison history

- Pass 1: 유튜브 113px·레딧 118px 높이와 프로필 겹침이 참고 화면보다 무겁게 보여 P2로 분류했다.
- Fix: 실제 참고 비율에 맞춰 유튜브형을 80px, 레딧형을 102px로 낮추고 프로필을 배너 아래 분리했다.
- Pass 2: 탭→배너→프로필→설명의 위계와 플랫폼별 모서리 차이가 명확해졌고 남은 P0/P1/P2는 없다.

final result: passed

---

# 상세페이지 레딧형 통합 투표칩 QA · 2026-10-16

- source visual truth: 사용자 제공 Reddit 상세 화면 `1000018620.jpg`의 `추천 아이콘 · 점수 · 비추천 아이콘` 단일 알약칩 구조.
- browser-rendered implementation: `http://127.0.0.1:4313/community/chzzk-detail.html?id=1&v=reddit-vote-pill`.
- viewport and density: 모바일 360 × 800 CSS px와 PC 1280 × 900 CSS px에서 확인했다.
- state: 기본 상태와 좋아요 선택, 싫어요 선택을 각각 검증했다.
- full-view comparison evidence: 본문 하단 반응바는 통합 투표칩, 댓글칩, 재게시, 공유 순서를 유지하며 모바일 가로 넘침이 없다.
- focused region evidence: 모바일 투표칩 103.6 × 40px, 좌우 버튼 각 38px, 가운데 점수 영역 26px. PC 투표칩 109.7 × 42px, 좌우 버튼 각 40px으로 균형을 맞췄다.

## Findings

- P0/P1/P2 없음.
- copy and content: 화면의 `좋아요`, `싫어요` 문구를 제거하고 숫자만 노출했다. 접근성 이름은 버튼에 유지했다.
- spacing and layout rhythm: 투표 3요소를 하나의 외곽선 안에 묶고 숫자 양옆에 얇은 구분선을 적용해 Reddit의 조밀한 반응바 리듬을 재현했다.
- interaction: 기본 추천 24에서 좋아요 선택 시 본문 점수와 상단 추천이 모두 25, 싫어요 선택 시 모두 23으로 동기화됐다.
- responsive behavior: 모바일 반응바 clientWidth/scrollWidth가 모두 315px, PC에서는 모두 1028px으로 오버플로가 없다.
- browser verification: 모바일·PC 모두 `.voteLabel` 0개, 통합 `.votePill` 2개, 콘솔 오류 0건을 확인했다.

## Comparison history

- Pass 1: 분리된 `좋아요`, `싫어요` 텍스트 칩은 참고 화면보다 폭이 넓고 투표 관계가 분산돼 보였다.
- Fix: 두 버튼과 점수를 단일 투표칩으로 합치고 보이는 텍스트를 제거했다.
- Pass 2: 모바일과 PC에서 버튼 폭, 점수 동기화, 오버플로, 콘솔 오류를 재검증했다.

final result: passed

---

# 커뮤니티 에펨형 인기글 강조 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/532b35e5-fd28-415f-8d24-e2027aae303e/1-1000018618.jpg` (592 × 1280px)
- browser-rendered implementation: CUA Chrome tab `229716713`, `http://127.0.0.1:4176/community/naver-cafe-list.html?view=compact&board=free&v=fm-popular-before`의 393 × 680px 브라우저 캡처
- viewport and density: 구현 콘텐츠 폭 393 CSS px, DPR 1. 원본은 모바일 화면에서 인기글 목록의 배경·배지·제목 위계를 기준으로 정규화했다.
- state: 자유게시판, 인기글 첫 묶음 3개와 일반 게시물 첫 행이 함께 보이는 기본 상태
- full-view comparison evidence: 현재 작업의 원본 이미지 출력과 CUA 구현 캡처를 함께 열어 인기글 묶음과 일반 글 목록의 대비를 비교했다.
- focused region comparison evidence: 구현의 인기글 영역은 실측 393 × 168px, 행 46px, `인기` 배지 31 × 22px이다. 요소가 충분히 읽히므로 별도 확대 크롭은 필요하지 않았다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 인기글 제목은 Pretendard 15px/560, 댓글 수는 13px/560, 배지는 12px/760으로 에펨 참고 화면의 제목·댓글·상태 위계를 유지한다.
- spacing and layout rhythm: 인기글은 46px 높이의 3개 행으로 묶고, 좌우 16px·배지와 제목 사이 8px·1px 내부 구분선을 적용했다. 일반 게시물과는 기존 8px 회색 밴드로 분리된다.
- colors and visual tokens: 인기 행은 `#edf7ff`, 내부 구분선은 `#d7e8f5`, 배지는 `#2f86df`, 댓글 수는 `#2878bb`로 구성해 참고 화면의 연한 하늘색 인기 묶음을 재현했다.
- image quality and asset fidelity: 이번 변경은 텍스트 상태 배지와 배경 토큰이며 신규 래스터 자산이 없다. 기존 핀 이미지를 억지로 변형하지 않고 참고 화면처럼 실제 `인기` 레이블을 사용했다.
- copy and content: 상위 반응량 게시물 3개에만 `인기` 배지를 표시하고 일반 게시물에는 적용하지 않아 의미가 명확하다.
- interaction: 페이지 표시 버튼을 누르면 첫 제목이 `오토파일럿 차선 중앙 유지가 흔들립니다`에서 `랩핑 색상 샘플 받았는데 무광 관리 어렵나요?`로 바뀌며 배경과 배지 스타일이 그대로 유지된다.
- browser verification: `리퍼럴 홍보 안내`는 계속 노출되지 않고, 인기글 바로 아래 일반 게시물이 이어진다. 앱 코드에서 발생한 콘솔 오류는 없으며 관찰된 비동기 메시지 채널 오류는 Chrome 확장 프로그램의 기존 로그다.

## Comparison history

- Pass 1: 어두운 핀 아이콘과 흰 배경은 치지직형 고정글에는 맞았지만 이번 에펨 참고 화면의 인기글 묶음 구분이 약했다.
- Fix: 핀을 파란 `인기` 배지로 교체하고 인기글 3개 행 전체에 연한 하늘색 배경과 청회색 구분선을 적용했다.
- Pass 2: 393px 브라우저 캡처에서 배지·제목·댓글 수가 한 줄에 정렬되고 일반 게시물과 명확히 분리되는 것을 확인했다. 남은 P0/P1/P2는 없다.

final result: passed

---

# 커뮤니티 동처띠 상단 우측 썸네일 인기글 QA · 2026-10-16

- source visual truth: Google Drive `동처띠 우측 썸네일 인기글.jpg`의 상단 `赛事直击` 영역 (`.tmp/dcd-popular-reference.jpg`, 1080 × 2400px)
- browser-rendered implementation: `artifacts/community-board-order-1015/mobile-384-top-menu-tiktok-text.png` (384 × 844px)
- focused source: `artifacts/community-popular-dcd-list-1016/reference-popular-384.png` (384 × 245px)
- focused implementation: `artifacts/community-popular-dcd-list-1016/implementation-popular-384.png` (384 × 241px)
- full-view comparison evidence: `artifacts/community-popular-dcd-list-1016/comparison.png` (792 × 297px)
- viewport and density: 구현 384 × 844 CSS px, DPR 1. 원본 상단 인기글 구간을 1080px에서 384px 폭으로 정규화했다.
- state: 자유게시판, 인기글 첫 묶음(대표 제목 1개 + 우측 썸네일 목록 2개)

## Findings

- P0/P1/P2 없음.
- fonts and typography: 18px 섹션 제목, 15.5px 대표 제목, 14.5px 목록 제목, 12~13px 메타 정보로 원본의 제목·작성자·보조 정보 위계를 재현했다.
- spacing and layout rhythm: 16px 좌우 여백, 14px 패널 반경, 60 × 54px 우측 썸네일, 두 줄 목록과 하단 페이지 표시를 원본 상단 패널 순서로 맞췄다. 구현 섹션 241px로 원본 정규화 높이 245px에 맞췄다.
- colors and visual tokens: 옅은 청회색 배경, 흰 패널, 짙은 제목, 청회색 메타, 하늘색 `NEW` 배지로 원본의 중립적인 정보형 팔레트를 유지했다.
- image quality and asset fidelity: 게시물 원본 차량 이미지를 `object-fit: cover`로 우측 썸네일에 사용했고, 태그·화살표는 프로젝트의 기존 SVG 자산을 재사용해 임시 도형을 만들지 않았다.
- copy and content: `인기글 · 지금 많이 보는 이야기`, `더 많은 글`, `조회`, 작성자와 게시 시간으로 한국어 커뮤니티 문맥에 맞게 현지화했다.
- interaction: `더 많은 글`을 클릭하면 대표 인기글이 `오토파일럿 차선 중앙 유지가 흔들립니다`에서 `랩핑 색상 샘플 받았는데 무광 관리 어렵나요?`로 전환되고 페이지 표시가 함께 바뀌는 것을 확인했다. 제목과 두 목록은 상세 페이지 링크다.
- browser verification: Chrome 로컬 렌더에서 대표 1개·우측 썸네일 목록 2개를 확인했고 콘솔 오류는 0건이다.
- regression verification: `npm run check:runtime`, `npm run community:verify:board-order`, `node --check public/community/reddit-popular.js`, `git diff --check`가 통과했다.

## Comparison history

- Pass 1: 직전 구현은 원본 하단의 가로 토론 카드·노란 CTA를 재현해 사용자가 지정한 상단 우측 썸네일형과 구조가 달랐다.
- Fix: 하단 토론 카드를 제거하고 상단 섹션과 같은 대표 제목, 작성자 메타, 우측 썸네일 2개, 페이지 표시 구조로 교체했다.
- Pass 2: 정규화한 원본과 384px 구현을 한 이미지에 배치해 비교했다. 정보 위계, 우측 이미지 배치, 패널 색과 반경이 같은 패턴으로 읽히며 남은 P0/P1/P2는 없다.

final result: passed

---

# 커뮤니티 동처띠형 인기글 QA · 2026-10-16

- source visual truth: Google Drive `동처띠 우측 썸네일 인기글.jpg` (`.tmp/dcd-popular-reference.jpg`, 1080 × 2400px)
- browser-rendered implementation: `artifacts/community-board-order-1015/mobile-384-top-menu-tiktok-text.png`
- focused source: `artifacts/community-popular-dcd-1016/reference-popular-384.png`
- focused implementation: `artifacts/community-popular-dcd-1016/implementation-popular-384.png`
- full-view comparison evidence: `artifacts/community-popular-dcd-1016/comparison.png`
- viewport and density: 구현 384 × 844 CSS px, DPR 1. 원본의 인기 토론 구간을 잘라 폭 384px으로 정규화했다.
- state: 자유게시판, `지금 인기` 첫 카드가 왼쪽에 맞춰진 기본 가로 스크롤 위치

## Findings

- P0/P1/P2 없음.
- fonts and typography: 제목 18px/800, 설명 13px, 카드 제목 15px/21px, 토론 배지 11px로 원본의 굵은 제목·보조 설명·작은 배지 위계를 재현했다.
- spacing and layout rhythm: 320 × 158px 카드, 16px 시작 여백, 10px 카드 간격, 14px 반경을 사용해 한 카드와 다음 카드 일부가 보이는 원본 구성을 맞췄다.
- colors and visual tokens: 옅은 청회색 섹션 배경, 흰 카드, 검정/노랑 토론 배지, 주황색 반응 문구, 노란 토론 버튼을 원본 팔레트에 맞췄다.
- image quality and asset fidelity: 기존 게시물 차량 이미지를 74 × 64px 우측 썸네일로 배치하고 `object-fit: cover`를 적용해 왜곡이 없다. 새로고침·인용 부호는 기존 SVG 자산을 재사용했다.
- copy and content: 원문의 `正在热议` 흐름을 `지금 인기 · 실시간으로 뜨는 이야기`, `새로고침`, `n명이 토론 중`으로 자연스럽게 현지화했다.
- interaction: `새로고침` 클릭 시 상위 5개 카드가 두 칸씩 순환하며 첫 카드가 실제로 변경되는 것을 접근성 트리에서 확인했다. 카드 본문과 노란 버튼 모두 상세 페이지로 연결된다.
- browser verification: Chrome 로컬 렌더에서 카드 5개, 카드 실측 320 × 158px, 콘솔 오류 0건을 확인했다.
- regression verification: `npm run check:runtime`, `npm run community:verify:board-order`, `git diff --check`가 모두 통과했다.

## Comparison history

- Pass 1: 네이버 카페형 상단 이미지 카드가 동처띠 원본의 우측 썸네일·토론 배지·노란 참여 버튼 구조와 달랐다.
- Fix: 섹션을 `지금 인기` 헤더와 우측 새로고침, 우측 썸네일 카드, 주황색 반응 문구, 노란 CTA로 전면 재구성했다.
- Pass 2: 384px 비교에서 카드 높이와 썸네일 비중이 원본보다 컸다.
- Fix: 카드 높이를 166px에서 158px, 썸네일을 82px에서 74px, 제목을 16px에서 15px로 조정하고 상단 여백을 제거했다.
- Final: 정규화된 원본과 384px 구현을 한 이미지에 배치해 비교한 결과 남은 P0/P1/P2가 없었다.

final result: passed

---

# 네이버 증권 토론형 피드 QA · 2026-10-16

- source visual truth: `https://m.stock.naver.com/discussion/home/topic`
- secondary media interaction source: `https://www.chotot.com/danh-gia-tu-cu-dan?area_v2=13107&region_v2=13000&ward=9230`
- browser-rendered implementation: `reports/naver-discussion-feed-1016/implementation-390x844.png`, `reports/naver-discussion-feed-1016/implementation-video-390x844.png`
- full-view comparison evidence: 원본과 구현을 390 × 844로 함께 캡처해 로컬에서 나란히 검수했다. 제3자 게시물·브랜드 화면은 PR에 보관하지 않았다.
- viewport and density: 원본·구현 모두 Chrome 390 × 844 CSS px, DPR 1
- state: 자유게시판, 네이버 토론형, 게시물 피드 카드만 노출

## Findings

- P0/P1/P2 없음.
- fonts and typography: 토론 제목은 Pretendard 16px/24px/750, 본문은 14px/21px으로 원본의 제목→요약 위계를 반영했다.
- spacing and layout rhythm: 보배드림 게시판 프로필 바로 아래에서 16px 좌우 여백의 토론 카드가 연속되며 별도 네이버 탐색 영역이 끼어들지 않는다.
- colors and visual tokens: 흰 배경, 중립 회색 경계선, 검정 제목과 회색 메타 정보로 피드 카드에만 네이버 토론의 정보 위계를 적용했다. 네이버 브랜드 자산은 복사하지 않았다.
- image quality and asset fidelity: 게시판·작성자·게시물 이미지는 기존 데이터와 저장소의 차량 이미지·영상 3개를 사용한다. PNG 차량 컷은 `contain`, 사진·영상은 `cover`로 처리한다. 첫 사진만 우선 로딩하고 나머지는 지연 로딩한다.
- copy and content: 네이버 원문 게시물은 복사하지 않고 기존 보배드림 테스트 게시물로 토론 카테고리·작성자·제목·요약·반응 수를 구성했다.
- interaction: 버프·너프는 아이콘·숫자·선택 기능만 유지하고 보이는 텍스트는 제거했다. 다중 미디어는 초톳·스레드 방식의 가로 스와이프와 스냅을 제공하고, 가로형·정사각형·세로형·긴 세로형을 같은 높이의 레일에 섞는다. 영상은 중앙 재생 버튼으로 실제 재생되며 다른 영상을 틀면 이전 영상이 멈춘다. 댓글·상세 이동도 유지한다.
- responsive verification: 360/390/412px에서 다중 미디어 레일 14개, 이미지 비율 4종, 영상 카드 4개, 첫 레일 1→2 이동, 페이지 번호·도트 0개, 카드마다 투표 아이콘 2개, 보이는 버프·너프 문구 0개, 문서 가로 오버플로 0px을 확인했다.
- browser verification: Chrome에서 콘솔 오류 0건과 3개 모바일 폭 자동 검사를 확인했다.

## Comparison history

- Pass 1: 네이버 토론 홈에서 탭·토론방·실시간 키워드·정렬·클린봇·토론 카드·중간 인기 토론 모듈의 순서를 실측했다.
- Fix: 기존 게시판의 보기 방식에 `피드형 · 네이버 토론`을 추가하고, 기존 게시물·프로필·상세 링크를 새 피드 구조에 연결했다.
- Pass 2: 390px 원본과 구현을 나란히 비교하고 360/390/412px에서 상호작용과 가로 넘침을 재검증했다.
- 사용자 후속 수정: 네이버의 상단 탐색 구조와 중간 추천 모듈을 모두 제거하고 게시물 피드 리스트만 남겼다.
- 사용자 후속 수정 2: 피드 카드의 버프·너프 문구만 제거하고 아이콘·숫자·선택 상태는 유지했다.
- 사용자 후속 수정 3: 사진이 여러 장인 게시물은 좌우 스와이프 레일로 바꾸고 다음 사진 미리보기, 스냅, `현재 / 전체` 표시와 페이지 점을 추가했다. 사진 한 장은 기존 전체 폭을 유지했다.
- 사용자 후속 수정 4: `현재 / 전체` 번호는 선택 이미지 우측 상단 안쪽, 페이지 점은 선택 이미지 하단 중앙을 기준으로 배치했다. 다음 이미지 미리보기 영역에는 페이지네이션이 걸치지 않는다.
- 사용자 후속 수정 5: 초톳 주민 리뷰를 다시 확인해 같은 높이 안에서 가로·정사각·세로 이미지 폭을 보존하도록 바꿨다. 영상 게시물은 실제 로컬 MP4와 재생 버튼을 연결했고 페이지네이션은 각 미디어 카드 안에 개별 배치했다.
- 사용자 후속 수정 6: 한 화면에 서로 다른 폭의 미디어 카드가 2개 이상 보이는 레일에서는 현재 페이지 기준이 모호해 번호와 도트를 모두 제거했다. 좌우 스크롤·스냅·다음 카드 노출·영상 재생은 유지했다.
- 사용자 후속 수정 7: 사진 제스처가 카드마다 끊기던 `mandatory`·`always` 강제 스냅과 강제 부드러운 스크롤을 제거했다. 네이티브 관성 스크롤, `proximity` 스냅, 자유롭게 여러 카드를 넘길 수 있는 `normal` 정지로 바꿨다.
- 사용자 후속 수정 8: `proximity` 스냅에서도 끊김이 남아 있어 가변 폭 미디어 레일의 스냅을 완전히 제거했다. 손가락 이동량과 관성을 그대로 유지하는 자유 가로 스크롤로 확정했다.
- 전수 시나리오 검수: 360/390/412px에서 렌더링, 단일·다중 미디어, 4종 비율, 자유 스크롤 위치 유지, 페이지네이션 제거, 이미지 로딩, 제목·사진 상세 ID 연결, 첫 이미지 우선 로딩, 후속 이미지 지연 로딩, 영상 재생·컨트롤·상태 문구, 다른 영상 재생 시 기존 영상 정지, 버프·너프 선택·상호 배타·재선택 해제, 댓글 앵커 이동, 가로 오버플로, 콘솔 오류를 자동 검사한다.

final result: passed

---

# 커뮤니티 네이버 카페형 HOT 인기글 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/10f2cb83-b293-4fc4-99a9-7a9fb5dc4c15/1-1000018586.jpg`
- browser-rendered implementation: `artifacts/community-board-order-1015/mobile-384-top-menu-tiktok-text.png`
- normalized source: `artifacts/community-popular-naver-1016/reference-384.png`
- full-view comparison evidence: `artifacts/community-popular-naver-1016/comparison.png`
- viewport and density: 구현 384 × 844 CSS px, DPR 1. 원본 592 × 1280px을 폭 384px으로 정규화해 384 × 830px으로 비교했다.
- state: 자유게시판, HOT 인기글, 기본 가로 스크롤 위치

## Findings

- P0/P1/P2 없음.
- fonts and typography: 제목 행은 Pretendard 17px/780, 카드 제목은 15px/21px 두 줄 말줄임, 조회·댓글 메타는 12px로 맞췄다.
- spacing and layout rhythm: 144 × 188px 카드, 이미지 98px·본문 90px, 10px 카드 간격, 16px 시작 여백, 14px 반경으로 참고 화면의 밀도와 일부 노출되는 세 번째 카드를 재현했다.
- colors and visual tokens: 흰 제목 행, `#f5f6f7` 카드 본문, 중립 회색 메타, 참고 화면에서 추출한 빨간 불꽃 아이콘을 사용했다.
- image quality and asset fidelity: 참고 화면의 불꽃을 투명 PNG로 정리했고 기존 차량 이미지와 댓글 SVG를 재사용해 선명도를 유지했다.
- copy and content: `HOT 인기글`, 사진 수 배지, 조회 수, 댓글 수를 반응량 기준 상위 5개 게시물 데이터로 생성한다.
- interaction: 카드 상세 링크와 우측 화살표 가로 이동을 확인했다. 화살표 클릭 시 `scrollLeft`가 16에서 324로 이동했고 콘솔 오류는 0건이었다.
- regression verification: `npm run check:runtime`, `npm run community:verify:board-order`, `git diff --check`가 모두 통과했다.

## Comparison history

- Pass 1: 레딧형 전체 이미지 카드가 네이버 카페 참고 화면의 이미지·본문 분할 구조와 달랐다.
- Fix: 상단 사진·하단 제목/메타 카드로 재구성하고 제목 행에 불꽃과 우측 이동 화살표를 배치했다.
- Pass 2: 인라인 요소 때문에 카드 크기가 흐트러지는 문제를 발견해 카드와 이미지 래퍼를 블록 요소로 고정했다.
- Pass 3: 첫 카드가 화면 왼쪽에 붙는 스냅 문제를 발견해 트랙 패딩과 스크롤 패딩을 분리하고 16px 여백을 복원했다.
- Final: 정규화된 원본과 384px 구현을 나란히 비교해 남은 P0/P1/P2가 없음을 확인했다.

final result: passed

---

# 상세페이지 좋아요·싫어요 분리 알약칩 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a128e5-de8a-78d0-9ed9-96cbde6a07c3/309bf5e7-9636-40c7-89f5-263195470246/1-1000018588.jpg`
- browser-rendered implementation: CUA Chrome tab `229716765`, `http://127.0.0.1:4313/community/chzzk-detail.html?id=1&v=split-likes`
- viewport and density: 구현 360 × 800 CSS px, DPR 1. 원본 591 × 1279px은 상세 본문 하단의 투표 액션 구조를 기준으로 비교했다.
- state: 일반 게시물 상세, 좋아요·싫어요 미선택 및 각 선택 상태
- full-view comparison evidence: 원본과 브라우저 렌더를 열어 본문 하단에 독립된 두 개의 캡슐 액션이 놓이는 구조를 확인했다.
- focused region comparison evidence: 구현에서 각 칩 68 × 40px, 반경 22px, 내부 아이콘 18px, 칩 사이 간격 6px을 실측했다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: Pretendard 12px/750으로 `좋아요`, `싫어요`를 동일한 광학 무게와 한 줄 높이로 맞췄다.
- spacing and layout rhythm: 기존의 결합 투표칩을 68px 동일 폭의 독립 알약칩 두 개로 분리했다. 360px에서 반응행 `clientWidth`와 `scrollWidth`가 모두 315px로 가로 넘침이 없다.
- colors and visual tokens: 기본은 흰 배경·중립 회색 테두리, 선택은 기존 브랜드 소프트 블루를 유지해 현재 서비스 상태색과 일치한다.
- image quality and asset fidelity: 기존 상세페이지의 실제 엄지 외곽선 자산을 재사용하고 싫어요만 같은 자산을 180도 회전해 획 굵기와 면적을 동일하게 유지했다.
- copy and content: `추천/비추`를 `좋아요/싫어요`로 교체했고 공지형 상세에도 같은 명칭과 구조를 적용했다.
- interaction: 두 선택은 상호 배타적으로 동작하고 내부 점수는 접근성 라이브 영역에서 계속 갱신된다. 좋아요·싫어요 토스트와 콘솔 오류 0건을 확인했다.

## Comparison history

- Pass 1: 좋아요·점수·싫어요가 하나의 긴 알약에 묶여 있어 원본의 독립 액션 구조와 달랐다.
- Fix: 두 액션을 별도 테두리 알약칩으로 분리하고 점수는 화면에서 숨긴 접근성 라이브 영역으로 이동했다.
- Pass 2: 360 × 800 브라우저에서 두 칩의 폭·높이·반경이 같고 댓글·재게시·공유와 충돌하지 않음을 확인했다.

final result: passed

---

# 커뮤니티 레딧형 인기글 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/1471b383-e429-4a24-a5b1-495c872e45ce/1-1000018552.jpg`
- browser-rendered implementation: `artifacts/community-board-order-1015/mobile-384-top-menu-tiktok-text.png`
- normalized source: `artifacts/community-popular-1016/reference-384.png`
- full-view comparison evidence: `artifacts/community-popular-1016/comparison.png`
- viewport and density: 구현 384 × 844 CSS px, DPR 1. 원본 592 × 1280px을 폭 384px으로 정규화해 384 × 830px으로 비교했다.
- state: 자유게시판, 인기글 펼침, 첫 카드가 왼쪽에 맞춰진 기본 가로 스크롤 위치

## Findings

- P0/P1/P2 없음.
- fonts and typography: 제목 행은 Pretendard 15px/750, 카드 제목은 15px/760과 두 줄 말줄임으로 레딧의 굵은 카드 제목 위계를 유지한다.
- spacing and layout rhythm: 48px 제목 행, 148 × 148px 카드, 10px 카드 간격, 14px 시작 여백, 20px 반경으로 참고 화면의 가로 스크롤 밀도를 384px에 맞췄다.
- colors and visual tokens: 흰 배경·중립 회색 테두리·검정 제목을 사용하고 이미지 카드에만 반투명 검정 레이어를 적용해 글자 대비를 확보했다.
- image quality and asset fidelity: 기존 게시물 차량 이미지와 작성자 프로필 자산을 재사용하고, 카드 이미지는 1:1 cover 처리해 늘어짐이 없다.
- copy and content: `인기글` 제목과 반응량 기반 상위 5개 게시물의 제목·작성자·댓글 수를 실제형 데이터에서 생성한다.
- interaction: 카드 가로 스크롤, 카드 상세 이동 링크, 인기글 접기·펼치기를 Chrome에서 확인했다. 접으면 카드 5개가 접근성 트리에서 제거되고 다시 펼치면 복원된다.
- browser verification: Chrome 로컬 렌더에서 콘솔 오류 0건, 게시판 정렬 검사와 모바일 런타임 무결성 검사가 통과했다.

## Comparison history

- Pass 1: 기존 화면에는 말머리 아래 인기글 영역이 없어 레딧 참고 화면의 콘텐츠 발견 구간이 빠져 있었다.
- Fix: 제목 행과 정사각형 가로 스크롤 카드 5개를 추가하고, 실데이터·상세 링크·접기 상태를 연결했다.
- Pass 2: 정규화된 원본과 384px 구현을 나란히 비교해 카드 면적, 첫 카드 시작점, 텍스트 줄 수, 다음 카드 노출 비율이 일치하며 남은 P0/P1/P2가 없음을 확인했다.

final result: passed

---

# 상세페이지 레딧형 본문 반응바 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a128e5-de8a-78d0-9ed9-96cbde6a07c3/3eb64c87-ab16-400f-a4ce-4ce1372483b4/1-1000018554.jpg`
- browser-rendered implementation: `artifacts/community-detail-actions-1016/implementation-592.png`
- focused comparison: `artifacts/community-detail-actions-1016/comparison-actions-source-vs-implementation.png`
- viewport and density: 실제 동작 검사는 Chrome 393 × 850 CSS px에서 수행했다. 참고 화면은 592 × 1280px이며 구조 비교 캡처는 동일한 592 × 1280px으로 맞췄다.
- state: 일반 게시물 상세, 반응 미선택 상태, 본문 하단 반응바 노출
- full-view comparison evidence: 참고 화면과 구현 화면을 동일 비교 이미지에 배치해 `투표·댓글` 왼쪽 그룹과 `재게시·공유` 오른쪽 그룹의 구조를 확인했다.
- focused region comparison evidence: 393px 브라우저에서 투표칩 102.6 × 40px, 댓글칩 56 × 40px, 재게시·공유 각 40 × 40px, 아이콘 18 × 18px, 그룹 내 간격 6px을 실측했다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 기존 Pretendard 본문·점수 계층을 보존하고 투표의 시각 문구만 제거했다. 좋아요·싫어요 의미는 `aria-label`로 유지한다.
- spacing and layout rhythm: 레딧처럼 왼쪽에 투표칩과 댓글칩, 오른쪽에 재게시와 공유를 분리했다. 모바일 반응행 348px 안에서 `scrollWidth`가 348px로 일치해 가로 넘침이 없다.
- colors and visual tokens: 흰 칩, 중립 회색 테두리, 검정 아이콘을 유지하고 선택 상태만 기존 브랜드 소프트 블루를 사용한다.
- image quality and asset fidelity: 댓글·재게시·공유는 기존 Reddit SVG 자산을 사용하고, 좋아요·싫어요는 동일한 외곽선 엄지를 180도 회전해 획과 면적을 정확히 맞췄다.
- copy and content: 보이는 `좋아요/싫어요` 문구를 제거해 참고 화면처럼 아이콘과 점수 중심으로 압축했다. 댓글 수와 추천 점수는 기존 실제형 시나리오 값을 유지한다.
- interaction: 좋아요·싫어요 상호 배타 선택, 점수 증감·취소, 재게시 선택·취소와 토스트를 확인했다. 브라우저 콘솔 오류는 0건이다.

## Comparison history

- Pass 1: 투표칩에 `좋아요/싫어요` 문구가 있어 참고 화면보다 길고, 오른쪽 재게시 액션이 없어 반응바 균형이 맞지 않았다.
- Fix: 문구를 제거해 투표칩을 102.6px로 압축하고, Reddit 재게시 자산을 40px 원형칩으로 추가했다. 재게시와 공유를 `margin-left:auto` 그룹으로 분리했다.
- Pass 2: 393 × 850 브라우저에서 모든 아이콘이 18px, 원형칩이 40px로 정렬됐고 360px 상당 폭에서도 넘침과 충돌이 없음을 확인했다.

final result: passed

---

# 커뮤니티 레딧형 구독 프로필 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/3637378f-bbf6-4e6d-87b8-a3eae2474c30/1-1000018552.jpg`
- browser-rendered implementation: `artifacts/community-board-order-1015/mobile-384-top-menu-tiktok-text.png`
- viewport and density: 구현 384 × 844 CSS px, DPR 1. 참고 화면 592 × 1280px은 앱 콘텐츠 폭을 384px 기준으로 정규화해 프로필·문자·버튼 비율을 비교했다.
- state: 자유게시판, 구독 전, 간결형 목록, 기본 스크롤 위치
- full-view comparison evidence: 같은 시각 비교 입력에서 참고 화면과 구현 화면을 함께 열어 게시판 프로필 행의 크기·정보 계층·우측 CTA를 확인했다.
- focused region comparison evidence: 원본 592px 폭을 구현 384px 폭으로 환산해 상단 프로필 영역의 아바타 49px, 게시판명 17.5px/22px, 통계 12px/17px, 구독 버튼 60×32px을 확인했다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 게시판명은 Pretendard 17.5px/760, 구독·게시물 통계는 12px/17px으로 레딧의 제목→보조정보 위계를 유지한다.
- spacing and layout rhythm: 49px 원형 프로필, 10px 내부 간격, 우측 60×32px 캡슐 버튼으로 레딧 원본을 384px에 비례 환산했으며 360px에서는 46px 프로필·56×30px 버튼으로 충돌을 방지한다.
- colors and visual tokens: 기본 구독 버튼은 `#111214`/흰 글자, 구독중은 흰 배경/검정 테두리로 명확히 구분된다.
- image quality and asset fidelity: 기존 게시판별 원형 프로필 실자산을 1:1 비율로 사용하며 늘어짐이나 대체 이미지가 없다.
- copy and content: 기존 방문자·활동 문구를 `구독 38.4만명 · 게시물 1,000개`로 교체했고 모든 게시판에 동일한 형식의 실제형 샘플 수치를 연결했다.
- interaction: Chrome에서 `구독 → 구독중 → 구독` 상태 전환과 접근성 상태 변경을 확인했다. 게시판 선택·정렬 검사에서 런타임 오류는 0건이다.

## Comparison history

- Pass 1: 기존 프로필 행에는 구독 CTA가 없고, 보조정보가 `1주일 기준 방문자 · 활동` 형식이었다.
- Fix: 레딧 비율의 우측 구독 버튼을 추가하고 통계를 구독자·게시물 정보로 교체했다.
- Pass 2: 사용자 재검토에서 52px 프로필과 64×36px CTA가 원본을 같은 폭으로 환산한 값보다 커 보이는 P2 밀도 차이를 확인했다.
- Fix: 원본 592px→구현 384px 비율로 다시 계산해 프로필 52→49px, 제목 18→17.5px, 통계 13→12px, CTA 64×36→60×32px, 프로필 행 최소 높이 80→62px로 축소했다.
- Pass 3: 동일한 384 × 844 렌더링에서 프로필·제목·통계·CTA의 환산 비율과 버튼 상태 전환을 다시 확인했으며 남은 P0/P1/P2가 없다.

final result: passed

---

# 전체 게시판 바이두형 3열·4열 시안 QA · 2026-10-15

- source visual truth: Google Drive `바이두,편집.jpg`, `바이두.jpg`, `바이두메뉴열기.mp4` (`1VpPkHQBgb15f7_ma6NhtCxr_NIaFKaHL`)
- browser-rendered implementation: `artifacts/community-board-order-1015/mobile-384-baidu-3-column.png`, `mobile-384-baidu-4-column.png`
- full-view comparison: `artifacts/community-board-order-1015/baidu-vs-3col-vs-4col-1015.png`
- viewport and density: 구현 384 × 844 CSS px, DPR 1. 원본 924 × 2048px을 384px 폭으로 정규화했다.
- state: 상단 햄버거로 전체 게시판을 연 일반 상태, 게시판 분류 선택

## Findings

- P0/P1/P2 없음.
- fonts and typography: 제목 20px/800, 내 게시판 18px/800, 칩 13px/620으로 기존 보배드림 한글 체계를 유지하면서 바이두의 굵기 위계를 반영했다.
- spacing and layout rhythm: 칩 높이 40px, 모서리 8px, 세로 간격 12px로 통일했다. 3열은 긴 이름의 가독성, 4열은 한 화면 정보량 비교용이다.
- colors and visual tokens: 내 게시판은 `#f6f7f8`, 고정 칩은 `#f1f2f3`, 추가 가능한 게시판은 흰색과 `#e1e3e6` 테두리를 사용했다. 현재 게시판은 바이두 참고 화면처럼 파란 글자로 표시한다.
- image quality and asset fidelity: 이번 화면은 별도 사진·일러스트 없이 기존 닫기/추가 아이콘 실자산만 사용한다.
- copy and content: 제목은 `전체 게시판`, 고정 항목은 `전체·베스트`, 분류는 `게시판·자료실`로 유지했다.
- interaction: 일반 상태에서는 즉시 이동, 편집 상태에서는 제외·추가·드래그 재정렬, 완료 후 저장, 전체·베스트 고정 동작을 확인했다.
- browser verification: 360 / 384 / 412 / 592 / 1280px, 3열·4열 직접 링크, 가로 오버플로와 런타임 오류가 없음을 확인했다.

## Comparison history

- Pass 1: 기존 칩이 62px로 높아 바이두 40px 밀도보다 화면을 과도하게 차지했다.
- Fix: 두 시안 모두 칩을 40px/8px radius로 맞추고 내부·추가 항목의 배경 체계를 분리했다.
- Pass 2: 3열과 4열을 같은 데이터·동작으로 나란히 비교했으며 칩 높이, 상태색, 고정 항목, 분류 탭 모두 일관됨을 확인했다.

final result: passed

---

# 커뮤니티 초톳 햄버거·검색 문구 색상 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/19894d52-9960-400a-8bf7-e614ef801e4e/1-1000018544.jpg` 및 Notion의 초톳 원본 `메뉴 햄버거_s03-chotot-mo-list-036-svgexport-1.svg`
- browser-rendered implementation: `artifacts/community-board-order-1015/mobile-384-top-menu-tiktok-text.png`
- viewport and density: 구현 384 × 844 CSS px, DPR 1. 참고 화면 591 × 1280px은 상단 검색 헤더의 색상과 아이콘 비율을 시각 기준으로 사용했다.
- state: 자유게시판, 간결형 목록, 기본 스크롤 위치
- full-view comparison evidence: 같은 시각 비교 입력에서 참고 화면과 구현 화면을 함께 열어 검색 문구의 중립 회색과 우측 메뉴의 획·크기를 확인했다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 검색 라벨은 Pretendard 15px/600을 유지하고 색만 `#8C8C8C`로 맞춰 초톳 검색 플레이스홀더와 같은 위계를 만들었다.
- spacing and layout rhythm: 기존 4열 헤더와 10px 간격을 유지하고 햄버거만 원본 규격인 24px로 조정해 프로필과 기준선이 어긋나지 않는다.
- colors and visual tokens: 검색 아이콘과 문구는 `#8C8C8C`, 햄버거는 초톳 원본 `#222222`를 사용한다.
- image quality and asset fidelity: 햄버거는 Notion에서 확인한 초톳 원본 path를 로컬 SVG로 추가했으며 임의 CSS 선이나 대체 아이콘을 사용하지 않았다.
- interaction: 게시판 선택·정렬 게이트와 모바일 런타임 무결성 검사가 통과했고 런타임 오류는 0건이다.

## Comparison history

- Pass 1: 검색 문구가 `#292B30`으로 참고 화면보다 진했고 햄버거는 Reddit 자산이라 획 길이와 간격이 달랐다.
- Fix: 검색 문구를 `#8C8C8C`로 낮추고 24px 초톳 햄버거 원본으로 교체했다.
- Pass 2: 384 × 844 렌더링에서 검색 아이콘·문구의 회색 톤과 프로필·햄버거의 수직 정렬이 안정적이며 남은 P0/P1/P2가 없음을 확인했다.

final result: passed

---

# 커뮤니티 검색·프로필 헤더 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/72f45332-bc5d-4cbc-81df-9201e2b11ae4/1-1000018538.jpg` 및 Notion의 초톳 원본 `검색 돋보기_s03-chotot-mo-list-035-svgexport-3.svg`, `기본 프로필 아바타_s03-chotot-mo-list-014-svgexport-23.svg`
- browser-rendered implementation: `artifacts/community-board-order-1015/mobile-384-top-menu-tiktok-text.png`
- viewport and density: 구현 384 × 844 CSS px, DPR 1. 참고 화면 591 × 1280px은 상단 검색 헤더의 구성과 아이콘 비율을 시각 기준으로 사용했다.
- state: 자유게시판, 간결형 목록, 기본 스크롤 위치
- full-view comparison evidence: 같은 시각 비교 입력에서 참고 화면과 구현 화면을 함께 열어 검색창 배경·돋보기 색·우측 액션 배치를 확인했다.
- focused region comparison evidence: 상단 56px 헤더에서 검색 아이콘 20px, 프로필 28px, 햄버거 22px과 10px 간격을 확인해 중요 요소가 충분히 판독되므로 추가 확대 크롭은 필요하지 않았다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 기존 Pretendard 15px/600 검색 라벨을 유지해 본문 계층에 영향을 주지 않는다.
- spacing and layout rhythm: 헤더를 `24px / 유동 검색창 / 28px 프로필 / 27px 메뉴` 4열로 구성하고 간격을 10px로 통일했다. 384px에서 가로 오버플로와 아이콘 충돌이 없다.
- colors and visual tokens: 검색창 `#f3f4f5`, 돋보기 원본 `#8C8C8C`, 흰 헤더를 사용해 초톳의 중립 회색 체계를 맞췄다.
- image quality and asset fidelity: 돋보기는 Notion 원본과 동일한 기존 로컬 SVG를 재사용했고, 기본 프로필은 Notion 원본 SVG를 로컬 자산으로 추가했다. 임의 도형이나 대체 아이콘을 사용하지 않았다.
- copy and content: 검색 라벨 `커뮤니티`, 접근성 이름 `내 프로필`, `전체 메뉴`를 유지했다.
- interaction: Chrome에서 검색과 프로필 버튼을 눌러 기존 토스트 반응을 확인했다. 게시판 선택·정렬 회귀 검사와 런타임 무결성 검사가 통과했고 콘솔 런타임 오류는 0건이다.

## Comparison history

- Pass 1: 기존 헤더에는 검정 Reddit 검색 아이콘만 있고 사용자 프로필 액션이 없었다.
- Fix: 초톳 회색 돋보기 원본으로 교체하고 햄버거 왼쪽에 28px 기본 프로필을 추가했으며 검색창이 남은 폭을 유동 점유하게 했다.
- Pass 2: 384 × 844 렌더링에서 아이콘 비율, 검색창 여백, 우측 두 액션의 기준선이 안정적이며 남은 P0/P1/P2가 없음을 확인했다.

final result: passed

---

# 커뮤니티 레딧형 게시판 프로필·설명 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/dc8d7806-ecb4-4832-9d0d-ed158a1ae4c9/1-1000018526.jpg`
- browser-rendered implementation: `artifacts/community-board-order-1015/mobile-384-top-menu-tiktok-text.png`
- full-view comparison evidence: `artifacts/community-board-order-1015/reddit-profile-reference-vs-implementation.png`
- viewport and density: 구현 384 × 844 CSS px, DPR 1. 원본 592 × 1280px을 384px 폭으로 정규화해 384 × 830px으로 만든 뒤 흰색으로 384 × 844px까지 패딩했다.
- state: 자유게시판, 간결형 목록, 게시판 설명 접힘 상태

## Findings

- P0/P1/P2 없음.
- fonts and typography: 게시판명은 Pretendard 18px/760, 활동 정보는 13px/18px, 설명은 14.5px/20px로 레딧의 제목→통계→설명 위계를 맞췄다.
- spacing and layout rhythm: 원형 프로필을 화면 폭의 약 13%인 52px로 맞추고, 프로필 행 80px과 설명 영역 55px 안에서 목록 시작 지점을 앞당겼다.
- colors and visual tokens: 제목 `#1d1d1f`, 활동 정보 `#6b6e73`, 설명 `#34363a`, 구분선 `#e7e8eb`로 레딧형 중립 회색 체계를 적용했다.
- image quality and asset fidelity: 기존 게시판별 원형 프로필 실자산을 유지했으며 늘어짐 없이 1:1 원형 크롭으로 노출된다.
- copy and content: 32개 게시판에 각 주제에 맞는 한글 설명과 주간 활동 문구를 연결했다. 설명은 기본 두 줄 말줄임이며 펼치기 버튼으로 전체 내용을 확인할 수 있다.
- interaction: 빠른 게시판 이동 후 프로필 이미지 대체 텍스트, 게시판명, 설명, 활동 정보가 함께 변경된다. 설명 펼치기/접기와 기존 글쓰기·목록 기능을 확인했다.
- browser verification: Chrome에서 로컬 렌더링을 열어 모바일 폭으로 확인했고, 콘솔의 로컬 페이지 오류는 0건이다.

## Comparison history

- Pass 1: 프로필이 64px로 레딧 원본의 화면 폭 대비 비율보다 컸고, 기존에 숨긴 보기 방식 버튼이 다시 노출됐다.
- Fix: 프로필을 52px, 제목을 18px로 낮추고 프로필 행을 80px로 축소했다. 보기 방식 버튼은 다시 숨겨 게시판 정보에 집중하도록 했다.
- Pass 2: 원본과 구현을 384 × 844px로 정규화해 나란히 비교했다. 프로필 비율, 제목/활동 정보 위계, 두 줄 설명과 목록 시작 밀도에 더 이상 P0/P1/P2 차이가 없었다.

## Follow-up Polish

- P3: 레딧의 상단 자동차 배너와 가입/알림 버튼은 이번 요청 범위인 프사·게시판 설명에 포함하지 않아 보배드림 기존 상단 구조를 유지했다.

final result: passed

---

# 커뮤니티 게시판별 프로필 이미지 QA · 2026-10-16

- 31개 공식 게시판과 `전체 게시글`에 서로 다른 원형 프로필 이미지 32개를 적용했다.
- 동일한 프로필 이미지를 상단 빠른 이동, 전체 게시판 그리드, 게시판 선택 목록, 현재 게시판 헤더에 연결했다.
- 색상과 축약명으로 자동차·스포츠·사진·교통 등 게시판 성격을 즉시 구분할 수 있게 했다.
- 390 × 844의 4열 시안에서 이름 잘림과 가로 오버플로가 없고, 1280 × 900의 6열 시안에서도 32개 프로필이 모두 노출된다.
- 게시판 변경 시 헤더 프로필의 이미지와 대체 텍스트가 함께 갱신되며 브라우저 콘솔 오류는 0건이다.

final result: passed

---

# 김태규 딜러 프사·배너 분리 QA · 2026-10-16

- 모바일 390 × 844에서 배너 하단과 프사 상단 사이 16px 간격을 확인했다. 기존 69px 겹침은 제거됐다.
- 프사는 88 × 88px 원형을 유지하고, 겹침용 4px 흰 테두리와 그림자는 제거했다.
- PC 1440 × 900에서는 기존 138 × 138px 프로필 배치와 배너 아래 36px 간격을 유지했다.
- 모바일·PC 모두 가로 오버플로 0px, 브라우저 콘솔 오류 0건이다.

final result: passed

---

# PC 메뉴 가운데점·활성 상태 QA · 2026-10-16

- implementation: `http://127.0.0.1:4311/?qf=guazi&pc=1&v=nav-rhythm`
- viewport: 1440 × 900, 1024 × 768 CSS px, DPR 1
- state: 전체차량 활성 및 `화물 · 특장 · 중기` 선택 상태

## Findings

- P0/P1/P2 없음.
- 메뉴 사이 장식 가운데점은 0개이며, 복합 메뉴명 안에만 `화물 · 특장 · 중기` 형태로 사용한다.
- 활성 메뉴는 `#222`, 700 굵기, 2px 검정 밑줄로 표시된다.
- 1440px과 1024px 모두 메뉴가 한 줄에 유지되고 가로 오버플로는 0px이다.
- 복합 메뉴 선택 후 `aria-current="page"`와 검정 활성 스타일이 정상 적용된다.
- 콘솔 오류 0건이며 기존 아이콘과 메뉴 동작을 유지한다.

final result: passed

---

# PC 커뮤니티 메뉴 원본 SVG 아이콘 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/Downloads/inline_97f2156b.svg` (24 × 24 viewBox, 사용자 첨부 원본)
- browser-rendered implementation: `http://127.0.0.1:4311/?qf=guazi&pc=1&v=nav-icons`
- viewport and density: 1440 × 900, 1024 × 768, 390 × 844 CSS px, DPR 1
- state: 전체차량 선택 기본 상태에서 PC 상단 커뮤니티 메뉴 표시
- full-view comparison evidence: 기존 헤더 높이·좌측 정렬·가운데점·메뉴 순서를 유지하고 커뮤니티 라벨 왼쪽에만 원본 아이콘을 추가했다.
- focused region comparison evidence: 첨부 SVG와 프로젝트 자산은 공백 정규화 후 완전히 일치한다. 렌더링 크기는 1440px에서 18 × 18px, 1024px에서 16 × 16px이다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 커뮤니티 라벨의 Pretendard 글꼴·크기·굵기·기준선은 기존 값 그대로다.
- spacing and layout rhythm: 아이콘과 텍스트 간격은 6px이며 메뉴 높이 49px를 유지한다. 1440px과 1024px 모두 가로 오버플로 0px이다.
- colors and visual tokens: 원본의 `currentColor` 실루엣을 메뉴의 기본 `#1a1a1a` 토큰으로 표시한다.
- image quality and asset fidelity: 첨부한 24 × 24 SVG 경로를 다시 그리지 않고 그대로 저장해 CSS 마스크로 사용했다.
- copy and content: `커뮤니티` 문구와 기존 클릭 동작은 변경하지 않았다.
- accessibility and interaction: 장식 아이콘은 `aria-hidden`이고 버튼의 접근성 이름은 `커뮤니티`로 유지된다.
- browser verification: 1440px·1024px 콘솔 오류 0건. 390px에서는 PC 헤더가 렌더링되지 않으며 모바일 가로 오버플로도 0px이다.

## Comparison history

- Pass 1: 1440px과 1024px에서 원본 사람 그룹 실루엣, 크기, 정렬을 확인했고 남은 P0/P1/P2가 없었다.

final result: passed

---

# PC 상단 메뉴 원본 SVG 아이콘 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/Downloads/중고차.svg`, `트럭.svg`, `캠핑카.svg`, `용품부품.svg`, `수입차.svg`, `더보기.svg`
- browser-rendered implementation: `http://127.0.0.1:4311/?qf=guazi&pc=1&v=nav-icons` (Codex 인앱 브라우저 캡처로 확인; 브라우저가 로컬 이미지 경로를 노출하지 않아 URL을 증거로 기록)
- viewport and density: 1440 × 900, 1024 × 768, 390 × 844 CSS px, DPR 1
- state: 전체차량 선택 기본 상태와 `더보기` 드롭다운 열린 상태
- full-view comparison evidence: 기존 117px 헤더와 1200px 콘텐츠 폭, 좌측 GNB 정렬, 카테고리 사이 가운데점 5개를 유지하면서 첨부 아이콘만 추가했다.
- focused region comparison evidence: 1440px 메뉴 아이콘 5개가 모두 18 × 18px, 1024px에서 16 × 16px으로 계산됐다. 더보기 드롭다운의 수입차 아이콘은 18 × 18px이며 나머지 미제공 항목은 텍스트만 유지했다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 기존 Pretendard 메뉴 계층과 문구는 변경하지 않았다.
- spacing and layout rhythm: 아이콘과 라벨 간격은 6px, 더보기 내부는 4px이다. 1440px GNB 시작점은 x=120, 1024px은 x=24이며 가로 오버플로는 모두 0px이다.
- colors and visual tokens: SVG 실루엣을 `currentColor` 마스크로 사용해 기본 `#1a1a1a`, 활성 `#1b4c8c` 상태가 동일하게 적용된다.
- image quality and asset fidelity: 사용자 첨부 SVG 여섯 개를 `public/assets/bbm/nav-icons/`에 보관하고 도형을 다시 그리거나 대체하지 않았다. 커뮤니티·바이크·전체차량은 원본 파일이 없어 임의 아이콘을 넣지 않았다.
- copy and content: 중고차·화물-특장-중기·캠핑카·부품-용품·더보기와 드롭다운의 수입차에만 대응 자산을 연결했다.
- interaction and accessibility: 장식 아이콘은 `aria-hidden`이며 기존 버튼 이름, 선택 상태, 드롭다운 동작을 유지한다.
- browser verification: 1440px·1024px 콘솔 오류 0건. 390px에서는 PC 헤더가 DOM에 없고 기존 모바일 화면의 가로 오버플로가 0px이다.

## Comparison history

- Pass 1: 1440px에서 다섯 메뉴 아이콘, 가운데점 5개, 더보기 드롭다운 수입차 아이콘을 확인했다. 가로 오버플로와 콘솔 오류가 없었다.
- Pass 2: 1024px에서 아이콘을 16px로 축소해 커뮤니티와 더보기까지 모두 보이는 것을 확인했다. 390px 모바일 비영향도 통과했다.

final result: passed

---

# PC 메인 탑메뉴 좌측 정렬·분류 구분 QA · 2026-10-15

- 기준: 사용자 후속 지시 — 메뉴 전체 좌측 정렬, 가운데점은 같은 차량 분류 메뉴 사이에만 사용.
- 구현 화면: `http://127.0.0.1:4311/?qf=guazi&pc=1&v=nav-left`
- viewport: 1440 × 900, 1024 × 768 CSS px.

## Findings

- 1440px에서 로고와 메뉴의 왼쪽 기준선이 모두 x=120px으로 일치한다.
- 1024px에서 로고와 메뉴의 왼쪽 기준선이 모두 x=24px으로 일치한다.
- 가운데점은 `전체차량 · 중고차 · 화물-특장-중기 · 바이크 · 캠핑카 · 부품-용품` 묶음 안의 5개만 표시한다.
- `홈`, `커뮤니티`, `더보기`는 차량 분류 묶음과 간격으로 분리하며 가운데점을 붙이지 않는다.
- 1440px과 1024px 모두 가로 오버플로가 없고 9개 메뉴가 전부 노출된다.

final result: passed

---

# PC 메인 카이디형 검색 헤더 QA · 2026-10-15

- source visual truth: `https://www.kaidee.com/en/cars`의 1440 × 900 브라우저 캡처(상단 로고·중앙 검색·간결한 우측 액션·2단 카테고리 구조).
- browser-rendered implementation: `http://127.0.0.1:4311/?qf=guazi&pc=1`의 1440 × 900 및 1024 × 768 브라우저 캡처(이 작업에서 원본과 같은 비교 입력으로 확인).
- viewport and density: 원본·구현 모두 1440 × 900 CSS px, DPR 1. 반응형은 1024 × 768, 모바일 비영향은 390 × 844 CSS px에서 확인했다.
- state: 전체차량 활성, 기본 헤더. `더보기` 드롭다운 열린 상태도 별도 검증했다.
- full-view comparison evidence: 카이디처럼 첫 행에 로고·중앙 검색·필수 액션을 배치하고 둘째 행에 메뉴를 모았다. 보배드림의 117px 헤더 높이와 파란 활성 상태는 유지했다.
- focused region comparison evidence: 1440px에서 검색창은 x=440~1000, 로고는 x=120~220, 우측 액션은 x=1220~1320으로 좌우 균형을 맞췄다. 메뉴는 x=392~1048에 중앙 정렬되고 8개의 가운데점이 표시된다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: Pretendard Variable 우선 스택을 유지했다. 1440px 메뉴 16px/600, 선택 700, 홈 15px/500이며 1024px에서는 14px로 축소된다.
- spacing and layout rhythm: 상단 유틸 20px, 검색 행 48px, 메뉴 행 49px으로 전체 117px을 유지했다. 검색창은 560px, 1024px에서는 48vw로 유동 배치된다.
- colors and visual tokens: 카이디의 연회색 pill 검색창 구조를 차용하되 보배드림 `#1b4c8c` 활성색과 기존 회색 배경·경계 토큰을 유지했다.
- image quality and asset fidelity: 보배드림 로고와 기존 찜·마이페이지 원본 아이콘을 그대로 사용했다. 검색·채팅·알림·전체 메뉴 중복 아이콘은 제거했다.
- copy and content: 기존 9개 메뉴 순서와 문구는 유지하고 각 항목 사이를 가운데점으로 구분했다.
- interaction: 검색 입력, 카테고리 이동, 더보기 드롭다운, 찜 열기가 유지된다. 우측에는 찜과 마이페이지만 남겼다.
- browser verification: 1440px·1024px 가로 오버플로 0, 콘솔 오류 0건. 390px에서는 PC 헤더가 렌더링되지 않아 모바일 화면 변경이 없다.

## Comparison history

- Pass 1: 기존 헤더는 검색이 메뉴 행에 있어 카이디보다 검색 우선순위가 낮고, 우측 아이콘 6개가 과밀한 P2가 있었다.
- Fix: 검색창을 첫 행 중앙으로 이동하고 우측 액션을 찜·마이페이지 2개로 축소했다. 메뉴를 둘째 행 중앙으로 옮기고 가운데점 8개를 추가했다.
- Pass 2: 1440px 원본·구현 동시 비교와 1024px 재검수에서 검색 중심 위계, 메뉴 중앙 정렬, 가로 안전 영역을 확인했다.

final result: passed

---
# 자유게시판 주간 통계 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0fe77-a06f-7a82-91f7-7cb79bab19bf/62224fb5-1c2a-424b-9e2c-7bcd1750c0cc/1-1000018442.jpg`
- browser-rendered implementation: `artifacts/community-headword-toggle-1015/mobile-384-collapsed.png`
- full-view comparison: `artifacts/community-headword-toggle-1015/reddit-board-stats-comparison-1015.png`
- viewport and density: 구현 384 × 844 CSS px, DPR 1. 원본 591 × 1280px을 384px 폭으로 정규화했다.
- state: 자유게시판, 설명·말머리 접힘

## Findings

- P0/P1/P2 없음.
- fonts and typography: 레딧의 커뮤니티명 아래 통계 계층을 따라 12.5px 회색 텍스트를 사용했다.
- spacing and layout rhythm: 48px 게시판 프로필 오른쪽, 게시판명 바로 아래에 한 줄 통계를 배치했다. 설명과 말머리 위치는 순서대로 유지된다.
- colors and visual tokens: 통계는 `#7b7e84`를 사용해 게시판명보다 한 단계 낮은 대비를 유지한다.
- image quality and asset fidelity: 기존 자유게시판 전용 프로필 PNG를 그대로 사용했다.
- copy and content: `1주일 기준 방문자 38.4만명 · 활동 1.2만회`를 표시하며 다른 게시판으로 이동하면 자유게시판 통계를 숨긴다.
- browser verification: 360 / 384 / 412px에서 한 줄 표시, 가로 오버플로 0, 콘솔 오류 0을 확인했다.

## Comparison history

- Pass 1: 게시판명 아래에 활동 규모 정보가 없어 레딧 참고 화면보다 커뮤니티 정체성이 약했다.
- Fix: 게시판 헤더 안에 주간 방문자·활동 통계를 추가하고 모바일 폭에서 말줄임 안전성을 적용했다.
- Pass 2: 정규화 비교에서 이름·통계·설명 순서와 시각적 위계가 일치했고 남은 P0/P1/P2가 없음을 확인했다.

final result: passed

---

# 딜러 페이지 탭 구분 간격 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/83ba0216-6270-43fc-bc42-94994f4f95c4/1-1000018418.jpg`
- implementation: Chrome QA tab `http://127.0.0.1:4261/?profile=dealer&shop=450554&emp=1&qf=guazi` (browser screenshot captured in this task)
- viewport: 393 × 852 CSS px, device scale 1. Source image 592 × 1280 px; layout was compared by matching the 393px mobile content width rather than raw image density.
- state: `판매차량` 탭 선택, 판매중 목록 노출.
- full-view comparison evidence: 상단 프로필, 탭 띠, 판매 상태 칩, 첫 차량 카드가 동일한 순서와 모바일 밀도로 표시됐다.
- focused region evidence: 탭 6개의 좌우 패딩은 모두 16px이며 너비는 `44.1 / 80.4 / 80.4 / 80.4 / 56.2 / 59.2px`로 측정됐다. 글자 길이에 관계없이 인접 라벨 사이 공간은 32px로 통일됐다.
- fonts and typography: 기존 Pretendard 14px/500, 선택 탭 700을 유지했다.
- spacing and layout rhythm: 고정 68px 칸을 제거하고 내용 너비 + 좌우 16px 규칙으로 변경했다. 활성 밑줄은 라벨 폭에 맞췄다.
- colors and visual tokens: 기존 검정 선택 상태와 `--dp-line` 구분선을 유지했다.
- image quality and assets: 이번 범위에서 변경된 이미지 자산은 없다.
- copy and content: 탭명과 순서는 변경하지 않았다.
- interaction: `홈` → `판매차량` 전환 후 `aria-selected=true` 확인.
- runtime: 페이지 가로 오버플로 0px, 브라우저 콘솔 오류 0건.
- comparison history: 최초 캡처에서 짧은 `홈`과 긴 탭 사이의 시각적 간격 차이를 P2로 확인했다. 고정 너비를 내용 기반 너비로 교체한 뒤 재측정 및 재캡처하여 차이를 해소했다.
- P0/P1/P2 findings: none.

final result: passed

---

# 김태규 딜러 배너·매장 아이콘 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/cfde466c-9b43-4b12-b40a-b06e118d7c20/1-1000018472.jpg`
- source icon: Notion `딜러 매장_16/16` (`cbfef568a45345308060dc72575166f0`), 원본 `7._딜러.svg`
- implementation screenshots: `artifacts/dealer-profile-avatar-banner-1015/mobile.png`, `desktop.png`
- comparison image: `artifacts/dealer-profile-avatar-banner-1015/comparison.png`
- viewport: 모바일 393 × 852 CSS px, 데스크톱 1280 × 900 CSS px, DPR 1
- state: 김태규 딜러 기본 화면, 판매차량 탭 선택, 팔로우 완료 상태

## Findings

- P0/P1/P2 없음.
- profile composition: 모바일 프로필 사진을 88px 원형으로 키우고 배너 하단에 겹쳐 배치했다. 4px 흰 테두리와 얕은 그림자로 밝고 어두운 배너 모두에서 인물이 분리된다.
- hierarchy and spacing: 배너 문구는 프사 오른쪽 124px에서 시작하며, 딜러명과 판매중·판매완료·팔로워 통계는 배너 바로 아래의 기존 정보 위계를 유지한다.
- icon fidelity: 기존 일반 빌딩 아이콘을 Notion 제공 매장+빌딩 원본 자산으로 교체했다. 20px 표시와 0.86 불투명도를 적용해 전화·위치 아이콘 및 `#777` 메타 텍스트 농도와 맞췄다.
- responsiveness: 모바일 393px에서 `scrollWidth === innerWidth`이며, 데스크톱 1280px에서도 헤더·프로필·탭에 가로 오버플로가 없다.
- interaction: 팔로우 버튼은 `팔로우 중 → 팔로우 → 팔로우 중`으로 정상 전환되고, 리뷰와 판매차량 탭의 `aria-selected` 및 본문 전환이 정상이다.
- browser evidence: 원본 아이콘은 128 × 128 투명 PNG로 로드되며 실제 표시는 20 × 20px이다. 콘솔 오류는 0건이다.

## Comparison history

- Pass 1: 기존 74px 프사가 배너 아래 그리드 안에만 있어 참고 화면보다 프로필 정체성이 약했다.
- Fix: 프사를 88px로 확대해 배너와 본문 경계에 겹치고, 배너 문구를 오른쪽으로 이동했다.
- Pass 2: 프사와 배너 문구가 겹치지 않고 딜러명이 자연스럽게 이어졌으나 기존 각진 빌딩 아이콘이 주변 메타 아이콘보다 강했다.
- Fix: Notion의 매장+빌딩 아이콘으로 교체하고 회색 농도와 표시 크기를 통일했다.
- Pass 3: 동일 비교 화면에서 배너·프사·정보 위계와 아이콘 톤이 안정적이며 남은 P0/P1/P2가 없음을 확인했다.

final result: passed

---

# 자유게시판 설명·말머리 디카드형 전환 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0fe77-a06f-7a82-91f7-7cb79bab19bf/af0facfc-fbac-461b-a0a0-c50fe1ce12f2/1-1000018478.jpg`, `.../2-1000018480.jpg`
- browser-rendered implementation: `artifacts/community-headword-toggle-1015/mobile-384-collapsed.png`, `mobile-384-expanded.png`
- full-view comparison: `artifacts/community-headword-toggle-1015/dcard-board-info-comparison-1015.png`
- viewport and density: 구현 384 × 844 CSS px, DPR 1. 원본 592 × 1280px을 384px 폭으로 정규화해 접힘·펼침 상태를 각각 비교했다.
- state: 자유게시판, 설명/말머리 모두 접힘 및 모두 펼침

## Findings

- P0/P1/P2 없음.
- fonts and typography: 설명은 14px/21px의 회색 보조 계층, 말머리는 14px/32px으로 맞춰 디카드 참고 화면과 유사한 밀도를 만든다.
- spacing and layout rhythm: 게시판명 옆 화살표를 제거하고, 게시판명 아래에 설명 44px과 말머리 48px을 순서대로 배치했다. 설명과 말머리는 각각 독립적으로 여러 줄 확장된다.
- colors and visual tokens: 비선택 말머리는 옅은 회색 채움, 선택 말머리는 기존 보배드림 검정 활성 토큰을 사용한다.
- image quality and asset fidelity: 자유게시판 프로필은 자동차와 대화 말풍선을 결합한 전용 256 × 256 PNG로 교체했으며 48px 원형 슬롯에서 선명하게 표시된다. 펼침 화살표는 저장소의 실자산 `board-chevron.svg`를 사용한다.
- copy and content: 자유게시판 설명을 추가했고 게시판 전환 시 해당 게시판 설명으로 교체된다.
- accessibility and interaction: 두 토글의 `aria-expanded`와 안내 라벨이 상태에 맞게 바뀌며 Escape로 열린 영역을 닫을 수 있다.
- browser verification: 360 / 384 / 412px에서 설명·말머리 펼침/선택/접힘, 프로필 로드, 가로 오버플로 0, 브라우저 오류 0을 확인했다.

## Comparison history

- Pass 1: 게시판명 옆 오른쪽 화살표가 남아 있고 설명 영역이 없어 디카드의 정보 구조와 달랐다.
- Fix: 게시판명 화살표를 숨기고 설명 행 및 독립 토글을 추가했으며 말머리 칩을 회색 채움형으로 변경했다.
- Pass 2: 접힘·펼침 상태를 원본과 구현이 나란히 보이도록 정규화해 비교했고 남은 P0/P1/P2가 없음을 확인했다.

final result: passed

---

# 간결형 게시판 댓글 수 크기 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0fe77-a06f-7a82-91f7-7cb79bab19bf/b0c8e281-2dc0-4a9d-917b-fd55bd1e8b84/1-1000018464.jpg`
- browser-rendered implementation: `artifacts/community-headword-toggle-1015/mobile-384-collapsed.png`
- full-view comparison: `artifacts/community-headword-toggle-1015/comment-size-comparison-1015.png`
- focused typography comparison: `artifacts/community-headword-toggle-1015/comment-size-focused-1015.png`
- viewport and density: 구현 384×844 CSS px, DPR 1. 원본 591×1280px을 384px 폭으로 정규화해 비교했다.
- state: 간결형 목록, 자유게시판, 말머리 접힘

## Findings

- P0/P1/P2 없음.
- fonts and typography: 제목 16px에 붙던 댓글 수를 16px에서 13px로 낮춰 참고 화면처럼 제목보다 한 단계 작은 위계를 만들었다. 괄호·500 weight·23px 기준선은 유지했다.
- spacing and layout rhythm: 댓글 수 왼쪽 간격 4px과 한 줄 말줄임 구조를 유지해 제목 폭이나 행 높이가 달라지지 않는다.
- colors and visual tokens: 참고 화면의 초록색 대신 보배드림 커뮤니티의 확정 파란색 `#238fe3`을 유지했다.
- image quality and asset fidelity: 이번 변경에 추가·교체된 이미지 자산은 없다.
- copy and content: 댓글 숫자와 괄호 표기는 그대로 보존했다.
- focused evidence: 나란히 비교한 목록 행에서 댓글 수가 제목 본문보다 작게 읽히며 제목과 경쟁하지 않는다.
- browser verification: 실제 렌더링은 댓글 13px / 제목 16px이며 콘솔 오류 0건이다.

## Comparison history

- Pass 1: 기존 댓글 수가 제목과 같은 16px여서 숫자의 시각적 비중이 과했다.
- Fix: 모든 모바일 폭에서 댓글 수를 13px로 통일하고 자동 검사에 13px 단언을 추가했다.
- Pass 2: 360/384/412px 자동 검사와 Chrome 실측에서 13px, 가로 오버플로 0, 콘솔 오류 0을 확인했다.

## Primary interactions tested

- 말머리 펼침·선택·접힘
- 커뮤니티 검색바 안내
- 360/384/412px 댓글 수 크기 및 가로 잘림

final result: passed

---

# 초톳 피드형 게시판·딜러 유형 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a128e5-de8a-78d0-9ed9-96cbde6a07c3/774c69ef-c203-4810-8844-6b97e643fdc6/1-1000018448.jpg`
- implementation screenshots: `artifacts/community-chotot-feed-1015/mobile-390x844-viewport.png`, `dealer-mobile-390x844-viewport.png`, `dealer-desktop-1200x900-viewport.png`
- comparison image: `artifacts/community-chotot-feed-1015/qa-comparison-dealer-mobile.png`
- viewports: 모바일 390 × 844 CSS px, PC 1200 × 900 CSS px
- states: `초톳 피드형 · 게시판형`, `초톳 피드형 · 딜러형`, 사진 확대, 좋아요, 저장

## Findings

- P0/P1/P2 없음.
- 두 초톳 유형을 보기 방식과 유형 선택 패널에 각각 독립 항목으로 추가했다.
- 모바일 카드 사이에 1px 구분선을 넣어 게시물 경계를 분명히 했다.
- 딜러형은 프로필 → 짧은 문구 → 사진/영상 → 좋아요·댓글·전화·채팅·저장 순서를 적용했다.
- 딜러형 액션에는 저장된 초톳 SVG 자산을 사용했으며 5개 아이콘의 로드 실패는 0건이다.
- 게시판형의 가로 스와이프, 첫 사진 위치, 확대 갤러리와 딜러형의 전화 링크, 좋아요·저장 토글을 자동 검증했다.
- 모바일·PC 가로 오버플로와 콘솔 오류, 4xx/5xx 자산 응답은 0건이다.

## Comparison history

- Pass 1: 딜러형 사진과 액션 행이 원본보다 넓고 세로 이미지 높이가 과했다.
- Fix: 모바일 콘텐츠 시작점을 53px 부근으로 맞추고 사진·액션 폭을 260px, 가로 사진 높이를 136px, 세로 사진 높이를 178px로 조정했다.
- Pass 2: 원본과 구현을 390px 폭으로 정규화해 프로필·문구·미디어·액션·구분선 순서와 밀도가 일치함을 확인했다.

final result: passed

---

# 레딧형 게시판 프로필·구분선 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0fe77-a06f-7a82-91f7-7cb79bab19bf/62224fb5-1c2a-424b-9e2c-7bcd1750c0cc/1-1000018442.jpg`
- implementation screenshot: `artifacts/community-headword-toggle-1015/mobile-384-collapsed.png`
- focused comparison: `artifacts/community-headword-toggle-1015/reddit-avatar-divider-comparison.png`
- viewport: 구현 384 × 844 CSS px, DPR 1 / 원본 591 × 1280px Android 캡처
- normalization: 원본을 384px 폭으로 정규화한 뒤 게시판 프로필 영역을 구현의 같은 영역과 나란히 배치했다.
- state: 자유게시판 선택, 말머리 한 줄 접힘

## Findings

- P0/P1/P2 없음.
- fonts and typography: 게시판명은 기존 17px/720 위계를 보존해 커진 프로필 옆에서도 중심이 흐트러지지 않는다.
- spacing and layout rhythm: 레딧 캡처에서 환산한 약 47px 프로필 크기에 맞춰 48px로 적용했고 행 높이를 68px로 늘렸다. 게시판명 행 하단 테두리는 0px로 제거했다.
- colors and tokens: 기존 흰 배경·검정 텍스트·회색 보조 텍스트 토큰을 유지했다.
- image quality and asset fidelity: 기존 실제 게시판 프로필 이미지를 확대 표시했으며 새 가짜 자산이나 CSS 그림을 만들지 않았다.
- copy and content: 자유게시판명과 보기 방식·간결형 문구는 변경하지 않았다.
- responsiveness: 360/384/412px에서 프로필 48×48px, 하단 테두리 0px, 가로 오버플로 0을 확인했다.
- focused comparison: 원본과 구현의 원형 프로필 직경 및 게시판명과의 시각 비중이 유사하며, 구현에서는 요청 범위에 맞춰 말머리 칩이 바로 이어진다.

## Comparison history

- Pass 1: 기존 프로필은 28px로 레딧 참고 화면보다 작고 게시판명 아래 1px 구분선이 남아 있었다.
- Fix: 프로필을 48px, 게시판 행을 68px로 조정하고 하단 테두리를 제거했다.
- Pass 2: 정규화 비교와 360/384/412px 자동 검사에서 남은 P0/P1/P2가 없음을 확인했다.

## Primary interactions tested

- 말머리 펼침·선택·접힘 유지
- 게시판명·보기 방식·간결형 컨트롤 충돌 없음
- 브라우저 페이지 오류 및 가로 잘림 없음

final result: passed

---

# 말머리 칩·펼침/접힘 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0fe77-a06f-7a82-91f7-7cb79bab19bf/79941765-2e07-4569-baaa-cb76c220405c/1-1000018436.jpg`, `.../2-1000018440.jpg`
- implementation screenshots: `artifacts/community-headword-toggle-1015/mobile-384-collapsed.png`, `mobile-384-expanded.png`
- comparison image: `artifacts/community-headword-toggle-1015/reference-comparison.png`
- viewport: 구현 360/384/412 × 844 CSS px, DPR 1 / 원본 각 591 × 1280px Android 캡처
- normalization: 원본 두 장을 384px 폭으로 정규화하고 구현의 접힘·펼침 상태와 한 장에 배치했다.
- state: 게시판명 아래 말머리 기본 접힘, 전체 펼침, `튜닝` 선택, 다시 접힘

## Findings

- P0/P1/P2 없음.
- fonts and typography: 레딧 참고 화면과 같은 14px 중심의 작은 칩 글자와 32px 칩 높이를 적용했다. 360px에서는 기존 반응형 비율에 맞춰 13.7px로 유지했다.
- spacing and layout rhythm: 게시판명 행의 하단 여백을 없애 말머리가 바로 이어지며, 접힘 48px 한 줄과 펼침 8px 행간의 다중 행 구조가 안정적으로 전환된다.
- colors and tokens: 선택 칩은 커뮤니티의 기존 검정 토큰, 비선택 칩은 흰 바탕과 옅은 회색 테두리를 사용해 레딧식 대비를 유지했다.
- image quality and asset fidelity: 펼침 아이콘은 기존 Dcard 원본 자산 `assets/write-parity/chevron-down.svg`를 재사용했고 CSS/문자 모양으로 새로 그리지 않았다.
- copy and content: 기존 말머리 11개와 선택 상태를 그대로 보존했다.
- interaction and accessibility: 버튼은 `aria-expanded`, `aria-controls`, `aria-pressed`를 제공한다. 펼침·선택·접힘과 Escape 접힘을 확인했다.
- responsiveness: 360/384/412px에서 가로 오버플로 0, 접힘 높이 48px, 칩 높이 32px가 모두 일치한다.
- focused comparison: 비교 이미지에서 칩 크기·선택 상태·게시판명 아래 위치·Dcard식 펼침 상태가 충분히 읽혀 추가 확대 크롭은 필요하지 않았다.

## Comparison history

- Pass 1: 기존 게시판 행의 8px 하단 마진 때문에 말머리가 게시판명에 바로 붙지 않았다.
- Fix: 게시판 행의 하단 마진과 하단 그림자를 제거하고 말머리 영역을 직접 연결했다.
- Pass 2: 동일 위치 실측과 360/384/412px 브라우저 검사에서 남은 P0/P1/P2가 없음을 확인했다.

## Primary interactions tested

- 한 줄 말머리 좌우 스크롤
- 아래 화살표로 전체 말머리 펼침
- 펼친 상태에서 말머리 선택 및 상태 유지
- 위 화살표와 Escape로 접힘
- 게시판 변경 시 기본 접힘으로 복귀
- 브라우저 콘솔·페이지 런타임 오류 0건

final result: passed

---

# 치지직 상세 · 보트 아이콘·블루·두깝이 최신글 v14 QA · 2026-10-15

- scope: 게시글과 동적 댓글의 엄지 추천·비추 아이콘을 Reddit 업보트·다운보트 화살표로 교체
- assets: `vote-up.svg`, `vote-down.svg`
- color: Airbnb 레드 대신 보배 블루 `#238fe3`, 선택 배경 `#eef7ff` 적용
- board: `자유`를 `자유게시판`으로 확장
- latest scenarios: 두깝이 최신글 3개에 제목·본문·댓글·상호 이동 경로 구성
- preserved: 추천·점수·비추 알약칩, 댓글칩, 우측 공유칩
- accessibility: 추천·비추 `aria-label`과 `aria-pressed` 상태 유지
- PC 1536 × 639 / 모바일 394 × 852: 가로 넘침 없음, 깨진 이미지 0건, 페이지 스크립트 오류 없음
- interaction: 추천 -4→-3, 비추 전환 -3→-5, 두깝이 최신글 상세 이동 통과
- scenario: 가입 인사 상세의 본문 4단락, 댓글 2건, 최신글 상호 링크 확인
- verification: `npm run verify`, `community:verify:detail-actions`, `community:verify:detail-scenarios` 통과

final result: passed

---

# Chợ Tốt 피드 · 이미지 첫 위치 및 카운터 정렬 QA · 2026-10-15

**Source visual truth**

- 사용자 캡처: `C:\Users\bobae\OneDrive\문서\ChatGPT\퀵필터 제작\.codex-remote-attachments\01a128e5-de8a-78d0-9ed9-96cbde6a07c3\4896e130-8db4-4e35-939b-e4865e4e55f8\1-1000018420.jpg`
- 좌측 밀착 문제 후속 캡처: `C:\Users\bobae\OneDrive\문서\ChatGPT\퀵필터 제작\.codex-remote-attachments\01a128e5-de8a-78d0-9ed9-96cbde6a07c3\7996fe5f-3593-46e4-82e5-f859abb1525f\1-1000018430.jpg`
- 모바일 카드 구분선 후속 캡처: `C:\Users\bobae\OneDrive\문서\ChatGPT\퀵필터 제작\.codex-remote-attachments\01a128e5-de8a-78d0-9ed9-96cbde6a07c3\67a2a0a4-2451-4c1f-807a-e0468e11a63e\1-1000018432.jpg`
- 구현 캡처: `artifacts/community-chotot-feed-1015/mobile-390x844-viewport.png`
- 좌우 비교: `artifacts/community-chotot-feed-1015/qa-comparison-mobile.png`
- 좌측 여백 집중 비교: `artifacts/community-chotot-feed-1015/qa-comparison-mobile-inset.png`
- 카드 구분선 집중 비교: `artifacts/community-chotot-feed-1015/qa-comparison-mobile-separator.png`

**Viewport and state**

- 구현: 390 × 844 CSS px, deviceScaleFactor 1.
- 원본: 592 × 1280 Android 캡처에서 브라우저 상단을 제외한 y=141~1280 영역을 390px 너비로 정규화했다.
- 상태: `피드형 · 초톳` 초기 화면, 첫 게시물의 첫 이미지와 `1/6` 카운터가 보이는 상태.

**Findings and fixes**

- Pass 1 P1: 게시물 순서가 작성자·제목·본문 뒤에 이미지로 구성되어, 요청한 이미지 우선 피드 구조와 달랐다.
- Pass 1 P2: `1/6` 카운터가 미디어 레일 우측 끝에 고정되어 두 번째 이미지 위에 놓였다.
- Fix: 미디어 셸을 카드의 첫 번째 자식으로 이동하고, 현재 이미지의 우측 끝을 기준으로 카운터 좌표를 계산하도록 변경했다.
- 공개 직접 링크 점검에서 게시판 초기화가 늦게 끝날 때 간결형으로 복귀하는 경합을 발견해, `?view=chotot` 요청 시 보기 상태도 `feed-chotot`으로 고정했다.
- 후속 사용자 캡처에서 첫 사진이 화면 왼쪽 `0px`에 붙는 P2 정렬 문제를 확인했다. 미디어 셸의 음수 여백과 레일 내부 패딩을 제거해 첫 사진을 카드 본문과 같은 좌측 여백(모바일 16px, 데스크톱 22px)에 맞췄다.
- Pass 2: 첫 이미지가 카드 상단에 놓이며 카운터는 첫 이미지 우측에서 9px 안쪽에 정렬된다.
- Pass 3: 후속 비교에서 첫 사진과 카드 본문의 좌측 기준선이 모바일 16px, 데스크톱 22px로 일치하고 페이지 가로 오버플로가 없음을 확인했다.
- Pass 4: 후속 캡처에서 카드 사이에 중복된 1px 위·아래 테두리와 8px 회색 간격이 구분선처럼 보이는 P2 문제를 확인했다. 모바일 카드의 위·아래 테두리와 카드 간격을 모두 0으로 제거해 흰 배경이 끊김 없이 이어지도록 했다.

**Required fidelity surfaces**

- typography: 기존 Pretendard 제목·본문·메타 위계 유지.
- spacing/layout: 이미지 → 작성자 → 제목 → 본문 → 반응 순으로 재배치하고 카드 모서리 밖 미디어를 클리핑했다.
- colors/tokens: 요청 범위가 위치 교정이므로 기존 보드 블루와 중립 배경을 유지했다.
- image quality: 기존 실제 차량 이미지를 그대로 사용하고 cover 처리와 가로 스와이프를 유지했다.
- copy/content: 게시물 문구와 작성자 데이터는 변경하지 않았다.

**Interaction and runtime checks**

- 모바일·데스크톱 피드 렌더링: passed.
- 미디어 스와이프 후 카운터 위치 갱신: passed.
- 첫 이미지 터치로 갤러리 열기, 닫기 후 스크롤 복원: passed.
- 추천·비추천, 저장, 더보기 동작: passed.
- 브라우저 콘솔 오류 및 실패 리소스: 0.
- `node scripts/community-chotot-feed-check.mjs`: passed.

final result: passed

---

# 게시판 밑줄·말머리 칩 분리 QA · 2026-10-15

- 상단 게시판의 선택 상태는 3px 검은 밑줄로 복원했다. 전체 행을 가로지르는 구분선은 넣지 않았다.
- 말머리는 전체 항목을 높이 32px의 테두리 칩으로 표시하고, 선택 항목만 검은 배경과 흰 글자로 구분했다.
- 360 / 384 / 412 / 1280px에서 게시판 가로 이동, 말머리 가로 이동, 순서 저장과 페이지 가로 오버플로를 확인했다.
- P0/P1/P2 findings: none.

final result: passed

---

# 게시판 선택 칩 균형 QA · 2026-10-15

- source: 사용자 첨부 `1000018404.jpg`의 정치/시사게시판 선택 상태.
- selected state: 기존 3px 하단 밑줄과 내비게이션 전체 하단 구분선을 제거했다.
- selected board: 높이 34px, 좌우 14px, 반경 20px, 배경 `#f3f4f6`으로 아래 `전체` 필터칩과 같은 규칙을 적용했다.
- spacing: 게시판 간격을 18px(360px 이하는 16px)로 조정해 아래 필터칩의 리듬과 맞췄다.
- 360 / 384 / 412 / 1280px에서 가로 스크롤, 선택 상태, 우측 메뉴 고정, 페이지 가로 오버플로를 재검증했다.
- P0/P1/P2 findings: none.

final result: passed

---

# 후푸형 전체 게시판 내비게이션 QA · 2026-10-15

**기준 자료**

- Google Drive `1faoHGmNzyRIF9UWpqN2qpvolNh2TiaOl`의 후푸 게시판·메뉴 열기 및 텐센트 메뉴 화면을 기준으로 비교했다.
- 후푸의 가로 채널 탐색, 우측 고정 메뉴 버튼, 전체 화면 순서 편집 구조를 보배드림 게시판 체계에 맞게 적용했다.

**구현 규칙**

- `홈`은 항상 첫 칸에 고정하고 보배드림 게시판 31개를 누락 없이 가로로 나열한다.
- 상단 띠 높이 50px, 게시판명 15.5px, 항목 간격 23px, 선택 밑줄 3px, 우측 메뉴 버튼 50×50px로 구성했다.
- 메뉴보기는 모바일 3열, PC 5열이며 긴 게시판명은 두 줄까지 표시한다.
- 게시판 삭제 기능은 두지 않는다. 길게 누르기·마우스 드래그·키보드 방향키로 순서를 바꾸고 완료 시 브라우저에 저장한다.
- 닫기는 변경 취소, `기본 순서`는 공식 순서 복원으로 동작한다.
- 저장 키: `bbm.community.boardOrder.v1`.

**검증 결과**

- 360 / 384 / 412 / 1280px에서 게시판 31개, 중복 0, 누락 0을 확인했다.
- `오토바이/자전거` 선택 시 하단 게시판 제목과 URL `board=bike-cycle`이 함께 바뀐다.
- 순서 변경 후 새로고침 유지, 취소, 기본 순서 복원, 가로 스크롤과 우측 메뉴 고정을 확인했다.
- 페이지 가로 오버플로와 브라우저 런타임 오류는 0건이다.

**캡처**

- `artifacts/community-board-order-1015/mobile-384-board-ribbon.png`
- `artifacts/community-board-order-1015/mobile-384-board-order.png`
- `artifacts/community-board-order-1015/pc-1280-board-ribbon.png`
- `artifacts/community-board-order-1015/pc-1280-board-order.png`

**판정**

- P0/P1/P2 차이 없음.
- P3: PC 본문은 기존 시안의 393px 중앙형 레이아웃을 유지했다. 이번 범위에서는 상단 게시판 탐색과 순서 편집만 확장했다.

final result: passed

---

# Chợ Tốt 피드 · 실사진 시나리오 및 모바일 터치 안정화 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/AppData/Local/Temp/nhatot-live-mobile-top.png`, 사용자 제공 Reddit 피드 참고 이미지 `1-1000018354.jpg`
- implementation screenshots:
  - `artifacts/community-chotot-feed-1015/mobile-390x844-viewport.png`
  - `artifacts/community-chotot-feed-1015/desktop-1200x900-viewport.png`
- viewport: 모바일 390 × 844 CSS px / PC 1200 × 900 CSS px, deviceScaleFactor 1
- state: `피드형 · 초톳`, 첫 실제 차량 시나리오, 갤러리 닫힘, 반응 미선택

## Full-view comparison evidence

- 초톳 참고 화면의 가로 미디어 레일과 Reddit 참고 화면의 반응 알약칩을 기존 보배드림 게시판 셸 안에 유지했다.
- 모바일 첫 화면에서 작성자, 긴 제목, 본문 미리보기, 실제 차량 사진 2장, 사진 수, 추천·비추천·댓글·공유·저장까지 한 흐름으로 읽힌다.
- PC에서는 996px 중앙 카드와 240px 미디어 레일을 유지하며 네 장의 실제 차량 사진과 좌우 화살표가 한 화면에 노출된다.

## Focused interaction evidence

- 로컬 보배드림 차량 사진 `sc-001.jpg`가 모바일·PC 모두 `640 × 480` 자연 크기로 로드되며 실패 리소스가 없다.
- 사진 레일의 `touchstart/touchmove/touchend`를 게시판 스와이프 처리에서 격리했다. 190px 가로 스와이프 후 카드 DOM이 유지됨을 확인했다.
- 130px 포인터 드래그 뒤 합성 click은 갤러리를 열지 않고, 짧은 탭만 갤러리를 연다.
- 갤러리 열기 전후 URL은 동일하고, 닫은 뒤 스크롤 위치는 모바일·PC 모두 `360 → 360`으로 복원된다.

## Required fidelity surfaces

- fonts and typography: Pretendard, 제목 18px/24px, 본문 15.5px/22px, 메타 12.5px 계층을 유지했다.
- spacing and layout rhythm: 모바일 미디어 높이 194px, PC 240px, 8–10px 사진 간격과 9px 반경을 유지했다.
- colors and visual tokens: 흰 카드, 중립 회색 배경, 보배 블루 선택 상태를 유지했다.
- image quality and asset fidelity: 외부 플레이스홀더 대신 저장소의 실제 보배드림 차량 JPEG를 10개 가상 게시물 시나리오에 연결했다. 첫 사진은 eager/high priority로 로드한다.
- copy and content: 전시장 비교, 도산대로 직찍, 출고 검수, 중고차 입고 점검 등 실제 커뮤니티 사용 맥락의 제목·작성자·본문·댓글 수를 구성했다.

## Findings

- P0/P1/P2: 없음.
- P3: 원본 사진이 640px 폭이라 초고해상도 화면에서 확대 시 원본 한계가 보일 수 있으나, 피드 카드와 일반 모바일 확대에서는 선명하다.

## Comparison history

- Pass 1: 사진 레일 터치가 상위 게시판 좌우 스와이프까지 전달되어 피드가 재렌더링되고, 드래그 종료 click이 갤러리를 열 수 있었다.
- Fix: 미디어 레일 터치 전파 차단, 10px 이동 임계값의 탭/드래그 분리, 고정 body 스크롤 잠금·복원, 갤러리 좌우 스와이프를 추가했다.
- Pass 2: 모바일·PC 자동 검증에서 카드 유지, 드래그 억제, 탭 갤러리, URL 유지, 스크롤 복원, 콘솔 오류 0건, 실패 리소스 0건을 확인했다.
- Pass 3: 최초 Pages 공개본에서 배포 스크립트가 상대 사진 경로에 프로젝트명을 중복 삽입하는 P0을 발견했다. 호스트 기반 자산 루트를 문자열 세그먼트로 조립해 배포 치환 대상에서 제외했고, 공개 URL에서도 `/bobaedream/assets/...` 단일 경로가 생성되도록 수정했다.

final result: passed

---

# 보배드림 전체 게시판 선택 QA · 2026-10-15

- 보배드림 모바일 커뮤니티 구조를 기준으로 `게시판` 14개와 `자료실` 17개를 상단 게시판 선택 바텀시트에 추가했다.
- `전체 게시글`을 포함한 선택 행은 총 32개이며 게시판명 중복·누락은 0개다.
- 선택한 게시판명은 상단에 즉시 반영되고, 해당 게시판명으로 글쓰기 화면까지 전달된다.
- 기존 데이터에 전용 분류가 없는 게시판은 목록을 비우지 않고 전체 게시물을 보여 주며, `교통사고/블박`과 `장착시공사진`은 기존 블박·튜닝 데이터에 연결했다.
- 모바일 384 × 844에서 긴 목록 스크롤, 선택 상태 유지, 목록 표시, 글쓰기 연결을 확인했다.
- implementation capture: `artifacts/community-board-selector-1015/mobile-384-all-boards.png`
- `npm run community:verify:boards`: passed (31/31, 전체 포함 32행)
- `npm run community:verify:compact-write`: passed
- browser console errors: 0

final result: passed

# 딜러 프로필 · 홈 좌측 정렬, 초톳형 칩, 설명 더 보기 QA · 2026-10-15

- implementation: 김태규 딜러 프로필, 393 × 852 CSS px
- `홈` 탭 시작 좌표를 본문과 동일한 좌측 16px에 맞췄다.
- 행동 칩 `팔로잉 · 채팅 · 전화` 3개는 각각 약 116 × 38px이며 `#c9c9c9` 1px 테두리, 9px 반경, 얕은 그림자를 적용했다.
- 설명은 짧은 미리보기와 인스타그램형 `더 보기`를 제공하고, 선택 시 전체 문장과 `접기`로 전환된다.
- 응답률에서 `보통`을 제거해 `응답률: 1시간 이내`로 표시한다.
- page horizontal overflow: 0px.
- `npm run build`: passed
- mobile runtime integrity: passed (28 protected files)

final result: passed

---

# 커뮤니티 상세 · 댓글 작성/답글/관리 및 댓글 투표 제거 QA · 2026-10-15

- source visual truth: `1000018388.jpg`, `1000018386.jpg`의 치지직 댓글 목록과 내 댓글 관리 바텀시트
- implementation capture: `artifacts/community-chzzk-detail-actions-1015/mobile-384-comment-menu.png`
- viewport: 384px 모바일 CSS 폭
- 댓글과 답글은 `답글 · 공유 · 더보기` 행동만 제공하며 댓글 단위 추천/비추천(버프/너프) DOM은 0개다.
- 게시글 본문의 기존 `추천 · 비추` 반응은 유지했다.
- 댓글 등록, 기존 댓글에 답글 등록, 내 댓글 수정, 내 댓글 삭제, 댓글 공유를 실제 상태 변경으로 검증했다.
- 내 댓글 더보기는 하단 바텀시트로 열리며 `수정하기 · 삭제하기 · 취소`를 제공한다.
- 외부 프로필 이미지 오류 시 로컬 기본 프로필 이미지로 대체한다.
- 모바일 가로 오버플로: 0px (`384/384`)
- browser runtime errors: 0
- P0/P1/P2 findings: none

final result: passed

---

# 커뮤니티 목록 · 레딧형 피드와 추천 안내 토스트 QA · 2026-10-15

- source visual truth: `1000018382.jpg`, `1000018380.jpg` (Reddit 모바일 피드·추천 토스트 상태)
- implementation capture: `artifacts/community-reddit-feed-1015/mobile-384-reddit-feed.png`
- viewport: 구현 384 × 844 CSS px / 원본 591 × 1280 px Android 캡처
- preserved surface: 기존 커뮤니티 헤더·상단 탭·게시판 선택 구조

**Findings**

- P0/P1/P2 없음.
- 카드 제목 18px, 본문 16px, 작성자 14px이며 원본의 제목 우선 계층과 본문 밀도를 재현했다.
- 프로필·시간·더보기, 말머리 캡슐, 본문 미리보기, 큰 이미지, 투표·댓글·재공유·공유 순서를 적용했다.
- 추천은 주황색 `1`, 비추천은 보라색 `-1`이며 상호배타로 동작한다.
- 추천 시 원본과 같은 검정 캡슐형 안내 토스트와 공유 버튼이 열린다.
- 상세 시나리오 5개를 목록에 연결했고 두 번째 게시물부터 이미지를 표시한다.
- 가로 오버플로는 0px이다.

**Interaction and runtime checks**

- `npm run community:verify:reddit-feed`: passed
- 게시물 카드 5개 / 반응 영역 5개 / 이미지 카드 4개: passed
- 추천·비추천 상호배타 및 점수 변화: passed
- 추천 안내 토스트: passed
- 댓글 상세 이동·재공유·공유: passed
- mobile width: 384/384
- browser console errors: 0

final result: passed

---

# 치지직 상세 · 배경색·본문 글자 크기 v15 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0fe77-a06f-7a82-91f7-7cb79bab19bf/72c6f71b-f9ca-4038-bfe8-29e5a453bea8/1-1000018376.jpg`
- implementation evidence: Codex IAB 로컬 렌더 `http://127.0.0.1:4176/community/chzzk-detail.html?id=1&v=20261015v15`
- viewport: 구현 486 × 668 CSS px / 원본 591 × 1280 px Android 캡처
- state: 시나리오 1 상세 본문, 최신글 카드, 댓글 입력창

**Findings**

- P0/P1/P2 없음.
- 헤더 구조와 상호작용은 유지하고 본문 계층의 면 색상과 글자 크기만 조정했다.
- 전체 배경은 `#FFFFFF`, 본문 글자는 `#303033`, 최신글 카드는 `#F4F4F6`, 댓글 입력창은 `#E9E9ED`로 확인했다.
- 모바일 본문은 16px/28px, 최신글 항목은 16px/22px로 확인했다.
- 페이지 가로 오버플로는 0px이다.

**Interaction and runtime checks**

- 상세 시나리오 5건: passed
- 댓글·추천·비추천·공유 동작: passed
- 모바일 가로 잘림: 0px

final result: passed

---

# Design QA · 간결형 댓글 숫자·괄호 통일 (2026-10-15)

- source visual truth: 사용자 제공 치지직 모바일 캡처 `1-1000018320.jpg` (591×1280 래스터)
- implementation: `http://127.0.0.1:4175/community/naver-cafe-list.html?qa=comment-blue`
- implementation screenshot: `artifacts/community-compact-write-1015/mobile-384-comment-blue.png`
- comparison image: `artifacts/community-compact-write-1015/design-qa-comment-blue-list-comparison.png`
- viewport: 384×844 CSS px, DPR 1
- density normalization: 원본 목록 영역을 폭 384px에 맞춰 정규화하고 구현의 384px 목록 영역과 가로로 결합했다.
- state: 간결형 목록, 오른쪽 썸네일, 댓글 수 괄호 표기

## Full-view comparison evidence

- 구현의 게시물 행은 70px, 좌우 여백 15px, 제목 16/23px, 메타 12.5/17px, 썸네일 52px로 기준 캡처와 같은 밀도를 유지한다.
- 사용자 지시대로 상단 헤더 60px와 상단 탭 50px는 변경하지 않았다.
- 새 글 빨간 점은 기준 캡처처럼 제목 왼쪽에 다시 표시된다.

## Focused region comparison evidence

- 결합 비교 이미지에서 원본과 구현의 목록 영역을 같은 384px 폭으로 확인했다.
- 댓글 표기 전체 `(13)`이 하나의 span에서 보배 블루 `rgb(35, 143, 227)`, 16px, 23px, 500으로 렌더링된다.
- 숫자와 양쪽 괄호는 같은 글꼴·크기·굵기·행간을 상속하며 별도 축소 요소가 없다.

## Required fidelity surfaces

- Fonts and typography: Pretendard를 유지하고 제목과 댓글 표기를 모두 16/23px, 500으로 통일했다.
- Spacing and layout rhythm: 행 70px, 상하 9px, 제목-댓글 4px, 본문-썸네일 12px을 유지했다.
- Colors and visual tokens: 댓글은 보배 블루 토큰 `--blue: #238fe3`를 사용한다.
- Image quality and asset fidelity: 기존 52×52px 썸네일과 실제 이미지 자산을 변경하지 않았다.
- Copy and content: `(숫자)` 형식을 유지하고 숫자·괄호를 분리하지 않았다.

## Findings

- P0/P1/P2: 없음.
- P3: 기준 캡처의 댓글 초록색 대신 사용자 결정에 따라 보배 블루를 적용한 의도적 차이가 있다.

## Comparison history

- Pass 1: 기존 댓글은 15px이었고 새 글 점이 간결형에서 숨겨져 있었다.
- Fix: 댓글 전체를 16/23px로 통일하고 새 글 점을 복원했다. 헤더·탭은 변경하지 않았다.
- Pass 2: 384px 결합 비교에서 행 높이·제목 기준선·댓글 괄호·썸네일 정렬이 일치했고 P0/P1/P2가 남지 않았다.

final result: passed

# 딜러 프로필 · 리뷰/응답률 위치 교체 QA · 2026-10-15

- implementation: 김태규 딜러 프로필, 394 × 852 CSS px
- 리뷰 행은 기존 응답률 위치인 첫 번째 메타정보 행으로 이동했다.
- `딜러 경력 7년` 옆에는 응답률을 배치했다.
- 측정값: 리뷰 상단 338px, 경력·응답률 상단 436px, horizontal overflow 0px.
- PC에서는 최근 활동 옆에 리뷰를 표시하고 경력 옆 응답률 구조를 동일하게 유지한다.
- `npm run build`: passed
- mobile runtime integrity: passed
- browser console errors: 0

final result: passed
---

# 치지직 상세 · Reddit형 반응 알약칩 v11 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a128e5-de8a-78d0-9ed9-96cbde6a07c3/1d502e3f-4676-47fe-9e4c-6e641aa51c24/1-1000018354.jpg`
- implementation: `public/community/chzzk-detail.html?id=8325190`
- implementation capture: Chrome 로컬 렌더, 모바일 394 × 852 CSS px
- source pixels: 591 × 1280, 구현은 콘텐츠 영역 기준으로 비율 정규화

## Comparison evidence

- P2 before: 추천·비추천·댓글·공유 아이콘이 평면적으로 나열돼 기능별 묶음이 약했고 공유가 좌측 반응 그룹에 붙어 있었다.
- fix: 추천·점수·비추천을 하나의 999px 알약칩으로 묶고, 댓글·댓글 수는 별도 알약칩, 공유는 우측 끝 독립 원형칩으로 분리했다.
- fix: 댓글의 추천·비추천도 999px 소형 알약칩으로 묶어 게시글과 댓글의 반응 체계를 통일했다.
- post-fix mobile geometry: 추천칩 115.6 × 40px, 댓글칩 57 × 40px, 공유칩 40 × 40px, 댓글 반응칩 63.6 × 34px, 그룹 간격 6px.
- PC: 기존 1060px 중앙 셸과 반응형 규칙은 유지하고 공유칩의 `margin-left:auto`로 넓은 화면에서도 좌·우 그룹을 명확히 분리했다.

## Required fidelity surfaces

- typography: 기존 Pretendard, 점수 15–17px, 댓글 수 14–16px 유지
- spacing/layout rhythm: 모바일 40px, PC 44px 터치 영역과 6–8px 간격 유지
- colors/tokens: 흰 칩, `#dddddd` 외곽선, 선택 시 기존 Airbnb 핑크 토큰 유지
- icons/assets: 직전 확정한 Reddit 계열 엄지·댓글·공유 아이콘 그대로 사용
- copy/content: 원본 사용자 문의글, 프로필, 댓글, 최신글 내용 변경 없음

## Verification

- 모바일 394 × 852: 가로 넘침 없음, 깨진 이미지 0건.
- 상호작용: 추천 -4→-3, 추천 후 비추천 전환 -3→-5, 답글쓰기 `@익씽 ` 자동 입력 통과.
- P0/P1/P2 findings: none.

final result: passed

---

# 커뮤니티 상세정보 시나리오 5종 QA · 2026-10-15

- source visual truth: 기존 치지직 상세 레이아웃과 Reddit식 댓글 작업 영역
- implementation: `public/community/chzzk-detail.html?id=1` ~ `id=5`
- scenarios: GV80 장거리 시승, 테슬라 업데이트, 모델Y 트렁크 매트, 모델3 도어라이트 DIY, 프렁크 소프트 클로징
- content: 각 글 본문 4단락, 태그 3개, 상위 댓글 3개, 대댓글 1~3개
- interaction: 게시글 추천·비추, 댓글 추천·비추, 답글 대상 자동 입력, 댓글 공유를 모든 시나리오에서 확인
- image treatment: 상세 이미지는 전폭 16px 반경(모바일 10px), 본문과 18~24px 간격. 첫 시나리오는 저장소의 제네시스 GV80 자산을 사용해 제목·사진 불일치를 제거
- responsive evidence: 384×844에서 5개 전체 가로 넘침 없음. 고정 댓글 입력창과 댓글 작업 버튼이 콘텐츠를 가로로 밀지 않음
- screenshots: `artifacts/community-detail-scenarios-1015/scenario-1-mobile-384.png` ~ `scenario-5-mobile-384.png`
- verification: `community:verify:detail-scenarios`, `community:verify:detail-actions`, `community:verify:compact-write` 통과
- P0/P1/P2 findings: none

final result: passed

---

# 딜러 프로필 · 인스타그램형 정보 위계 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/2fa25692-156f-4b36-9fd0-5541173e51a6/1-1000018350.jpg`
- implementation: 딜러 프로필 모바일 화면, IAB 393 × 852 CSS px
- scope: 프로필 사진 옆 딜러명, 판매중·판매완료·팔로워, 소개글, 딜러 경력 아래 리뷰 순서

## Cross-check evidence

- 74px 원형 프로필 사진 오른쪽 첫 줄에 `김태규`와 인증 배지를 유지했다.
- 딜러명 바로 아래에 판매중·판매완료·팔로워를 3열 무테두리 통계로 배치하고 숫자를 먼저 읽히게 했다.
- 프로필 영역 전체 폭에 소속·역할과 두 줄 소개글을 배치해 인스타그램 프로필의 정보 위계를 적용했다.
- 공유·팔로우, 응답률, 주소, 딜러 경력, 리뷰 순으로 세로 흐름을 정리해 리뷰가 경력 아래에 오도록 했다.
- PC에서는 기존 박스형 판매 통계를 유지해 데스크톱 정보 밀도 회귀를 방지했다.

## Verification

- 모바일 393 × 852: 헤더·프로필·통계·소개글·리뷰 순서 통과
- 가로 넘침 및 텍스트 충돌: 없음
- `npm run check:runtime`: passed
- `npx tsc --noEmit`: passed
- P0/P1/P2 findings: none

final result: passed

---

# Design QA · 투제이모터웍스 페라리 영상 헤더 (2026-10-15)

- source visual truth: 기존 보배드림 페라리 카테고리의 Ferrari 공식 Sports Cars 히어로 영상
- implementation: `http://127.0.0.1:4213/?profile=dealer&shop=450554&emp=1&qf=guazi&category=서울오토갤러리&v=ferrari-video`
- implementation screenshot: Codex IAB tab `110`, 393 × 852 CSS px iframe capture, 서로 다른 재생 프레임 2회
- viewport: 모바일 393 × 852 CSS px; PC 기본 뷰포트
- state: 김태규 판매자 페이지, 판매차량 탭, 무음 자동재생

## Full-view comparison evidence

- 기존 Range Rover 5장 슬라이드를 페라리 공식 16:9 히어로 영상의 18:5 배너 크롭으로 교체했다.
- 모바일 393px 화면에서 영상은 좌우 16px·최대 100px 헤더 슬롯을 유지하며 프로필 사진과 제목의 위치를 움직이지 않는다.
- 1.2초 간격의 두 브라우저 캡처에서 서로 다른 차량 프레임이 보여 자동재생이 실제로 진행됨을 확인했다.

## Focused region comparison evidence

- 영상 초점을 오른쪽 62%에 배치해 차량의 주행 장면과 왼쪽 상사 문구가 겹치지 않는다.
- 좌측 76% 검정 오버레이와 하단 26% 음영으로 흰색 `투제이모터웍스 / 수입차 전문 매매`의 대비를 확보했다.
- 슬라이드 점·연식·차종 표기를 제거해 헤더의 정보 잡음을 줄였다.

## Required fidelity surfaces

- fonts/typography: 기존 18/23px 상사명과 11/15px 설명을 유지하고 설명 자간만 `.02em`으로 정돈했다.
- spacing/layout rhythm: 직전 유튜브 기준 18:5·100px 헤더, 74px 프사, 13px 간격을 보존했다.
- colors/tokens: 검정 비네팅·흰색 타이포만 사용해 페라리 영상의 색을 방해하지 않는다.
- image quality/assets: Ferrari 공식 1280×720 MP4를 재사용하고, 실패·모션 감소 시 로컬 Ferrari F80 포스터로 전환한다.
- copy/content: 상사명과 전문 분야 문구를 유지하고 불필요한 연식·모델 문구만 제거했다.

## Verification

- 모바일 영상 자동재생·무음·인라인·반복 렌더 확인
- 정지 포스터 fallback 및 `prefers-reduced-motion` 경로 구현
- `npm run check:runtime`: passed
- `npx tsc --noEmit`: passed
- P0/P1/P2 findings: none

final result: passed

---

# 치지직 상세 · 당근형 엄지 반응 아이콘 v8 QA · 2026-10-15

- source visual truth: 사용자 제공 `1-1000018342.jpg` (591 × 1280px, 당근형 모바일 게시물)
- implementation screenshot: Chrome 브라우저 캡처 `http://172.30.1.200:45174/community/chzzk-detail.html?id=8325190`
- viewport: 모바일 394 × 852 CSS px, DPR 1 / PC 1440 × 1000 CSS px
- density normalization: 원본은 591px 폭 모바일 캡처이며, 전체 페이지 복제가 아닌 반응 아이콘 행의 형태·무게·간격을 394px 구현 화면과 집중 비교했다.
- state: 기본, 추천 선택, 비추천 전환, 댓글 추천 선택

## Full-view comparison evidence

- 치지직의 제목·본문·댓글 정보 구조는 유지하면서 참고 화면의 테두리 없는 평면 반응 아이콘 행을 적용했다.
- 모바일에서 추천·점수·비추천·댓글 수·공유가 하나의 기준선에 놓이고, PC에서는 1060px 셸 안에서 동일한 아이콘 비율을 유지한다.
- 상단 북마크·더보기와 하단 입력 아이콘도 24px 계열로 통일해 화면 전체의 아이콘 밀도를 맞췄다.

## Focused region comparison evidence

- 참고 화면의 추천 24px, 댓글 24px, 공유 24px 시각 무게에 맞춰 구현의 게시글 반응 아이콘 네 종을 모두 24 × 24px로 측정했다.
- 댓글 단위 추천·비추천은 20 × 20px, 32px 원형 터치 영역으로 축소해 본문 반응보다 한 단계 낮은 위계를 만들었다.
- 텍스트 `버프`·`너프`는 시각적으로 제거하고 접근성 이름만 `추천`·`비추천`으로 유지했다.

## Comparison history

- P2 before: 기존 반응은 테두리 캡슐 안의 `버프`·`너프` 텍스트와 서로 다른 크기의 댓글·공유 아이콘 때문에 참고 화면보다 복잡하고 무게가 불균형했다.
- fix: 저장소의 동일 계열 Chợ Tốt 24px 엄지·댓글·공유·북마크·더보기 자산으로 교체하고, 테두리를 제거해 40px 모바일 터치 영역에 정렬했다.
- post-fix: 모바일 캡처에서 네 아이콘이 같은 기준선과 24px 박스를 사용하며, 댓글 영역의 20px 엄지 쌍도 균형 있게 정렬됐다.
- P3 accepted: 치지직 정보 구조와 기존 Airbnb `#FF385C` 선택 상태는 제품 맥락에 따른 의도적 차이다.

## Verification

- 모바일: 가로 넘침 없음, 깨진 이미지 0건, 콘솔 warning/error 0건.
- PC: 1060px 중앙 셸, 가로 넘침 없음, 깨진 이미지 0건.
- 상호작용: 추천 -4→-3, 비추천 전환 -3→-5, 답글 `@익씽 ` 입력 통과.
- `npm run verify`: 관리자 29건, Sites 4건, 타입 검사·프로덕션 빌드 전체 통과.
- P0/P1/P2 findings: none.

final result: passed

---

# 치지직 상세 · 레딧 아이콘 전면 통일 v9 QA · 2026-10-15

- source visual truth: 사용자 제공 Reddit 상세 화면과 Notion `미국_레딧` 아이콘 데이터베이스에서 분리한 저장소 벡터 세트
- implementation: `public/community/chzzk-detail.html?id=8325190`
- viewports: 모바일 394 × 852 CSS px / PC 1440 × 1000 CSS px
- scope: 치지직 상세 전용 아이콘만 변경; 네이버 카페 상세·목록은 미변경

## Cross-check evidence

- 직전 v8에서 섞였던 Chợ Tốt 북마크·더보기·추천·비추천·댓글·공유 참조를 모두 제거했다.
- 상단 닫기·북마크·더보기, 이벤트, 게시글 추천·비추천·댓글·공유, 댓글 더보기·추천·비추천, 새로고침·정렬·설정·맨 위로, 입력창 카메라·스티커·잠금·전송을 `assets/chzzk-detail/icons/`의 Reddit 원본 벡터 세트로 통일했다.
- 모바일 핵심 반응 아이콘은 24 × 24px, 댓글 반응 아이콘은 20 × 20px, PC 핵심 반응 아이콘은 26 × 26px로 기존 균형을 유지했다.
- 추천·비추천의 의미와 Airbnb `#FF385C` 선택 상태는 그대로 유지했다.

## Verification

- 모바일: 가로 넘침 없음, 깨진 이미지 0건, 콘솔 warning/error 0건.
- PC: 1060px 중앙 셸, 가로 넘침 없음, 깨진 이미지 0건.
- 상호작용: 추천 -4→-3, 비추천 전환 -3→-5, 답글 `@익씽 ` 입력 통과.
- 코드 검색: 치지직 상세 HTML·JS의 `chotot` 아이콘 참조 0건.
- 검증: 관리자 29건 통과, 프로덕션 빌드 통과, Sites 4건 통과.
- P0/P1/P2 findings: none.

final result: passed

---

# 치지직 상세 · 레딧 엄지 실측 균형 v10 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a128e5-de8a-78d0-9ed9-96cbde6a07c3/18c75ea0-215b-4cac-858d-8c1a6f1691c6/1-1000018368.jpg`
- implementation: `http://127.0.0.1:45174/community/chzzk-detail.html?id=8325190&v=10`
- implementation screenshot: Chrome Browser 탭 `229711349`, 모바일 394 × 852 CSS px 캡처
- source pixels: 591 × 1280px; 구현은 394 × 852 CSS px, DPR 1 기준으로 반응 행을 정규화해 비교
- state: 사용자 문의 게시물, 추천·비추천 미선택 기본 상태

## Full-view comparison evidence

- 원본 캡처와 수정 구현을 같은 사용자 문의 게시물·모바일 상태에서 비교했다.
- 게시글 본문, 반응 행, 최신글 카드, 댓글 헤더, 하단 입력창의 기존 구조와 세로 리듬은 유지했다.
- 수정 범위는 레딧 추천·비추천 엄지의 실제 보이는 크기와 캐시 갱신에 한정했다.

## Focused region comparison evidence

- P2 before: 24 × 24px 이미지 박스 안에서 엄지 도형이 약 10px로만 보여, 24px 댓글·공유 아이콘의 절반 수준이었다.
- fix: Reddit 엄지 원본 path는 그대로 두고 SVG `viewBox`를 `0 0 40 40`에서 `10 10 20 20`으로 보정해 내부 여백만 제거했다.
- post-fix: 모바일 캡처에서 추천·비추천·댓글·공유가 동일한 24 × 24px 슬롯과 유사한 시각 무게로 정렬됐다.
- 댓글 단위 엄지 역시 20 × 20px 슬롯 안에서 본문 반응보다 한 단계 작은 위계를 유지한다.

## Required fidelity surfaces

- fonts/typography: 기존 Pretendard 제목·본문·점수 체계를 변경하지 않았다.
- spacing/layout rhythm: 반응 버튼 40px 터치 영역과 좌측 정렬 간격을 유지했다.
- colors/tokens: 기본 `#222`, 선택 `#FF385C` 및 Airbnb 상태색을 유지했다.
- image quality/assets: Reddit 원본 벡터 path를 재제작하지 않고 viewBox만 보정했으며 흐림·왜곡이 없다.
- copy/content: 제목·본문·점수·댓글 문구는 변경하지 않았다.

## Verification

- 모바일 394 × 852: 네 핵심 아이콘 24 × 24px, 가로 넘침 없음, 깨진 이미지 0건.
- PC 1440 × 1000: 1060px 중앙 셸, 가로 넘침 없음, 깨진 이미지 0건.
- 상호작용: 추천 -4→-3, 비추천 전환 -3→-5 통과.
- 콘솔 warning/error 0건.
- 캐시 방지: 모든 추천·비추천 SVG URL에 `v=20261015v10` 적용.
- P0/P1/P2 findings: none.

final result: passed

---

# Design QA · 유튜브 모바일 헤더·프로필 크기 보정 (2026-10-15)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/dbff4f9b-8c08-43b9-bccf-46b545374c2e/1-1000018338.jpg`
- implementation: `http://127.0.0.1:4213/?profile=dealer&shop=450554&emp=1&qf=guazi&category=서울오토갤러리&v=youtube-size`
- implementation screenshot: Codex IAB tab `108`, 393 × 852 CSS px iframe capture
- source pixels: 592 × 1280 px; Android 기기 배율을 393 CSS px 기준으로 정규화
- implementation pixels/CSS/density: 393 × 852 CSS px, 브라우저 기본 DPR
- state: 김태규 판매자 페이지, 판매차량 탭, 팔로우 전

## Full-view comparison evidence

- 원본 유튜브 배너는 좌우 약 16px, 폭 약 361px, 높이 약 100px로 측정됐다.
- 구현을 393px 프레임에서 열어 배너 좌우 16px, 18:5 비율, 최대 높이 100px로 렌더되는 것을 확인했다.
- 원본 프로필 사진은 약 74px이고 배너 하단에서 약 13px 떨어져 시작한다. 구현도 74px 원형 사진과 13px 상단 간격으로 맞췄다.

## Focused region comparison evidence

- 프로필 사진의 왼쪽 시작점은 16px, 판매자명 시작점은 108px로 유지했다.
- 프사 폭을 72px에서 74px로 늘리는 대신 사진–텍스트 간격을 20px에서 18px로 줄여 제목 시작축이 움직이지 않게 했다.
- 헤더 아래 과도했던 24px 합산 간격을 13px로 줄여 원본 유튜브의 세로 밀도와 맞췄다.

## Required fidelity surfaces

- fonts/typography: 기존 판매자명 22/28px 및 보조 정보 13/18px을 유지해 텍스트 위계를 변경하지 않았다.
- spacing/layout rhythm: 배너 18:5·100px, 프사 74px, 좌우 16px, 배너–프사 13px으로 보정했다.
- colors/tokens: 기존 흰 배경·검정 본문·회색 보조 정보 토큰을 유지했다.
- image quality/assets: 기존 공식 Range Rover 헤더 이미지와 실제 딜러 프로필 원본을 유지하고 크롭만 슬롯에 맞췄다.
- copy/content: 판매자·상사·평점·판매 실적 문구는 변경하지 않았다.

## Comparison history

- Pass 1 P2: 배너가 3.65:1·98px로 원본보다 약간 낮고, 프사 72px 및 배너–프사 24px 간격으로 상단 밀도가 느슨했다.
- Fix: 모바일 배너를 18:5·100px, 프사를 74px, 배너–프사 간격을 13px으로 수정했다.
- Pass 2: 393 × 852 IAB 프레임에서 제목 시작축, 배너 비율, 프사 크기와 세로 간격을 다시 확인했고 P0/P1/P2 차이가 남지 않았다.

## Verification

- `npm run check:runtime`: passed
- `npx tsc --noEmit`: passed
- `npm run build`: passed
- 모바일 393 × 852 및 PC 기본 뷰포트 렌더 확인
- P0/P1/P2 findings: none

final result: passed

---

# 치지직 상세 · 댓글 있는 사용자 게시물 v7 QA · 2026-10-15

- source visual truth: `https://m.game.naver.com/lounge/chzzk/board/detail/8325190`
- implementation: `public/community/chzzk-detail.html?id=8325190`
- viewports: 모바일 394 × 852 CSS px, PC 1440 × 1000 CSS px
- scope: 다른 사용자 게시물·실제 댓글 시나리오 추가; 기존 공지와 네이버 카페 상세는 유지

## Cross-check evidence

- 원본의 긴 제목, 작성자 `두깝이 · LV 7`, `14시간 전`, 조회 91, 6문단 본문을 동일한 정보 순서로 구성했다.
- 작성자 최신글은 `가입 인사` 한 건만 노출하고, 댓글 2건은 클린봇 숨김 안내와 `익씽 · LV 12`의 공개 댓글로 재현했다.
- 원본 사용자·익명 댓글 프로필 자산을 로컬로 고정하고, 치지직 상세의 Airbnb 강조색과 Reddit식 좌측 버프/너프/댓글·우측 공유 구조를 유지했다.
- 모바일에서 제목·본문·최신글·클린봇·댓글·하단 입력창의 순서와 고정 헤더/입력창을 확인했다.

## Verification

- 모바일: 가로 넘침 없음, 깨진 이미지 0건, 콘솔 warning/error 0건.
- PC: 1060px 중앙 셸, 가로 넘침 없음, 깨진 이미지 0건.
- 상호작용: 버프 -4→-3, 너프 전환 -3→-5, 답글쓰기 `@익씽 ` 입력 및 등록 버튼 활성화 통과.
- `npm run verify`: 관리자 29건, Sites 4건, 타입 검사·프로덕션 빌드 전체 통과.
- P0/P1/P2 findings: none.

final result: passed

---

# 치지직 상세 · Reddit 댓글 액션 v8 QA · 2026-10-15

- source visual truth: 사용자 첨부 `1000018336.jpg`의 Reddit 모바일 게시글·댓글 액션 영역
- icon source: 사용자 제공 Notion `미국_레딧` DB의 `N_커뮤니티 시안용 아이콘 모음`과 답글 아이콘
- implementation: `public/community/chzzk-detail.html?id=8326278`
- viewport: 모바일 384 × 844, 360 × 800 CSS px

## Cross-check evidence

- 게시글 반응을 `추천 아이콘 + 추천 + 점수 + 비추 아이콘 + 비추`, 댓글 수, 우측 공유 순서로 재구성했다.
- 댓글과 답글에 `더보기 / 답글 / 공유 / 추천 / 비추` 액션을 같은 크기 체계로 추가했다.
- 360px에서 문구와 숫자가 잘리지 않고 가로 스크롤이 생기지 않는다(`scrollWidth 345 / viewport 360`).
- 추천과 비추는 같은 그룹에서 상호 배타적으로 동작하고, 답글 버튼은 `@쿠로토라 `를 입력창에 준비한다.
- 실제 댓글 시나리오 `8325190`도 같은 아이콘·명칭으로 교체했고 답글 대상 `@익씽 `을 유지한다.
- Notion 원본 SVG 6개는 `reddit-icon-manifest.json`에 페이지 URL과 SHA-256을 기록했다.

## Verification

- `npm run community:verify:detail-actions`: passed
- `npm run community:verify:compact-write`: passed
- `npm run build`: passed
- 브라우저 console warning/error: 0건
- P0/P1/P2 findings: none

final result: passed

---

# 치지직 상세 · 긴 제목 공지 구조 v6 QA · 2026-10-15

- source visual truth: `https://m.game.naver.com/lounge/chzzk/board/detail/8303245` (사용자 제공 `https://naver.me/x7eQI0p3` 리디렉션)
- implementation screenshot target: `http://172.30.1.200:45174/community/chzzk-detail.html?id=8303245`
- browser captures: Chrome 원본 탭 `229711228`, 구현 탭 `229711249`
- viewport/density: 모바일 394 × 852 CSS px, DPR 1; PC 1440 × 1000 CSS px, DPR 1
- state: 긴 제목 공지 기본 화면, 버프 선택, 너프 전환, 댓글 비활성

## Full-view and focused comparison evidence

- 모바일 상단 집중 비교에서 `공지사항 → 2줄 제목 → 운영자 프로필 → 구분선 → 루프 스테이션 배너 → 본문` 순서를 원본과 동일하게 맞췄다.
- 핵심 좌표는 제목 y=154px, 작성자 y=205px, 구분선 y=250px, 배너 y=266px로 원본 캡처와 일치한다.
- PC에서는 1060px 중앙 셸에서 제목이 1줄, 배너가 콘텐츠 폭 전체로 표시된다.
- 원본 치지직 운영자 프로필 40 × 40 PNG와 루프 스테이션 800 × 67 PNG를 직접 추출해 사용했다.

## Required fidelity surfaces

- fonts/typography: 모바일 제목 18/24px·2줄, PC 24/32px·1줄이며 원본과 같은 어절 내부 줄바꿈을 적용했다.
- spacing/layout rhythm: 모바일 상단 핵심 요소의 y 좌표와 15px 좌우 여백, PC 1060px 셸을 확인했다.
- colors/tokens: 기존 Airbnb 로즈 상호작용 토큰과 초록 게시판 라벨을 유지했다.
- image quality/assets: 운영자 프로필과 본문 배너는 원본 파일이며 깨진 이미지 0건이다.
- copy/content: 제목, 작성자·레벨·운영자 표기, 날짜·조회수, 공지 본문, 최신글 3건을 원본과 대조했다.

## Comparison history

- P2 before: 긴 제목이 모바일에서 원본보다 뒤쪽에서 줄바꿈되고 작성자·구분선·배너가 5–11px 아래에 놓였다.
- fix: 긴 제목에 원본형 글자 간격과 어절 내부 줄바꿈을 적용하고 제목 하단·구분선 간격을 각각 5px 줄였다.
- post-fix: 제목 y=154px, 2줄 높이 48px, 작성자 y=205px, 구분선 y=250px, 배너 y=266px로 재측정했다.

## Verification

- 모바일·PC 가로 넘침 없음, 깨진 이미지 0건, 콘솔 warning/error 0건.
- 상호작용: 버프 30→31, 너프 전환 31→29, 공지 댓글 입력 비활성 통과.
- `npm run verify`: 관리자 29건, Sites 4건, 타입 검사·프로덕션 빌드 전체 통과.
- P0/P1/P2 findings: none.

final result: passed

---

# 간결형 치지직 글쓰기 전용 화면 QA · 2026-10-15

- source visual truth: 로그인된 치지직 모바일 글쓰기 `https://m.game.naver.com/lounge/chzzk/write?boardId=-1&loungeId=chzzk`
- implementation: `public/community/chzzk-write.html`
- entry: 간결형 목록의 우하단 글쓰기 버튼
- scope: 간결형만 치지직 전용 등록폼으로 연결; 기존 네이버 카페형 등록폼은 유지

## 대조 결과

- 모바일 헤더의 닫기·글쓰기·저장·등록, 게시판 선택, 제목, 8개 편집 도구, 본문, 태그, 본문 숨기기, 하단 3버튼 구조를 원본 순서대로 구성했다.
- 원본의 사진·동영상·텍스트 도구·스티커·인용구·구분선·링크·투표를 모두 동작하도록 연결했다.
- 투표는 제목, 기본 선택지 3개, 항목 추가/삭제, 복수 선택, 무기명, 현황 공개 시점, 자동 종료 설정을 제공한다.
- 게시판은 치지직의 게시판 선택 패턴을 사용하되 사용자의 기존 요구대로 보배드림 게시판 목록을 표시한다.
- 등록 결과는 기존 로컬 미리보기 파이프라인을 통해 간결형 목록에 한 번만 추가되고 치지직형 상세로 열린다.

## 검증

- 모바일 384 × 844: 간결형 목록 → 치지직 글쓰기 → 게시판 자동 선택 → 등록 → 목록 → 상세 전 흐름 통과.
- 편집 도구 8개, 투표 기본 선택지 3개, 스티커 카테고리, 링크 URL 검증, 태그 10개 제한, 본문 숨기기 확인.
- 브라우저 warning/error 0건.
- `npm run community:verify:compact-write`: passed.
- P0/P1/P2 findings: none.

final result: passed

---

# Design QA · 게시물 작성 숫자 잘림 수정 (2026-10-15)

- source visual truth: 사용자 제공 모바일 캡처 `1-1000018290.jpg` (591×1280 래스터, 글자 크기 `15`의 오른쪽 획 잘림)
- implementation: `http://127.0.0.1:4173/community/naver-write-parity.html`
- implementation screenshots: `artifacts/community-write-number-clipping-1015/mobile-360-toolbar-long-values.png`, `mobile-384-toolbar-long-values.png`, `mobile-412-toolbar-long-values.png`, `desktop-1536-toolbar-long-values.png`
- implementation pixels/CSS/density: 360×800, 384×844, 412×915, 1536×864 CSS px / DPR 1
- density normalization: 원본은 기기 스크린샷이므로 실제 픽셀 배율을 직접 비교하지 않고, 글자 획의 완전 노출·선택창 내부 여백·화살표 충돌 여부를 같은 비교 입력에서 판정했다.
- state: 텍스트 도구막대 열림, 긴 글꼴명, 글자 크기 38, 가운데 정렬

## Full-view comparison evidence

- 원본 캡처와 360px 수정본을 같은 비교 입력에 넣어 확인했다.
- 헤더·분류·제목·기본 도구막대·텍스트 도구막대·본문·태그·공개 설정의 전체 순서와 밀도는 유지됐다.
- 수정 전 잘린 `15`와 수정 후 최대 두 자리 `38`을 비교했고, 수정본은 숫자 두 획과 화살표 사이에 독립 여백이 있다.

## Focused region comparison evidence

- 글자 크기 선택창을 68px로 고정하고 문자 영역 33px, 화살표 여백 26px을 확보했다.
- 11·13·15·16·19·24·28·30·34·38을 네 개 뷰포트에서 모두 선택해 값 유지와 내부 오버플로를 검사했다.
- 실제 인앱 브라우저에서 기본값 `15`가 잘리지 않는 것을 다시 육안 확인했다.

## Required fidelity surfaces

- Fonts and typography: 기존 네이버형 시스템 글꼴과 크기 위계를 유지했고 숫자만 `tabular-nums`로 안정화했다.
- Spacing and layout rhythm: 선택창 폭 외의 행 높이·도구 순서·본문 시작점은 변경하지 않았다.
- Colors and visual tokens: 기존 검정/회색 토큰을 보존하고 새 색상은 추가하지 않았다.
- Image quality and asset fidelity: 새 래스터를 만들지 않고 기존 벡터 `chevron-down.svg`를 재사용했다.
- Copy and content: 문구와 선택값은 변경하지 않았다.

## Findings

- P0/P1/P2: 없음.
- P3: 모바일 텍스트 도구막대 전체 폭은 화면보다 넓어 뒤쪽 기능은 가로 스크롤로 접근한다. 기존 구조를 유지한 의도적 동작이며 글자 크기 칸은 첫 화면에 완전히 노출된다.

## Comparison history

### Pass 1 — failed

- 모바일 네이티브 선택창 화살표가 64px 칸의 문자 영역을 침범해 `15`의 마지막 획이 잘렸다.

### Pass 2 — passed

- 네이티브 외형을 제거하고 전용 화살표·68px 폭·고정 패딩을 적용했다.
- 4개 뷰포트 × 10개 글자 크기 40/40, 숫자 표기, 전체 기능·첨부·이모지·빌드 회귀가 통과했다.

final result: passed

---

# 치지직 상세 · 실제 원본 글 8326278 및 PC 반응형 v4 QA · 2026-10-15

- source visual truth:
  - live: `https://m.game.naver.com/lounge/chzzk/board/detail/8326278`
  - mobile capture: `.codex-remote-attachments/01a128e5-de8a-78d0-9ed9-96cbde6a07c3/05b4afa3-384c-4b00-99d0-0beffae80c58/2-1000018294.png`
- implementation route: `http://127.0.0.1:4175/community/chzzk-detail.html?id=8326278`
- implementation screenshot evidence: Chrome browser capture of the route above at 390×844 and 1536×639; unchanged mobile regions are also recorded in `artifacts/chzzk-detail-reference-v3/implementation-regular-600.png`
- normalized side-by-side evidence: `artifacts/chzzk-detail-reference-v3/comparison-regular-content.png`
- source pixels: uploaded mobile capture 1080×3689px; live desktop viewport 1520×750 with approximately 1055px content shell
- implementation pixels/CSS: browser viewport 390×844 and 1536×639, DPR managed by Chrome; desktop shell measured 1060px
- state: regular post `8326278`, default reactions, event ticker first item

## Full-view comparison evidence

- live source resolved from the supplied short link to post `8326278`; title, author, level, elapsed time, view 34, tags, buff 16, comment hierarchy, and latest-post copy were checked against the rendered implementation.
- mobile retained the reference screen's header, post, sticker, tags, banner, latest card, comments, nested reply, and fixed composer order with zero horizontal overflow.
- desktop changed from the earlier 760px shell to a measured 1060px shell, matching the live source's approximately 1055px centered content region.
- the reaction strip intentionally follows the user's later Reddit-layout instruction: buff/nerf and comment start on the left while share remains on the far right. This is an accepted product override from the source's right-aligned mobile strip.

## Focused region comparison evidence

- mobile reaction coordinates: row 23–352px, vote 23–179px, comment 187–243px, share 309–352px; the requested left cluster and separated share control are visible and non-overlapping.
- desktop reaction coordinates: row 246–1274px, vote 246–406px, comment 416–473px, share 1231–1274px.
- event ticker click advanced to the next observed live-source message; buff toggled 16→17 and restored; comment input enabled the submit control and was then cleared.

## Required fidelity surfaces

- fonts/typography: Pretendard hierarchy and 13–24px type scale remain unchanged; source copy and current elapsed-time/view metadata were updated.
- spacing/layout rhythm: mobile 23px content inset and 390px viewport remain stable; desktop shell now measures 1060px with 16px content inset.
- colors/tokens: source green board label is retained, while the user-requested Airbnb `#FF385C` interaction token remains the intentional brand override.
- image quality/assets: source-matching cat stickers and avatar are local raster assets; browser check found zero broken images.
- copy/content: default route now resolves to post `8326278`, view is 34, parent comment time is 7 hours, and the event row cycles through three messages observed on the live source.

## Comparison history

- P2 before: desktop remained constrained to 760px although the supplied live desktop page uses an approximately 1055px centered shell.
- fix: introduced `--shell-max: 1060px`, aligned the fixed composer to the same width, and reduced desktop content insets to 16px.
- P2 before: reaction controls were right-aligned despite the user's explicit Reddit-style left placement request.
- fix: moved vote and comment controls to the left and pushed only share to the far right; notice-mode votes remain right-aligned like the reference.
- post-fix browser evidence: mobile and desktop coordinate checks above, zero horizontal overflow, zero broken images, and zero console warnings/errors.

## Verification

- mobile 390×844 and desktop 1536×639: passed
- regular and notice modes: passed
- buff toggle, event ticker, comment input enablement: passed
- console warning/error: 0
- broken images: 0
- `npm run verify`: passed (admin 29, Sites 4, production build)
- P0/P1/P2 findings: none after fixes

final result: passed

---

# Design QA · 네이버 카페 글쓰기 UI 동일화 (2026-10-15)

- source visual truth: `https://m.cafe.naver.com/ca-fe/web/cafes/25233466/articles/write`의 로그인된 실제 글쓰기 화면
- source capture: Chrome Browser Use 렌더 1536×695 CSS px, DPR 1.25. 계정 보호 정책에 따라 원본 캡처 파일은 저장소에 저장하지 않고 같은 비교 입력에서 구현 캡처와 함께 확인했다.
- implementation: `http://127.0.0.1:4173/community/naver-write-parity.html`
- implementation screenshots: `artifacts/community-write-parity-1015/desktop-source-1536x695-viewport.png`, `mobile-384-viewport.png`, `desktop-source-1536x695-board-modal.png`, `mobile-384-filled-tools.png`
- implementation pixels/CSS/density: 1536×695 / 1536×695 CSS / DPR 1; 384×844 / 384×844 CSS / DPR 1
- density normalization: CSS 좌표와 컴포넌트 실측을 기준으로 비교하고, 래스터 배율 차이는 판정에서 제외했다.
- state: 빈 편집기, 게시판 선택 모달, 확장 텍스트 도구막대, 임시글 저장/목록

## Full-view comparison evidence

- 원본과 구현을 같은 Browser Use 비교 입력에서 확인했다.
- 헤더 52px, 게시판 49px, 제목 47px, 기본 도구막대 48px, 본문 300px, 태그 45px의 세로 구조가 일치한다.
- 구현의 제목 y=120, 도구막대 y=188, 본문 y=236, 태그 y=536으로 원본 실측 오차 1px 이내다.
- PC 1536px과 모바일 384·360·412px에서 가로 오버플로가 없고, 도구막대만 의도적으로 가로 스크롤한다.

## Focused region comparison evidence

- 게시판 모달은 원본과 같은 300×417px, 16px 모서리, 40px 검색 필드, 40px 선택 행을 사용한다.
- 상단 행동은 닫기 / 임시 건수 / 임시등록 / 비활성 등록 순서와 52px 높이를 유지한다.
- 편집기 툴바의 39px 버튼·44px 중심 간격과 공개 설정의 44×26px 스위치를 집중 대조했다.

## Required fidelity surfaces

- Fonts and typography: 시스템 `-apple-system`, BlinkMacSystemFont, Helvetica Neue, Apple SD Gothic Neo 폴백과 14~17px 위계를 적용했다. 입력·버튼·설정 문구 줄바꿈을 뷰포트별로 확인했다.
- Spacing and layout rhythm: 좌우 16px, 상단 행 높이, 편집기 300px, 모달 300×417px을 자동 실측으로 고정했다.
- Colors and visual tokens: 흰 배경, `#f5f6f7` 입력 배경, `#03c75a` 활성색, 옅은 회색 구분선과 비활성 등록색을 대조했다.
- Image quality and asset fidelity: 사용자 지정 노션 DB의 SVG 21개를 원본 벡터로 저장했으며 매니페스트를 남겼다. 네이버 전용 편집기 스프라이트는 복제하지 않았고, 사용자 지시대로 승인된 노션 자산을 사용했다.
- Copy and content: 게시판/제목/본문/태그/공개 설정/임시글 문구와 상태가 기준 화면과 일치한다.

## Findings

- P0/P1/P2: 없음.
- P3: 사진·동영상·글감·파일 등 일부 글리프는 네이버 전용 스프라이트 대신 사용자 지정 노션 DB의 동등 기능 SVG를 사용한다. 버튼 박스·정렬·동작은 기준과 같고, 이는 사용자 지정 자산 원천을 우선한 의도적 차이다.
- P3: 원본 모바일 384px 화면은 인증된 Chrome 창의 크기 변경 제약으로 직접 저장하지 못했다. 구현은 384·360·412px에서 자동 캡처·실측·상호작용 검증을 완료했다.

## Comparison history

### Pass 1 — blocked

- P2: 제목·도구막대·본문·태그가 원본보다 1~2px 아래에 있었고 게시판 문구가 기본 버튼 패딩 때문에 x=22에서 시작했다.
- 수정: 제목 영역 상·하 패딩을 각각 1px 줄이고 게시판 버튼 패딩을 0으로 고정했다.

### Pass 2 — passed

- 수정 후 제목 y=120, 도구막대 y=188, 본문 y=236, 태그 y=536, 게시판 문구 x=16.
- 5개 뷰포트 기능 테스트, 외부 요청 0건, 콘솔·페이지 오류 0건.

## Primary interactions tested

- 게시판 모달 열기/검색/단일 선택/닫기
- 제목·본문 입력 후 등록 활성화
- 텍스트 도구막대 열기
- 임시글 저장/건수/목록/복원/삭제
- 공개 설정 스위치와 등록 전송 차단

final result: passed

---

# Design QA · FC온라인 치지직 전용 상세페이지 분리 (2026-10-15)

- source visual truth: `https://m.game.naver.com/lounge/FIFA_ONLINE4/board/detail/8131629`
- source mobile capture: Browser tab `229710682`, 390 × 844 CSS px
- source desktop capture: Browser tab `229710688`, 1536 × 639 CSS px, 본문 1056px
- implementation: `public/community/chzzk-detail.html`
- implementation mobile capture: Browser tab `229710692`, 390 × 844 CSS px
- implementation desktop capture: Browser tab `229710695`, 1536 × 639 CSS px, 본문 1056px
- side-by-side comparison: Browser tab `229710704`, 원본·구현 각각 390 × 844px iframe
- density normalization: 원본과 구현 모두 DPR 1의 동일 CSS 크기로 비교
- state: FC온라인 자유 게시글 상세, 댓글 1개, 등록순

## Full-view comparison evidence

- 원본과 구현을 같은 390 × 844 비교 화면에서 나란히 확인했다.
- 48px 다크 헤더, 1056px PC 본문 폭, 모바일 단일 열, 흰 콘텐츠와 `#ebedf3` 바깥 배경을 재현했다.
- 게시글 → 댓글 입력 → 클린봇 → 댓글 → 자유 목록 → 인기글 → 푸터 순서를 원본과 동일하게 구성했다.
- 사용자 요청에 따라 원본의 우측 버프·너프 대신 레딧형 추천·점수·비추, 파란 댓글 수, 공유를 본문 아래 왼쪽에 배치했다.
- 기존 `naver-cafe-detail.html`은 보존하고 새 `chzzk-detail.html`로 완전히 분리했다.

## Focused region comparison evidence

- 모바일 원본과 구현의 제목 시작축 y=99~103px, 작성자 영역 y=124~160px, 본문 시작축 y=193~199px로 6px 이내다.
- 댓글 헤더는 두 화면 모두 y=329~330px, 연관글 첫 구역은 y=688px 전후로 일치한다.
- PC는 원본과 같은 1056px 중앙 카드, 48px 헤더, 좌우 15px 콘텐츠 여백을 사용한다.
- 원본 기본 프로필·댓글 작성자·댓글 스티커를 로컬 자산으로 저장해 외부 핫링크 없이 사용했다.

## Comparison history

### Pass 1 — passed

- P0/P1/P2 findings: 없음.
- 앱으로 보기의 원형 서비스 아이콘은 원본 자산 번들링이 차단되어 텍스트 버튼으로 유지했다. 기능 흐름과 버튼 크기는 같으며 P3 자산 차이로 기록한다.
- 레딧형 게시글 액션은 사용자 지정 변경이므로 원본과의 의도적 차이로 판정했다.

## Required fidelity surfaces

- fonts/typography: Pretendard, 제목 18/24px 650, 본문 15/27px, 메타 11~14px 계층 통과
- spacing/layout rhythm: 모바일 15px, PC 15px 여백, 48px 헤더, 8px 섹션 구분 통과
- colors/tokens: 다크 헤더 `#202125`, 페이지 `#ebedf3`, 클린봇 퍼플, 댓글 블루 통과
- image quality/assets: 원본 프로필·댓글 작성자·스티커와 지정 Notion 액션 SVG 사용, 깨진 이미지 0
- copy/content: FC온라인·자유·앱으로 보기·클린봇·댓글·연관글·푸터 문구 통과

## Primary interactions tested

- 추천 1→2, 비추 전환 2→0 및 상호 배타 상태
- 댓글 아이콘 이동·입력 포커스
- 댓글 입력·등록 후 댓글 1→2
- 댓글별 추천·비추, 답글 입력, 정렬 메뉴
- 게시판 목록 첫 항목 → `chzzk-detail.html?id=1` 연결
- 모바일·PC 가로 오버플로 0, 깨진 이미지 0, 콘솔 오류·경고 0

final result: passed

---

# Design QA · 레딧형 게시글·댓글 액션 배치 (2026-10-15)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a128e5-de8a-78d0-9ed9-96cbde6a07c3/3eec52e2-01d4-459d-9a5b-25c6a8c99f60/1-1000018284.jpg`
- icon source: 사용자가 지정한 Notion 아이콘 DB의 좋아요·싫어요·댓글·공유 SVG 원본
- implementation: `public/community/naver-cafe-detail.html`
- mobile viewport: 394 × 864 CSS px
- desktop viewport: 1536 × 639 CSS px, 본문 카드 760px

## Full-view comparison evidence

- 기존 FC온라인 상세의 헤더·게시글·클린봇·댓글 입력 구조는 유지했다.
- 레딧 참고 화면처럼 본문 바로 아래 왼쪽에 추천/점수/비추 묶음, 댓글 수, 공유 버튼을 한 줄로 배치했다.
- 댓글 하단은 더보기, 답글 달기, 추천 수, 비추 순으로 왼쪽부터 읽히도록 정렬했다.
- 모바일과 PC 모두 동일한 정보 순서를 사용하며 PC에서는 760px 카드 폭 안에서 같은 축을 유지한다.

## Focused region comparison evidence

- 게시글 액션은 40px 높이, 21px 라운드 투표 묶음, 9px 간격을 사용한다.
- 추천·비추는 상호 배타적으로 동작하고 점수는 추천 시 +1, 비추 시 -1로 즉시 반영된다.
- 댓글 수와 댓글 아이콘은 사용자 지시에 따라 `#238fe3` 블루로 표시한다.
- 댓글 아이콘을 누르면 댓글 영역으로 이동하고 입력창에 포커스된다.
- 댓글별 추천·비추도 상호 배타적 선택 상태와 한국어 접근성 이름을 제공한다.

## Required fidelity surfaces

- fonts/typography: 기존 Pretendard 계층 유지, 액션 수치는 14/20px 750으로 통과
- spacing/layout rhythm: 모바일 좌우 15px, PC 좌우 32px, 액션 버튼 40~42px로 통과
- colors/tokens: 추천 오렌지, 비추·댓글 블루, 흰 버튼·회색 외곽선으로 레딧형 상태 대비 통과
- image quality/assets: Notion에서 받은 벡터 4종을 로컬 정적 자산으로 저장, 깨진 이미지 0
- copy/accessibility: 추천·비추·댓글로 이동·공유·답글 달기 접근성 이름 통과

## Verification

- 모바일 추천 3→4, 비추 전환 4→2: passed
- 댓글 아이콘 이동 및 입력 포커스: passed
- 모바일 가로 오버플로: 0
- PC 760px 카드 가로 오버플로: 0
- 모바일·PC 깨진 이미지: 0
- 모바일·PC 콘솔 오류·경고: 0

final result: passed

---

# Design QA · 판매자 아이콘·SNS 홍보 정보란 (2026-10-15)

- source assets: 사용자가 지정한 Notion 원본 10종(페이스북·유튜브·인스타그램·틱톡·이메일·전화·시계·공유·딜러·달력)
- implementation route: `?profile=dealer&shop=450554&emp=1&qf=guazi&category=서울오토갤러리`
- mobile viewport: 393 × 852 px
- desktop viewport: 1280 × 900 px
- state: 김태규 판매자 페이지, 소개 탭

## Pass 1 — passed

- 상단 공유는 새 아웃라인 SVG로 교체했고 18px 시각 크기를 기존 36px 버튼 안에 유지했다.
- 응답 시간·딜러 경력·소속 상사·전화·이메일에 역할별 원본 아이콘을 연결했다.
- 소개 정보 하단에 SNS 4종을 모바일 2열, PC 4열로 배치했다.
- SNS 아이콘은 색상 원본을 유지하고 34px 박스에 통일해 플랫폼 간 원본 크기 차이를 보정했다.
- 모바일과 PC에서 가로 넘침, 잘린 텍스트, 깨진 이미지가 없음을 확인했다.

## Required fidelity surfaces

- fonts/typography: 채널명 14/20px 700, 보조 설명 12/17px, 정보 행 14/21px 통과
- spacing/layout rhythm: 모바일 2열 10px 간격·60px 최소 높이, PC 4열 정렬 통과
- colors/tokens: 브랜드 SNS 색상 유지, 정보 아이콘은 검정 아웃라인과 0.78 농도로 조화
- image quality/assets: Notion에서 받은 SVG 10종을 로컬 정적 자산으로 사용, 원격 만료 링크 없음
- copy/content: 딜러 판매 소식·차량 영상·신규 매물·숏폼 영상의 목적을 각 채널에 명시

## Verification

- `npm run verify:qf`: passed
- 모바일 393 × 852 소개 탭: passed
- PC 1280 × 900 소개 탭: passed
- 키보드 접근 가능한 전화·이메일·SNS 링크: passed
- P0/P1/P2 findings: none

final result: passed

---

# Design QA · 치지직형 게시글 상세 PC·모바일 (2026-10-15)

> 2026-10-15 사용자 후속 요청으로 상세페이지 광고 배너는 모바일·PC 모두 제거했으며, 게시글 반응 영역 다음에 댓글 영역이 바로 이어진다.

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a128e5-de8a-78d0-9ed9-96cbde6a07c3/1f84abc6-973d-4383-89e0-5448c4df5fbb/1-1000018274.png`
- implementation: `public/community/naver-cafe-detail.html`
- implementation browser capture: `http://127.0.0.1:4174/community/naver-cafe-detail.html?id=2&v=detail-reference-v2-2`
- source pixels: 1080 × 2376; 393px 폭 기준 393 × 864.5 CSS px로 정규화
- implementation viewports: 모바일 393 × 864 CSS px, PC 1280 × 900 CSS px
- state: FC온라인 자유 게시글, 댓글 1개, 하단 댓글 입력창 기본 상태

## Full-view comparison evidence

- 모바일은 흰색 상단바, 녹색 게시판명, 제목·작성자, 본문 두 문단, 추천/비추천, 검정·금색 광고, 댓글 헤더, 클린봇, 스티커 댓글, 맨 위로, 고정 입력창 순서를 원본과 같은 한 화면 흐름으로 대조했다.
- 원본의 기기 상태바는 런타임 밖 요소라 제외하고 앱 UI만 393 × 864 뷰포트에서 비교했다.
- 최종 모바일 화면은 문서 가로 넘침이 없고 `맨 위로`가 y=727–789, 고정 입력창이 y=798–864에 배치되어 원본과 같은 첫 화면 노출 관계를 유지한다.
- PC는 1280 × 900에서 760px 중앙 카드형 본문으로 확장했고 광고·댓글·고정 입력창이 동일 축을 공유하며 가로 넘침이 없다.

## Focused region comparison evidence

- 상단바는 닫기·FC온라인·북마크·더보기 순서로 구성하고 실제 SVG 아이콘을 사용했다.
- 게시글은 15px 모바일 시작축, 21/29px 제목, 40px 프로필, 16/25px 본문 위계를 적용했다.
- 광고는 393 × 82 모바일, 760 × 118 PC 비율로 배치했고 별도 생성한 검정·금색 자동차 배너를 사용했다.
- 댓글은 34px 원형 새로고침/정렬, 46px 클린봇, 파란 멘션 토큰, 보라색 캐릭터 스티커, 외곽형 추천/비추 버튼으로 구성했다.
- 하단 입력창은 사진·표정·비밀댓글·전송 SVG를 포함하며 모바일 393px, PC 760px에서 각각 콘텐츠 폭과 정렬된다.

## Comparison history

### Pass 1 — needs density correction

- P1: 첫 모바일 구현에서 댓글 카드가 265px로 길어 `맨 위로` 버튼이 첫 화면 아래로 밀렸다.
- P2: 58px 상단바와 넓은 본문/추천 여백 때문에 원본보다 세로 밀도가 느슨했다.

### Pass 2 — passed

- 상단바를 50px로, 본문과 추천 영역의 수직 간격을 압축하고 댓글을 190px 단일 행형으로 조정했다.
- 최종 393 × 864 화면에서 광고·댓글·스티커·맨 위로·고정 입력창이 모두 원본과 같은 한 화면 흐름에 들어왔다.
- 768px 이상에서는 여백과 타이포를 다시 확장하는 PC 전용 규칙을 추가해 모바일 압축이 데스크톱 가독성에 영향을 주지 않도록 했다.

## Required fidelity surfaces

- fonts/typography: 모바일 21px 제목·16px 본문·14–15px 댓글, PC 26px 제목·17px 본문 통과
- spacing/layout rhythm: 모바일 15px 축과 393px 고정 입력창, PC 32px 축과 760px 중앙 콘텐츠 통과
- colors/tokens: 녹색 게시판/클린봇, 회색 메타·입력창, 검정 본문, 파란 멘션 통과
- image quality/assets: 786 × 164 광고와 224 × 192 투명 댓글 스티커, SVG UI 아이콘 로딩 통과
- copy/content: 기존 보배드림 게시글·작성자·조회·댓글 데이터를 유지하고 치지직 상세 위계로 표시

## Interaction verification

- 북마크 활성화: passed
- 댓글 정렬 메뉴 및 최신순 전환: passed
- 게시글 추천 수 5 → 6: passed
- 댓글 입력 후 전송 활성화 및 댓글 수 1 → 2: passed
- 맨 위로 이동: passed
- 콘솔 오류/경고: 0건
- 모바일/PC 가로 넘침: 없음
final result: passed

---

# Design QA · 커뮤니티 전체 이모지 선택기 (2026-10-15)

- source visual truth: 기존 `naver-write-parity.html` 도구 바텀시트의 헤더·버튼·Airbnb 핑크 토큰
- implementation screenshot: `artifacts/community-write-attachment-parity-1015/mobile-384-emoji-picker.png`
- viewport: 384 × 844 CSS px, DPR 1
- state: 등록폼에서 스티커 도구를 열고 기본 `표정` 카테고리를 표시

## Full-view comparison evidence

- 기존 바텀시트의 56px 헤더, 흰 배경, 하단 취소·추가 버튼을 유지했다.
- 12개 고정 목록을 검색·카테고리·피부색·스크롤 그리드로 확장하되 등록폼의 다른 도구 위치는 바꾸지 않았다.
- 화면 높이는 모바일 88vh 안에서 유지되고 본문은 바텀시트 뒤로 가려져 편집 상태가 보존된다.

## Focused region comparison evidence

- 검색창 44px, 카테고리 탭 54px, 피부색 버튼 31px, 이모지 7열로 터치 밀도와 탐색성을 맞췄다.
- 선택·포커스에는 기존 `--primary`와 `--primary-soft`를 사용했다.
- 카테고리 이름을 아이콘 아래에 같이 표시해 아이콘 의미를 추측하지 않아도 된다.
- 기본 1,867개를 한꺼번에 DOM에 넣지 않고 카테고리별로 렌더링해 모바일 스크롤을 유지했다.

## Verification

- 384px에서 가로 넘침 없음.
- 영문 검색, 한글 카테고리 검색, 피부색, 최근 사용, 본문 삽입 통과.
- 키보드 포커스와 스크린리더용 버튼 이름 제공.
- 런타임 오류 0건.
final result: passed

---

# Design QA · 유튜브 헤더·프로필 축 정밀 조정 (2026-10-15)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/f53ec7ce-b4f4-4ca5-b5ae-dce638bdddbc/1-1000018254.jpg`
- implementation screenshot: Codex IAB capture `dealer-youtube-header-avatar-spacing-2026-10-15`
- source normalization: 591px 원본을 394 CSS px 기준으로 대조
- implementation viewport: 394 × 852 CSS px

## Focused comparison evidence

- 모바일 앱 헤더를 50px로 맞추고 배너의 상단 여백을 제거해 유튜브 원본처럼 헤더 바로 아래에서 시작하게 했다.
- 배너는 x=16px, y=50px, 351.2 × 100px으로 측정됐다.
- 프로필 사진은 x=16px, y=164px, 72 × 72px이며 배너 하단과 14px 간격이다.
- 판매자명은 x=108px, y=164px에서 시작해 프로필 사진의 상단축과 정확히 일치한다.
- 프로필 사진과 판매자명 사이 간격은 20px으로 유튜브 원본의 정규화 치수와 일치한다.

## Verification

- 모바일 가로 넘침 0px.
- 헤더·배너·프로필 사진·판매자명 DOM 실측 통과.
- PC 헤더 64px 규격과 데스크톱 프로필 레이아웃은 유지.
- `npm run verify:qf`: passed.
- P0/P1/P2 findings: none.

final result: passed

---

# Design QA · 게시물 등록 본문 포커스 선·게시판·말머리·투표 (2026-10-15)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0fe77-a06f-7a82-91f7-7cb79bab19bf/d89e79e2-5c6c-4318-a35d-bc6b28e9988d/1-1000018270.jpg`
- implementation screenshot: `C:/Users/bobae/codex-worktrees/community-write-parity-1015/artifacts/community-write-attachment-parity-1015/mobile-384-focus-boundary.png`
- additional implementation evidence: `mobile-384-board-select.png`, `mobile-384-head-select.png`, `mobile-384-poll-dialog.png`
- viewport: 384 × 844 CSS px, DPR 1
- source pixels: 591 × 1280 px; implementation pixels: 384 × 844 px
- normalization: source was inspected at its native device screenshot size; the content boundary was compared by matching the mobile authoring state rather than browser chrome.
- state: attached image, caption, focused editor body, tag boundary; board/head selectors and filled poll sheet.

## Full-view comparison evidence

- Source showed a 2px primary-color line spanning the full editor width immediately above the tag field.
- Revised implementation shows only the neutral 1px content/tag separator; no primary-color editor outline is visible.
- The board and headword selectors share the original 49px taxonomy row, so the title, toolbar, editor and tag positions do not shift.
- The poll authoring sheet fits within 384px and keeps the primary action visible without horizontal overflow.

## Focused region comparison evidence

- The editor-bottom/tag-top boundary was compared directly. The accidental focus outline is absent after the selector change.
- The selected-photo state was checked separately: its intended primary-color selection border and caption focus border remain visible.
- Board, headword and poll sheets were reviewed at 384px for close controls, radio affordances, field spacing and bottom action visibility.

## Comparison history

- P1 before: the generic `[contenteditable]:focus-visible` rule overrode `.editor-body{outline:none}`, creating the full-width pink line in long mobile posts.
- Fix: exclude `.editor-body` from the global focus-outline selector while retaining focus outlines on buttons, form controls and nested editable captions.
- Post-fix evidence: `mobile-384-focus-boundary.png` shows no primary-colored line; automated computed-style checks pass on desktop and mobile.

## Required fidelity surfaces

- fonts/typography: existing system font, 14–17px hierarchy and label weights are unchanged; poll question and option hierarchy is legible.
- spacing/layout rhythm: original 49px taxonomy row and downstream y positions are preserved; sheets use the existing 16–20px dialog rhythm.
- colors/tokens: primary `#ff385c`, neutral borders and disabled states continue to use existing tokens.
- image quality/assets: existing verified toolbar icons and test imagery remain intact; broken image count is zero.
- copy/content: Naver sample boards were replaced with Bobaedream boards; board-specific headwords and poll settings use Korean service copy.

## Verification

- `community:verify:write-tools`: 21 features passed on 1536px and 384px.
- `community:verify:attachments`: 23 scenarios passed on desktop and mobile.
- `community:verify:write-parity`: five viewports passed.
- horizontal overflow: 0; runtime errors: 0; broken images: 0.
- P0/P1/P2 findings: none after correction.

final result: passed

---

# Design QA · 치지직형 게시글 상세 (2026-10-15)

- source visual truth: `https://m.game.naver.com/lounge/FIFA_ONLINE4/board/detail/8125137`
- implementation screenshot: CUA 브라우저 캡처 `http://localhost:4173/community/naver-cafe-detail.html?id=2&v=detail-qa3`
- source capture: CUA 브라우저 캡처 `https://m.game.naver.com/lounge/FIFA_ONLINE4/board/detail/8125137`
- source and implementation pixels: 390 × 844 px
- CSS viewport: 390 × 844, 동일 브라우저·동일 밀도
- state: 모바일 기본 상세, 댓글 입력 닫힘, 등록순

## Full-view comparison evidence

- 같은 도구 호출에서 원본과 구현 이미지를 390 × 844로 함께 열어 상단부터 댓글 진입부까지 대조했다.
- 48px 검정 고정 헤더, 15px 좌우 시작축, 게시판 링크, 18/24px 제목, 38px 프로필, 본문 16/24px, 우측 버프·너프, 작성자 최신 글 카드, 댓글 영역 순서를 맞췄다.
- 무사진 게시글 기준 원본 댓글 시작점은 약 635px, 구현은 약 617px이며 콘텐츠 길이 차이를 고려하면 동일한 정보 밀도다.
- 사진이 있는 보배드림 게시글은 본문 흐름 안에서 원본 비율을 유지해 표시하는 제품 데이터 차이로 분류했다.

## Focused region comparison evidence

- 댓글 영역을 별도로 확인해 15px 댓글 제목, 48px 입력 필드, 클린봇 안내, 30px 아바타, 작성자·레벨·본문·날짜·답글·버프/너프의 위계를 대조했다.
- 정렬 메뉴는 원본과 같이 우측 드롭다운으로 열리며 등록순·인기순·최신순이 동작한다.
- 댓글 입력을 펼쳐 텍스트를 등록한 뒤 댓글 수가 8에서 9로 증가하는 것을 확인했다.

## Comparison history

- Pass 1 P1: 기존 상세는 붉은 헤더, 광고, 대형 24px 제목, 하단 고정 메뉴, 카드형 인기글로 치지직 상세 구조와 달랐다.
- fix: 상세 전용 구조를 검정 헤더·본문·반응·작성자 최신 글·댓글·관련 목록 순으로 재구성하고 모바일 치수를 원본 측정값에 맞췄다.
- Pass 2: 동일 크기 원본/구현 비교에서 actionable P0/P1/P2 없음.

## Required fidelity surfaces

- fonts/typography: 제목 18/24px, 본문 16/24px, 댓글 제목 15/20px과 보조 텍스트 위계 통과
- spacing/layout rhythm: 48px 헤더, 15px 좌우 여백, 38px 프로필, 8px 섹션 구분, 댓글 밀도 통과
- colors/tokens: 헤더 `#202124`, 게시판/강조 `#4e41db`, 멘션 `#238fe3`, 본문 `#222` 통과
- image quality/assets: 기존 보배드림 원본 썸네일·아바타와 저장된 실제 SVG 아이콘 사용, 늘어짐 없음
- copy/content: 보배드림 게시글·작성자·조회·댓글 데이터를 유지하고 치지직형 정보 구조만 적용

## Verification

- 모바일 390 × 844 확인
- 버프·너프 상태 전환 확인
- 댓글 입력·등록, 댓글 수 증가 확인
- 등록순·인기순·최신순 정렬 확인
- 콘솔 오류: 0건

final result: passed

---

# Design QA · 김태규 딜러 초톳형 프로필 정리 (2026-10-15)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/8cdec0e6-56e0-42be-bc3d-9c6f5ad7d870/1-1000018278.jpg`
- official business source: `https://www.carku.kr/info/sangsa-info.html?wShopNo=450554`
- official dealer source: `https://www.carku.kr/info/dealer-info.html?wShopNo=450554&wEmpNo=1`
- implementation screenshot: Codex IAB capture `dealer-kim-taegyu-premium-mobile-2026-10-15`
- source pixels: 591 × 1280 px, 393 CSS px 기준으로 정규화
- implementation: 394 × 852 CSS px, 모바일 판매차량 탭·판매중 선택

## Full-view comparison evidence

- 초톳 참고 화면처럼 판매자명 아래에 평점·별점·평가 수를 배치하고, 주소 줄에 섞여 있던 리뷰 요소를 분리했다.
- 헤더 하단 그림자를 제거해 앱 바와 커버 사이의 불필요한 구분선을 없앴다.
- 상단 탭의 `판매차량`과 본문 제목 `판매차량 24`가 중복되던 구조에서 본문 제목을 제거했다.
- 커버에는 실제 소속 상사 `(주)투제이모터웍스`를 유리 패널형 명판으로 표시하고 서울오토갤러리 건물 사진을 어두운 남색·샴페인 톤으로 정리했다.

## Focused region comparison evidence

- 판매자명 `김태규`, 소속 상사, 서울SAG, 판매중 수가 프로필 사진 오른쪽의 네 줄 안에서 읽힌다.
- 공식 등록 사진을 기반으로 얼굴 정체성을 유지한 정장·쇼룸 프로필 보정본을 76px 원형 슬롯에 적용했다.
- 공유·팔로우는 36px 흰 외곽 버튼으로 유지하고, 평점 행 바로 아래에 배치했다.
- 공식 주소는 `서울특별시 서초구 양재대로11길 36 은관 421호 (양재동)`로 두 줄 허용해 잘림을 방지했다.

## Required fidelity surfaces

- fonts/typography: 판매자명 22/28px, 상사·단지 정보 13/18px, 평점 14px와 14px 별 아이콘을 확인했다.
- spacing/layout rhythm: 16px 커버 여백, 14px 사진-텍스트 간격, 10px 행동 버튼 간격을 확인했다.
- colors/tokens: `#222` 본문, `#2764af` 평가 링크, `#d8bd77` 커버 포인트, 남색 반투명 명판을 사용했다.
- image quality/assets: 공식 딜러 사진에서 생성한 1254 × 1254 보정 프로필과 2048 × 750 서울오토갤러리 커버를 사용했다.
- copy/content: 상사명, 대표자, 허가번호, 사업자번호, 전화, 팩스, 주소, 종사원번호, 소속 직원 수를 공식 등록 정보와 대조했다.

## Verification

- 모바일 394 × 852, PC 1280 × 720 확인.
- 모바일 가로 넘침 없음 (`scrollWidth = innerWidth = 394`).
- 중복 `판매차량` 본문 제목 0개, 실제 목록 카드 5개 초기 노출.
- 소개 탭에서 공식 상사·딜러 정보 전 항목 노출 확인.
- 콘솔 오류 0건.
- `npm run build`: passed.
- `npm run verify:qf`: passed.
- P0/P1/P2 findings: none after fixes.

final result: passed

---

# Design QA · 네이버 카페 게시글 목록 밀도 동일화 (2026-10-15)

- source visual truth: `https://m.cafe.naver.com/ca-fe/bimmerwerks?tc=section_home_my_cafe`
- source screenshot: `reports/naver-cafe-list-fidelity-1015/source-naver-393x852.png`
- implementation screenshot: `reports/naver-cafe-list-fidelity-1015/implementation-393x852.png`
- comparison sheet: `reports/naver-cafe-list-fidelity-1015/comparison-side-by-side.png`
- viewport: 393 × 852 CSS px
- state: 전체 게시글, 목록형, 초기 스크롤 위치

## Full-view comparison evidence

- 네이버 카페와 구현을 같은 393 × 852 기준으로 나란히 비교했다.
- 서비스 고유 상단 영역은 유지하고 게시글 목록의 행 높이, 좌우 여백, 이미지·댓글 슬롯과 글자 위계를 동일화했다.
- 구현 목록의 첫 행은 x=16px, 높이 86px이며 기준 화면과 동일하다.

## Focused region comparison evidence

- 제목 16/22px/400, 메타 14/19px/400으로 수정했다.
- 썸네일 60 × 60px, 댓글 배지 46 × 60px, 모서리 12px를 확인했다.
- 댓글 숫자 14/19px/600, 댓글 라벨 12/16px/400을 확인했다.
- 공지 행 55px, 공지 배지 38.5 × 22px, 글쓰기 버튼 54 × 54px을 확인했다.

## Comparison history

### Pass 1 — blocked

- P2: 제목이 15.5px, 메타가 13px, 댓글 라벨이 10.5px으로 기준보다 작았다.
- P2: 공지 행 49px·밝은 공지 배지·글쓰기 버튼 60px으로 기준 밀도와 달랐다.

### Pass 2 — passed

- 위 수치를 기준 화면에 맞춘 뒤 동일 뷰포트로 다시 캡처했다.
- 필터 전환, 보기방식 열기·닫기, 글쓰기 버튼 반응을 확인했다.
- 가로 넘침 없음, 깨진 이미지 없음, 콘솔 오류 0건.

## Required fidelity surfaces

- fonts/typography: 제목·메타·댓글 숫자와 라벨의 크기, 행높이, 굵기 통과
- spacing/layout rhythm: 목록 16px 시작축, 86px 행, 55px 공지 행 통과
- colors/tokens: 짙은 공지 배지, 연회색 댓글 배지, 본문·보조색 통과
- image quality/assets: 60px 썸네일의 비율과 12px 모서리 유지, 깨진 이미지 없음
- copy/content: 기존 보배드림 커뮤니티 데이터와 카테고리 구조 유지

## Verification

- `npm run verify`: passed
- `git diff --check`: passed
- 콘솔 오류: 0건

final result: passed

---

# Design QA · 판매자 실제 테스트 매물·탭 균형 (2026-10-15)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/8ea69c42-2ca7-461a-8800-147ccaade0e1/1-1000018260.jpg`
- secondary reference: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/8ea69c42-2ca7-461a-8800-147ccaade0e1/2-1000018256.jpg`
- implementation screenshot: `design-qa-dealer-tabs-mobile.jpg`
- side-by-side comparison: `design-qa-dealer-tabs-comparison.jpg`
- source images: 592 × 1280 px 계열 기기 캡처, 393 × 852 CSS px 기준으로 정규화
- implementation: 393 × 852 CSS px, DPR 1
- state: 판매차량 탭 선택, 실제 테스트 매물 24대 연결

## Full-view comparison evidence

- 유튜브식 흰 배경 프로필 구조와 첫차식 판매자 정보 탭 구조를 같은 비교 이미지에서 대조했다.
- 프로필의 판매중 수와 판매차량 제목·상태 탭이 모두 실제 테스트 데이터 24대를 표시한다.
- 판매 목록 첫 화면에 레인지로버, BMW M3, 타이칸 등 실제 테스트 카드가 노출된다.
- 모바일 393px과 PC 1440px에서 세 개의 주 탭이 콘텐츠 중앙축에 균등하게 자리 잡는다.

## Focused tab evidence

- 주 탭 높이 52px, 글자 14px, 항목 최대 너비 176px, 선택 밑줄 2px로 통일했다.
- 모바일은 좌우 16px, PC는 좌우 20px 여백을 두고 탭 묶음을 중앙 정렬했다.
- `판매차량`, `리뷰`, `소개`를 전환해 제목·콘텐츠가 정상 교체되는 것을 확인했다.
- BMW M3 카드를 열어 실제 `listing=13001` 상세 화면으로 연결되는 것을 확인했다.

## Comparison history

- 이전 P2: 강홍구 이름으로 필터된 7대만 보여 실제 테스트 재고를 대표하지 못했고, PC 탭 묶음이 왼쪽으로 치우쳤다.
- fix: 대표 판매자에 서울오토갤러리 테스트 재고 24대를 연결하고 탭 너비·중앙축을 반응형으로 다시 설정했다.
- post-fix evidence: 모바일/PC 캡처에서 실제 카드와 수량이 일치하고 주 탭의 좌우 시각 무게가 같다.

## Required fidelity surfaces

- fonts/typography: 탭 14/20px, 선택 700·비선택 500으로 정보 계층을 명확히 했다.
- spacing/layout rhythm: 52px 탭 높이와 2px 밑줄, 최대 176px 폭으로 모바일과 PC 리듬을 통일했다.
- colors/tokens: 흰 배경, `#222` 선택 텍스트, `#666` 비선택 텍스트, 기존 구분선 토큰을 유지했다.
- image quality/assets: 실제 테스트 매물 사진을 원본 비율로 사용했고 깨진 이미지가 없다.
- copy/content: 판매중 24대, 판매차량 24, 실제 차량명·가격·지역을 데이터와 동일하게 표시한다.

## Verification

- 모바일 393 × 852, PC 1440 × 1000 확인.
- 리뷰·소개 탭 전환 확인.
- BMW M3 상세 연결 확인.
- 콘솔 오류 0건.
- P0/P1/P2 findings: none after fixes.

final result: passed

---

# Design QA · 판매자 페이지 3탭 평면화 (2026-10-15)

- source visual truth (YouTube): `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/8ea69c42-2ca7-461a-8800-147ccaade0e1/1-1000018260.jpg`
- source visual truth (FirstCar): `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/8ea69c42-2ca7-461a-8800-147ccaade0e1/2-1000018256.jpg`
- implementation screenshot: `design-qa-dealer-tabs-mobile.jpg`
- comparison sheet: `design-qa-dealer-tabs-comparison.jpg`
- viewport: 393 × 852 CSS px, DPR 1
- state: `판매차량` 탭 선택, 판매중 목록

## Full-view comparison evidence

- 유튜브 채널 참고처럼 상단 프로필과 본문을 하나의 흰 바탕으로 연결했다.
- 프로필 아래에 첫차와 같은 수평 탭 구조를 배치하고 `판매차량 · 리뷰 · 소개`로 재구성했다.
- 탭 경계는 얇은 하단 선, 선택 상태는 3px 검정 밑줄로만 구분했다.
- 판매중·판매완료 필터와 실제 매물 링크는 기존 동작을 유지했다.

## Focused region comparison evidence

- 프로필 배너, 아바타, 판매자명, 3탭 스트립을 집중 비교했다.
- 유튜브의 평면 구조와 첫차의 선택 밑줄 언어를 어긋나지 않게 결합했다.
- 중고차 상품의 탐색 성격을 위해 아래 목록은 원본 크기 비율을 유지한 의도적 차이다.

## Required fidelity surfaces

- fonts/typography: 프로필명 22/28px, 탭 15px, 섹션 제목 20px의 계층을 확인했다.
- spacing/layout rhythm: 16px 모바일 여백, 54px 탭 높이, 선택 밑줄과 목록 시작점의 간격을 확인했다.
- colors/tokens: 상단과 본문 배경은 흰색, 본문은 `#222`, 구분선은 연한 회색으로 통일했다.
- image quality/assets: 기존 서울오토갤러리 배너·딜러 사진·실제 매물 사진을 재사용했고 표시 품질 저하가 없다.
- copy/content: `판매차량`, `리뷰`, `소개` 명칭과 판매자·주소·경력·응답 정보를 보존했다.

## Verification

- `판매차량` 기본 상태, `리뷰`, `소개` 탭 전환 확인.
- 모바일 393 × 852, PC 1440 × 1000 확인.
- 콘솔 오류 0건, 깨진 이미지 0건.
- P0/P1/P2 findings: none.

final result: passed

---

# 올드카 기아 브리사 공식 헤리티지 헤더 QA · 2026-10-12

- source visual truth: 기아 헤리티지 아카이브의 1974 브리사 대표 KV
- source page: `https://worldwide.kia.com/ko/brand/our-brand/heritage/vehicles/brisa`
- source asset: `https://worldwide.kia.com/ko/brand/our-brand/heritage/desktop/images/vehicle/brisa/kia-brandweb-movement-brisa-KV-1920x1080.webp`
- implementation: `http://127.0.0.1:4212/?qf=guazi&category=올드카&view=feed`
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- compared header size: 358 × 98px
- state: light theme, 정적 이미지 1장

## Findings

- Fonts and typography: Pretendard 제목 18/23·700, 설명 11/15·400. 설명은 `국내 유일 올드카ㆍ클래식카 쇼핑몰`로 정확히 표기한다.
- Spacing and layout rhythm: 기존 검증 슬롯 358×98, 좌우 16px, 8px 모서리를 유지한다.
- Image quality and asset fidelity: 기아 공식 1920×1080 브리사 대표 이미지를 수정 없이 사용한다.
- Color and contrast: 원본의 중성 회색 스튜디오 톤은 유지하고, 왼쪽 문구 영역에만 검정 그라데이션을 적용한다.
- Content hierarchy: 첫 줄은 `보배드림 올드카`와 `1974` / `기아 브리사` 2줄 표기를 나란히 두고, 브리사 이미지는 슬롯 폭의 24% 오른쪽으로 이동한다. 둘째 줄에 쇼핑몰 설명을 유지한다.

## Verification

- `npm run verify:qf`: passed
- `git diff --check`: passed
- 헤더 실측 358.4×98px, 이미지 1장, 버튼 0개
- 공식 이미지 1920×1080px 로드, 깨진 이미지 0
- 모바일 390×844 브라우저 렌더 확인, 콘솔 오류 0

final result: passed

---

# Design QA · 유튜브형 판매자 헤더 (2026-10-15)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/85756e7f-78bb-4563-8ce5-863efac3a1c0/1-1000018254.jpg`
- implementation screenshot: Codex IAB capture `dealer-youtube-header-mobile-2026-10-15`
- viewport: 393 × 852 CSS px, DPR 1
- state: 강홍구 딜러 판매자 페이지, 팔로잉 상태

## Full-view comparison evidence

- 모바일 상단을 64px 앱 바의 뒤로가기·검색·더보기 구조로 바꿔 유튜브 채널 헤더의 정보 밀도를 맞췄다.
- 배너를 좌우 16px, 12px 모서리로 배치하고 프로필 사진을 배너 밖으로 분리했다.
- 112px 원형 프로필 사진 오른쪽 첫 줄에 판매자명과 인증 배지를 배치했다.
- 평점·팔로워·응답률은 이름 아래, 지역·딜러 경력은 다음 줄, 공유·팔로우는 전체 폭 행동 영역으로 정리했다.
- PC 1440 × 1000에서 기존 보배드림 헤더와 5열 매물 레이아웃이 유지되는 것을 확인했다.

## Focused region comparison evidence

- 상단 앱 바와 프로필 블록을 집중 비교했다. 참고 화면의 44px 터치 영역, 배너 여백, 원형 프로필과 이름의 수평 관계를 구현했다.
- 원본 유튜브의 채널 고유 텍스트 대신 자동차 판매자에게 필요한 평점·팔로워·응답률을 유지한 것은 의도된 콘텐츠 차이다.

## Findings

- P0/P1/P2 findings: none.
- fonts/typography: Pretendard 24/32px 판매자명과 14/22px 보조 정보가 계층을 유지한다.
- spacing/layout rhythm: 16px 페이지 여백, 18px 프로필 열 간격, 46px 행동 버튼을 확인했다.
- colors/tokens: 흰 배경, `#222` 본문, `#f2f2f2` 팔로우 버튼으로 참고 화면의 중립 톤을 따른다.
- image quality/assets: 기존 서울오토갤러리 배너와 딜러 프로필 원본을 재사용하고 실제 SVG 아이콘만 사용했다.
- copy/content: 판매자명 `강홍구`, 위치, 경력, 팔로워, 평점 데이터를 보존했다.

## Interaction and browser verification

- 팔로우 → 팔로잉 전환과 팔로워 426 → 427 갱신 확인.
- 모바일·PC 브라우저 렌더 확인.
- 콘솔 오류 0건.

final result: passed

---

# Design QA · 초톳형 딜러 판매자 페이지 (2026-10-15)

- source visual truth: `https://www.chotot.com/user/182c9bf8014956c591f7579852308956`
- source capture: Codex in-app Browser 현재 턴 원본 캡처(모바일 상단·판매중·판매완료·평가, PC 상단·5열 매물·평가)
- implementation screenshot: Codex in-app Browser 현재 턴 `http://127.0.0.1:4210/?profile=dealer&qf=guazi&category=서울오토갤러리` 캡처
- mobile viewport: 390 × 844 CSS px, DPR 1, source/implementation 동일
- desktop viewport: 1440 × 1000 CSS px, DPR 1
- state: 강홍구 딜러 샘플, 판매중 7대·판매완료 12대·평가 3개

## Full-view comparison evidence

- 모바일은 104px 2단 헤더, 146px 배너, 98px 원형 프로필 오버랩, 24/32px 판매자명, 32px 공유·팔로우 알약 버튼 순서를 원본과 맞췄다.
- 판매자 신뢰 정보는 평점·팔로워 → 응답률 → 지역 → 딜러 경력 순서로 정리했다.
- 모바일 매물은 원본처럼 128×170px 세로 썸네일과 우측 정보 열, PC는 1184px 카드 안 5열 그리드다.
- 판매중/판매완료 상태는 각각 이미지 카드와 텍스트 이력 카드로 분리했고, `소개 / 전체 매물 / 평가` 앵커를 매물과 평가 사이에 배치했다.
- PC는 기존 430px 모바일 고정 폭을 제거하고 원본처럼 전체 폭 헤더, 배너·프로필 카드, 5열 매물, 3열 평가 카드로 반응한다.

## Focused region comparison evidence

- 원본 모바일 측정: 판매자명 24/32px·700, 상태 칩 32px, 더보기 174×40px, 섹션 제목 18~20px, 썸네일 128×170px.
- 구현 모바일: 동일한 텍스트 위계·컨트롤 높이·썸네일 크기와 좌우 16~20px 시작축을 사용했다.
- 원본 PC 측정: 1184px 본문 카드와 5열 매물 구조. 구현도 1184px 컨테이너와 5개 동일 열을 사용했다.
- 초톳의 노란 브랜드 배너·로고는 복제하지 않고 서울오토갤러리 배너, 보배드림 로고, 기존 실차·딜러 자산으로 치환했다.

## Required fidelity surfaces

- Fonts and typography: Pretendard, 이름 24/32px·700, 섹션 20/28px·700, 카드 제목 14/21px, 가격 17/24px·700.
- Spacing and layout rhythm: 모바일 프로필 오버랩과 14~18px 정보 간격, PC 16px 카드 간격과 12px 바깥 카드 간격을 확인했다.
- Colors and visual tokens: 원본의 `#222`, `#F4F4F4`, `#E8E8E8`, 별 `#F8BA02`를 유지하고 브랜드 강조만 보배드림 남색으로 교체했다.
- Image quality and asset fidelity: 프로젝트의 서울오토갤러리 건물·실차·딜러 원본 이미지와 기존 SVG 아이콘만 사용했다. 깨진 이미지 0개를 확인했다.
- Copy and content: 원본의 정보 구조를 한국어 딜러 데이터로 치환했고, 실제 API 전 단계임을 알 수 있도록 샘플 수치와 리뷰를 일관되게 사용했다.

## Comparison history

- Pass 1 P1: 기존 구현은 5개 전환 탭과 모바일 430px 고정 폭이라 원본의 긴 페이지 흐름과 PC 5열 레이아웃이 달랐다.
- Fix: 3개 앵커 구역의 단일 페이지 구조와 모바일 행/PC 그리드 반응형을 새로 구성했다.
- Pass 2 P2: 새 상단의 보배드림·공통 아이콘 경로가 잘못되어 이미지가 깨졌다.
- Fix: 로고는 `assets/pc-detail`, 공통 아이콘은 `/icons/chotot`의 실제 로컬 자산 경로로 교정했다.
- Pass 3 P2: 모바일에서 응답률 행이 빠지고 프로필 하단 공백이 원본보다 컸다.
- Fix: 응답률을 독립 행으로 추가하고 고정 최소 높이를 제거해 원본의 세로 리듬에 맞췄다.
- Post-fix evidence: 390×844 원본/구현 동시 캡처에서 이름·버튼·평점·응답률·지역·경력·첫 매물 시작 위치를 비교했고 P0/P1/P2 잔여 항목이 없다.

## Interaction and verification

- 판매중 ↔ 판매완료 전환: passed
- 매물 더보기: 5대 → 7대 확장, passed
- 관심 매물 선택 상태: `aria-pressed=true`, passed
- 팔로우: 팔로우 → 팔로잉, passed
- 평가 앵커 이동: passed
- 평가 전체/구매자/판매자 필터: passed
- 신규 브라우저 탭 콘솔 오류: 0
- `npm run build`: passed
- `git diff --check`: passed

## Follow-up polish

- P3: 원본의 노란 초톳 그래픽과 수치는 타사 브랜드 자산이므로 의도적으로 보배드림·서울오토갤러리 자산과 샘플 데이터로 대체했다.

final result: passed

---

# Design QA · 초톳형 2열 시작축 정렬 (2026-10-14)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/80a25fd3-79ac-4b04-adf3-38296c86922d/1-1000018248.jpg`
- source pixels: 591 × 1280 JPEG
- implementation screenshot: Codex in-app Browser의 이번 턴 차량 히스토리 집중 캡처(도구 출력)
- implementation route: `http://127.0.0.1:4210/?qf=guazi&category=서울오토갤러리&facts=icons` → BMW M3 첫 매물 → 히스토리
- viewport: 390 × 844 CSS px, 브라우저 스테이지 자동 배율
- state: 차량 히스토리 `출고·유통 정보`, 아이콘 핵심정보 격자는 변경하지 않음

## Full-view comparison evidence

- 참고 화면은 왼쪽 열과 화면 가운데에서 시작하는 오른쪽 열, 두 개의 왼쪽 정렬 시작축을 사용한다.
- 구현도 항목을 왼쪽 열에서, 값을 50% 지점의 오른쪽 열에서 시작하도록 복원했다.
- 이전의 가운데축·우측끝 정렬은 참고 화면과 달라 제거했다.

## Focused region comparison evidence

- `생산 공장` 시작점과 `BMW 뮌헨 공장` 시작점이 각각 첫 열과 두 번째 열의 고정 시작축에 놓인다.
- 런타임 계산값: 두 텍스트 모두 `text-align:left`, `font-size:14px`; 같은 열의 `출고일`, `출고가격`도 동일 시작점을 유지한다.
- 브라우저 집중 캡처에서 행 구분선, 50:50 열, 14px 정보 밀도를 확인했다.

## Required fidelity surfaces

- Fonts and typography: Pretendard 유지, 좌·우 열 모두 14/20px; 값 500 weight.
- Spacing and layout rhythm: 50:50 열, 첫 열 좌측 시작축과 둘째 열 가운데 시작축, 44px 행과 1px 구분선 유지.
- Colors and visual tokens: 항목 `#767676`, 값 `#222`, 선 `#E5E5E5` 유지.
- Image quality and asset fidelity: 이 행형 영역은 이미지 자산이 없으며 아이콘 격자 자산을 변경하지 않았다.
- Copy and content: `생산 공장 / BMW 뮌헨 공장`을 포함한 모든 차량 히스토리 문구와 순서를 보존했다.

## Comparison history

- 이전 P1: 항목명이 가운데 경계에 끝나고 값이 카드 우측 끝에 붙어 초톳의 두 시작축과 반대로 보였다.
- 수정: 모든 비격자 2열 행에서 항목과 값을 각 열의 왼쪽 시작점에 맞췄다.
- 수정 후 근거: 브라우저에서 `생산 공장`과 `BMW 뮌헨 공장`의 두 시작축, 동일 14px 크기, 콘솔 오류 0건을 확인했다.

## Verification

- `npm run verify:qf`: passed
- `git diff --check`: passed
- 주요 행의 계산 스타일과 시작점 확인
- PC 차량 정보도 항목 x=121, 값 x=361의 두 시작축과 `text-align:left`를 확인
- 콘솔 오류 0

final result: passed

---

# Design QA · PC 차량 정보 우측 정렬·밀도 조정 (2026-10-14)

- source visual truth: 직전 승인된 모바일 차량 정보의 14px 정보 밀도와 사용자 결정 「우측으로 텍스트 정렬 하고 정보 텍스트들 줄여라」, 「PC 버전도」
- supporting source: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/a02f62c6-044c-47d3-ae5c-e6ea40a778ad/4-1000018218.jpg`
- implementation screenshot: Codex in-app Browser tab 64 capture (tool output)
- implementation route: `http://127.0.0.1:5173/?qf=guazi&category=서울오토갤러리&facts=icons&pc=1` → 첫 매물 상세 → 차량 정보 펼침
- viewport: 1440 × 1000 CSS px, DPR 1
- state: PC 차량 상세, 차량 정보 펼침

## Comparison evidence

- 모바일에서 승인한 항목/값 위계를 PC의 216px 라벨 열과 가변 값 열에 맞춰 반응형으로 옮겼다.
- 값은 오른쪽 끝선에 정렬되고, 긴 색상·치수 값도 행 밖으로 넘치지 않는다.
- 14px/20px 정보 텍스트, 40px 행 높이, 24px 열 간격으로 전체 제원을 펼쳐도 지나치게 성기지 않다.

## Required fidelity surfaces

- Fonts and typography: Pretendard 유지, 항목·값 14/20px, 값 500 weight.
- Spacing and layout rhythm: 라벨 216px, 열 간격 24px, 행 높이 40px, 기존 1px 구분선 유지.
- Colors and visual tokens: 항목 `#767676`, 값 `#222`, 구분선 `#F1F1F1`.
- Image quality and asset fidelity: 기존 20px 차량 정보 아이콘 자산을 변경하지 않았다.
- Copy and content: PC 차량 정보의 기존 항목과 값, 펼침/접기 동작을 모두 보존했다.

## Verification

- 계산 스타일: `font-size: 14px`, `line-height: 20px`, `text-align: right`, `min-height: 40px`.
- 1440px 뷰포트에서 문서 가로 오버플로 0.
- 차량 정보 펼침 동작 확인, 콘솔 오류 0.
- `npm run verify:qf`: passed.

final result: passed

---

# Design QA · 차량 정보 에어비앤비형 모두 보기 박스 (2026-10-14)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/041e5e66-4282-4ca5-a4b4-2096bc91601c/3-1000018235.jpg`
- supporting source: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/041e5e66-4282-4ca5-a4b4-2096bc91601c/1-1000018239.jpg`, `2-1000018237.jpg`
- implementation screenshot: Codex in-app Browser tab 24 capture (tool output)
- implementation route: `http://127.0.0.1:5173/?qf=guazi&category=서울오토갤러리&facts=icons` → BMW M3 첫 매물 상세
- viewport: 393 × 852 CSS px, DPR 1
- source pixels: 591 × 1280px; focused component comparison으로 기기 크롬과 하단 예약 바는 제외
- state: 차량 정보 8개 접힘 / 28개 전체 정보 펼침 / 접힘 복귀

## Full-view comparison evidence

- 차량 정보 카드의 8개 핵심 정보는 기존 2열 격자와 아이콘 비율을 유지했다.
- 카드 하단 행동만 에어비앤비의 편의시설·후기 `모두 보기` 버튼처럼 전체 폭 연회색 박스로 분리했다.
- 버튼은 카드 안쪽 좌우 12px 흐름에 맞고 하단 고정 상담 바에 가리지 않는다.

## Focused region comparison evidence

- 버튼 높이 52px, 모서리 12px, 배경 `#F2F2F2`, 본문 `#222`, 16/24px·600으로 측정·구현했다.
- 문구는 `차량 정보 28개 모두 보기`로 대상을 먼저 밝히고, 에어비앤비처럼 별도 화살표 없이 단일 행동으로 정리했다.
- 펼친 상태는 `차량 정보 접기`로 동일 위치와 스타일을 유지하며, 접으면 기존 8개 격자로 정확히 복귀한다.

## Findings

- P0/P1/P2 findings: none.
- Fonts and typography: 기존 Pretendard와 차량 정보 제목·라벨·값 위계는 변경하지 않았고 버튼만 16/24·600으로 명확히 했다.
- Spacing and layout rhythm: 핵심 격자 아래 16px 간격, 버튼 내부 12px 세로 패딩, 12px 모서리로 에어비앤비의 넓은 행동 박스 리듬을 반영했다.
- Colors and visual tokens: 흰 카드와 외부 회색 스택 사이에서 버튼이 묻히지 않도록 카드 내부에만 `#F2F2F2`를 사용했다.
- Image quality and asset fidelity: 기존 차량 정보 아이콘 원본과 광학 보정값을 그대로 유지했다. 새 이미지 자산은 없다.
- Copy and content: 기존 28개 전체 제원과 8개 핵심 정보는 보존하고 더보기 문구만 목적 중심으로 바꿨다.

## Interaction and verification

- `차량 정보 28개 모두 보기` 클릭 → 그룹형 전체 제원 표시 확인.
- `차량 정보 접기` 클릭 → 8개 핵심 격자 복귀 확인.
- 모바일 393×852 가로 오버플로 없음, 콘솔 오류 0.
- `npm run verify:qf`: passed.

final result: passed

---

# Design QA · 차량 히스토리 건수 링크 (2026-10-14)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/cb601674-78d6-4f91-b3d6-fd390eae26b3/1-1000018232.jpg`
- implementation screenshot: Codex in-app browser tab 18 capture (tool output)
- viewport: 384 × 820 CSS px
- source pixels: 592 × 1280 px; focused region comparison으로 기기 크롬과 전체 화면 배율은 제외
- state: BMW M3 상세 → 히스토리 → 이력·권리 정보

## Comparison evidence

- `수리이력 1건`, `사고이력 0건`을 기존 값과 동일한 16px/22px, 500 weight, `#222`로 유지했다.
- 참고 화면처럼 값에만 1px 밑줄과 3px 오프셋을 적용했다.
- 두 링크는 모두 차량번호를 포함한 통합 이력조회 경로로 연결된다.
- 기존 44px 행 높이, 50:50 열, 회색 구분선과 그룹 간격은 변하지 않았다.

## Required fidelity surfaces

- fonts/typography: 기존 차량 히스토리 값 토큰 상속, 차이 없음.
- spacing/layout rhythm: 기존 행·열·구분선 유지.
- colors/tokens: 브라우저 기본 파랑을 차단하고 `#222` 상속.
- image quality/assets: 이미지·아이콘 변경 없음.
- copy/content: 수리 1건, 사고 0건으로 건수형 표기.

## Verification

- 히스토리 탭 이동 확인.
- 두 링크의 밑줄, 색상, 이력조회 URL 확인.
- 키보드 초점 스타일 포함.
- 콘솔 오류 0.
- P0/P1/P2 findings: none.

final result: passed

---

# Design QA · 차량 히스토리 초톳 행 구조 (2026-10-14)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/9694c755-6097-4361-9ba1-55dff93bb383/1-1000018216.jpg`
- source pixels: 592 × 1280 JPEG
- implementation screenshot: Codex in-app Browser의 384 × 844 인라인 캡처
- implementation route: `http://127.0.0.1:4210/?qf=guazi&category=서울오토갤러리&facts=icons` → BMW M3 첫 매물 → 히스토리
- viewport / CSS size / density: 384 × 844 / 384 × 844 CSS px / DPR 1
- state: 차량 정보는 기존 2열 아이콘 격자 유지, 차량 히스토리 탭 선택

## Full-view comparison evidence

- 초톳의 흰 카드 안 세로 목록 구조와 구현의 차량 히스토리 카드를 비교했다.
- 구현은 인접한 A/S 정보와 판매 정보 카드의 구조를 변경하지 않고 히스토리 카드에만 행 규칙을 적용했다.

## Focused region comparison evidence

- 각 행은 172px / 172px의 동일한 두 열이며 항목과 값 모두 왼쪽 정렬이다.
- 네 행 모두 높이 44px이고, 행 사이에만 `#E5E5E5` 1px 구분선을 둔다.
- 마지막 행 아래 구분선은 제거해 초톳 카드의 끝 처리를 따른다.

## Findings

- P0/P1/P2 findings: none after correction.
- Fonts and typography: 기존 Pretendard와 히스토리 라벨·값 위계는 유지했다.
- Spacing and layout rhythm: 50% / 50% 열, 44px 행 높이, 공통 좌측 시작선을 확인했다.
- Colors and visual tokens: 초톳의 옅은 회색 행 구분선에 맞춰 `#E5E5E5`를 사용했다.
- Image quality and asset fidelity: 이 영역에는 이미지 자산이 없으며 기존 차량 정보 아이콘은 변경하지 않았다.
- Copy and content: 출고일, 생산 국가, 정식/직수입 여부, 구입 딜러와 각 값은 그대로 유지했다.

## Comparison history

- 이전 P2: 값이 각 셀 중앙에 정렬되어 문자열 길이에 따라 시작점이 달랐고 행 구분선이 없었다.
- 수정: 열을 50% / 50%로 고정하고 값을 좌측 정렬했으며 행 사이에 1px 선을 추가했다.
- 수정 후 근거: 런타임 계산값에서 모든 행 `172px 172px`, `text-align:left`, `min-height:44px`를 확인했다.

## Verification

- `npm run verify:qf`: passed
- 깨진 이미지 0, 콘솔 오류 0
- 차량 정보 2열 아이콘 격자 보존

final result: passed

---

# Design QA · 상세 하트·판매자 리뷰 재정렬 (2026-10-14)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/9745c5c0-e284-4109-b52c-d87c9006da14/1-1000018198.jpg`
- implementation: `reports/detail-heart-review-2026-10-14/after.png`
- route: `/?qf=guazi&category=서울오토갤러리&facts=icons` → BMW M3 첫 매물 상세
- viewport: 384 × 844 CSS px, DPR 1

## Focused comparison

- 저장 버튼: 초톳 정규화 기준 88×48px 캡슐, 우측 24px, 사진 아래 12px. 구현 88×48px, 우측 24px, 사진 아래 12px.
- 저장 아이콘/문구: 24px 하트 + 15/20px 600 `저장`, 간격 6px.
- 리뷰 열: x=274px, 폭 94px, 높이 64px, 좌측 1px `#e8e8e8` 구분선.
- 평점: 22/28px 600, 별 18×18px, 후기 13/18px 밑줄.
- 판매자 글 높이가 바뀌어도 리뷰 열은 `align-self:flex-start`와 고정 높이로 독립 정렬된다.

## Findings

- P0/P1/P2 findings: none after correction.
- 제목 내용 차이에 따른 줄바꿈만 콘텐츠 차이로 허용했다.
- 가격 검정은 기존 제품 결정대로 유지했다.

## Verification

- `npm run verify:qf`: passed
- 384×844: 하트 캡슐과 리뷰 열 위치 통과
- 깨진 이미지 0, 콘솔 오류 0

final result: passed

---

# 차량 정보 배기량 아이콘 교체 QA · 2026-10-14

- source visual truth: `C:/Users/bobae/Downloads/notion-displacement-alpha.png`
- source page: `https://app.notion.com/p/35d45bdf6e4540c1890cc941f7b33604`
- implementation screenshot: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/notion-displacement-local.png`
- side-by-side comparison: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/comparison-notion-displacement.png`
- route: `/?qf=guazi&category=서울오토갤러리&facts=icons` → 첫 매물 상세
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- state: 차량 정보 8개 접힘 상태

## Findings

- P0/P1/P2 findings: none after the focused comparison.
- Notion에 첨부된 AutoUncle 배기량 아이콘의 24×24 투명 원본 렌더를 잘림·재채색 없이 적용했다.
- 기존 28px 아이콘 슬롯을 유지해 레이아웃과 텍스트 정렬은 변경하지 않았다.
- 배기량 렌더 박스는 28.08px, 마력은 27.58px로 시각 크기 차이가 1px 이내다.
- 타이포그래피·간격·카드 구조·복사는 변경하지 않았다.

## Verification

- 모바일 390×844 가로 오버플로 0
- 깨진 이미지 0, 콘솔 오류 0, 400 이상 네트워크 오류 0
- 기존 굵은 일반 엔진 아이콘을 노션 원본 배기량 아이콘으로 교체했다.

final result: passed

---

# 마력·배기량 24px 원본 크기 QA · 2026-10-14

- source visual truth: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/notion-displacement-public-89a0095.png`
- implementation screenshot: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/notion-engine-power-24px-local.png`
- focused before/after comparison: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/comparison-engine-power-28-vs-24.png`
- route: `/?qf=guazi&category=서울오토갤러리&facts=icons` → 첫 매물 상세
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- source and implementation: 390 × 844px, 밀도 변환 없음
- state: 차량 정보 8개 접힘 상태

## Findings

- P0/P1/P2 findings: none after the 24px correction.
- 기존 구현은 24px 래스터 원본을 28px로 확대해 마력·배기량의 선이 다른 아이콘보다 굵고 흐리게 보였다.
- 28px 정렬 박스는 유지하고 안쪽 원본만 24px로 렌더해 텍스트 시작선과 격자 구조를 그대로 보존했다.
- 수정 후 마력·배기량의 시각 무게가 연식·연료 아이콘과 비슷하고, 래스터 확대 흐림이 줄었다.
- 폰트·타이포그래피, 간격, 색상 토큰, 복사, 카드 구조는 변경하지 않았다.
- 원본 투명 이미지의 잘림·크롭·재채색은 없다.

## Comparison history

- 이전 P2: 24px 원본의 28px 확대로 선 두께와 안티앨리어싱이 강해짐.
- 수정: 두 아이콘에만 2px 내부 여백을 적용해 실제 원본을 24px로 렌더.
- 수정 후 근거: 좌측 28px 확대본과 우측 24px 원본 크기본의 집중 비교에서 두께·선명도가 개선됨.

## Verification

- 모바일 390×844 가로 오버플로 0
- 깨진 이미지 0, 콘솔 오류 0, 400 이상 네트워크 오류 0

final result: passed

---

# 마력·배기량 크기 복원·선 두께 광학 보정 QA · 2026-10-14

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/5eeae80b-1ea0-4479-9489-1e80688c1730/1-1000018191.jpg`
- previous full-size implementation: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/notion-displacement-public-89a0095.png`
- failed reduced-size implementation: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/notion-engine-power-24px-public-87b65a5.png`
- corrected implementation screenshot: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/notion-engine-power-optical-thin-local.png`
- focused three-pass comparison: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/comparison-engine-power-three-pass.png`
- route: `/?qf=guazi&category=서울오토갤러리&facts=icons` → 첫 매물 상세
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- source/implementation density: 구현 캡처 390 × 844px, 밀도 변환 없음
- state: 차량 정보 8개 접힘 상태

## Findings

- P0/P1/P2 findings: none after the optical-weight correction.
- 폰트·타이포그래피: 변경 없음. Pretendard, 라벨 14/20, 값 16/22·600을 유지했다.
- 간격·레이아웃: 마력·배기량을 다시 기존 28px 점유 크기로 복원해 다른 핵심 아이콘과 세로 비율을 맞춰다. 열·텍스트 시작선은 변경 없음.
- 색상·토큰: 래스터 원본의 서로 다른 회색을 차량 정보 기본색 `#222`로 통일했다.
- 이미지·아이콘 품질: 크기를 줄이지 않고 원본 알파에 `feMorphology erode 0.3` 광학 보정만 적용해 선 무게를 줄였다. 0.5px 시험은 세부 도형이 끊겨 폐기했다.
- 복사·콘텐츠: 변경 없음.

## Comparison history

- 이전 P1: 두께 문제를 24px 축소로 처리해 마력·배기량의 세로 크기와 정보 격자 밸런스가 깨짐.
- 수정: 2px 내부 여백을 제거해 기존 크기를 복원하고, 별도 알파 선 얇힘·`#222` 재채색을 적용.
- 수정 후 근거: 3단 비교의 오른쪽 최종본은 왼쪽 초기 28px본의 크기를 유지하면서, 중앙 24px 축소본의 작은 비율을 해소했다.

## Verification

- 모바일 390×844 가로 오버플로 0
- 깨진 이미지 0, 콘솔 오류 0, 400 이상 네트워크 오류 0

final result: passed

---

# 차량 정보 주행거리 아이콘 교체 QA · 2026-10-13

- source visual truth: Notion `09_주행거리 Mileage (km) (1)`의 `MileageOdometer.svg`
- implementation: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/17-mileage-notion-raw.png`
- route: `/?qf=guazi&category=서울오토갤러리&facts=icons` → 첫 번째 매물 상세
- viewport: 390 × 844 CSS px, deviceScaleFactor 1

## Findings

- 기존 도로형 아이콘을 노션에 등록된 오토스카우트24 숫자형 오도미터 원본 SVG로 교체했다.
- SVG path와 24×24 viewBox는 원본 그대로 유지했다.
- 28px 공통 아이콘 슬롯에서 실제 잉크가 가운데 정렬되며 연식·마력 아이콘과 시각 무게가 균형을 이룬다.
- 별도 path 수정이나 CSS 왜곡 없이 기존 광학 보정값을 유지했다.

## Verification

- 모바일 390×844 가로 오버플로 0
- 깨진 이미지 0, 콘솔 오류 0, 400 이상 네트워크 오류 0
- `git diff --check`: passed
- `npm run verify:qf`: passed

final result: passed

---

# 차량 정보 마력 아이콘 교체 QA · 2026-10-13

- source visual truth: Notion `마력` 페이지의 스웨덴 AutoUncle 원본 SVG와 AutoUncle 공식 상세 페이지의 동일 벡터 경로
- before: 속도계 모양의 일반 출력 아이콘
- after: 엔진 본체 안 번개를 넣은 AutoUncle 마력 아이콘
- implementation capture: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/15-autouncle-power-balanced.png`
- viewport: 390 × 844 CSS px, deviceScaleFactor 1

## Optical balance

- 원본 SVG 경로는 수정하지 않고 28px 공통 슬롯의 CSS transform만 보정했다.
- 마력 아이콘: `translate(0, 0.28px) scale(0.985)`
- 배기량 아이콘 렌더 박스: 28.08 × 28.08px
- 마력 아이콘 렌더 박스: 27.58 × 27.58px
- 두 아이콘의 시각 중심, 선 굵기, 검정 농도를 8개 차량정보 격자에서 함께 확인했다.

## Verification

- 모바일 390×844 가로 오버플로 0
- 깨진 이미지 0, 콘솔 오류 0, 400 이상 네트워크 오류 0
- 제조사·모델·연식·주행거리·출시가격·연료·배기량·마력 8개 슬롯 정렬 유지

final result: passed

---

# FINN 제조사 아이콘 교체 QA · 2026-10-13

- source URL: `https://www.finn.no/mobility/item/476214749`
- source asset: FINN 상세 화면의 24×24 `Bil` SVG, `stroke-width: 1.5`
- implementation screenshot: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/11-finn-maker-icon.png`
- viewport: 390 × 844 CSS px

## Findings

- 제조사 아이콘을 기존 차량+검색 조합 아이콘에서 FINN 원본 정면 차량 아이콘으로 교체했다.
- SVG 원본의 24×24 뷰박스와 1.5px 스트로크를 유지했다.
- 기존 28px 점유 슬롯 안에서 다른 정보 아이콘과 같은 시각 면적이 되도록 `scale(0.860)`과 y축 `0.35px`만 광학 보정했다.
- 차량 정보 격자, 제조사 링크, 펼침 동작은 그대로 유지했다.
- 390px에서 깨진 이미지 0, 콘솔 오류 0, 가로 오버플로 0을 확인했다.

final result: passed

---

# 차량 설명 더 보기 QA · 2026-10-13

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/9815eb3a-8d59-4681-9c95-25879fc9905c/2-1000018116.jpg`
- collapsed implementation: `C:/Users/bobae/Downloads/vehicle-intro-more-1013/01-collapsed.png`
- expanded implementation: `C:/Users/bobae/Downloads/vehicle-intro-more-1013/02-expanded.png`
- viewport: 390 × 844 CSS px

## Findings

- 설명은 3줄 말줄임으로 접고, 하단 행동 영역은 초톳처럼 전체 폭 48px·흰 바탕·`#d8d8d8` 1px 테두리·24px 알약 모서리로 분리했다.
- 접힌 상태의 마지막 줄 오른쪽 112px에는 초톳처럼 흰색 페이드와 1.2px 블러를 적용해 뒤 내용이 이어짐을 알린다.
- `더 보기`와 초톳 원본 아래 화살표를 한 묶음으로 정중앙에 배치하고 16/24, 600, `#222`를 적용했다.
- 펼치면 문장이 한 문단으로 자연스럽게 이어지고 `접기`와 위쪽 화살표로 전환된다.

## Verification

- 모바일 390×844 가로 오버플로 0
- 깨진 이미지 0, 콘솔 오류 0, 네트워크 오류 0

final result: passed

---

# 차량 정보 첫 행 간격·2열 균형 QA · 2026-10-13

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/70775948-7c3d-402b-a535-982778481cd1/1-1000018149.jpg`
- implementation: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/13-heading-gap-16.png`
- normalized side-by-side: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/14-reference-vs-gap16.png`
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- source pixels: 591 × 1280 → 390 × 844 normalized, implementation pixels: 390 × 844
- state: 차량 정보 아이콘 요약 접힘 상태

## Findings

- [P2 fixed] `차량 정보` 제목 하단부터 제조사·모델 셀 상단까지 31px로 벌어져 제목과 격자가 분리되어 보였다.
- Fix: 아이콘형 카드에만 제목 하단 패딩을 제거하고 격자 상단 여백을 2px로 조정해 실측 간격을 16px로 줄였다.
- Fonts and typography: Pretendard Variable, 제목 18/24·700, 라벨 14/20·400, 값 16/22·600을 유지했다.
- Spacing and layout rhythm: 2열 165px + 중앙 12px, 셀 가로 간격 10px, 행 간격 20px, 아이콘 중심과 42px 텍스트 묶음 중심을 유지했다.
- Colors and visual tokens: `#222` 값·아이콘, `#676767` 라벨, `#F2F2F2` 정보 더보기 버튼을 유지했다.
- Image quality and asset fidelity: 기존 보배드림 상세 아이콘 SVG와 광학 보정값을 그대로 사용했다. 참고 화면의 원형 배경은 초톳 슬롯 규칙과 다르므로 가져오지 않았다.
- Copy and content: 제조사·모델을 포함한 기존 8개 핵심정보와 `37개 정보 더보기` 문구를 유지했다.

## Comparison history

- Before: 제목→첫 셀 31px, 카드 높이 375px.
- After: 제목→첫 셀 16px, 카드 높이 360px.
- Post-fix evidence: 두 열 시작선과 아이콘·라벨·값 중심선이 유지되고 카드 상단의 불필요한 공백만 15px 감소했다.

## Verification

- 모바일 390 × 844 가로 오버플로 0.
- 깨진 이미지 0, 콘솔 오류 0, 400 이상 네트워크 오류 0.
- `37개 정보 더보기` 펼침·복귀 동작 정상.

final result: passed

---

# 차량 소개 에어비앤비형 더보기 QA · 2026-10-13

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/9815eb3a-8d59-4681-9c95-25879fc9905c/2-1000018116.jpg`
- implementation collapsed: `C:/Users/bobae/Downloads/vehicle-intro-more-1013/01-collapsed.png`
- implementation expanded: `C:/Users/bobae/Downloads/vehicle-intro-more-1013/02-expanded.png`
- route: `/?qf=guazi&category=서울오토갤러리&facts=icons` → 첫 번째 매물 상세
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- source pixels: 591 × 1280, implementation pixels: 390 × 844
- state: 차량 소개 접힘 / 펼침

## Findings

- P0/P1/P2 findings: none after focused comparison.
- Fonts and typography: 기존 Pretendard Variable 본문 16/24를 유지하고, 에어비앤비 참고 화면처럼 버튼을 16/24·600·1px 밑줄로 구분했다.
- Spacing and layout rhythm: 핵심 2문단 다음 12px 뒤에 링크형 버튼을 배치해 차량 정보 카드와의 흐름을 유지했다.
- Colors and visual tokens: 소개 본문 `#191F28`, 더보기 `#222`, 흰 카드 배경을 유지했다.
- Image quality and asset fidelity: 우측 꺾쇠는 기존 `public/assets/ui/category-chevron-right.svg`를 재사용했으며 CSS/문자 대체 아이콘은 없다.
- Copy and content: 접힘 상태는 차량·주행거리 핵심 2문단, 펼침 상태는 판매 위치와 실차 확인 안내까지 모두 노출한다.

## Interaction and verification

- `더보기` 클릭 시 `aria-expanded=true`, 숨긴 문단 노출, 라벨 `접기`, 꺾쇠 위 방향 전환을 확인했다.
- `접기` 시 핵심 2문단과 `더보기` 상태로 복귀한다.
- 모바일 390 × 844 가로 오버플로 0, 깨진 이미지 0, 콘솔 오류 0, 400 이상 네트워크 오류 0.
- `npm run verify:qf`: passed.

## Comparison history

- Initial finding: 차량 소개의 모든 문단이 항상 노출되어 다음 차량 정보까지의 세로 이동이 길었다.
- Fix: 에어비앤비 설명문 패턴처럼 핵심 2문단 뒤에 밑줄형 `더보기 ›`를 추가하고 펼침/접기 동작을 연결했다.
- Post-fix evidence: 접힘·펼침 캡처에서 카드 폭 374px, 버튼 16/24·600, 위 여백 12px, 가로 오버플로 0을 확인했다.

final result: passed

---

# 차량 히스토리 그룹 QA · 2026-10-13

- implementation: `C:/Users/bobae/Downloads/vehicle-info-groups-1013/05-expanded-history.png`
- route: `/?qf=guazi&category=서울오토갤러리&facts=icons` → 첫 매물 → `37개 정보 더보기`
- viewport: 390 × 844 CSS px, deviceScaleFactor 1

## Findings

- 펼친 차량정보 마지막 그룹을 `차량 히스토리`로 정리했다.
- 순서는 연식, 등록일, 주행거리, 소유자 변경, 최초 출고가격(옵션 포함/미포함), 압류/저당, 보험이력, 생산국가다.
- 연식·생산국가는 기본 정보의 중복 항목에서 이동해 펼침 전체 37개 정보 수를 유지했다.
- 등록월·옵션 포함 출고가·소유자 변경·압류/저당처럼 원본 데이터가 없는 값은 추정하지 않고 `정보 없음`으로 표시한다.
- M3의 공식 국내 출시가격 13,770만원은 `옵션 미포함`에만 표시한다.

## Verification

- 그룹 8개, 전체 행 37개
- 차량 히스토리 9개 행
- 모바일 390×844 가로 오버플로 0
- 깨진 이미지 0, 콘솔 오류 0, 400 이상 네트워크 오류 0

final result: passed

---

# 차량 정보 그룹 펼침 QA · 2026-10-13

- source visual truth: 사용자 제공 Mudah.my 차량 제원 캡처 4장
- field source: Google Sheet `국내 중고차사이트 링크`의 `기본정보` 탭, Mudah.my 차량정보 노출 항목
- implementation screenshots: `C:/Users/bobae/Downloads/vehicle-info-groups-1013/01-expanded-basic.png` ~ `04-expanded-tyres-history.png`
- side-by-side: `comparison-basic.png`, `comparison-engine.png`
- route: `/?qf=guazi&category=서울오토갤러리&facts=icons` → 첫 번째 매물 상세 → `37개 정보 더보기`
- viewport: 390 × 844 CSS px, deviceScaleFactor 1

## 구조 대조

| 그룹 | 항목 수 | 기준 |
|---|---:|---|
| 기본 정보 | 8 | Mudah Car Specifications에서 히스토리 중복 항목 제외 |
| 엔진·성능 | 5 | Mudah Engine |
| 크기·중량 | 6 | Mudah Dimension & Weight |
| 제동장치 | 2 | Mudah Brakes |
| 서스펜션 | 2 | Mudah Suspension |
| 조향장치 | 1 | Mudah Steering |
| 타이어·휠 | 4 | Mudah Tyres & Wheels |
| 차량 히스토리 | 9 | 보배드림 차량 이력 정보 |

합계 37개로 버튼 표기와 실제 펼침 항목 수가 일치한다.

## Findings

- P0/P1/P2 findings: none after the focused comparison.
- 접힌 상태는 기존 2열 핵심 정보 8개를 유지했다.
- 펼친 상태는 그룹 제목 18/25·700, 일반 행 16/24, 라벨 `#767676`, 값 `#222`로 통일했다.
- 기본 정보만 기존 원본 아이콘을 쓰고 기술 제원 그룹은 무다처럼 텍스트 라벨/값 2열로 구성했다.
- 그룹 안 구분선은 없으며, 그룹 사이 28px 간격과 제목으로만 위계를 만든다.
- 미확정 DB 값은 추정하지 않고 `정보 없음`으로 표시한다.

## Verification

- `npm run verify:qf`: passed
- 모바일 390×844: 가로 오버플로 0
- 그룹 8개 / 행 37개
- 깨진 이미지 0
- 콘솔 오류 0 / 400 이상 네트워크 오류 0
- 펼침 `aria-expanded=true`, 버튼 문구 `정보 접기`

final result: passed

---

# 차량 정보 2열 아이콘 격자 시안 QA · 2026-10-13

- source visual truth:
  - `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/414dd1f6-fc84-496c-a5fc-8ce98721d31d/1-1000018101.jpg` (FINN)
  - `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/414dd1f6-fc84-496c-a5fc-8ce98721d31d/2-1000018099.jpg` (mobile.de)
  - `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/414dd1f6-fc84-496c-a5fc-8ce98721d31d/3-1000018097.jpg` (Auto Trader)
- implementation screenshot: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/03-autoscout-size-local.png`
- comparison composite: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/comparison-autoscout-size.png`
- route: `/?qf=guazi&category=서울오토갤러리&facts=icons` → 첫 번째 매물 상세 → 차량 정보
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- state: 차량 정보 기본 펼침

## Findings

- P0/P1/P2 findings: none after the focused comparison.
- Fonts and typography: 라벨 14/20·400 `#676767`, 값 16/22·600 `#222`로 mobile.de의 회색 라벨·강한 값 위계를 유지했다.
- Spacing and layout rhythm: 2열 165px, 열 간격 12px, 행 간격 20px, 아이콘과 텍스트 간격 10px다.
- Icon balance: 오토스카우트의 약 24px 슬롯·20~22px 가시 도형에 맞춰, 24px 점유 슬롯 안에 28px 원본을 -2px 광학 인셋으로 배치했다. opacity는 `1`이며 기존 SVG 내부 여백을 포함한 최종 가시 도형은 약 20~22px다.
- Dividers: `차량 정보` 제목 바로 아래의 상단 구분선은 제거하고, 정보 격자와 `정보 더보기` 사이의 하단 구분선만 유지했다.
- Source synthesis: FINN의 넉넉한 여백, mobile.de의 라벨·값 위계, Auto Trader의 2열 아이콘 구조를 조합했다.
- Data preservation: 제조사·모델·연식·주행거리·출시가격·연료·배기량·마력 8개 데이터와 기존 아이콘 자산을 그대로 사용했다.

## Verification

- `npm run verify:qf`: passed
- `git diff --check`: passed
- 깨진 이미지 0
- 콘솔 오류 0
- 가로 오버플로 0

final result: passed

---

# 초톳형 차량 정보 더보기 칩 QA · 2026-10-13

- source visual truth: 사용자 제공 초톳 상세 화면의 흰색 `Xem thêm` 알약 버튼
- implementation screenshot: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/07-chotot-white-info-button.png`
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- source and implementation pixels: 각각 390 × 844
- state: 차량 정보 8개 노출, 더보기 닫힘

## Findings

- P0/P1/P2 findings: none after the focused comparison.
- Fonts and typography: Pretendard Variable 16/24·600으로 본문 CTA와 명확히 구분했다.
- Spacing and layout rhythm: x=24, width=342, height=48, padding 10px 23px, radius 24px다.
- Colors and visual tokens: 흰 배경과 글자 `#222`를 유지하고, FINN 보조 버튼처럼 윤곽이 묻히지 않도록 `#C8C8C8` 2px 테두리를 적용했다.
- Image quality and asset fidelity: 초톳 원본 드롭다운 화살표 SVG를 사용하고 펼친 상태에서 180도 회전한다.
- Copy and content: 사용자 지정 문구 `37개 정보 더보기`를 적용했고, 펼친 상태에서는 `정보 접기`로 바뀐다.
- Interaction: 버튼 클릭 시 `aria-expanded=false → true`, 차량 정보 행 `8 → 23`, 다시 클릭 시 닫힘을 확인했다.

## Comparison history

- 이전: 에어비앤비 기준의 `#F2F2F2`, 반경 12px, 아이콘 없는 버튼이었다.
- 수정: 초톳 기준의 흰색 테두리 알약 버튼과 중앙 화살표로 교체했다.
- 최종: 390px 캡처에서 342×48px, 깨진 이미지 0, 콘솔 오류 0, 가로 오버플로 0을 확인했다.

final result: passed

---

# A/S 성능·상태점검 보증 안내 카드 QA · 2026-10-13

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/c74bc93f-5543-4941-a40b-a2b46876261b/1-1000018089.jpg`
- implementation screenshot: `C:/Users/bobae/Downloads/as-info-modal-audit-1013/01-local-open.png`
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- source pixels: 591 × 1280; implementation pixels: 390 × 844
- density normalization: 안내 카드 폭을 화면의 약 90%로 맞춰 본문·테두리·딤 상태를 집중 대조
- state: `성능·상태점검 보증` 안내 열림

## Findings

- P0/P1/P2 findings: none after the focused comparison.
- Fonts and typography: Pretendard Variable, 제목 16/24·700, 본문 14/22·400으로 원본의 위계를 재현했다.
- Spacing and layout rhythm: 카드 폭은 350px(390px 화면의 89.7%), 내부 여백 18px, 제목 아래 10px이다.
- Colors and visual tokens: 흰 카드, #222 1px 테두리, rgba(0,0,0,.14) 딤을 적용했다.
- Image quality and asset fidelity: 이번 상태에는 별도 래스터·아이콘 자산이 없으며 기존 정보 아이콘을 유지했다.
- Copy and content: 원본의 성능기록부 불일치, 30일 또는 2,000km, 수입·노후 차량 예외 안내를 그대로 반영했다.
- Interaction and accessibility: 행 클릭으로 열기, 바깥 영역 클릭과 Escape로 닫기, 다이얼로그 초점 이동·복귀를 구현했다.

## Comparison history

- Initial finding: A/S 3행은 있었지만 성능점검 보증의 적용 범위와 예외를 확인할 수 있는 상세 상태가 없었다.
- Fix: 원본 비율의 안내 카드와 전체 화면 딤을 추가하고 성능점검 행을 대화상자 트리거로 변경했다.
- Post-fix evidence: dialog 350×203, `aria-modal=true`, 열린 뒤 초점 이동, 바깥 영역 닫힘, 깨진 이미지 0, 가로 오버플로 0, 콘솔 오류 0을 확인했다.

## Verification

- `npm run verify:qf`: passed
- `git diff --check`: passed
- 모바일 390×844 열림 상태 캡처 확인
- 닫기·Escape·초점 이동 확인
- 깨진 이미지 0, 가로 오버플로 0, 콘솔 오류 0

final result: passed

---

# 상세 차량 옵션 · Airbnb 편의시설형 시안 QA · 2026-10-13

- source visual truth: Airbnb 공식 숙소 상세의 `What this place offers` / `Show all amenities` 구조
- source URL: `https://www.airbnb.co.kr/rooms/38527334`
- supporting source: `https://www.airbnb.com/rooms/1461437324598523995`
- implementation: `http://127.0.0.1:4212/?qf=guazi&category=슈퍼카&view=feed&maker=페라리`
- intended viewport: 모바일 390×844 CSS px / PC 1440×900 CSS px
- state: 주요 옵션 접힘·전체 옵션 펼침

## Findings

- Fonts and typography: 기존 Pretendard를 유지하고 옵션명은 16/22·400으로 정리했다.
- Spacing and layout rhythm: 모바일은 1열 48px 행, 아이콘 24px, 아이콘–텍스트 16px. PC는 2열 52px 행으로 구성했다.
- Colors and visual tokens: 본문·버튼은 #222, 배경은 흰색, 전체 보기 버튼은 1px 진한 테두리와 8px 모서리를 사용한다.
- Image quality and asset fidelity: 기존 차량 옵션 PNG만 재사용했으며 새 CSS 도형·문자 아이콘·임의 SVG를 만들지 않았다.
- Copy and content: 페라리 실데이터는 공개된 주요 옵션만 보여주고, 전체 등록 개수는 보조 문구로 구분한다.
- Interaction: 처음에는 핵심 옵션만 노출하고 `주요 옵션 N개 모두 보기`로 펼치며 같은 버튼으로 접는다.

## Blocking issue

- Chrome CDP 연결이 `Page.navigate`와 `Page.getFrameTree`에서 반복 시간 초과되어 Airbnb 원본과 로컬 구현의 브라우저 캡처를 만들 수 없었다.
- 따라서 같은 뷰포트의 나란히 비교, 실제 줄바꿈, 아이콘 광학 정렬, 콘솔 오류 확인은 완료하지 못했다.

## Verification

- `npm run check:runtime`: passed
- `npm run verify:qf`: passed
- 브라우저 렌더 증거: blocked

final result: blocked

---

# 올드카 카테고리 헤더 QA · 2026-10-12

- source visual truth: `reports/oldcar-hero-1012/source-supercar-header-390.png`
- implementation screenshot: `reports/oldcar-hero-1012/implementation-oldcar-header-390.png`
- focused side-by-side: `reports/oldcar-hero-1012/comparison-supercar-oldcar-390.png`
- route: `/?qf=guazi&category=올드카&view=feed`
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- compared element size: source 358 × 98px / implementation 358 × 98px
- state: 첫 번째 슬라이드, light theme

## Findings

- P0/P1/P2 findings: none after the focused comparison.
- Fonts and typography: 슈퍼카 헤더와 동일한 Pretendard 제목 18/23·700, 설명 12/17·400을 유지했다.
- Spacing and layout rhythm: 좌우 16px, 상단 12px, 높이 98px, 8px 모서리, 가운데 인디케이터를 동일하게 적용했다.
- Colors and visual tokens: 쌍용·기아·대우의 시대감을 구분하는 저채도 브라운·블루·퍼플 단색 배경을 사용해 본문과 분리했다.
- Image quality and asset fidelity: 저장소의 투명 세대 이미지를 재사용해 무쏘·프라이드·에스페로 실차 형상을 유지하고 문자·배경 합성을 추가하지 않았다.
- Copy and content: `보배드림 올드카`와 `쌍용 · 기아 · 대우 명차 컬렉션`으로 카테고리 정체성을 한 화면 안에 고정했다.
- Interaction: 6초 순환, 헤더 탭 시 다음 장, 하단 인디케이터 직접 선택을 지원하며 reduced-motion에서는 자동 순환을 중단한다.

## Focused region evidence

슈퍼카 헤더와 올드카 헤더 자체만 같은 358×98px 크기로 붙여 비교했다. 카드 하단 피드 콘텐츠는 판정에서 제외했다.

## Comparison history

- Initial finding: 별도 올드카 헤더가 없어 목록 시작점에서 카테고리 정체성이 드러나지 않았다.
- Fix: 기존 슈퍼카 헤더의 검증된 슬롯과 계층을 그대로 사용하고 쌍용 무쏘·기아 프라이드·대우 에스페로 3장 순환 콘텐츠를 추가했다.
- Post-fix evidence: 두 헤더의 실측 크기 358×98px, 텍스트 시작선, 중앙 인디케이터 위치가 일치하며 이미지와 문구가 겹치지 않는다.

## Verification

- `npm run verify:qf`: passed
- `git diff --check`: passed
- 모바일 390×844 브라우저 렌더 확인
- 깨진 이미지 0, 헤더 버튼과 인디케이터 접근성 이름 확인

final result: passed

---

# 피드 판매자 줄 축약 QA · 2026-10-12

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/455d141e-0910-4091-a640-7077b9bf4beb/1-1000017881.jpg`
- implementation screenshot: `reports/feed-seller-name-only-1012/implementation-card-390.png`
- focused side-by-side: `reports/feed-seller-name-only-1012/source-vs-implementation-seller-row.png`
- route: `/?qf=guazi&category=슈퍼카&view=feed`
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- source pixels: 591 × 1280; implementation card pixels: 358 × 377
- density normalization: 판매자 영역을 같은 358px 폭으로 맞춰 확대 비교
- state: 슈퍼카 피드 첫 번째 큰 카드

## Findings

- P0/P1/P2 findings: none after the focused comparison.
- Fonts and typography: 판매자명은 기존 Pretendard 14px·400·#222 한 줄을 유지한다.
- Spacing and layout rhythm: 프사 16×16, 프사–이름 6px로 축소해 지역 줄보다 시각적 비중이 커지지 않는다.
- Colors and visual tokens: 기존 판매자명·아이콘·액션 색 토큰을 유지했다.
- Image quality and asset fidelity: 기존 실제 판매자 프로필 이미지를 그대로 사용하고 크롭 방식도 유지했다.
- Copy and content: 피드에서는 판매자명만 남기고 판매완료·판매중 대수와 인증 배지를 제거했다. 목록형·PC·상세 데이터는 바꾸지 않았다.

## Comparison history

- Initial finding: 피드 판매자 프사가 24px이고 판매완료·판매중 보조 줄까지 있어 모델·가격 아래에서 판매자 정보가 과도하게 강조됐다.
- Fix: 피드 프사를 16px로 줄이고 간격을 9px에서 6px로 조정했다. 판매 대수 줄과 피드 인증 배지를 제거했다.
- Post-fix evidence: 렌더 DOM에서 `.bbm-card-seller-sales` 0개, 첫 카드 판매자 텍스트 `최민재 딜러`, 프사 16×16, 인증 배지 0개를 확인했다.

## Verification

- `npm run verify:qf`: passed
- `git diff --check`: passed
- 모바일 390px 브라우저 렌더 캡처 확인
- 전화·채팅·찜 액션 유지

final result: passed

---

# 초톳 필터 칩 정합 QA

- source visual truth: `C:/Users/bobae/Downloads/KakaoTalk_20261010_202521671.png`
- implementation: Codex in-app Browser 탭 38의 2026-10-10 20:31 KST 브라우저 렌더 캡처
- route: `http://127.0.0.1:4208/?qf=guazi&view=feed&category=서울오토갤러리`
- viewport: 485 × 670 CSS px
- source pixels: 1080 × 2340 (`@2x` 계열 모바일 캡처)
- density normalization: 필터 칩 높이 32px를 기준으로 비례 대조
- state: 서울오토갤러리 선택 칩 활성, 카테고리·제조사 칩 비활성

## Findings

- P0/P1/P2 findings: none after the second comparison.
- Fonts and typography: 필터 칩은 기존 14/20·500을 유지해 초톳 원본의 밀도와 일치한다.
- Spacing and layout rhythm: 칩 높이 32px, 칩 사이 8px, 텍스트와 X/꺾쇠 사이 8px로 맞췄다.
- Colors and visual tokens: 선택 칩은 #222 계열과 흰색 X, 비선택 칩은 연회색 바탕과 진회색 꺾쇠를 유지한다.
- Image quality and asset fidelity: 기존 `chip-remove.svg`와 `filter-toggle-chotot-v01.svg` 원본 자산을 사용한다. CSS 도형이나 문자 대체는 없다.
- Copy and content: 서울오토갤러리·카테고리·제조사 문구와 기능은 변경하지 않았다.
- Interaction: 선택 칩 X는 기존 해제 동작을 유지하며, 비선택 칩 꺾쇠는 기존 필터 바텀시트를 연다.

## Focused region evidence

원본의 필터 줄과 로컬 시안의 필터 줄을 확대 대조했다. 전체 화면보다 X 배경, 칩 사이 간격, 꺾쇠 잉크 크기가 중요한 영역이라 필터 줄을 중심으로 판정했다.

## Comparison history

- Initial finding: 선택 칩의 X 뒤에 회색 원형 배경이 있었고, 칩 사이 간격은 4px로 원본보다 좁았다. 비선택 칩 꺾쇠도 20px 박스로 다소 무거웠다.
- Fix: X의 원형 배경과 추가 왼쪽 마진을 제거했다. 칩 사이·내부 간격을 8px로 통일하고 꺾쇠 박스를 18px로 조정했다.
- Post-fix evidence: Codex in-app Browser에서 새로고침 후 선택 칩은 흰색 X만 표시되고, 카테고리·제조사 꺾쇠와 칩 간격이 초톳 원본과 같은 리듬으로 정리됨을 확인했다.

## Verification

- `npm run verify:qf`: passed
- 필터 X 해제 버튼 접근성 이름 유지
- 브라우저 렌더 확인 완료
- 기존 데이터·헤더·브랜드 레일·매물 목록 변경 없음

final result: passed

---

# 트럭 카고 적재중량 칩 QF-123

- 기준 이미지: 마이트럭 모바일 카고트럭 목록(사용자 제공 2장)
- 대상 화면: 보배드림 트럭·특장 > 카고(화물)트럭
- 뷰포트: 모바일 390px

## 기준에서 가져온 구조

- 차급명과 톤수를 두 줄 카드마다 반복하지 않는다.
- 레일 왼쪽에 `적재중량` 축 이름을 한 번만 둔다.
- 톤수 범위는 흰색 한 줄 알약칩으로 가로 스크롤한다.
- 별도 `형식 변경` 카드는 제거하고 상단 선택 칩의 X를 사용한다.

## 구현 수치

| 항목 | 값 |
|---|---:|
| 레일 높이 | 56px |
| 모바일 좌우 여백 | 16px |
| 칩 높이 | 32px |
| 칩 좌우 패딩 | 10px |
| 칩 간격 | 8px |
| 칩 모서리 | 완전 알약형 |
| 칩 글자 | 14/20·500 |
| 칩 배경 | 투명 |
| 칩 테두리 | #DEDEE3 1px |

## 확인 목록

- [x] 실제 경형·소형·준중형 등 내부 분류값 유지
- [x] 톤수 칩 선택 시 기존 다음 뎁스 동작 유지
- [x] 카고 외 트럭 유형 UI 변경 없음
- [x] 마이트럭 5개 톤수 구간과 노출 순서 일치
- [x] `git diff --check` 통과
- [ ] 배포본 390px에서 줄 높이·가로 스크롤·첫 칩 노출 확인

---

# 중고차 상세 A/S 정보 업그레이드 QA · 2026-10-13

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/01d398d9-b73a-4071-af75-a1c3764a9d0d/1-1000018087.jpg`
- implementation screenshot: `C:/Users/bobae/Downloads/as-info-audit-1013/01-local-default.png`
- expanded-state screenshot: `C:/Users/bobae/Downloads/as-info-audit-1013/02-local-expanded.png`
- route: `/?qf=guazi&category=슈퍼카&view=feed&maker=페라리` → 첫 번째 매물 상세
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- source pixels: 591 × 1280; implementation pixels: 390 × 844
- density normalization: 원본의 A/S 영역 정보 위계와 390px 구현 영역을 동일한 3행 구조로 대조
- state: 기본 접힘 / 안내 펼침

## Findings

- P0/P1/P2 findings: none after the focused comparison.
- Fonts and typography: 기존 Pretendard Variable을 유지하고 행 라벨 14px, 상태값 13px로 정리했다.
- Spacing and layout rhythm: 제목 아래 18px, 행 사이 22px, 라벨·상태값·프로그레스바를 3행 반복 규칙으로 통일했다.
- Colors and visual tokens: 종료·확인 필요는 회색, 성능점검 보증의 상태값과 프로그레스는 에어비앤비식 #222 블랙으로 통일했다.
- Image quality and asset fidelity: 헤더 화살표는 기존 `public/assets/ui/category-chevron-right.svg`를 사용했다. CSS 대체 그림은 없다.
- Copy and content: `제조사 보증 (차체/일반)`, `제조사 보증 (엔진/주요)`, `성능·상태점검 보증`으로 정리했다. 제조사 보증은 확정 데이터가 없으면 `보증 여부 확인 필요`로 표시한다.
- Interaction: 우측 화살표로 제조사 보증 산정 주의와 성능점검 보증 적용 기준을 펼치고 접을 수 있다.

## Comparison history

- Initial finding: 기존 구현은 선택된 매물 상세에서 A/S 카드를 완전히 숨기고, 비선택 상태에서도 2행만 표시했다.
- Fix: 실제 매물 상세에 3행 A/S 정보를 출력하고 차량 연식·주행거리·판매자 구분에 따라 상태 문구를 보수적으로 계산하게 했다.
- Post-fix evidence: `.warranty-card` 374px 폭, 행 3개, 제목 `A/S 정보`, 깨진 이미지 0, 가로 오버플로 0, 콘솔 오류 0을 확인했다.

## Verification

- `npm run verify`: passed
- `git diff --check`: passed
- 모바일 390×844 렌더 확인
- 기본·펼침 상태 캡처 확인
- 깨진 이미지 0, 가로 오버플로 0, 콘솔 오류 0

final result: passed

---

# 2023 BMW M3 컴페티션 M xDrive 제원 QA · 2026-10-13

- 적용 대상: 서울오토갤러리 첫 매물 `BMW M3 6세대 M3 xDrive 컴페티션 M`
- 기준: BMW Group PressClub의 G80 M3 Competition xDrive 공식 기술자료, BMW 코리아 2023년 12월 가격표
- 접힘 캡처: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/01-local-tuned.png`
- 펼침 캡처: `C:/Users/bobae/Downloads/vehicle-info-groups-1013/01-expanded-basic.png` ~ `04-expanded-tyres-history.png`

## 확인한 핵심 값

- S58 2,993cc 직렬 6기통 트윈터보, 압축비 9.3:1
- 510마력(375kW), 650N·m, 8단 M 스텝트로닉 Drivelogic
- 4,794 × 1,903 × 1,434mm, 축거 2,857mm, 연료탱크 59L
- 전륜 275/35 ZR19·9.5J×19, 후륜 285/30 ZR20·10.5J×20
- 2023년 12월 국내 출시가격 13,770만원

## Verification

- 접힌 8개 핵심 정보에 출시가격·배기량·510마력 반영
- 펼친 30개 기술 제원에서 `정보 없음` 제거
- 매물 고유 이력 7개는 공식 차량 제원으로 추정하지 않음
- 모바일 390×844 가로 오버플로 0, 깨진 이미지 0, 콘솔 오류 0
- `npm run verify:qf`: passed

final result: passed

---

# 차량 정보 초톳형 테마 QA · 2026-10-13

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/686e7f8e-a5cf-4e7c-8a82-ede39fb39fb1/1-1000018136.jpg`
- implementation: `C:/Users/bobae/Downloads/vehicle-info-chotot-1013/01-local.png`
- side-by-side comparison: `C:/Users/bobae/Downloads/vehicle-info-chotot-1013/comparison.png`
- route: `/?qf=guazi&category=서울오토갤러리&facts=chotot` → 첫 번째 매물 상세
- viewport: 390 × 844 CSS px, deviceScaleFactor 1

## Findings

- P0/P1/P2 findings: none after the focused comparison.
- 초톳의 흰 카드·24px 안쪽 여백·회색 배경 구조를 기존 상세 카드 토큰으로 재현했다.
- `차량 상태`와 `기술 제원` 두 구역을 1px `#E6E6E6` 선으로만 나눴다.
- 각 구역은 2열, 라벨 14/20 `#8A8A8A`, 값 16/24 `#222`, 열 간격 22px, 행 간격 18px다.
- 초톳처럼 짧게 훑도록 변속기·공차중량·최고출력 값은 요약 표기하고, 무다형에는 전체 공식 제원을 유지했다.
- 제조사 링크만 보배드림의 링크 색을 유지했다.

## Verification

- 카드 374px, 높이 680px
- 차량 상태 6개 + 기술 제원 10개
- 모바일 390×844 가로 오버플로 0
- 깨진 이미지 0, 콘솔 오류 0, 400 이상 네트워크 오류 0
- `npm run verify:qf`: passed

final result: passed

---

# Design QA · 초톳 상세 상단 정보 슬롯

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/9745c5c0-e284-4109-b52c-d87c9006da14/1-1000018198.jpg`
- source pixels: 591×1280 JPEG; 384px CSS 폭으로 정규화(배율 0.6497, 래스터 추정 오차 ±1~2px)
- implementation: `http://127.0.0.1:4210/?qf=guazi&category=서울오토갤러리&facts=icons`
- implementation screenshot: Chrome Browser tab `229709567`의 384×844 인라인 캡처
- implementation pixels/CSS/density: 384×844 / 384×844 CSS / DPR 1
- state: BMW M3 첫 매물 상세, 사진 1/20, 상세 상단과 첫 콘텐츠 카드가 보이는 초기 상태

## Full-view comparison evidence

원본과 구현의 차량/상품 사진 내용이 달라 사진 영역 자체는 판정에서 제외했다. 사진 아래 정보 블록의 좌우 16px 정렬, 텍스트 계층, 주소 두 줄, 등록 시간, 판매자 블록의 전체 밀도를 비교했다. 구현은 초톳과 같은 순서와 정보 위계를 유지하며, 가격 색상은 제품 결정에 따라 `#222`를 유지했다.

## Focused region comparison evidence

- 제목: 20px/28px/600, 사진 아래 16px
- 메타: 15px/22px/400, 제목 아래 8px
- 가격: 22px/28px/600, 메타 아래 8px, `#222`
- 지역: 15px/22px/400, 두 줄 간격 4px, 보조 주소 `#8c8c8c`
- 등록일: 15px/22px/400, 지역 아래 12px
- 판매자: 등록일 아래 36px, 프사 48×48px, 이름 16px/22px/600, 실적·최근 활동 14px/20px/400
- 평점: 세로 구분선, 4.8 + 초톳 원본 별 SVG, 후기 버튼

## Findings

- P3: 원본과 구현의 제목 내용이 달라 줄바꿈 위치는 동일 문구 기준으로 비교할 수 없다. 슬롯 폭과 타이포 토큰은 기준에 맞으며 콘텐츠 차이로 허용한다.
- P3: 평점·후기·최근 활동 값은 프런트 시안용 결정값이다. 실제 API가 연결되면 실데이터로 교체해야 한다.

## Comparison history

### Pass 1 — blocked

- 제목 19/29.5/500, 메타 14/20, 가격 20/28/700으로 초톳보다 작거나 위계가 달랐다.
- 주소 두 줄 간격이 0px였고 등록일에서 판매자까지 12px뿐이었다.
- 판매 실적이 16/24로 과대했고 최근 활동 및 우측 평점 영역이 없었다.

### Pass 2 — passed

- 위 타이포와 간격을 항목별 토큰으로 수정했다.
- 주소 보조 줄과 판매자 3단 정보, 평점 영역을 추가했다.
- 384×844 렌더에서 DOM 수치를 재확인했다.
- 깨진 이미지 0개, 콘솔 오류 0건.
- 후기 버튼 동작을 확인했다.

## Required fidelity surfaces

- fonts/typography: Pretendard 계열 유지, 크기·굵기·행높이 통과
- spacing/layout rhythm: 좌우 16px, 슬롯 간격, 판매자 블록 통과
- colors/tokens: 본문 `#222`, 보조 `#8c8c8c`, 가격 검정 의도적 변경 통과
- image quality/assets: 기존 실차·프사 유지, 초톳 원본 별 SVG 사용, 깨진 이미지 없음
- copy/content: 기존 차량 데이터 보존, 최근 활동·평점은 시안용 값임을 기록

final result: passed

---

# Design QA · 상세 저장 문구 제거 (2026-10-14)

- source visual truth: 직전 승인된 상세 하트·리뷰 시안 + 사용자 결정 「저장 텍스트 제거」
- implementation screenshot: `reports/detail-heart-review-2026-10-14/after-heart-only.png`
- viewport: 384 × 844 CSS px, DPR 1
- state: BMW M3 첫 매물 상세 상단

## Comparison evidence

- 저장 문구를 제거하고 48×48px 원형 하트 버튼으로 축소했다.
- 버튼 우측 24px과 사진 아래 12px 위치는 유지했다.
- 제목 우측 여백을 104px에서 64px로 줄여 40px의 제목 공간을 되찾았다.
- 리뷰 열의 위치·크기·타이포는 직전 통과본을 그대로 유지했다.

## Findings

- P0/P1/P2 findings: none.
- fonts/typography: 저장 문구 제거 외 변동 없음.
- spacing/layout rhythm: 48px 터치 영역과 제목 간 8px 안전 간격 통과.
- colors/tokens: `#222`, 흰 배경, `#dedede` 테두리 유지.
- image quality/assets: 기존 초톳 계열 하트 SVG 유지, 깨진 이미지 없음.
- copy/content: 시각 문구는 제거했지만 접근성 이름은 유지.

## Verification

- `npm run verify:qf`: passed
- 깨진 이미지 0, 콘솔 오류 0

final result: passed

---

# Design QA · 리뷰 제거·하트 판매자 줄 이동 (2026-10-14)

- source visual truth: 사용자 결정 「리뷰 빼고 그 자리 하트」
- implementation screenshot: `reports/detail-heart-review-2026-10-14/after-heart-seller-row.png`
- viewport: 384 × 844 CSS px, DPR 1
- state: BMW M3 첫 매물 상세 상단

## Comparison evidence

- 제목 옆 하트와 우측 제목 여백을 모두 제거해 제목이 352px 전체 폭을 사용한다.
- 목업 평점·후기 열을 제거하고 같은 94×64px 판매자 우측 슬롯에 28px 하트를 배치했다.
- 기존 1px 세로 구분선과 판매자 블록 높이는 유지했다.
- 비선택/선택 상태 모두 기존 초톳 계열 하트 SVG와 핑크 마스크를 재사용한다.

## Findings

- P0/P1/P2 findings: none.
- fonts/typography: 차량·판매자 텍스트 토큰 변동 없음.
- spacing/layout rhythm: 제목 폭 회복, 판매자 우측 행동 슬롯 정렬 통과.
- colors/tokens: 기존 본문·선·찜 색상 유지.
- image quality/assets: 기존 실제 아이콘 자산 사용, 깨진 이미지 없음.
- copy/content: 목업 평점·후기 삭제, 하트는 접근성 이름과 선택 상태 유지.

## Verification

- 384×844 렌더 확인
- 깨진 이미지 0, 콘솔 오류 0

final result: passed

---

# Design QA · 하트 사진 상단 이동 (2026-10-14)

- source visual truth: 사용자 결정 「하트는 모델 위쪽, 리뷰 제거」
- viewport: 384 × 844 CSS px, DPR 1
- state: BMW M3 첫 매물 상세 상단

## Comparison evidence

- 하트를 차량 사진 상단 액션 줄로 옮겨 모델명과 판매자 정보의 가로 폭을 모두 확보했다.
- 우측 액션은 하트 → 공유 → 더보기 순으로 32px 원형 버튼과 8px 간격을 사용한다.
- 판매자 줄의 리뷰·평점·세로 구분선·하트 슬롯을 모두 제거했다.
- 비선택/선택 상태는 기존 하트 SVG와 핑크 마스크를 재사용한다.

## Verification

- `npm run verify:qf`: passed
- 하트 선택 상태 전환 확인
- 깨진 이미지 0, 콘솔 오류 0

final result: passed

---

# Design QA · 상세 메타정보 마력 추가 (2026-10-14)

- source visual truth: 사용자 결정 「메타정보에 마력 추가」
- viewport: 384 × 844 CSS px, DPR 1
- state: BMW M3 첫 매물 상세 상단

## Verification

- 메타정보를 `2023 · 2.2만km · 가솔린 · 510마력`으로 표시했다.
- 차량 정보 격자의 실제 표시값과 같은 마력값을 재사용했다.
- 한 줄 유지, 잘림 없음, 깨진 이미지 0, 콘솔 오류 0.
- `npm run verify:qf`: passed

final result: passed

---

# Design QA · 유튜브 프로필 비율 재조정 (2026-10-15)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/f53ec7ce-b4f4-4ca5-b5ae-dce638bdddbc/1-1000018254.jpg`
- live reference: `https://www.youtube.com/@이성미의나는꼰대다`
- implementation screenshot: Codex IAB capture `dealer-youtube-avatar-review-row-2026-10-15`
- source pixels: 591 × 1280 px, normalized from device-density capture to 393 CSS px reference width
- implementation: 393 × 852 CSS px, DPR 1
- state: 강홍구 딜러 판매자 페이지, 팔로잉 상태

## Full-view comparison evidence

- 원본과 구현을 같은 비교 출력에서 직접 대조했다.
- 모바일 앱 바는 뒤로가기·검색·더보기의 44px 터치 영역과 56px 높이를 사용한다.
- 배너는 좌우 16px, 높이 100px, 12px 모서리로 원본 앱 채널의 비율에 맞췄다.
- 프로필 사진을 112px에서 76px로 축소하고 판매자명·채널명·팔로워/판매중 수를 오른쪽 세 줄로 정렬했다.
- 평점과 리뷰 수를 이름 영역에서 제거하고 주소 줄 오른쪽에 배치했다.

## Focused region comparison evidence

- 헤더·배너·프로필 사진·판매자명 영역을 집중 비교했다.
- 원본의 약 76px 프로필 원과 구현의 76px 원을 1:1 CSS 크기로 맞췄다.
- 자동차 판매자 페이지에 필요한 주소·경력·응답률은 원본 유튜브보다 추가된 의도적 제품 정보다.

## Comparison history

- 이전 P2: 프로필 사진 112px와 146px 배너가 유튜브 원본보다 커서 상단 밀도가 낮았다.
- fix: 사진 76px, 배너 100px, 앱 바 56px로 조정했다.
- post-fix evidence: 393px 브라우저 캡처에서 이름의 시작축과 프로필 원 비율이 원본과 일치하고 가로 넘침이 없다.

## Required fidelity surfaces

- fonts/typography: 판매자명 22/28px, 보조 정보 13/18px로 원본의 제목·핸들·구독자 계층을 재현했다.
- spacing/layout rhythm: 좌우 16~20px 여백, 사진-텍스트 14px 간격, 46px 행동 버튼을 확인했다.
- colors/tokens: 흰 배경, `#222` 본문, 비팔로우 검정/팔로잉 회색 버튼을 사용한다.
- image quality/assets: 기존 고해상도 딜러 사진과 서울오토갤러리 배너를 원형·커버 슬롯에 맞게 사용했다.
- copy/content: `강홍구`, `@서울오토갤러리`, 팔로워, 판매중 수, 주소, 리뷰 정보를 보존했다.

## Verification

- 팔로우 → 팔로잉 상태 전환 확인.
- 모바일 393 × 852, PC 1440 × 1000 확인.
- 콘솔 오류 0건.
- P0/P1/P2 findings: none after the size correction.

final result: passed

---

# Design QA · 치지직형 게시글 리스트 (2026-10-15)

- source visual truth: `reports/chzzk-list-parity-20261015/source-full.jpg`
- normalized source list: `reports/chzzk-list-parity-20261015/source-list-393x525.png`
- implementation: `public/community/naver-cafe-list.html`
- implementation screenshot: `reports/chzzk-list-parity-20261015/implementation-full.png`
- implementation list crop: `reports/chzzk-list-parity-20261015/implementation-list-393x525.png`
- comparison sheet: `reports/chzzk-list-parity-20261015/comparison-list-side-by-side.png`
- source pixels: 591 × 1280; 게시글 영역을 x=0, y=190, 591 × 790으로 잘라 393 × 525로 정규화
- implementation pixels/CSS/density: 393 × 852 / 393 × 852 CSS / DPR 1; 게시글 영역 y=279부터 393 × 525로 비교
- state: 기존 보배드림 상단 UI 유지, 전체 게시글, 치지직형 간결 리스트

## Full-view comparison evidence

- 사용자 정정에 따라 상단 앱 바, 메뉴, 게시판 선택, 카테고리, 공지와 글쓰기 버튼은 비교·수정 범위에서 제외했다.
- 원본과 구현의 게시글 영역만 같은 393 × 525 입력으로 나란히 비교했다.
- 원본의 기기 상태바와 화면 위 동영상 PIP는 앱 외부 요소이므로 제외했다.

## Focused region comparison evidence

- 행 높이 70px, 좌우 15px, 구분선 `#dedfe1`을 적용했다.
- 제목은 한 줄 16/23px/500, 댓글 수는 15px 블루로 분리했다.
- 메타는 작성자·날짜·추천 아이콘/수·조회 아이콘/수 순서의 12.5/17px 구조다.
- 우측 썸네일은 52 × 52px, 모서리 7px이며 원본과 같은 일부 게시물에만 나타난다.
- 치지직의 실제 추천·조회 아이콘 자산을 재사용했다.

## Comparison history

### Pass 1 — blocked

- P1: 최초 변경에서 상단 헤더와 탭까지 치지직 스타일로 바뀌어 사용자가 지정한 리스트 전용 범위를 넘었다.
- P2: 동적 간결형 스타일이 정적 CSS를 덮어 제목 15.5px, 행 68px, 썸네일 50px으로 표시됐다.
- P1: 추천수 옵션을 조기 활성화해 기존 렌더 단계에서 스크립트 오류가 발생했다.

### Pass 2 — passed

- 상단 관련 변경을 전부 되돌리고 게시글 리스트에만 치지직형 스타일을 적용했다.
- 최종 동적 스타일을 행 70px, 제목 16px, 썸네일 52px로 수정했다.
- 기본 추천 옵션은 유지하지 않고 최종 간결 렌더 단계에서 추천·조회 메타를 구성해 오류를 제거했다.
- 새 브라우저 탭에서 카테고리 필터 후에도 간결형 유지, 콘솔 오류 0건을 확인했다.

## Required fidelity surfaces

- fonts/typography: 한 줄 제목, 블루 댓글 수, 회색 메타 위계 통과
- spacing/layout rhythm: 15px 시작축, 70px 행, 52px 썸네일과 행 구분선 통과
- colors/tokens: 본문 `#292b2e`, 메타 `#7b7d80`, 댓글 `#238fe3` 통과
- image quality/assets: 기존 실차 썸네일 유지, 52px 커버 크롭과 7px 모서리 통과
- copy/content: 기존 보배드림 게시글 제목·작성자·조회 데이터 유지, 표시 날짜만 치지직 목록 형식으로 정규화

## Verification

- 카테고리 필터: passed
- 필터 후 간결형 유지: passed
- 콘솔 오류: 0건
- `git diff --check`: passed

final result: passed

---

# Design QA · 초톳 행동 버튼·서비스 목록형 재사용 (2026-10-15)

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/b9846df3-385e-4e6d-86c7-e49a39e0bcfd/1-1000018268.jpg`
- implementation screenshot: `design-qa-dealer-chotot-actions-list-mobile.jpg`
- side-by-side comparison: `design-qa-dealer-chotot-actions-list-comparison.jpg`
- source pixels: 591 × 1280 px, 393 × 852 CSS px 기준으로 정규화
- implementation pixels: 393 × 852 px, CSS viewport 393 × 852, DPR 1
- state: 강홍구 판매자 페이지, 판매차량 탭·판매중 선택

## Full-view comparison evidence

- 기존 유튜브식 배너·프로필 구조는 유지하고, 초톳 참고 화면에서 지정된 공유·팔로우의 상대 위치와 외곽 버튼 표현만 적용했다.
- 공유·팔로우를 이름·채널 메타 바로 아래, 응답률·주소·딜러 경력보다 위에 배치했다.
- 판매차량은 판매자 전용 카드가 아니라 서비스 본문에서 사용하는 `BbmResultCard` 목록형을 그대로 재사용했다.
- 첫 화면에서 사진·차명·연식/주행거리/연료·가격·지역·판매자·찜 정보가 동일한 목록 위계로 보인다.

## Focused region comparison evidence

- 행동 버튼은 36px 높이, 8px 반경, `#dedede` 1px 선, 공유 92px·팔로우 102px 최소 폭으로 대조했다.
- 팔로우 아이콘은 참고 화면과 같은 더하기 기호를 실제 Radix 아이콘 자산으로 사용했다.
- 목록형 모바일 카드는 서비스 공통 120 × 120px 사진, 12px 간격, 16/20px 제목, 14/20px 메타 규격을 상속한다.
- PC 1440 × 1000에서는 공통 PC 목록형의 160px 사진과 세로 행 배치를 사용하며 가로 넘침이 없다.

## Comparison history

- 이전 P2: 공유·팔로우가 프로필 정보 맨 아래의 큰 46px 버튼이었고 팔로우가 검정 채움이라 초톳의 정보 흐름과 달랐다.
- 이전 P2: 판매자 페이지 전용 카드는 기존 목록형의 사양·판매자·찜 정보가 빠져 서비스 전체와 일관되지 않았다.
- fix: 행동 버튼을 프로필 메타 바로 아래의 작은 흰 외곽 버튼으로 옮기고, 목록을 공통 `BbmResultCard`로 교체했다.
- post-fix evidence: 비교 이미지에서 행동 버튼의 순서·크기·위치가 초톳과 같은 흐름이며 실제 매물 목록은 서비스 목록형과 동일하다.

## Required fidelity surfaces

- fonts/typography: 행동 버튼 14/20px 700, 목록 제목 16/20px 600과 공통 메타 토큰을 확인했다.
- spacing/layout rhythm: 버튼 간 10px, 버튼 아래 정보 행 16px, 목록 카드 12px 상하 여백과 1px 구분선을 확인했다.
- colors/tokens: 흰 버튼, `#dedede` 테두리, `#222` 텍스트와 기존 목록 토큰을 재사용했다.
- image quality/assets: 실제 테스트 매물 정규화 썸네일과 기존 공유·위치·찜 아이콘을 사용했고 깨진 이미지가 없다.
- copy/content: 판매중 24대, 실제 차량명·사양·가격·지역·판매자 정보를 그대로 유지했다.

## Verification

- 모바일 393 × 852, PC 1440 × 1000 확인.
- 공유·팔로우 버튼 표시 및 팔로우 상태 전환 확인.
- 실제 목록형 매물 5개 초기 노출, 매물 상세 연결 확인.
- 가로 넘침 없음, 콘솔 오류 0건.
- `npm run verify:qf`: passed.
- P0/P1/P2 findings: none after fixes.

final result: passed

---

# Design QA · 판매자 위치·교통편 탭 (2026-10-15)

- source: 기존 김태규 판매자 페이지와 공개 상사 주소
- implementation route: `?profile=dealer&shop=450554&emp=1&qf=guazi&category=서울오토갤러리`
- mobile viewport: 393 × 852 px
- desktop viewport: 1280 × 900 px
- state: 위치 탭 선택

## Pass 1 — passed

- 판매차량·리뷰·소개와 동일한 1차 탭에 위치를 추가했다.
- 주소 카드는 상사명, 전체 주소, 위치 아이콘, 외부 링크 표시를 한 행에 정리했다.
- 이동수단은 모바일 2열, PC 4열로 도보·지하철·버스·차량을 배치했다.
- 도보·차량은 Google 지도 길찾기, 지하철·버스는 주변 역·정류장 검색 URL로 구분했다.
- 모바일과 PC에서 탭 폭, 텍스트 줄바꿈, 가로 넘침, 링크 접근성을 확인했다.

## Required fidelity surfaces

- fonts/typography: 제목 20/28px, 교통편 17/24px, 버튼명 14/20px 통과
- spacing/layout rhythm: 주소 카드 92px, 교통 버튼 68px, 모바일 2열·PC 4열 통과
- colors/tokens: 기존 흰 배경·회색 외곽선·검정 본문 토큰 유지
- interaction: 모든 위치·교통편 링크가 새 탭의 Google 지도 URL로 연결
- accessibility: 링크별 이동수단·목적·Google 지도 열기 이름 제공

## Verification

- `npm run verify:qf`: passed
- 모바일 393 × 852 위치 탭: passed
- PC 1280 × 900 위치 탭: passed
- 브라우저 오류·경고: 0건
- P0/P1/P2 findings: none

final result: passed

---

# 치지직 상세 · 에어비앤비 팔레트 적용 QA · 2026-10-15

- source visual truth: 저장소의 보배드림 Airbnb 토큰(`public/community/naver-write-parity.css`, `src/prototype/register/bike-register.css`)과 기존 치지직 상세 레이아웃
- color system: 브랜드 강조 `#FF385C`, 강조 눌림 `#E00B41`, 본문 `#222222`, 보조 `#717171`, 테두리 `#DDDDDD`, 연한 바탕 `#F7F7F7`
- scope: `public/community/chzzk-detail.html`만 변경하고 네이버 카페 상세페이지는 유지
- required states: 모바일·PC 기본 화면, 추천·비추 선택, 댓글 입력 포커스·등록
- mobile evidence: 390×844에서 `#FF385C` 강조색, 추천 1→2, 비추 전환 2→0, 댓글 1→2, 가로 넘침 없음, 깨진 이미지 0건
- desktop evidence: 1536×900에서 1056px 셸, `#222222` 헤더와 `#FF385C` 강조색, 가로 넘침 없음, 깨진 이미지 0건
- console: warning/error 0건
- regression: `npm run verify` 통과(관리자 29건, Sites 4건, 빌드 포함)
- final result: passed

---
# 전체 게시글 · 추천/조회 아이콘 밸런스 QA · 2026-10-16

- source visual truth: 사용자 첨부 `1000018664.jpg`의 작성자 · 날짜 · 추천 · 조회 메타 행.
- browser-rendered implementation: `http://127.0.0.1:4314/community/naver-cafe-list.html?v=20261016thumbbalance1`을 Chrome 모바일 뷰에서 확인했다.
- viewport and density: 참고 이미지 591 × 1280px, 구현 화면 390 × 844 CSS px. 전체 페이지의 콘텐츠 차이가 아니라 메타 아이콘의 크기·기준선·간격을 비교 범위로 삼았다.
- state: `전체 게시글` 기본 목록, 첫 게시물부터 썸네일 유무가 다른 여러 행이 보이는 상태.
- full-view comparison evidence: 모바일 목록의 작성자, 날짜, 추천수, 조회수가 한 줄에 유지되고 썸네일·제목·행 높이는 기존 구성을 보존했다.
- focused region comparison evidence: 메타 행 17px, 추천 엄지 16 × 16px, 조회 눈 14 × 14px이며 두 아이콘은 같은 중앙 기준선과 opacity `.68`을 사용한다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 메타 12.5px/17px와 기존 숫자 굵기를 유지했다.
- spacing and layout rhythm: 그룹 간 7px, 아이콘과 숫자 사이 1px을 유지하고 추천 아이콘의 불필요한 좌측 음수 여백을 제거했다.
- colors and visual tokens: 추천과 조회 아이콘을 같은 회색 농도 `.68`로 통일했다.
- image quality and asset fidelity: 프로젝트에 있던 Reddit식 엄지 경로를 그대로 재사용하고, SVG의 빈 내부 여백만 타이트한 viewBox로 잘라 선명도를 유지했다.
- copy and content: 추천수·조회수와 게시물 내용은 변경하지 않았다.
- interaction and console: 정적 메타 아이콘 변경이며 Chrome 콘솔 오류 0건을 확인했다.

## Comparison history

- Pass 1: 기존 18px SVG 상자 안의 빈 여백 때문에 실제 엄지 모양이 조회 눈보다 작아 보이는 P2가 있었다.
- Fix: 같은 엄지 경로를 타이트한 viewBox로 재사용하고 16px로 렌더링했다. 조회 눈은 14px을 유지했다.
- Pass 2: 두 아이콘이 같은 17px 행과 중앙 기준선에 놓이고 시각적 무게가 맞는 것을 확인했다.

final result: passed

---

# 치지직 상세 · 모바일 레퍼런스 v3 QA · 2026-10-15

- source visual truth:
  - 일반글: `.codex-remote-attachments/01a128e5-de8a-78d0-9ed9-96cbde6a07c3/05b4afa3-384c-4b00-99d0-0beffae80c58/2-1000018294.png`
  - 공지글: `.codex-remote-attachments/01a128e5-de8a-78d0-9ed9-96cbde6a07c3/05b4afa3-384c-4b00-99d0-0beffae80c58/1-1000018292.jpg`
- implementation screenshots:
  - `artifacts/chzzk-detail-reference-v3/implementation-regular-600.png`
  - `artifacts/chzzk-detail-reference-v3/implementation-notice-content-591x1150.png`
- normalized comparisons:
  - `artifacts/chzzk-detail-reference-v3/comparison-regular-content.png`
  - `artifacts/chzzk-detail-reference-v3/comparison-notice-content.png`
- viewport and density:
  - 일반글 원본 1080×3689px에서 Android 상태바 98px을 제외하고 584px 폭으로 정규화; 구현 CSS viewport 600×1280, DPR 1, 전체 캡처 584×1948px
  - 공지글 원본 591×1280px에서 상태바·시스템 내비게이션을 제외한 591×1150px 콘텐츠 영역; 구현 CSS viewport 591×1150, DPR 1
- states: 일반글 기본, 버프 16→17, 너프 전환 17→15, 댓글 입력·등록 2→3, 공지글 댓글 비활성

## Full-view comparison evidence

- 상단 흰 헤더, 이벤트 띠, 자유 게시판 라벨, 제목·작성자, 본문 스티커, 태그, 버프/너프, 전폭 배너, 최신글 카드, 댓글·답글, 맨 위로, 하단 입력창의 순서를 참고 화면과 동일하게 구성했다.
- 공지글은 일반글 헤더·댓글을 숨기고 긴 본문, 업데이트 시각, 태그, 버프/너프, 배너, 최신글, 댓글 비활성 입력창만 노출한다.
- 참고 화면의 외부 광고는 제품 맥락상 기존 보배드림 드라이브 챌린지 배너로 교체했고, 초록 서비스 강조 외에 기존 요청의 Airbnb `#FF385C` 상호작용 색을 유지했다.

## Required fidelity surfaces

- fonts/typography: Pretendard, 16–24px 위계, 제목 700대 굵기, 댓글·메타 13–17px를 확인했다.
- spacing/layout rhythm: 모바일 23–24px 좌우 여백, 64px 헤더, 65px 이벤트 띠, 20–22px 최신글 카드 반경과 전체 세로 순서를 비교했다.
- colors/tokens: 흰 표면, `#222` 본문, `#F7F7F7` 카드, `#00A86B` 게시판 라벨, `#FF385C` 상호작용 강조를 확인했다.
- image quality/assets: 생성한 고양이 본문·답글 스티커와 작성자 아바타를 실제 PNG로 배치했다. 깨진 이미지 0건이다.
- copy/content: `치지직`, 이벤트, `출첵!`, 태그, 최신글, 클린봇, 댓글/답글, 공지 안내 문구와 댓글 비활성 문구를 확인했다.
- focused region: 정규화된 전체 비교가 원본 픽셀 크기를 유지해 헤더·본문·댓글 텍스트와 아이콘이 읽히므로 별도 확대 크롭은 필요하지 않았다.

## Comparison history

- P2 before: 구현의 모바일 제목·최신글·댓글 글자가 참고 화면보다 1–2px 작아 정보 밀도가 달랐다.
- fix: 이벤트 18px, 제목 24px, 작성자 17px, 태그 16–17px, 최신글 18px, 댓글 16–17px로 조정하고 카드 높이를 늘렸다.
- post-fix: `comparison-regular-content.png`에서 제목·작성자·최신글·댓글 위계와 세로 리듬이 참고 화면에 근접했다.
- P3 accepted: 배너 문안과 Airbnb 핑크 강조은 보배드림 브랜드·직전 사용자 지시를 따르는 의도적 차이다.

## Verification

- 모바일 일반글·공지글: 가로 넘침 없음, 깨진 이미지 0건, 콘솔 warning/error 0건
- PC 1536×639: 760px 중앙 셸, 가로 넘침 없음, 깨진 이미지 0건
- `npm run verify`: passed(관리자 29건, Sites 4건, 빌드 포함)

final result: passed

---

## Latest effective result · chzzk detail v4

The v4 QA section titled `치지직 상세 · 실제 원본 글 8326278 및 PC 반응형 v4 QA` supersedes the v3 desktop-shell note above. The effective PC shell is 1060px, the default/source post id is 8326278, and Reddit-style vote/comment controls are left aligned with share on the right.

final result: passed

---

# 치지직 상세 · Notion 아이콘·원본 프로필 자산 v5 QA · 2026-10-15

- source visual truth: `https://m.game.naver.com/lounge/chzzk/board/detail/8326278`
- icon source: 사용자 제공 Notion `미국_레딧` 아이콘 데이터베이스
- implementation: `public/community/chzzk-detail.html?id=8326278`
- viewports: 모바일 394 × 852 CSS px, PC 1440 × 1000 CSS px
- scope: 치지직 전용 상세페이지만 변경; 네이버 카페 상세는 미변경

## Cross-check evidence

- 실제 치지직 API와 렌더 자산에서 쿠로토라 프로필, 꼬부기 댓글 프로필 GIF, 본문 출첵 고양이, 답글 야호 고양이를 직접 대조해 원본 파일로 교체했다.
- 모바일 표시 크기는 실제 치지직 측정값에 맞췄다: 작성자 38px, 댓글·답글 프로필 30px, 본문 스티커 139 × 120px, 답글 스티커 96 × 83px.
- 모바일 핵심 좌표는 원본과 일치한다: 상단 바 48px, 제목 시작 y=154px, 제목 18/24px, 본문 스티커 시작 y=257px(원본 251.4px, 5.6px 차이).
- 닫기·저장·더보기·버프·너프·댓글·공유·새로고침·필터·설정·맨 위로·카메라·스티커·잠금 아이콘을 Notion 원본 벡터 경로로 치지직 전용 폴더에 분리했다.
- 버프는 추천(엄지 위), 너프는 비추천(엄지 아래) 의미를 유지하고 Reddit식 좌측 반응 배치·우측 공유 배치를 보존했다.
- Airbnb 상호작용 색상은 선택 시 `#E00B41` / `#FFF1F4`로 유지했다.

## Verification

- 모바일: 가로 넘침 없음, 깨진 이미지 0건, 콘솔 warning/error 0건.
- PC: 1060px 중앙 셸, 가로 넘침 없음, 깨진 이미지 0건.
- 상호작용: 버프 16→17, 너프 전환 17→15, 댓글 2→3 통과.
- `npm run verify`: 관리자 29건, Sites 4건, 타입 검사·프로덕션 빌드 전체 통과.
- P0/P1/P2 findings: none.

final result: passed

---

# 딜러 프로필 · 통계 좌측 정렬 및 전화번호 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/97b6a156-eacf-4641-b60c-5699928a1226/1-1000018358.jpg`
- implementation: 로컬 딜러 프로필, IAB 393 × 852 CSS px
- scope: 닉네임 아래 판매중·판매완료·팔로워 좌측 정렬, 프로필 정보 전화번호 추가

## Cross-check evidence

- 세 통계 셀의 콘텐츠를 각 열의 왼쪽 시작선에 맞추고 첫 열을 딜러명 시작선과 일치시켰다.
- 프로필 연락 정보에 전화 아이콘과 `02-2059-5211`을 추가했다.
- 전화번호는 `tel:0220595211` 링크로 연결해 모바일에서 바로 통화할 수 있게 했다.
- 전화번호 다음에 딜러 경력과 리뷰가 이어지도록 기존 정보 위계를 유지했다.

## Verification

- 모바일 393 × 852: 통계 3열 `align-items: flex-start` 확인
- 전화 링크 및 표시 텍스트: passed
- 가로 넘침: 0px
- P0/P1/P2 findings: none

final result: passed

---

# 딜러 프로필 · 인스타그램형 헤더·행동 버튼 QA · 2026-10-15

- source visual truth:
  - `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/e701f2ea-c867-4db2-95b7-e129f14146cc/1-1000018360.jpg`
  - `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/e701f2ea-c867-4db2-95b7-e129f14146cc/2-1000018364.jpg`
- implementation capture: Codex IAB `393 × 852` 로컬 렌더 캡처
- state: 팔로잉 기본 상태, 판매차량 탭 선택, 메시지 알림 표시
- density normalization: CSS viewport와 구현 캡처 모두 393 × 852, 별도 배율 변환 없음

## Full-view comparison evidence

- 인스타그램 참고 화면처럼 상단 뒤로가기 바로 오른쪽에 상사명 `투제이모터웍스`를 배치했다.
- 프로필 소개 아래에 `팔로잉 · 메시지 보내기 · 전화 걸기 · 공유` 네 행동을 같은 높이의 버튼 한 줄로 구성했다.
- 딜러 경력은 좌측 x=16px, 리뷰는 우측 끝 x=367px에 맞춰 한 줄 양끝 정렬했다.
- 기존 배너·프로필·통계·소개·주소 흐름은 유지해 사용자가 요청하지 않은 영역의 구조 변경을 피했다.

## Focused comparison evidence

- 상단 헤더에서 상사명이 말줄임 가능한 단일 행으로 표시되고 검색·더보기 아이콘과 충돌하지 않음을 확인했다.
- 393px 폭에서 네 버튼의 전체 문구가 줄바꿈 없이 노출되고 가로 넘침이 0px임을 확인했다.
- 전화 버튼은 `tel:0220595211`, 메시지 버튼은 딜러명 포함 상태 알림, 팔로잉 버튼은 팔로우/팔로잉 양방향 전환을 검증했다.

## Required fidelity surfaces

- fonts/typography: 기존 Pretendard와 12–17px 모바일 위계를 유지
- spacing/layout rhythm: 헤더 50px, 버튼 34px, 6px 간격, 경력·리뷰 한 줄 양끝 정렬 통과
- colors/tokens: 흰 배경, `#222` 본문, `#f6f6f6` 버튼, `#dedede` 외곽선 유지
- image quality: 기존 딜러 사진과 페라리 영상 배너 자산 유지
- copy/content: 상사명, 팔로잉, 메시지 보내기, 전화 걸기, 공유, 딜러 경력, 리뷰 수 확인

## Verification

- 팔로잉 → 팔로우 → 팔로잉 전환: passed
- 메시지 알림: passed
- 전화 링크: passed
- 브라우저 콘솔 error: 0건
- P0/P1/P2 findings: none

final result: passed

---

# 딜러 프로필 · 행동 버튼 하단 이동 QA · 2026-10-15

- implementation capture: Codex IAB 393 × 852 로컬 렌더
- intended order: 응답률 → 주소 → 전화번호 → 딜러 경력·리뷰 → 행동 버튼
- measured y positions: 응답률 338px, 주소 372px, 전화번호 406px, 경력·리뷰 440px, 행동 버튼 476px
- 행동 버튼 네 개의 한 줄 표시와 가로 넘침 0px을 확인했다.
- P0/P1/P2 findings: none

final result: passed

---

# 딜러 프로필 · 내차시세문의 행동 교체 QA · 2026-10-15

- implementation capture: Codex IAB 393 × 852 로컬 렌더
- actions: 팔로잉 · 메시지 보내기 · 전화 걸기 · 내차시세문의
- 공유 버튼 제거 및 내차시세문의 버튼 추가를 확인했다.
- 문의 버튼의 표시 폭은 98px이며 문구 잘림, 버튼 행 넘침, 페이지 가로 넘침은 모두 0px이다.
- 내차시세문의 선택 시 `내 차 시세 문의를 준비 중이에요` 상태 알림을 확인했다.
- P0/P1/P2 findings: none

final result: passed

---

# 딜러 프로필 · 초톳 행동 버튼 및 리뷰 인접 배치 QA · 2026-10-15

- implementation capture: Codex IAB 393 × 852 로컬 렌더
- 딜러 경력 우측 14px 지점에 별점과 리뷰 링크를 인접 배치했다.
- 행동 버튼은 흰 바탕, `#d7d7d7` 1px 테두리, 8px 곡률, `0 1px 3px rgba(0,0,0,.12)` 그림자로 초톳형 스타일을 적용했다.
- 네 버튼의 한 줄 표시와 페이지 가로 넘침 0px을 확인했다.
- P0/P1/P2 findings: none

final result: passed
# 딜러 프로필 · 초톳 크기 행동 버튼 및 내차시세문의 탭 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/231dae6d-7900-452b-ac42-41e074ed47e1/1-1000018374.jpg`
- implementation evidence: CUA browser tab `117`, `http://127.0.0.1:4211/?profile=dealer&shop=450554&emp=1&qf=guazi`에서 캡처·화면 출력
- viewport: 구현 394 × 852 CSS px, deviceScaleFactor 1 / 원본 592 × 1280 px Android 캡처
- normalization: 전체 화면 복제가 아니라 원본의 CTA 영역을 기준으로 너비 비율·높이·캡슐 반경을 비교했다. 구현 버튼은 각 171px(가용 폭의 약 46%), 높이 46px, `999px` 반경이다.
- state: 김태규 딜러 프로필, 판매차량 기본 탭 및 내차시세문의 선택 탭

**Findings**

- P0/P1/P2 없음.
- 원본처럼 주요 행동을 가로 2분할 캡슐 버튼으로 정리했고 `팔로잉`, `메시지 보내기`를 동일 크기로 맞췄다.
- 중복되던 전화 버튼은 프로필의 `02-2059-5211` 전화 링크로 유지하고, `내차시세문의`는 독립 1차 탭으로 이동했다.
- 여섯 개 탭은 394px 모바일에서 한 줄을 유지하며 문구 잘림과 페이지 가로 오버플로가 없다.
- 시세 문의 탭은 차량번호·소유자명 입력 전 비활성, 유효 입력 후 활성, 제출 후 `김태규 딜러에게 시세 문의를 접수했어요` 상태 알림까지 정상 동작한다.

**Required fidelity surfaces**

- fonts/typography: Pretendard 15px/700 버튼 텍스트로 원본의 굵고 중앙 정렬된 CTA 위계를 유지했다.
- spacing/layout rhythm: 2열 10px 간격, 46px 높이, 좌우 16px 패딩, 완전한 캡슐 반경으로 원본 버튼 비율을 반영했다.
- colors/tokens: 기존 초톳형 흰 배경·`#d7d7d7` 경계선을 유지해 이번 요청의 사이즈 변경만 반영했다.
- image quality: 이번 변경 범위는 버튼과 탭이며 신규 이미지 자산이 없다. 기존 프로필·배너 자산은 유지했다.
- copy/content: `내차시세문의`를 독립 탭으로 추가하고 문의 목적과 입력 항목을 명확히 표시했다.

**Interaction and runtime checks**

- `npm run build`: passed
- mobile runtime integrity: passed (28 protected files)
- 팔로잉 토글 및 메시지 버튼 노출: passed
- 내차시세문의 탭 전환: passed
- 차량번호·소유자명 입력, CTA 활성화, 제출 상태 알림: passed
- horizontal overflow: 0px
- browser console errors: 0

**Comparison history**

- initial implementation: 작은 4분할 34px 버튼이라 원본의 주 행동 버튼 대비 밀도가 높았다.
- fix: 중복 행동을 정리하고 2분할 46px 캡슐 버튼으로 변경, 내차시세문의를 독립 탭과 작동하는 문의 폼으로 분리했다.
- post-fix evidence: 394 × 852 브라우저 캡처에서 버튼 171 × 46px, 탭 6개, 오버플로 0px 확인.

final result: passed

# 딜러 프로필 · 리뷰 탭과 연락 행동 확장 QA · 2026-10-15

- implementation: 김태규 딜러 프로필, 394 × 852 CSS px
- 프로필 역할 표기를 `(주)투제이모터웍스 · 대표` 순서로 수정했다.
- 행동 버튼은 `팔로잉 · 채팅하기 · 전화하기` 3개이며 각각 112 × 46px로 동일하다.
- 1차 탐색에 `리뷰`를 추가해 총 7개 탭을 가로 스크롤로 제공한다.
- 선택 탭 밑줄은 높이 3px, `#222`로 확인했다.
- 리뷰 탭 선택 시 리뷰 본문과 선택 상태가 정상 노출된다.
- navigation scroll width 532px / client width 383px, page horizontal overflow 0px.
- browser console errors: 0
- `npm run build`: passed
- mobile runtime integrity: passed

final result: passed

# 딜러 프로필 · 행동 아이콘 축소 및 커뮤니티 탭 QA · 2026-10-15

- implementation: 김태규 딜러 프로필, 394 × 852 CSS px
- 행동 버튼 3개에 초톳 팔로우·채팅·전화 아이콘을 적용했다.
- 각 버튼은 113 × 38px로 축소했고 텍스트·아이콘 중앙 정렬을 확인했다.
- 탭 순서는 `홈 · 판매차량 · 커뮤니티 · 내차시세문의 · 리뷰 · SNS · 소속딜러 · 소개`다.
- 커뮤니티는 판매차량 바로 옆에 위치하며 선택 시 게시물 3개와 글쓰기 버튼이 노출된다.
- 선택 밑줄 3px, page horizontal overflow 0px, console errors 0.
- `npm run build`: passed
- mobile runtime integrity: passed

final result: passed

# 딜러 프로필 · 팔로잉 체크 아이콘 상태 QA · 2026-10-15

- 팔로우 전에는 기존 팔로우 아이콘을 표시한다.
- 팔로잉 상태에서는 하트 채움 대신 초톳 계열 체크 마크 아이콘을 표시한다.
- 동일 버튼에서 `aria-pressed`와 아이콘 소스가 함께 전환된다.
- `npm run build`: passed
- mobile runtime integrity: passed

final result: passed

---

# Chợ Tốt feed view design QA

**Source visual truth paths**

- `C:\Users\bobae\AppData\Local\Temp\nhatot-live-mobile-top.png`
- `C:\Users\bobae\AppData\Local\Temp\nhatot-live-desktop-0650.png`

**Implementation screenshot paths**

- `C:\Users\bobae\.codex\worktrees\naver-cafe-list-fidelity-1015\artifacts\community-chotot-feed-1015\mobile-390x844-viewport.png`
- `C:\Users\bobae\.codex\worktrees\naver-cafe-list-fidelity-1015\artifacts\community-chotot-feed-1015\desktop-1200x900-viewport.png`

**Viewport and normalization**

- Mobile: source 390 × 844 px; implementation 390 × 844 px; CSS viewport 390 × 844; deviceScaleFactor 1.
- Desktop: source 1200 × 900 px; implementation 1200 × 900 px; CSS viewport 1200 × 900; deviceScaleFactor 1.
- Both comparisons use equal pixel dimensions and equal density. No resampling was required.
- State: initial feed view, first post visible, gallery closed, reaction controls inactive.

**Full-view comparison evidence**

- `C:\Users\bobae\.codex\worktrees\naver-cafe-list-fidelity-1015\artifacts\community-chotot-feed-1015\comparison-mobile.png`
- `C:\Users\bobae\.codex\worktrees\naver-cafe-list-fidelity-1015\artifacts\community-chotot-feed-1015\comparison-desktop.png`
- The source is on the left and the implementation is on the right in each image.

**Focused region comparison evidence**

- A separate crop was not needed. The 1:1 mobile comparison makes author typography, body copy, 194 px media rail, image counter, and action pills readable. The 1:1 desktop comparison makes the 240 px rail, mixed media widths, arrow affordances, card spacing, and action alignment readable.

**Findings**

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: Pretendard hierarchy and weights preserve the compact source-feed density while using Korean content. Titles, metadata, body copy, and action counts wrap and truncate consistently.
- Spacing and layout rhythm: the implementation matches the source's single-column feed, fixed-height horizontal media rail, narrow inter-image gaps, rounded media, and compact action row. The surrounding community board header is intentionally retained because this is a viewing mode, not a broker-profile clone.
- Colors and visual tokens: neutral gray surfaces and white cards match the source structure. `#238FE3` is intentionally used for active states to preserve the requested board blue instead of Chợ Tốt orange.
- Image quality and asset fidelity: production car assets render sharply with cover treatment inside four supported aspect classes. Source-style rail arrows use the checked-in Chợ Tốt assets; votes, comments, share, save, and overflow use the checked-in Reddit-style icon assets requested for this board.
- Copy and content: source feed behaviors are translated to Korean community copy, including source/time metadata, `더보기`, image count, and board-specific reactions.

**Primary interactions tested**

- Selecting `피드형 · 초톳` from the existing viewing-mode sheet.
- Direct `?view=chotot` route.
- Mobile horizontal media overflow and desktop arrow-ready overflow.
- Body `더보기` expand/collapse.
- Recommendation vote toggle, save toggle, comments navigation hook, full-screen image/video gallery open/close.
- Body horizontal overflow check at both viewports.
- Browser console checked; zero errors after the page favicon was declared.

**Comparison history**

- Pass 1: no P0/P1/P2 fidelity issues found in the normalized side-by-side comparisons. No visual fix iteration was required after this comparison.

**Implementation checklist**

- [x] Add the mode to both view selectors.
- [x] Preserve existing list, Reddit, and Naver Cafe modes.
- [x] Support 3:4, tall, square, landscape, video, mixed, single-media, multi-media, and text-only scenarios.
- [x] Verify mobile and desktop renderings and interactions in Chrome.

**Follow-up polish**

- None required for handoff.

final result: passed

---

# 커뮤니티 작성자·댓글·답글 전체 프로필 이미지 QA · 2026-10-15

- 자체 생성한 로컬 SVG 프로필 이미지 48개를 `public/community/assets/profile-avatars/`에 추가했다.
- 같은 닉네임은 목록·상세·댓글·답글에서 항상 같은 프로필 이미지를 사용한다.
- 게시글 작성자 30명과 5개 상세 시나리오의 댓글·답글 전부를 로컬 이미지로 연결했다.
- Reddit형 피드 5개 카드와 네이버 카페형 피드·목록의 프로필 이미지도 같은 원천을 사용한다.
- 외부 DiceBear·Pravatar 프로필 주소를 화면 데이터 경로에서 제거했다.
- 상세 시나리오 5개: 작성자·댓글·답글 이미지 누락 0, 깨짐 0, 외부 URL 0.
- Reddit형 피드: 프로필 이미지 5/5 로컬 로드, 깨짐 0, 작성자별 중복 0.
- implementation capture: `artifacts/community-detail-scenarios-1015/scenario-1-mobile-384.png`
- 모바일 가로 오버플로: 0px (`384/384`)
- P0/P1/P2 findings: none

final result: passed

---

# 탑메뉴 게시판 · TikTok 텍스트 대조 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0fe77-a06f-7a82-91f7-7cb79bab19bf/e0824bd2-af7f-4a21-a3ca-5683447ce7ae/1-1000018428.jpg`
- implementation screenshot: `artifacts/community-board-order-1015/mobile-384-top-menu-tiktok-text.png`
- focused comparison: `artifacts/community-board-order-1015/tiktok-vs-bobae-top-menu-text.png`
- viewport: 구현 384 × 844 CSS px, DPR 1 / 원본 591 × 1280px Android 캡처
- normalization: 원본 탭 영역을 384px 폭으로 정규화하고 구현의 384px 탑메뉴 영역과 같은 비교 이미지에 배치했다.
- state: 상단 게시판 탭 `자유` 선택, 가로 메뉴 기본 위치

## Findings

- P0/P1/P2 없음.
- fonts and typography: 탭 글자 16px, 선택 700, 비선택 600, 자간 -0.3px로 TikTok의 선택/비선택 위계에 맞췄다.
- spacing and layout rhythm: 행 높이 44px, 항목 간격 22px, 좌측 시작 16px로 조정했다.
- colors and tokens: 선택 `#111214`, 비선택 `#73767c`를 사용했다. TikTok보다 비선택 색을 약간 진하게 유지한 것은 흰 배경 가독성을 위한 의도적 P3 차이다.
- image quality and asset fidelity: 이번 범위는 텍스트 탭이며 신규 래스터 자산이 없다. 기존 메뉴 SVG는 변경하지 않았다.
- copy and content: 축약 게시판명과 전체 원문 접근성 이름을 그대로 유지했다.
- focused comparison: 글자 굵기·기준선·밑줄이 충분히 읽히므로 별도 추가 확대 크롭은 필요하지 않았다.

## Comparison history

- Pass 1: 기존 50px 행, 선택 760, 비선택 520, 자간 -0.70px, 3px 밑줄로 TikTok보다 대비가 거칠고 행이 높았다.
- Fix: 44px 행, 16px 글자, 선택 700, 비선택 600, 자간 -0.3px, 2px 밑줄과 좌우 6px 확장을 적용했다.
- Pass 2: 정규화 비교에서 텍스트 계층·메뉴 밀도·선택 밑줄이 일치했고 360/384/412/1280px 테스트에서 잘림과 가로 오버플로가 없었다.

final result: passed

---

# 바이두형 게시판 채널 관리 QA · 2026-10-15

- source visual truth: Google Drive `1VpPkHQBgb15f7_ma6NhtCxr_NIaFKaHL`의 바이두 채널 목록·편집 영상 및 캡처
- implementation screenshots: `artifacts/community-board-order-1015/mobile-384-channel-normal.png`, `mobile-384-channel-edit.png`, `pc-1280-channel-normal.png`
- comparison image: `artifacts/community-board-order-1015/baidu-vs-bobae-edit.png`
- viewport: 모바일 384px CSS 폭 / PC 1280px CSS 폭
- state: 채널 기본·편집·제거·재추가·순서 변경

## Findings

- P0/P1/P2 없음.
- 모바일 4열, PC 6열이며 `전체 · 베스트`를 첫 두 칸 고정 항목으로 유지했다.
- `게시판 · 자료실` 분류와 편집·완료·기본 순서 상태를 구현했다.
- 기본 상태에서 채널을 누르면 해당 게시판으로 이동하고 패널이 닫힌다.
- 편집 상태에서 이동 가능한 30개 채널은 제거·재추가·드래그·키보드 순서 변경이 가능하다.
- 저장값은 v2 구조로 유지되며 기존 v1 순서는 자동 이전된다.
- 360 / 384 / 412 / 1280px 가로 넘침과 런타임 오류 0건이다.

## Comparison history

- Pass 1: 삭제 배지가 패널 폭 밖으로 밀려 모바일 편집 화면이 수평 이동했다.
- Fix: 패널 가로 오버플로를 차단하고 배지를 타일 안쪽으로 조정했다.
- Pass 2: 바이두 편집 화면과 구현의 4열 구조를 비교해 남은 P0/P1/P2가 없음을 확인했다.

final result: passed

---

# 커뮤니티 채널 메뉴 · 모바일 3열 QA · 2026-10-15

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a128e5-de8a-78d0-9ed9-96cbde6a07c3/aac2161d-8117-4017-9cb3-bfcd1d26a268/1-1000018476.jpg`
- implementation screenshot: `artifacts/community-board-order-1015/mobile-592-channel-normal.png`
- comparison image: `artifacts/community-board-order-1015/comparison-592-source-vs-3col-equal-height.png`
- viewport: source 592 × 1280px, implementation 592 × 1280 CSS px, device scale 1.
- state: 상단 전체 메뉴 햄버거의 채널 목록이 열린 상태.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 기존 Pretendard 계층과 13px 채널명을 유지하며 긴 게시판명도 한 줄 중앙 정렬된다.
- spacing and layout rhythm: 모바일 그리드는 3열을 유지하고 타일을 약 181 × 62px, 열 간격 9px, 행 간격 14px, 반경 10px로 맞췄다. 첨부 이미지의 실측 타일 높이 61~62px와 행 간격 13~14px을 반영했다.
- colors and visual tokens: 참고 화면의 옅은 회색 카드와 흰 배경 대비를 기존 커뮤니티 토큰으로 유지했다.
- image quality and asset fidelity: 변경 범위는 텍스트 채널 타일이며 신규 이미지 자산이나 대체 아이콘은 없다.
- copy and content: 32개 채널명, `전체 · 베스트` 고정 항목, 게시판·자료실 분류를 그대로 유지했다.
- responsiveness: 360 / 384 / 412 / 592px은 3열, 1280px은 6열이다. 가로 오버플로와 텍스트 잘림이 없다.
- accessibility and interaction: 키보드 상하 이동 계산도 모바일 3열에 맞췄고, 채널 선택·편집·제거·재추가 흐름이 통과했다.
- browser evidence: Chrome에서 592 × 1280으로 열어 3열, 32개 타일 모두 62px 높이, 14px 행 간격, 패널 폭 592px을 확인했다. 콘솔 오류는 없었다.

## Comparison history

- Pass 1: 기존 4열은 모바일에서 카드 폭이 좁고 정보가 촘촘했다.
- Fix: 모바일 3열을 적용하고 592px 회귀 캡처를 추가했다.
- Pass 2: 사용자 후속 이미지의 카드 높이를 실측해 56px에서 62px로, 행 간격을 10px에서 14px로 조정했다.
- Pass 3: 동일 592 × 1280 비교에서 모든 타일 높이가 참고 이미지와 일치했고 남은 P0/P1/P2가 없음을 확인했다.

final result: passed
# PC 메인 탑메뉴·Pretendard QA · 2026-10-15

- source visual truth: 기존 공개 PC 시안 `https://bobaekimboae.github.io/bobaedream/?qf=guazi&pc=1&v=0dc12792`의 헤더 구조·색·높이와 사용자 지정 메뉴 문구.
- browser-rendered implementation: `http://127.0.0.1:4311/?qf=guazi&pc=1` (1440×900 및 1024×768 브라우저 캡처를 이 작업에서 확인).
- viewport and density: 1440 × 900 CSS px, 1024 × 768 CSS px, DPR 1. 모바일 비영향 검사는 390 × 844 CSS px에서 수행했다.
- state: 전체차량 선택, `더보기` 드롭다운 열림. 추가로 건설기계 선택 후 결합 메뉴 활성 상태를 확인했다.
- full-view comparison evidence: 기존 117px 헤더, 로고, 검색, 우측 아이콘의 위치·색·배경은 유지하고 GNB만 요청한 9개 항목으로 교체했다. 1440px에서 가로 오버플로 0px.
- focused region evidence: 1440px에서 기본 메뉴 16px/600, 홈 15px/500, 선택 메뉴 16px/700을 실측했다. 1024px에서는 반응형 14px과 10px 간격으로 모든 9개 메뉴가 검색창 왼쪽에 노출된다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: `Pretendard Variable`, Pretendard 우선 스택이 계산 스타일에 적용됐다. 기본 16px/600, 선택 700, 좁은 PC 14px 규칙으로 계층과 가독성을 유지한다.
- spacing and layout rhythm: 1440px은 메뉴 간격 18px, 1024px은 10px이다. 기존 54px GNB 높이와 3px 활성 밑줄을 유지했다.
- colors and visual tokens: 기존 `#1b4c8c` 활성색, 흰 헤더, `#ebebeb` 경계와 드롭다운의 중립 톤을 유지했다.
- image quality and asset fidelity: 로고·검색·사용자·찜·채팅·알림·메뉴 아이콘 원본 자산을 변경하지 않았다. 더보기 화살표도 기존 `icons/bb/chevron-down.svg`를 재사용했다.
- copy and content: `홈 / 전체차량 / 중고차 / 화물-특장-중기 / 바이크 / 캠핑카 / 부품-용품 / 커뮤니티 / 더보기` 순서를 정확히 적용했다.
- interaction: 전체차량·중고차·바이크·캠핑카·부품/용품은 실제 카테고리로 이동하고, 결합 메뉴는 화물·특장·건설기계·자재운반장비 상태를 함께 강조한다. 더보기는 수입차·건설기계·자재운반장비·올드카 메뉴를 열고 바깥 클릭으로 닫힌다.
- browser verification: 1440px과 1024px 가로 오버플로 0px, 콘솔 오류 0건. 390px에서는 PC 헤더가 렌더링되지 않고 기존 모바일 화면만 유지된다.

## Comparison history

- Pass 1: 1440px은 통과했지만 1024px에서 16px/18px 메뉴가 검색창과 겹쳐 `더보기`가 가려지는 P2를 확인했다.
- Fix: 820~1199px 범위에 14px 글자와 10px 메뉴 간격을 적용했다.
- Pass 2: 1024px에서 9개 메뉴의 오른쪽 끝 510.9px, 검색창 왼쪽 535.7px으로 24.8px 여유를 확인했다. 1440px 기본 16px 규칙과 드롭다운도 재확인했다.

final result: passed

---
# 전체 게시글 · 추천 엄지척 아이콘 QA · 2026-10-16

- source visual truth: 사용자의 후속 지시 `보트 아이콘 아닌 엄지척`과 기존 프로젝트의 `public/community/assets/detail-parity/reddit-recommend.svg`.
- implementation: `public/community/naver-cafe-list.html`의 일반 게시글 추천 메타 아이콘.
- viewport: 모바일 393×844, 기본 `전체 게시글` 상태.
- fonts and typography: 제목 16px, 메타 13px를 유지했다.
- spacing and layout rhythm: 추천 아이콘 슬롯 14px와 행 높이 70px를 유지했다.
- colors/tokens: 기존 회색 메타 색과 동일한 `#4B4B4B` 엄지척 자산을 사용했다.
- image quality and asset fidelity: 기존 상향 투표 화살표를 프로젝트에 이미 포함된 실제 엄지척 SVG 자산으로 교체했다.
- copy and content: 게시판명·제목·추천수·조회수 문구는 변경하지 않았다.
- interaction and console: 정적 메타 아이콘 교체로 기존 목록 동작을 보존했으며 브라우저 콘솔 오류 0건을 확인했다.
- full-view comparison evidence: 전체 게시글 모바일 목록에서 추천 수 앞 아이콘이 엄지척으로 표시되고 조회 눈 아이콘과 14px 시각 무게로 정렬됐다.
- focused region comparison evidence: 첫 일반 게시글 메타의 추천 아이콘 `img`가 `reddit-recommend.svg`를 사용하고 14×14px로 렌더링되는지 확인했다.
- comparison history: P2 — 상향 투표 화살표가 사용자의 의미 요구와 달랐다. 기존 엄지척 자산으로 교체해 해소했다.
- final result: passed

---
# 전체 게시글 · 치지직 그린 추천 아이콘 QA · 2026-10-16

- source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a128e5-de8a-78d0-9ed9-96cbde6a07c3/05b4afa3-384c-4b00-99d0-0beffae80c58/2-1000018294.png`의 치지직 초록 강조 텍스트와 기존 페이지 토큰 `#00A862`.
- browser-rendered implementation: `http://127.0.0.1:4173/community/naver-cafe-list.html?v=20261016chzzkgreen1`을 Chrome에서 캡처해 현재 작업에서 확인했다.
- viewport and density: 구현 페이지는 393px 고정 콘텐츠 폭으로 렌더링했으며 브라우저 캡처는 1536 × 695 CSS px이다. 색상·아이콘 메타 영역을 비교 범위로 삼았다.
- state: `전체 게시글` 기본 목록, 추천수와 조회수가 함께 보이는 첫 게시물 행.
- full-view comparison evidence: 목록 구조·제목·썸네일·메타 행 간격은 기존 상태를 유지하고 추천 엄지에만 치지직 초록을 적용했다.
- focused region comparison evidence: 추천 엄지 16 × 16px, opacity `1`, fill `#00A862`; 조회 눈 14 × 14px, opacity `.68`로 의미 계층이 분리된다.

## Findings

- P0/P1/P2 없음.
- fonts and typography: 메타 12.5px/17px와 기존 숫자 굵기·줄높이를 유지했다.
- spacing and layout rhythm: 추천·조회 아이콘 크기와 기준선, 그룹 간격을 변경하지 않았다.
- colors and visual tokens: 치지직 화면에서 사용 중인 강조색 `#00A862`를 추천 엄지에만 적용했다. 회색 조회 아이콘과 충분히 구분된다.
- image quality and asset fidelity: Notion `좋아요` SVG의 기존 Reddit식 엄지 경로를 유지하고 fill만 토큰 색으로 변경했다.
- copy and content: 추천수·조회수·게시글 문구를 변경하지 않았다.
- interaction and console: 정적 색상 변경이며 가로 오버플로 0px, Chrome 콘솔 오류 0건을 확인했다.

## Comparison history

- Pass 1: 회색 엄지와 회색 조회 아이콘이 가까이 있어 의미 구분이 약했다.
- Fix: 추천 엄지에 치지직 그린 `#00A862`를 100% 불투명도로 적용하고 조회 아이콘은 기존 회색 `.68`을 유지했다.
- Pass 2: 목록 전체 리듬을 유지하면서 추천 지표만 즉시 식별되는 것을 확인했다.

final result: passed

## 베스트게시판 보기방식 2종 · 시나리오 확장 QA · 2026-10-17

- `라운지 인기글형`: 기존 순위 숫자 + 우측 56×56 썸네일 구성을 기본값으로 보존했다.
- `라운지 간결형`: 순위 숫자를 제거하고 본문 시작점을 x=20px로 넓혔으며, 우측 썸네일은 x=299.2px / 56×56px로 유지했다.
- 보기방식은 `bbm.community.bestView.v1`에 저장하며, 베스트게시판 재방문·새로고침 뒤 선택한 형식이 복원된다.
- 게시판 메뉴보기 → 보기 방식에서 세 형식(순위+우측 썸네일 / 순위 없음+우측 썸네일 / 순위 없음+좌측 썸네일)을 선택할 수 있고, 직접 URL의 `view=lounge-best-rank|lounge-best-clean|lounge-best-left`도 지원한다.
- 베스트 전용 시나리오 50개를 추가해 총 56개 게시물을 두 보기방식에서 검증했다.
- 모바일 390×844 실측: 인기글형 글자 x=58px / 간결형 글자 x=20px / 썸네일 우측 x=299.2px / 가로 넘침 0px.
- 브라우저 검증: 인기글형 순위 56개, 간결형 순위 0개, 재방문 복원 성공, 경고·오류 0건.

## 베스트글 — 네이버 랭킹뉴스형 (2026-10-17)

- source visual truth: `https://media.naver.com/press/081/ranking?type=popular&date=20261017`
- source capture: Chrome, 모바일 390×844 및 PC 1280×900 상단·목록 스크롤 캡처
- implementation target: `/community/naver-cafe-list.html?board=best&view=naver-ranking-news`
- 비교 기준: 모바일 순위 22px, 제목 16/21px 2줄, 조회수 14~15px, 우측 썸네일 74×74·radius 4px
- PC 원본은 2열이나 현재 시안의 `.phone`이 PC에서도 393px로 고정되는 기존 규칙을 보존해 중앙 모바일 1열로 표시한다. 외부 viewport 기준 2열을 강제하면 제목 폭이 0이 되는 회귀가 확인되어 적용하지 않았다.
- 콘텐츠·이미지는 네이버에서 복제하지 않고 기존 보배드림 베스트글 56개와 저장소 자산을 사용한다.
- 주요 상호작용: 많이 본·댓글 많은·추천 많은 탭 정렬, 집계 안내 팝오버, 보기 방식 저장
- full-view / focused comparison: 모바일 상단 탭과 1~5위 행, PC 2열 그룹을 각각 같은 viewport에서 비교한다.
- browser-rendered evidence: 로컬 Chrome에서 390×844, 360×844, 412×844, PC 1280×900으로 렌더링 확인
- 모바일 390px 실측: 순위 x=20 / 제목 x=54·폭 211.2·높이 42 / 썸네일 x=281.2·74×74 / 가로 넘침 0
- 반응형 실측: 360px에서는 썸네일 70×70·가로 넘침 0, 412px에서는 74×74·가로 넘침 0
- PC 회귀 검증: 기존 393px 중앙 프레임 유지, 행 353×88·제목 폭 229·썸네일 74×74·가로 넘침 0
- 상호작용: 많이 본·댓글 많은·추천 많은 정렬 전환, 선택 탭 aria-selected, 집계 안내 팝오버, 보기방식 메뉴 노출, 재방문 복원 확인
- 콘솔 경고·오류: 0건
- full-view comparison: 모바일 원본과 구현 모두 3탭 → 랭킹 제목 → 순위/2줄 제목/메타/우측 이미지의 동일 계층을 유지한다.
- focused comparison: 원본 모바일 첫 행의 x=20/54/281.2와 구현 첫 행의 x=20/54/281.2, 썸네일 74×74를 대조했다.
- findings: P0/P1/P2 없음. 네이버 콘텐츠·상표 자산을 복제하지 않고 보배드림 데이터로 치환한 차이만 의도적으로 남겼다.
- comparison history: 초기 PC 외부 viewport 기준 2열 규칙에서 393px 프레임 내부 제목 폭이 0이 되는 P1을 발견했다. 2열 미디어 규칙을 제거하고 기존 중앙 모바일 프레임 1열로 복원한 뒤 제목 폭 229px, 넘침 0을 재확인했다.
- final result: passed
- 자동 검증: `npm run check:runtime`, `npm run test:sites`, `npm run build` 모두 통과.

## 좌측 썸네일형 복원 · 네이버 랭킹뉴스형 정밀 보정 QA (2026-10-17)

- source visual truth: `https://media.naver.com/press/081/ranking?type=popular&date=20261017`
- implementation: `/community/naver-cafe-list.html?board=best&view=naver-ranking-news` 및 `view=lounge-best-left`
- viewport and density: 원본·구현 모두 Chrome 390×844 CSS px, device scale 1. 브라우저 스크롤바를 제외한 콘텐츠 폭은 375.2px로 동일하다.
- full-view comparison evidence: 같은 실행에서 원본과 구현을 연속 캡처해 3개 랭킹 탭 → 제목 → 순위/2줄 제목/조회수/우측 이미지 계층을 대조했다.
- focused region comparison evidence:
  - 탭 높이 44px, 선택 글자 15/21px·700, 밑줄은 글자 폭 기준.
  - 제목 영역 높이 39px, 위 여백 10px, 내부 위 패딩 14px, 제목 18/25px·700.
  - 첫 행 x=20px·폭 335.2px·높이 75px, 이후 행 간격 13px, 구분선 없음.
  - 순위 x=20px·22/24px·600, 제목 x=54px·폭 211.2px·16/21px, 메타 x=54px·15/18px.
  - 썸네일 x=281.2px·74×74px·radius 4px.
- responsive evidence: 360px에서 썸네일 70×70·가로 넘침 0, 412px에서 74×74·가로 넘침 0.
- interaction evidence: 많이 본·댓글 많은·추천 많은 탭이 각각 `aria-selected`를 갱신하고 첫 결과 및 숫자를 바꾼다. 다시 많이 본으로 복귀한다.
- left-thumbnail evidence: `lounge-best-left` 직접 URL에서 행 56개·이미지 56개, 행 x=20px·폭 335.2px, 썸네일 x=20px·56×56px, 글자 x=88px, 가로 넘침 0.
- colors/tokens: 네이버의 구조·간격만 참고하고 보배드림 색상·콘텐츠·저장소 이미지 자산을 유지했다.
- accessibility: 화면에는 눈 아이콘과 숫자만 표시하고, `조회수`·`댓글수`·`추천수`는 스크린리더용 `.blind` 텍스트로 보존했다.
- console: 페이지 자체 warning/error 0건. Chrome 제어 확장 초기화 `log`만 존재한다.
- comparison history:
  - P1: 후속 요청을 잘못 해석해 기존 좌측 썸네일형을 제거했던 회귀를 발견했다. 보기 방식·직접 URL·저장값을 모두 복원했다.
  - P2: 초기 랭킹뉴스형의 행 높이·구분선·제목 굵기·메타 표기·선택 밑줄 폭이 원본과 미세하게 달랐다. 원본 실측값으로 재보정했다.
  - P3: PC에서도 393px 중앙 모바일 프레임을 유지하는 것은 기존 제품 규칙이므로 변경하지 않았다.
- automated verification: `node --check`, `npm run build`, `npm run test:sites`, `git diff --check` 통과.

final result: passed

## 말머리 — 틱톡형 알약칩 (2026-10-17)

- source visual truth: Google Drive `틱톡 알약칩.png` (`1D0AC68qOuGrga5rP2AihAGTBbOS5Et6Z`)
- source copy: `artifacts/tiktok-headword-chip-1017/reference-tiktok-chip.png` (1080×2340)
- implementation screenshot: `artifacts/tiktok-headword-chip-1017/mobile-393-selected.png` (393×852, CSS viewport 393×852, deviceScaleFactor 1)
- side-by-side comparison: `artifacts/tiktok-headword-chip-1017/comparison.png` (비율을 유지해 함께 축소)
- state: `테슬라` 말머리 선택, 한 줄 접힘
- full-view comparison: 틱톡의 무테 연회색 기본 칩과 짙은 검정 선택 칩 계층을 동일하게 적용했고 기존 게시판 밀도를 유지했다.
- focused comparison: 높이 32px, 좌우 여백 14px, 간격 8px, 반지름 999px, 기본 `#f1f1f2/#4f5156`, 선택 `#161823/#fff`, 테두리 0px을 확인했다.
- typography: Pretendard 14px/600, 선택 700. 기존 말머리명·순서는 변경하지 않았다.
- interactions: 360/384/412px에서 선택 전환, `aria-pressed`, 전체 펼치기, 눌림·키보드 포커스 상태를 확인했다.
- browser-rendered evidence: Chrome 직접 확인, 세 뷰포트 콘솔·런타임 오류 0건.
- image fidelity: 칩 자체는 이미지 자산이 없는 UI이며 기존 로고·아이콘·게시물 이미지는 변경하지 않았다.
- findings: P0/P1/P2 없음. 한글 자폭에 맞춘 글꼴만 보배드림 기존 체계를 유지했다.
- comparison history: 중복 칩 CSS를 하나로 통합한 뒤 선택 대비와 반응형 동작을 재검했고 추가 차이가 없었다.
- final result: passed

## Tesla Model Y 오너 서클 · 2026-10-17

- Source truth: 동처디 모델 점수 구조(모델 종합점수 → 항목별 점수/동급 평균 → 장단점 태그 → 모델별 리뷰 피드), 공식 Model Y 점수 페이지 https://www.dongchedi.com/auto/series/score/4363-x-S0-P105-x-1-2.
- Implementation: community/naver-cafe-list.html?board=vehicle-review&model=tesla-model-y&view=compact.
- Verified deployed commit: 9bf495a96e8f2b77aead2943ab815bc79f921ba2.
- Visual result: black Bobae/Airbnb-style model header, Tesla brand avatar, 4.04 aggregate score, 7 category statistics, segment-average comparisons, horizontal owner-keyword chips, sticky review filters, Model Y-only feed.
- Functional QA:
  - overall screen renders 6 Model Y sample reviews;
  - owner filter reduces feed from 6 to 5;
  - first review opens detail while preserving model=tesla-model-y;
  - detail renders 4.43 overall score, 6 category rows, owner information, and 4 comments;
  - console error count: 0.
- Current limitations: 2,619 aggregate review count and category/tag counts are reference snapshot data; the visible feed uses 6 representative sample posts until backend model-review aggregation is connected.

## 치지직 간결형 리스트 정밀 동일화 (2026-10-17)

- source visual truth: 사용자 제공 `1000018804.jpg` (치지직 모바일 게시판, 591×1280).
- implementation: `/community/naver-cafe-list.html?view=compact`.
- 의도적 예외: 댓글 숫자는 보배드림 블루 `#238fe3`, 추천 아이콘은 기존 `recommend-thumb-up.svg`를 유지했다.
- route finding: `view=compact`가 허용 목록에서 빠져 네이버 토론형으로 전환되던 P1을 발견해 직접 주소가 간결형을 유지하도록 복구했다.
- structure: 치지직과 같은 게시판 행 → 고정 공지 3건 → 2점 페이지 표시 → 회색 구분대 → 클린봇 → 목록 순서를 적용했다. 간결형에서는 게시판 설명·말머리 칩을 숨겨 목록 진입 구조를 맞췄다.
- list measurements: 행 70px, 좌우 15px, 제목 16px/23px, 메타 13px/17px, 우측 썸네일 52×52px·radius 7px, 구분선 1px.
- media scenarios: 텍스트 전용 18건, 썸네일 12건, 동영상 재생 표시 3건, 외부 링크 표시 4건, 복수 사진 수 표시 6건. 실패 이미지가 생기면 깨진 칸을 남기지 않고 텍스트 행으로 자동 전환한다.
- new marker: 실제 `fresh` 8건에만 빨간 점 8개가 표시되고 나머지 행에는 표시되지 않는다.
- interactions: 게시글 행과 공지 행이 각각 상세 주소로 이동한다. 글쓰기·클린봇 설정·보기 방식 기존 동작을 보존했다.
- responsive evidence: 360·384·412px 모두 행 70px, 썸네일 52×52px, 오른쪽 배치, 가로 넘침 없이 통과했다.
- runtime evidence: 세 폭에서 콘솔 오류 0건, 깨진 이미지 0건.
- screenshot: `artifacts/community-chzzk-list-parity-1017/implementation-mobile-384.png`.
- focused comparison: `artifacts/community-chzzk-list-parity-1017/comparison-list-focused.png`.
- automated verification: `node scripts/community-chzzk-list-parity-check.mjs`, `npm run test:sites`, `npm run build` 통과.
- final result: passed.


---

## 연비·전비 독립 게시판 50대 · 2026-10-17

- source visual truth: `artifacts/fuel-economy-crosscheck-20261017/09-dongchedi-ev-form.png`, `07-dongchedi-ice-form.png`, `01-dongchedi-current.png`.
- implementation evidence: `40a-public-list-all-viewport.png`, `50-public-detail-ev.png`, `25-public-writer-ev.png`.
- combined comparison evidence: `99-writer-ev-side-by-side.png`.
- viewport: 390×844 모바일 및 1440×900 PC.
- scope: 독립 연비·전비 목록 50건, 모델별 상세, 등록 폼, 동력원 필터, 댓글/반응, 격리 저장소 등록 흐름.
- data verification: 서로 다른 모델 ID 50개, ICE 17 / EV 14 / PHEV 11 / HEV 8, 필수값 누락 0, 깨진 이미지 0, 콘솔 오류 0.
- variable fields: EV=전비+완충거리+온도, PHEV=전비+연비, HEV/ICE=연비. 차량 선택 카탈로그도 동일한 50개 모델이다.
- design comparison: 원본의 사진→제목/내용→차량→지역→주행거리→가변 입력 순서를 유지하고, 노란 CTA만 사용자 지정 보배드림 블랙으로 치환했다.
- deployed commit: `79f6c63c76ca7e6ae3cf6f5bfc8a8518b48dfed7`.

final result: passed

---

## 차량 결함·불만 이해관계자 식별 · 2026-10-17

- 목적: 공식 접수·업체 통지 기능 없이 보배드림 안에서 결함과 불만을 공개하고 동일 사례를 공론화한다.
- 차량 구분: 국내 신차 / 공식 수입차 / 병행수입차 / 중고차.
- 국내 신차: 제조사·모델·세부 모델 + 신차 딜러사 + 판매·정비 지점.
- 공식 수입차: 제조사·모델·세부 모델 + 공식 수입사 + 수입차 딜러사 + 판매·정비 지점.
- 병행수입차: 제조사·모델·세부 모델 + 병행수입 업체 + 판매 업체·지점.
- 중고차: 제조사·모델·세부 모델 + 판매 상사 + 판매자·담당자(선택).
- 공개 상태: 공개 / 추가 제보 / 작성자 업데이트 / 해결 후기. 답변 대기·제조사 전달·조치 완료 등 공식 처리로 오인될 상태는 제거했다.
- current-run UI audit: 393px 모바일 레이아웃에서 네 가지 차량 유형의 조건부 필드, 공식 수입차 상세 이해관계자 표, 가로 오버플로 없음 확인.
- automated gate: `node qa/community-autohome-complaint/flow-gate.mjs` PASS 36 / FAIL 0.
- source flow report: `docs/autohome-complaint-platform-flow-20261017.md`.

final result: passed


---

## 수입사·딜러사 자동 후보 사전 · 2026-10-17

- scope: BMW, 벤츠, 렉서스, 포르쉐, 람보르기니 공식 출처 기반 후보 사전.
- interaction: 제조사 변경 시 수입사 자동값과 딜러·지점 후보가 함께 갱신되며, 사전 미등록 브랜드는 값을 비우고 직접 입력 안내를 노출한다.
- source safety: 수입 법인 명칭이 공식 출처에서 확인되지 않은 람보르기니는 수입사 자동값을 제공하지 않는다.
- current-run UI audit: BMW 선택 시 `BMW 코리아` 자동 입력과 공식자료 안내 노출, BYD 선택 시 이전 값 초기화와 직접 입력 폴백 노출 확인.
- automated gate: `node qa/community-autohome-complaint/flow-gate.mjs` PASS 41 / FAIL 0.
---

## GitHub Pages 매물등록 × Chợ Tốt 등록폼 동일화 · 2026-10-17

- source visual truth: `artifacts/register-ui-audit-20261017/01-chotot-detail-form.png`, `01a-chotot-detail-top.png`.
- implementation evidence: `12-implementation-full-v3.png`, `13-implementation-mobile-v3.png`, `15-implementation-pc-v3.png`.
- combined comparison evidence: `14-comparison-v3.png`, `16-full-comparison-final.png`.
- viewport: 393×852 모바일, 1280×900 PC.
- structure: 사진/영상 → 설명 → 제목 → 가격 → 지역 → 판매자 → 2열 상세 정보 → 3분할 고정 하단 액션 순서를 원본과 동일하게 재구성했다.
- interaction verification: 이미지 첨부, 삭제, 드래그/터치 순서 변경, 서류 첨부, 선택 필드, 미리보기, 임시저장, 등록 검증 흐름을 자동화로 통과했다.
- responsive verification: 모바일 가로 넘침 0, 상세 필드 2열 유지, PC에서 등록폼 394px 중앙 정렬.
- intentional localization: Chợ Tốt 로고·베트남어 문구는 보배드림 로고·한국어 매물 항목으로만 치환했고, 배치·크기·간격·상태 구조는 유지했다.
- validation: `npm run check:runtime`, `npm run verify:qf`, `npm run verify`, `npm run register:verify:chotot-parity` 통과.
final result: passed

---

## 매물등록 모바일 선택창 교정 · 2026-10-17

- source visual truth: 사용자 제보 `17-mobile-native-select-problem.jpg`와 Chợ Tốt 상세폼 `01-chotot-detail-form.png`.
- implementation evidence: `18-mobile-custom-picker-local.png`.
- combined comparison evidence: `19-mobile-picker-comparison.png`.
- viewport/state: 393×852, 카테고리 선택창 열림, 배경 스크롤 잠금.
- P1 finding resolved: 모바일 브라우저의 네이티브 `<select>`가 기기별 전체화면 팝업과 일반 제목 `선택`을 만들어 폼 맥락·크기·위치가 달라졌다. 모든 선택 필드를 동일한 커스텀 하단 선택창으로 교체했다.
- visual checks: 16px 상단 라운드, 58px 제목 바, 54px 선택 행, 15px 옵션 글자, 1px 구분선, Chợ Tốt 노란 선택 표시, 불투명 흰색 시트와 회색 딤을 확인했다.
- interaction checks: 항목별 제목, 현재값 표시, 옵션 선택 후 값 반영, 배경 탭 닫기, 닫기 버튼, Escape 닫기, 열림 중 본문 스크롤 잠금 및 종료 후 해제를 확인했다.
- responsive checks: 가로 넘침 0, 상세 필드 2열 유지, 고정 하단 액션보다 선택창이 위에 렌더링됨을 확인했다.
- automated evidence: 이미지 첨부·미리보기·임시저장·등록 검증까지 포함한 `register:verify:chotot-parity` 통과, 콘솔 오류 0건.
- remaining findings: P0/P1/P2 없음.

final result: passed

---

## 투후 오너 리뷰 독립 게시판 · 2026-10-17

- source visual truth: `artifacts/tuhu-review-audit-20261017/00-current.png`, `01-rating-*.png`, `02-space-like-open2.png`, `03-space-dislike-actual.png`, `11-review-tab-list.png`, `12-review-detail-origin.png`, `13-review-detail-lower.png`, `33-writer-ev.png`, `48-writer-hybrid.png`, `66-writer-phev.png`.
- list comparison: 프로필 → 별점·모델 → 제목·내용 → 사진 → 액션 순서를 동일하게 구성했다.
- detail comparison: 상단 프로필·구독, 이미지 카운터, 장문 본문, 차량 평가 카드, 댓글과 고정 액션 구조를 구현했다.
- writer comparison: 상단 진행 단계, 차량 정보, 5단계 만족도, 8개 장단점 평가, 30자 본문, 미디어 순서를 구현했다.
- variable fields: ICE=실연비, EV=실주행거리, HEV=실연비+순수전기 주행거리, PHEV=실주행거리로 즉시 전환한다.
- interaction: 전체/내연기관/전기차/하이브리드/PHEV 필터, 상세 진입·복귀, 구독, 추천, 공유, 댓글, 작성 검증, 등록 후 상세 이동을 확인했다.
- content rules: 만족도 5단계 문구, 8개 평가 항목의 긍정/부정 원문과 한국어 현지화 문구를 `docs/tuhu-review-system-audit-20261017.md`에 보존했다.
- design system: 투후 노란 활성색은 사용자 지정 에어비앤비형 검정으로 치환하고 Pretendard 및 저장소의 Reddit·Chotot·AutoScout24 계열 SVG만 사용했다.
- responsive/runtime: 393px 모바일 목록·상세·등록 렌더링, 연료별 가변 항목, 가로 넘침, 콘솔 오류 0건 확인.
- phone cleanup: 조사 중 추가한 EV/HEV/PHEV 차량은 삭제하고 BMW 120i 원상태를 `garage-restored.png/xml`로 확인했다.

final result: passed
# 2026-10-17 처즈왕 결함·불만 10배 강화 감사

- 원본 Android 16개 화면/XML과 웹 6개 화면을 이번 회차에 새로 캡처했다.
- 원본 가변 항목은 품질 8, 서비스 7, 기타 4, 종합 19개로 재확인했다.
- 나이 직접 입력, 자동차등록증, 사진/영상 분리, 바이크 사용신고필증을 추가했다.
- 모바일 393×844에서 목록 32건, 상세, 등록, 종합, 바이크 분기를 확인했다.
- 깨진 이미지 0, 콘솔 경고/오류 0, 민감 식별정보 상세 노출 0.
- `node qa/chezhiwang-complaint/ten-x-gate.mjs` 결과 51/51 PASS.

---

## PC 메인 초톳형 검색바 · 2026-10-17

- reference truth: Chợ Tốt의 단순한 회색 알약형 검색 구조와 원형 검색 액션. 보배드림에는 활성 메뉴색인 `#222`를 적용했다.
- implementation URL: `http://127.0.0.1:4312/?qf=guazi&pc=1&v=searchbar-chotot`.
- visual evidence: Codex in-app browser 1440×900 inline capture.
- measured: 검색창 560×48px, `#F4F4F4`, 입력 16/24px, 검색 버튼 36×36px, 배경 `#222`, 흰색 18px 아이콘.
- focus: 컨테이너 바깥쪽 2px `#222`만 노출하고 입력 자체 outline·box-shadow는 제거했다.
- interaction: `BMW` 입력 시 모델 추천과 매물 필터링, 검색어 지우기 후 초기 목록 복귀를 확인했다.
- runtime: 브라우저 콘솔 오류 0, `npm run verify:qf`와 `npm run verify` 통과.

final result: passed

---

## PC 메인 블루 로고 · 로그인/매물등록 헤더 · 2026-10-17

- source visual truth: 기존 공개본 `qa/pc-main-logo/source-e39b946f-1280x720.png`, 비엑람똣 헤더 `qa/pc-main-logo/vieclamtot-header-reference-1280x720.png`, 사용자 지시(보배드림 로고도 블루, 우측은 로그인·매물등록).
- implementation screenshot: `qa/pc-main-logo/local-final-1280x720.png`.
- combined comparison evidence: `qa/pc-main-logo/header-comparison-old-reference-final.png`; 기존/참조/구현의 상단 120px을 한 캔버스에 세로로 배치했고 1270×714 참조는 1280×720으로 정규화했다.
- viewport/state: PC 메인 `?qf=guazi&pc=1`, 1280×720 CSS px, device scale 1, 전체차량 활성 및 BMW 검색 결과 상태.
- fonts and typography: Pretendard를 유지하고 로그인·매물등록은 14/20px·650으로 맞췄다. GNB 14~16px 계층과 검색 입력 16/24px은 바꾸지 않았다.
- spacing and layout rhythm: 유틸 로그인/회원가입 중복 행을 제거해 헤더를 117px에서 97px로 줄였다. 로고 113.9×28px, 검색 560×48px, 우측 버튼 높이 36px·간격 8px이다.
- colors and visual tokens: 로고 엠블럼·워드마크와 검색 버튼·매물등록 버튼을 `#306BD9`, 호버를 `#1952BA`로 통일했다. 로그인은 흰 바탕·회색 테두리, 메뉴 선택은 검정으로 유지했다.
- image quality and asset fidelity: 기존 `header-logo.svg` 원본의 네이비 fill만 교체했고 흰 엠블럼과 빨간 포인트를 보존했다. 새 로고나 근사 아이콘을 그리지 않았다.
- copy and content: 우측 기능을 `로그인`과 `매물등록`으로 명확히 정리했으며 기존 찜·마이페이지 장식 아이콘은 헤더에서 제거했다.
- interaction: BMW 검색→BMW X5 필터링, 매물등록 클릭→안내 토스트를 확인했다. 브라우저 콘솔 오류 0건, 가로 넘침 0건이다.
- comparison history: 1차 구현은 상단 고객센터 유틸 행이 남아 로그인 CTA와 수직 위계가 중복되는 P2가 있었다. 유틸 행을 제거하고 헤더를 97px로 압축한 뒤 로고·검색·회원 액션이 한 줄에 정렬됨을 재캡처했다.
- findings: P0/P1/P2 없음. 비엑람똣의 남는 찜·알림·프로필 아이콘은 사용자 지시에 따라 복제하지 않은 의도적 차이다.

final result: passed

---

## PC 메인 로고 락업·로그인 아이콘 교정 · 2026-10-17

- correction source: 사용자 지시(엠블럼만 블루, `보배드림` 워드마크는 블랙, 우측 로그인에 사람 아이콘 표시).
- implementation screenshot: `qa/pc-main-logo-correction/local-final-1280x720.png`.
- logo lockup: 원형 엠블럼만 `#306BD9`로 유지하고 워드마크 4개 path를 `#222222`로 복원했다. 흰 내부 엠블럼과 빨간 포인트는 변경하지 않았다.
- login action: 저장소 기존 `header-mypage.svg`를 18×18px로 사용하고 `로그인` 텍스트와 6px 간격으로 정렬했다. 새 아이콘은 그리지 않았다.
- measured layout: 1280×720에서 헤더 97px, 로고 113.9×28px, 로그인 91.9×36px, 매물등록 80×36px, 버튼 간격 8px, 가로 넘침 0px.
- visual hierarchy: 검색 버튼과 매물등록 CTA는 `#306BD9`를 유지하고, 브랜드명과 GNB는 검정으로 두어 블루 사용 범위를 행동·엠블럼에 한정했다.
- interaction/runtime: BMW 검색 결과, 매물등록 안내 토스트, 콘솔 오류 0건을 확인했다.
- findings: P0/P1/P2 없음.

final result: passed

---

## PC 메인 영문 워드마크 교체 · 2026-10-17

- decision: 원형 엠블럼은 `#306BD9`로 유지하고 한글 워드마크 대신 검정 대문자 `BOBAEDREAM`을 사용한다.
- implementation screenshot: `qa/pc-main-logo-correction/local-english-final-1280x720.png`.
- measured layout: 엠블럼 30×30px, 영문 워드마크 121.8×24px, 간격 7px, 전체 로고 슬롯 164×30px이다.
- alignment: 1280×720에서 검색창은 x=236부터 560×48px, 로그인은 91.9×36px, 매물등록은 80×36px을 유지했다.
- interaction/runtime: BMW 검색 결과, 로그인 안내 토스트, 가로 넘침 0px, 콘솔 오류 0건을 확인했다.
- findings: P0/P1/P2 없음.

final result: passed

---

## PC 메인 카이디형 중앙 검색바·한글/영문 블루 로고 · 2026-10-17

- decision: 검색창을 로고 뒤 고정 간격으로 두지 않고, 좌측 브랜드·가운데 검색·우측 회원 액션을 3개 대칭 열로 구성해 카이디처럼 화면 중앙축을 안정적으로 유지한다.
- before: 1280×720에서 검색창 x=236, 중심=516px으로 화면 중심 640px보다 124px 왼쪽에 있었고 영문 워드마크 끝과 검색창 시작 사이가 37.2px라 붙어 보였다.
- after (1280): 좌우 열 288px, 가운데 검색 560px으로 검색창 x=360~920, 중심=640px을 정확히 맞췄다. 가로 넘침은 0px이다.
- responsive (1024): 좌우 열 237.6px, 검색 460.8px으로 검색창 중심=512px을 유지했고 가로 넘침은 0px이다. 900px 이하는 기존 모바일 헤더로 안전하게 전환된다.
- brand variants: 기본 영문 `BOBAEDREAM`과 `?pclogo=ko` 한글 `보배드림` 두 시안을 제공한다. 두 타이틀 모두 원형 엠블럼과 동일한 `#306BD9`를 적용했다.
- typography: 영문은 Arial 18/24px·800, 한글은 Pretendard 20/24px·800로 각 문자 구조에 맞추되 헤더 높이와 검색 축은 동일하게 유지했다.
- evidence: `qa/pc-main-logo-correction/local-kaidee-balanced-en-1280x720.png`, `qa/pc-main-logo-correction/local-kaidee-balanced-ko-1280x720.png`.
- interaction/runtime: `BMW M3` 검색 입력, 로그인·매물등록 안내 토스트, 콘솔 오류 0건을 확인했다.
- findings: P0/P1/P2 없음.

final result: passed

---

## PC 메인 검색창 상단 밀착 교정 · 2026-10-17

- finding: 중앙축은 맞았지만 검색창 48px과 첫 헤더 행 48px이 같아 검색창이 화면 최상단 y=0에 붙었다.
- correction: 첫 헤더 행을 72px로 확장하고 검색창 48px을 수직 중앙 정렬해 상단 12px·하단 12px의 동일 여백을 확보했다.
- resulting hierarchy: 로고 y=21~51, 검색창 y=12~60, GNB y=72~121이며 전체 헤더는 121px이다.
- horizontal stability: 검색창 x=360~920·중심=640px, 좌우 대칭 열과 560px 검색 폭은 유지했다.
- variants: 영문 `BOBAEDREAM`과 한글 `보배드림` 모두 동일한 상하 여백과 블루 타이틀 규칙을 공유한다.
- evidence: `qa/pc-main-logo-correction/local-kaidee-top-gap-1280x720.png`.
- runtime: 1280×720 가로 넘침 0px, 한글·영문 렌더링 및 콘솔 오류 0건.

final result: passed

---

## PC 메인 우측 회원 메뉴 초톳형 교정 · 2026-10-18

- 기준 화면: `https://xe.chotot.com/mua-ban-oto` PC 1280×720.
- 초톳 실측: 로그인 약 `103×40px`, 등록 CTA 높이 `40px`, 버튼 간격 `8px`, `14px/600`, 완전 원형 모서리.
- 보배드림 적용: 로그인 `118×40px`, `프로필 20px + 로그인 + 아래 화살표 16px`; CTA `112×40px`, 문구 `무료 매물등록`, 브랜드 블루 `#306BD9` 유지.
- 검색창은 기존 `560×48px`, `x=360`, `y=12`를 유지해 가운데 정렬을 보존했다.
- 1280×720 확인: 회원 메뉴 `x=952~1240`, 가로 넘침 `0`, 검색창과 충돌 `0`.
- 로컬 증거: `C:/Users/bobae/.codex/visualizations/2026/10/01/01a0f512-065a-7300-9ce1-d86601ce6384/pc-main-auth-chotot-local-1018.png`.

final result: passed

---

## PC 메인 로고·검색·회원 액션 공통선 교정 · 2026-10-18

- 기준 화면: `https://xe.chotot.com/mua-ban-xe` PC 1280×720.
- 초톳 실측: 로고·지역·검색바·우측 액션이 모두 `40px` 높이이고 같은 `y=52.8~92.8` 선에 있으며, 검색 원형 버튼은 `32px`이다.
- 보배드림 적용: 로고 컨테이너·검색바·무료 매물등록·로그인을 모두 `40px`, `y=16~56`으로 통일했다. 검색 원형 버튼은 `32px`, `y=20~52`다.
- 우측 순서: `무료 매물등록 → 로그인`으로 바꿔 로그인 칩이 화면 맨 우측에 위치한다.
- 보존 사항: 검색창 `x=360~920`, 폭 `560px`, 중심 `640px`; 가로 넘침 `0`, 콘솔 오류 `0`.
- 로컬 증거: `C:/Users/bobae/.codex/visualizations/2026/10/01/01a0f512-065a-7300-9ce1-d86601ce6384/pc-main-header-aligned-local-1018.png`.

final result: passed

