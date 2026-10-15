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
