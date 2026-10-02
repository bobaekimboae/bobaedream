# Design QA — FilterHeader 아이콘 교체

## Comparison target

- Source visual truth: Notion `0_0_필터 FilterHeader`의 첨부 파일 `FilterHeader.svg`.
- Implementation: `public/assets/bbm/chip-filter-header.svg`; 기본 버튼이 이 파일을 직접 참조합니다.
- State: 과쯔 모바일 기본 목록과 PC 개발 시안형 기본 목록.

## Findings

- 원본과 구현의 `viewBox="0 0 24 24"` 및 단일 path 데이터가 일치합니다.
- 조절점은 위·아래 x=8, 가운데 x=16으로 원본과 같습니다.
- 모바일과 PC가 같은 아이콘 파일을 사용합니다.
- 실제 표시 크기는 PC 20×20px이며 32px 높이 필터 버튼 안에서 세로 가운데 정렬됩니다.
- 모바일 필터 버튼을 누르면 필터 dialog가 정상적으로 열립니다.
- 모바일·PC 콘솔 오류와 경고는 없습니다.

## Verification

- `npm run verify:qf`: passed.
- 모바일 필터 dialog: passed.
- PC 1280×720 배치: passed.

final result: passed

---

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

# Design QA — 트럭 최종 축소 카드 v05

## Comparison target

- Source visual truth path: `C:/Users/bobae/Downloads/KakaoTalk_20261002_183735865.png`.
- Prior comparison screenshot path: `docs/truck/audits/2026-10-02/truck_finn_airbnb_cards_mobile_v01.png`.
- Latest implementation capture: Codex 인앱 브라우저의 로컬 모바일·PC 화면.
- Latest local URL: `http://127.0.0.1:5173/?qf=guazi&category=트럭%20·%20특장`.
- Source pixels: 1080×2340px.
- Verification viewports: 모바일 390×844px, PC 1280×900px, density 1× 기준.
- State: 라이트 테마, 트럭 형식 및 카고 세부형식 단계.

## Findings and fixes

- [P2 resolved] v04 카드도 사용자 화면에서 여전히 크게 느껴졌다.
  - Fix: 모바일 72×80px, PC 88×90px로 추가 축소했다.
- [P2 resolved] 축소 후 긴 명칭의 잘림 위험이 있었다.
  - Fix: 실제 세부형식 7개 모두 표시 높이와 콘텐츠 높이가 일치하는지 확인했다.

## Full-view comparison

- 모바일 390px에서 약 5개 카드와 다음 카드 일부가 보여 탐색 밀도가 높아졌다.
- PC에서는 주요 형식 대부분이 한 행에 들어와 수평 탐색 부담이 줄었다.
- FINN형 연회색 카드와 Airbnb형 선택 외곽선은 유지된다.

## Focused region comparison

- 모바일 카드 72×80px, 이미지 64×36px, 하단 명칭 64×32px, 곡률 14px.
- PC 카드 88×90px, 이미지 80×43px, 하단 명칭 80×34px, 곡률 14px.
- 차량 이미지와 명칭 사이 간격은 양쪽 모두 4px이다.
- `경형 트럭 (1톤 미만)`과 `트랜스/와이드 파워게이트`를 포함한 7개 세부형식이 최대 2줄에서 잘림 없이 표시된다.

## Required fidelity surfaces

- Fonts and typography: 모바일·PC 11px, 16~17px 행간, 최대 2줄.
- Spacing and layout rhythm: 카드 축소 비율에 맞춰 이미지·명칭·곡률을 함께 축소.
- Colors and visual tokens: 기본·호버·선택 색상 유지.
- Image quality and asset fidelity: 원본 PNG 비율 유지, `contain`, 하단 기준선 정렬.
- Copy and content: 형식·세부형식 명칭 변경 없음.

## Verification

- 모바일 72×80px 카드와 콘솔 오류 0건: passed.
- PC 88×90px 카드와 세부형식 2줄 표시: passed.
- `npm run verify:qf`: passed.

