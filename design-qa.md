# 올드카 현대 포니 단일 차량 헤더 QA · 2026-10-12

- source visual truth: Dyler 홈페이지의 저조도 클래식카 히어로 구도와 현대자동차 공식 1세대 포니 단일 차량 사진
- source page: `https://www.hyundai.com/eu/en/electrification/electrified-models/concept-cars/pony.html`
- source asset: `https://s7g10.scene7.com/is/image/hyundaiautoever/Hyundai_Pony_Heritage_Comparison_Slider_Old?fit=wrap%2C1&hei=720&wid=1940`
- implementation: `http://127.0.0.1:4212/?qf=guazi&category=올드카&view=feed`
- viewport: 390 × 844 CSS px, deviceScaleFactor 1
- compared header size: 358 × 98px
- state: light theme, 정적 이미지 1장

## Findings

- Fonts and typography: Pretendard 제목 18/23·700, 설명 11/15·400. 설명은 `국내 유일 올드카ㆍ클래식카 쇼핑몰`로 정확히 표기한다.
- Spacing and layout rhythm: 기존 검증 슬롯 358×98, 좌우 16px, 8px 모서리를 유지한다.
- Image quality and asset fidelity: 현대자동차 공식 포니의 차체 형상은 유지하고 Dyler처럼 검정 스튜디오와 앰버 림라이트를 적용했다. 포니 한 대의 전체 실루엣이 보이며 추가 차량·소품·문자는 없다.
- Color and contrast: 이미지 자체의 검정 왼쪽 여백에 4% 음영과 텍스트 그림자만 더해 Dyler의 깊은 블랙과 파란 차체를 유지한다.
- Content hierarchy: 왼쪽 문구와 오른쪽 단일 차량을 분리해 포니의 형태를 즉시 인식하게 한다.

## Verification

- `npm run verify:qf`: passed
- `git diff --check`: passed
- 헤더 실측 358.4×98px, 이미지 1장, 버튼 0개
- 편집 이미지 2078×757px 로드, 깨진 이미지 0
- 모바일 390×844 브라우저 렌더 확인, 콘솔 오류 0

final result: passed

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
