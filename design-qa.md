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
- 제목은 한 줄 16/23px/500, 댓글 수는 15px 녹색으로 분리했다.
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

- fonts/typography: 한 줄 제목, 녹색 댓글 수, 회색 메타 위계 통과
- spacing/layout rhythm: 15px 시작축, 70px 행, 52px 썸네일과 행 구분선 통과
- colors/tokens: 본문 `#292b2e`, 메타 `#7b7d80`, 댓글 `#00a77b` 통과
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