**Open Questions**

- 없음. 공개 배포 후 캐시 반영과 실제 링크만 최종 확인한다.

final result: passed

---

# Design QA — 트럭 축소 이미지 카드 v04

## Comparison target

- Source visual truth path: `C:/Users/bobae/Downloads/KakaoTalk_20261002_183735865.png`.
- Prior comparison screenshot path: `docs/truck/audits/2026-10-02/truck_finn_airbnb_cards_mobile_v01.png`.
- Latest implementation capture: Codex 인앱 브라우저의 로컬 모바일·PC 화면.
- Latest local URL: `http://127.0.0.1:5173/?qf=guazi&category=트럭%20·%20특장`.
- Source pixels: 1080×2340px.
- Verification viewports: 모바일 390×844px, PC 1280×900px, density 1× 기준.
- State: 라이트 테마, 트럭 형식 단계와 카고 세부형식 단계.

## Findings and fixes

- [P2 resolved] v03 카드가 사용자 기대보다 크게 보여 한 화면 정보 밀도가 낮았다.
  - Fix: 모바일을 80×88px, PC를 100×100px로 줄였다.
- [P2 resolved] 카드만 줄이면 이미지와 긴 명칭이 답답해질 가능성이 있었다.
  - Fix: 차량 이미지는 카드 폭의 약 90%를 유지하고, 명칭은 2줄 고정 영역으로 재조정했다.

## Full-view comparison

- 모바일에서 카드 4개와 다음 카드 일부가 함께 보여 가로 탐색 가능성이 더 명확하다.
- PC에서는 퀵필터 한 행에 더 많은 형식이 노출되며 전체 필터 영역 높이는 줄었다.
- 카드 전체 터치·클릭 대상과 Airbnb형 선택 상태는 유지된다.

## Focused region comparison

- 모바일 카드 80×88px, 이미지 72×42px, 명칭 72×32px, 곡률 16px.
- PC 카드 100×100px, 이미지 92×50px, 명칭 92×34px, 곡률 16px.
- `경형 트럭 (1톤 미만)`부터 `트랜스/와이드 파워게이트`까지 7개 세부형식의 실제 표시 높이가 스크롤 높이와 일치한다.
- 개별 카드 집중 캡처에서 차량 이미지 로딩과 이미지·명칭 간격 4px을 확인했다.

## Required fidelity surfaces

- Fonts and typography: 모바일 11/16px, PC 12/17px, 최대 2줄로 축소 밀도에 맞춤.
- Spacing and layout rhythm: 카드 외곽과 내부 요소를 동일 비율로 축소해 빈 공간 편차를 줄임.
- Colors and visual tokens: 기본·호버·선택 색상 변경 없음.
- Image quality and asset fidelity: 228×120 원본 PNG를 비율 왜곡 없이 `contain`으로 축소 표시.
- Copy and content: 형식·세부형식 명칭 변경 없음.

## Verification

- 모바일 축소 카드와 첫 화면 노출 밀도: passed.
- PC 100×100px 카드와 세부형식 2줄 표시: passed.
- 모바일 콘솔 errors/warnings: 0건.
- `npm run verify:qf`: passed.

**Open Questions**

- 공개 배포는 사용자 확인 후 진행한다.

final result: passed

---

# Design QA — 트럭 이미지 위·텍스트 아래 카드 균형 v03

## Comparison target

- Source visual truth path: `C:/Users/bobae/Downloads/KakaoTalk_20261002_183735865.png`.
- Prior implementation screenshot path: `docs/truck/audits/2026-10-02/truck_finn_airbnb_cards_mobile_v01.png`.
- Latest implementation capture: Codex 인앱 브라우저 탭 20의 로컬 URL `http://127.0.0.1:5173/?qf=guazi&category=트럭%20·%20특장`.
- Source pixels: 1080×2340px.
- Latest CSS viewports: 모바일 390×844px, PC 1280×900px, device density 1× 기준.
- State: 라이트 테마, 트럭 형식 단계와 카고 세부형식 단계.

