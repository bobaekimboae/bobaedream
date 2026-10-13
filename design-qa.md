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

# 에어비앤비형 차량 정보 더보기 칩 QA · 2026-10-13

- source URL: `https://www.airbnb.co.kr/rooms/749432416774983495`
- source capture: `C:/Users/bobae/Downloads/airbnb-info-chip-1013/airbnb-amenities-button-mobile.png`
- implementation screenshot: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/06-airbnb-info-chip-local-final.png`
- comparison composite: `C:/Users/bobae/Downloads/vehicle-grid-icon-tuned-1013/comparison-airbnb-info-chip.png`
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- source and implementation pixels: 각각 390 × 844
- state: 차량 정보 8개 노출, 더보기 닫힘

## Findings

- P0/P1/P2 findings: none after the focused comparison.
- Fonts and typography: 에어비앤비의 16/20·500을 Pretendard Variable 16/20·500으로 옮겼다.
- Spacing and layout rhythm: 기준과 동일하게 x=24, width=342, height=48, padding 14px 24px, radius 12px다.
- Colors and visual tokens: 배경 `#F2F2F2`, 글자 `#222`, 테두리·그림자 없음으로 일치한다.
- Image quality and asset fidelity: 이미지나 별도 아이콘을 사용하지 않는 텍스트 버튼이므로 대체 자산은 없다.
- Copy and content: 사용자 지정 문구 `37개 정보 더보기`를 적용했고, 펼친 상태에서는 `정보 접기`로 바뀐다.
- Interaction: 버튼 클릭 시 `aria-expanded=false → true`, 차량 정보 행 `8 → 23`, 다시 클릭 시 닫힘을 확인했다.

## Comparison history

- 1차: 버튼이 기준보다 좌우 4px씩 좁은 334px로 렌더링됐다.
- 수정: 좌우 보정 마진을 제거해 기준과 같은 342px로 교정했다.
- 2차: 390px 캡처에서 342×48px, 깨진 이미지 0, 콘솔 오류 0, 가로 오버플로 0을 확인했다.

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
