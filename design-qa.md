# Design QA — 모바일 하단 GNB 블랙 밸런스

## Comparison target

- Source visual truth: 배포본 `bfe18cd`의 블루 홈·매물등록 하단 GNB.
- Implementation: 로컬 Guazi 럭셔리 30 목록형 시안의 블랙 하단 GNB.
- State: 라이트 테마, 목록형, 첫 화면 스크롤 위치.
- CSS viewport: 384×832px, device density normalized to 1× browser capture.

## Evidence

- [기존 블루 전체 화면](reports/gnb-black-20261002/before-blue-mobile.jpg)
- [수정 블랙 전체 화면](reports/gnb-black-20261002/after-black-mobile.jpg)
- [기존 블루 하단 GNB](reports/gnb-black-20261002/before-blue-gnb.jpg)
- [수정 블랙 하단 GNB](reports/gnb-black-20261002/after-black-gnb.jpg)
- [하단 GNB 전후 비교 — 왼쪽 기존, 오른쪽 수정](reports/gnb-black-20261002/before-after-gnb.jpg)

## Findings

- [P2 resolved] 화면 상단의 블랙 필터 칩과 하단의 블루 활성색이 서로 다른 강조 체계를 만들었다.
  - Location: `.bbm-bottom-gnb`의 활성 홈 아이콘, 홈 라벨, 중앙 `매물등록` 버튼과 라벨.
  - Impact: 상단은 블랙, 하단은 블루로 시선이 분산되어 브랜드 톤이 일관되지 않았다.
  - Fix: 활성 홈과 중앙 CTA를 모두 보배드림 블랙 `#222`로 통일했다. 비활성 메뉴는 기존 회색을 유지해 중앙 CTA 우선순위를 보존했다.
- [P2 resolved] 활성 홈 라벨과 아이콘의 블랙 값이 미세하게 달랐다.
  - Fix: 활성 홈 라벨도 `--bbm-text-strong`을 사용해 아이콘·CTA와 동일한 `#222`가 되도록 맞췄다.

## Required fidelity surfaces

- Geometry: 하단 바 74px, 매물등록 원형 버튼 44×44px, 아이콘 24×24px, 기존 5분할 구조를 유지했다.
- Alignment: 360px에서는 CTA 중심 180px, 384px에서는 192px, 430px에서는 215px로 각 화면 중심과 일치한다.
- Typography: 홈·매물등록 라벨 크기와 굵기는 변경하지 않았다.
- Colors: 활성 홈 아이콘·라벨과 매물등록 원형·라벨 배경만 `#222`; 플러스는 흰색, 비활성 항목은 기존 회색 유지.
- Content and behavior: 메뉴 순서, 터치 영역, 링크 동작, 목록 콘텐츠는 변경하지 않았다.

## Comparison history

1. 기존 배포본: 활성 홈과 중앙 CTA가 블루라 상단 블랙 필터와 이중 강조로 보였다.
2. 수정: 두 강조 요소를 `#222`로 통일하고 비활성 회색을 유지했다.
3. 최종 캡처: 중앙 CTA가 가장 강하고 홈은 현재 위치만 알려 주는 보조 강조로 정리됐다.

## Verification

- 360·384·430px 중앙 정렬: passed.
- 384×832px 전체 화면 및 하단 집중 전후 비교: passed.
- 활성 홈 라벨·아이콘·매물등록 배경 `rgb(34, 34, 34)`: passed.
- 브라우저 콘솔 errors/warnings: none observed.
- `npm run check:runtime`: passed (28 protected files unchanged).
- `npm run verify:qf`: passed.

**Open Questions**

- None.

**Implementation Checklist**

- [x] 홈 활성색을 보배드림 블랙으로 변경.
- [x] 매물등록 원형 버튼과 라벨을 보배드림 블랙으로 변경.
- [x] 비활성 메뉴는 회색 유지.
- [x] 360·384·430px에서 중앙 정렬 확인.

**Follow-up Polish**

- None required for this scope.

final result: passed

---

# Design QA — 실제 메인 Pages 자산 경로 교정

## Finding and fix

- [P1 resolved] 1차 공개 배포에서 Pages 준비 단계의 `/assets/` 문자열 치환이 React 메인 자산 경로에 중복 적용되어 로고·브랜드·추천 매물 이미지가 404가 되었다.
- Fix: 실제 메인의 공통 자산과 추천 매물 경로를 완성 문자열 대신 영문 경로 조각 결합으로 생성해 자동 치환 대상에서 제외했다. 독립 프로토타입의 기존 배포 안전 경로는 유지했다.

## Verification

- 로컬 일반 루트 메인 표시: passed.
- 로컬 `?qf=guazi&filtericon=notion` 목록 회귀: passed.
- 교정본 프로덕션 빌드: passed.
- 공개본 최종 이미지 404 확인: 재배포 후 수행.

final result: passed

---

# Design QA — 노션 아이콘·AutoScout형 칩·실제 메인 연결

## Comparison target