## Findings and fixes

- [P2 resolved] v01은 명칭이 이미지 위에 있어 사용자 요청 방향과 반대였다.
  - Fix: DOM의 `이미지 → 명칭` 순서를 그대로 사용하고 강제 재정렬을 제거했다.
- [P2 resolved] 순서 변경 직후에는 카드 외곽 대비 차량 이미지가 작고 위·좌우 여백이 컸다.
  - Fix: 카드 외곽 크기는 유지하면서 모바일 이미지를 80×47px, PC 이미지를 104×54px로 확대하고 안쪽 여백을 줄였다.

## Full-view comparison

- 참고 화면의 연회색 둥근 카드, 단일 터치 대상, 반복되는 동일 카드 리듬을 유지한다.
- 텍스트 아래 배치는 사용자가 명시한 의도적 변경으로 참고 화면의 텍스트 위 배치와 다르다.
- 모바일은 첫 화면에서 카드 4개와 다음 카드 일부가 보여 가로 탐색 가능성을 전달한다.
- PC는 카드 외곽을 키우지 않아 필터 영역과 매물 목록의 기존 세로 밀도를 유지한다.

## Focused region comparison

- 모바일: 카드 88×96px 안에 이미지 80×47px, 간격 5px, 하단 명칭 80×34px.
- PC: 카드 112×108px 안에 이미지 104×54px, 간격 4px, 하단 명칭 최대 104×36px.
- 차량 이미지는 `object-position: center bottom`으로 같은 바닥선에 놓인다.
- 긴 명칭은 하단 2줄 영역에 제한되어 이미지 크기나 카드 높이를 밀어내지 않는다.

## Required fidelity surfaces

- Fonts and typography: 기존 트럭 카드의 12px 모바일, 13px PC 굵기와 최대 2줄 규칙 유지.
- Spacing and layout rhythm: 카드 외곽·곡률·행 간격 유지, 내부 이미지 비중만 확대.
- Colors and visual tokens: 기본 `#F1F1F3`, 선택 `#FFFFFF`·`#222222` 2px 유지.
- Image quality and asset fidelity: 기존 228×120 정규화 PNG를 비율 왜곡 없이 `contain`과 바닥 정렬로 사용.
- Copy and content: 형식·세부형식 명칭 변경 없음.

## Verification

- 모바일 이미지가 명칭보다 위에 있음: passed.
- PC 1280×900 카드 112×108px, 이미지 104×54px, 간격 4px: passed.
- 모바일 콘솔 errors/warnings: 0건.
- `npm run verify:qf`: passed.

**Open Questions**

- 공개 배포는 사용자 확인 후 진행한다.

final result: passed

---

# Design QA — 트럭 FINN형 카드·Airbnb형 선택 상태

## Comparison target

- Source visual truth path: `C:/Users/bobae/Downloads/KakaoTalk_20261002_183735865.png`.
- Implementation screenshots:
  - `docs/truck/audits/2026-10-02/truck_finn_airbnb_cards_mobile_v01.png`
  - `docs/truck/audits/2026-10-02/truck_airbnb_selected_mobile_v01.png`
  - `docs/truck/audits/2026-10-02/truck_finn_airbnb_cards_pc_v01.png`
- Source dimensions: 1080×2340px.
- Implementation dimensions: 모바일 390×844px, PC 1280×900px.
- State: 라이트 테마, 트럭·특장 형식 단계, 카고 세부형식 단계, 선택 상태 시뮬레이션.

## Full-view comparison

