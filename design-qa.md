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