- Source assets: 사용자 지정 노션 `베트남 초톳` 데이터베이스의 검색, 메뉴, 셰브론 아래, 화살표 우, 위치 SVG 원본.
- Source visual truth: AutoScout24 모바일 메인 384px 화면의 짙은 헤더 톤, 1px 입력 외곽선, 명확한 활성 대비와 40px 전후 터치 리듬.
- Implementation: `src/main-home/MainHome.tsx`, `src/main-home/main-home.css`, `public/prototypes/autotrader-bobaedream-main/index.html`.
- Viewport: 384×900px 기준 모바일 및 기본 데스크톱 미리보기.

## Issues and fixes

- [P1 resolved] 임시 메인이 별도 프로토타입 주소에만 존재해 실제 루트 진입에서 노출되지 않았다.
  - Fix: 일반 루트는 `MainHome`을 표시하고, `qf`, `scenario`, `view`, `titlepos`, `filtericon`, `desktop`, `pc`, `bbmparts`, `pcl` 쿼리가 있으면 기존 매물 목록을 유지하도록 분기했다.
- [P2 resolved] 서비스 칩이 36px 높이의 보편적인 검정 칩에 가까워 AutoScout형 깊이와 터치 리듬이 약했다.
  - Fix: 40px 높이, 16px 좌우 패딩, 1px `#B8C0CA` 외곽선, 활성 `#16212E`, 흰 글자, 약한 그림자로 교정했다.
- [P2 resolved] 검색·메뉴는 기존 공통 자산, 선택 화살표는 CSS 삼각형, 섹션 이동은 문자 기호라 아이콘 체계가 혼재했다.
  - Fix: 노션 SVG 원본 5종을 검색·메뉴·위치·셰브론·섹션 화살표에 일관되게 적용했다.

## Required fidelity surfaces

- Geometry: 서비스 칩 40px, 최소 너비 58px, 8px 간격, 999px 곡률, 검색 선택 상자 52px.
- Alignment: 검색 카드 2열과 전국 1열의 아이콘·텍스트·셰브론 중심선 일치.
- Typography: 칩 14px/700, 활성 800; 히어로 30px/900; 입력 17px/500.
- Colors: 활성 칩 `#16212E`, 비활성 외곽선 `#B8C0CA`, 주요 CTA는 기존 보배드림 블랙 `#222` 유지.
- Assets: 노션 원본 SVG 5종을 로컬 정적 자산으로 사용하고 장식 아이콘은 빈 대체 텍스트 처리.

## Interaction verification

- 일반 루트에서 `.main-home` 표시, `.bbm-m-list` 미표시: passed.
- `건설기계` 선택 시 `aria-pressed=true`, 히어로 제목과 CTA 변경, 칩 가로 스크롤 이동: passed.
- `?qf=guazi&filtericon=notion`에서 기존 `.bbm-m-list` 표시, 메인 미표시: passed.
- 메인 및 기존 목록 이미지 404: 0.
- 브라우저 콘솔 errors/warnings: none observed.
- `npm run check:runtime`: passed.
- `npm run verify:qf`: passed.

## Open questions

- 다른 카테고리 실제 링크는 각 담당 코덱스 결과가 확정된 뒤 연결한다.

final result: passed

---

# Design QA — AutoScout형 임시 메인 서비스 메뉴

## Comparison target

- Source visual truth: 사용자 지정 메뉴 순서와 AutoScout형 메인 방향, 기존 `public/prototypes/autotrader-bobaedream-main/index.html`의 검색 중심 모바일 메인 골격.
- Notion reference: 페이지는 확인했으나 이미지 원본은 로그인 요구와 만료된 첨부 주소로 픽셀 단위 대조가 불가능했다. 따라서 이번 1차 시안은 사용자가 직접 적은 메뉴·구조 요구를 우선 기준으로 삼았다.
- Implementation: `public/prototypes/autotrader-bobaedream-main/index.html`.
- Viewport: 384×900px 모바일, 기본 데스크톱 미리보기.

## Required fidelity surfaces

- 메뉴 순서: 전체 / 중고차 / 커뮤니티 / 트럭/특장 / 바이크 / 건설기계 / 캠핑카 / 부품/용품.
- 알약칩: 36px 높이, 999px 곡률, 8px 간격, 가로 스크롤, 선택 항목 `#222` 배경과 흰 글자.
- 헤더: 기존 보배드림 로고·검색·메뉴 SVG 자산 사용.
- 메인 구조: 서비스 메뉴 → 이미지 히어로 → 검색 카드 → 바디 타입 → 인기 제조사 → 내 차 팔기 → 추천 매물.
- 범위 보호: 중고차만 기존 목록에 연결하고 다른 카테고리는 선택형 임시 상태로 유지.

## Interaction verification

- `건설기계` 선택 시 선택 칩이 중앙으로 이동하고 `aria-pressed=true`, 히어로 문구와 CTA가 건설기계 상태로 변경됨: passed.
- `중고차` 선택 후 `64대 매물 보기` 클릭 시 `/?qf=guazi&filtericon=notion`으로 이동: passed.
- 384px 화면에서 메뉴 가로 스크롤, 검색 카드, 4개 바디 타입 첫 행이 잘림 없이 표시됨: passed.
- 브라우저 콘솔 errors/warnings: none observed.
- `npm run verify:qf`: passed.

## Open questions

- Notion 이미지가 다시 공개되면 메뉴 높이·좌우 여백·선택색을 원본과 2차 실측할 수 있다.

final result: passed