- 참고 화면의 핵심인 연회색 단일 카드 안의 상단 명칭·하단 이미지 구조를 트럭 형식과 세부형식에 적용했다.
- 모바일 첫 화면에서 카드 4개가 한 행에 보이며 가로 스와이프로 추가 항목을 탐색한다.
- PC에서는 같은 카드 언어를 유지하면서 112×108px로 확대해 2줄 명칭과 차량 이미지를 함께 식별할 수 있다.
- 모바일 하단 고정 메뉴와 첫 카드 행은 겹치지 않는다.

## Focused region comparison

- 기본 카드 배경은 참고 화면과 같은 계열의 `#F1F1F3`, 곡률은 18px이다.
- 명칭을 이미지 위로 배치하고 카드 전체를 버튼으로 유지해 터치 대상을 하나로 만들었다.
- 선택 상태는 사용자 수정 요청에 따라 흰 배경, `#222222` 2px 외곽선, 약한 그림자로 변경했다.
- `카고(화물)트럭`, `경형 트럭 (1톤 미만)`, `트랜스/와이드 파워게이트` 등 긴 명칭은 최대 2줄에서 식별 가능하다.

## Findings and history

1. 기존: 이미지와 명칭이 카드 배경 없이 떨어져 있어 항목 사이 터치 경계가 모호했다.
2. 1차: FINN형 연회색 카드와 파란 선택 배경을 적용했다.
3. 사용자 수정: 선택 상태를 에어비앤비 방향으로 요청했다.
4. 최종: 기본은 FINN형 연회색 카드, 선택은 Airbnb형 흰 배경·검정 외곽선으로 분리했다.

## Verification

- 모바일 카드 88×96px, PC 카드 112×108px: passed.
- 기본 배경 `rgb(241, 241, 243)`, 곡률 18px: passed.
- 선택 배경 `rgb(255, 255, 255)`, 텍스트·외곽선 `rgb(34, 34, 34)`: passed.
- 명칭이 이미지보다 먼저 표시됨: passed.
- 모바일·PC 경형 0.5톤과 1톤 결과 분리: passed.
- `npm run verify:qf`: passed.
- `npx playwright test tests/truck-payload-classification.spec.ts`: 5 passed.

**Open Questions**

- 공개 배포는 사용자 확인 후 진행한다.

final result: passed

---

# Design QA — 실제 메인 통합 검색바

## Finding and fix

- [P2 resolved] 제조사·모델·지역을 각각 고르는 3개 필드가 메인 첫 화면을 길게 만들고 검색 진입을 분산했다.
- Fix: 노션 검색 아이콘과 `차량명, 제조사, 모델 검색` 문구를 가진 단일 검색바로 통합하고 지역·세부 조건은 상세 필터로 이관했다.

## Verification

- 통합 검색바: 1개.
- 기존 선택 필드: 0개.
- 검색바 높이: 54px, 곡률 8px.
- 결과 보기·상세 필터 유지: passed.
- 세로 스크롤 높이 1348px 및 이미지 404 0건: passed.

final result: passed

---

# Design QA — 실제 메인 하단 스크롤

## Finding and fix

- [P1 resolved] 모바일 프레임은 본문 스크롤을 잠그는데 실제 메인에는 별도의 세로 스크롤 컨테이너가 없었고, flex 기본 `stretch`가 메인 카드를 프레임 높이로 제한해 하단 콘텐츠가 잘렸다.
- Fix: `main-home-stage`에 `overflow-y:auto`, `touch-action:pan-y`, 관성 스크롤을 적용하고 `align-items:flex-start`로 실제 콘텐츠 높이를 보존했다.

## Verification

- 스크롤 영역 높이: 720px.
- 전체 콘텐츠 스크롤 높이: 1410px.
- 직접 아래 제스처 후 스크롤 위치: 689.6px.
- 하단 추천 매물 영역 노출: passed.

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

---

# Design QA — 실제 메인 히어로 배경 경로 교정

## Finding and fix

- [P1 resolved] 2차 공개본에서 일반 이미지 404는 모두 해소됐지만, CSS 사용자 속성에 넣은 히어로 상대 URL이 빌드 CSS 파일의 `/assets/` 위치를 기준으로 해석돼 배경 사진이 회색으로 보였다.
- Fix: 히어로의 그라디언트와 이미지 URL을 React 인라인 `background-image`로 지정해 문서 루트 기준 `prototypes/...` 경로로 해석되게 했다.

## Verification

- 일반 이미지 404: 0.
- 메인 루트·기존 목록 분기: passed.
- 최종 공개본 히어로 시각 확인: passed.

final result: passed

---

# Design QA — 실제 메인 당근형 상단 액션

## Comparison target

- Source visual truth path: `reports/main-header-20261002/karrot-reference.png`.
- Source visual truth URL: `https://drive.google.com/file/d/1xqMNn9TU1YwL18q7HpEDKSOdaQxuMKXU/view`.
- Implementation screenshot path: Codex 인앱 브라우저 탭 99의 `http://127.0.0.1:4173/` 캡처(영구 로컬 경로 없음).
- Source pixels: 1080×2340px, 384×832 CSS px 기준, 밀도 2.8125×.
- Implementation pixels: 470×667px 인앱 브라우저 캡처, 가운데 430px 모바일 프레임.
- State: 첫 화면, 라이트 테마, 스크롤 상단.

## Full-view and focused evidence

- 드라이브 원본과 수정본을 각각 열어 상단 타이틀, 즐겨찾기, 메뉴 영역을 확인했다.
- 당근 기준은 64px급 상단 리듬, 24px 아이콘, 44px 터치 영역을 사용한다.
- 수정본은 보배드림 타이틀 114×28px, 상단 64px, 우측 버튼 44×44px, 원본 SVG 24×24px로 구현했다.
- 인앱 브라우저 보안 정책이 비교용 `data:` URL을 차단해 두 캡처를 한 화면에 배치한 최종 비교 입력은 만들지 못했다.

## Required fidelity surfaces

- Fonts and typography: 보배드림 로고 원본을 유지해 글꼴 대체나 왜곡이 없다.
- Spacing and layout rhythm: 헤더 64px, 좌측 16px, 우측 12px, 액션 44px 두 개, 추가 간격 0px.
- Colors and visual tokens: 메뉴·즐겨찾기 모두 노션 원본의 `#222` 사용.
- Image quality and asset fidelity: 래스터나 임의 도형이 아닌 노션 SVG 원본 사용.
- Copy and content: 우측 액션은 `즐겨찾기`, `전체 메뉴`로 접근성 이름을 지정했다.

## Findings

- [P2 blocked] 동일 화면 병렬 비교 증거가 없다.
  - Location: 상단 헤더 전체.
  - Evidence: 원본과 구현 화면은 각각 열렸지만 브라우저 보안 정책이 병렬 비교 페이지를 차단했다.
  - Impact: 미세한 광학 정렬과 여백 차이를 최종 통과 처리할 수 없다.
  - Fix: 허용된 동일 화면 비교 수단으로 384px 정규화 캡처를 다시 만든다.

## Comparison history

1. 기존 구현: 58px 헤더, 40px 터치 영역, 22px 검색·메뉴 아이콘.
2. 수정 구현: 64px 헤더, 44px 터치 영역, 24px 즐겨찾기·메뉴 원본 아이콘.
3. 로컬 시각 확인: 타이틀과 우측 액션 중심선, 아이콘 로딩, 첫 화면 레이아웃 유지 확인.

## Implementation Checklist

- [x] 당근형 상단 크기 반영.
- [x] 노션 메뉴 아이콘 원본 적용.
- [x] 노션 즐겨찾기 아이콘 원본 적용.
- [x] 프로덕션 빌드.
- [ ] 동일 화면 병렬 비교로 최종 통과.

## Follow-up Polish

- 즐겨찾기 선택 상태 아이콘은 실제 동작 범위가 확정될 때 추가한다.

final result: blocked
