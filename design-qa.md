# Design QA

## 모바일 목록 제어행 v43

- source visual truth: `C:\Users\bobae\Downloads\notion-original-video-sort-1.png`, `C:\Users\bobae\Downloads\notion-original-video-sort-2.png`
- implementation: Codex 인앱 브라우저 로컬 렌더링 `http://127.0.0.1:5175/?qf=guazi&v=local`
- implementation screenshot: 인앱 브라우저의 384×844 전체 화면 및 384×48 제어행 근접 캡처
- viewport: 384×844, 추가 360×800
- density normalization: 원본 945×2048 캡처는 CSS 384px 폭에 맞춰 구조·비율을 비교했고 구현은 CSS 384px, deviceScaleFactor 1 화면으로 확인
- state: 기본, `숏폼매물` 선택, `숏폼매물 + 개인` 동시 선택

## Full-view comparison evidence

- 원본과 구현 모두 퀵필터 이미지·로고 레일 바로 아래에 목록 제어행 하나가 위치한다.
- 구현에서 기존 44px 영상·정렬 행과 48px 판매자 탭 행의 이중 구조가 제거되어 목록 시작점이 원본처럼 48px 제어행 직후로 올라왔다.
- 360px와 384px 모두 문서 가로 넘침이 없고 보기 방식 아이콘이 오른쪽에 고정됐다.

## Focused region comparison evidence

- 순서: 숏폼매물, 개인, 딜러, 정렬, 4칸 보기 방식이며 항목 사이 세로 구분선은 없다.
- 기본 상태: 숏폼·판매자 항목은 회색 텍스트 탭이다.
- 선택 상태: 숏폼과 개인이 각각 초톳 실측 28px 알약 형태로 바뀌며 색상만 Airbnb형 `#222` 배경·흰 글자를 쓴다.
- 아이콘: 정렬은 아래 방향 꺾쇠, 보기 방식은 24px 4칸 그리드로 원본과 일치한다.

## Required fidelity surfaces

- Fonts and typography: 비선택 14/20px, 정렬 600·비선택 탭 500·선택 12/18px 700으로 확인.
- Spacing and layout rhythm: 행 48px, 상하 8px, 좌우 16px, 제어 32px로 확인. 정렬 뒤 인위적인 세로 구분선은 제거했다.
- Colors and visual tokens: 비선택 회색, 선택 `#222` 배경·흰 글자·무테두리·무그림자, 아래 1px 구분선으로 확인.
- Image quality and asset fidelity: 새 래스터 자산 없음. 기존 꺾쇠 SVG와 Radix 4칸 아이콘을 사용해 코드 도형을 추가하지 않음.
- Copy and content: `숏폼매물 · 개인 · 딜러 · 업데이트순`을 표시하고 모바일의 `전체 · 브랜드`는 제거. PC도 `숏폼매물` 문구와 스위치를 사용한다.

## Findings

- P0/P1/P2 없음.
- 원본과 구현 모두 퀵필터 이미지·로고 레일 바로 아래에 목록 제어행 하나가 위치한다.
- 기존 44px 영상·정렬 행과 48px 판매자 탭 행을 48px 제어행 하나로 통합했다.
- 360px와 384px 모두 가로 넘침이 없고 보기 방식 아이콘이 오른쪽에 고정됐다.
- 순서: 숏폼매물, 개인, 딜러, 정렬, 4칸 보기 방식.
- 선택 상태: 초톳과 동일한 28px·99px 라운드·16px 해제 아이콘 알약칩.
- Fonts: 비선택 14/20px, 정렬 600·비선택 500·선택 12/18px 700.
- Spacing: 행 48px, 상하 8px, 좌우 16px, 선택 칩 좌우 8px이며 세로 구분선은 없다.
- Colors: 비선택 회색, 선택 `#222` 배경·흰 글자·무테두리·무그림자.
- Assets: 기존 꺾쇠 SVG와 Radix 4칸 아이콘을 사용한다.
- Copy: `숏폼매물 · 개인 · 딜러 · 업데이트순`; 모바일의 `전체 · 브랜드`는 제거하고 PC도 `숏폼매물`로 통일한다.
- P3: 원본 베트남어와 한국어의 글자 폭 차이는 현지화 차이로 허용한다.

### Comparison history

1. 초기 이중 행과 목록형 아이콘을 확인했다.
2. 단일 48px 행, 선택 알약, 정렬 꺾쇠, 4칸 보기 아이콘으로 수정했다.
3. 384px 기본·복수 선택, 360px 기본에서 가로 넘침 없음과 결과 갱신을 확인했다.
4. v40에서 연노랑 선택색을 Airbnb형 흰색·검정 선택 표면으로 교체했다.
5. v43에서 초톳 선택 칩의 실제 28px 규격으로 교정하고 색상만 Airbnb형 `#222`·흰색으로 변경했다.

## 트럭 유형 필터 v39

- source visual truth: `https://bobaedream-transmission-filter-chip.bobaekim.chatgpt.site/bodytype?view=list&v=97`
- source numeric truth: Notion `보배드림 퀵필터 최종 인수인계 · 판매자 유형·바디타입`, Google Sheets `보배드림 퀵필터 인수인계 2026-10-01`의 `UI 수치!A6:E24`
- source capture: `docs/truck/qa/source-bodytype-mobile.png`
- implementation captures: `docs/truck/qa/implementation-truck-mobile.png`, `docs/truck/qa/implementation-truck-pc.png`
- combined comparison: `docs/truck/qa/comparison-mobile.png`
- viewport: 모바일 393×852 CSS px, PC 1440×900 CSS px
- pixels/density: 모바일 원본·구현 모두 393×852px, PC 구현 1440×900px, deviceScaleFactor 1. 보정 불필요.
- state: 트럭·특장 목록에서 `트럭 유형` 선택창을 연 초기 상태, 라이트 테마

### Findings

- P0/P1/P2 없음.
- 정보구조: 원본 체크박스 단일 열에 트럭 계층용 대수와 하위 화살표만 추가했다.
- 글꼴: 15/20px 목록, 20/28px 모바일 제목, 19px PC 제목. 긴 항목은 한 줄 말줄임하고 하위 화면에서 전체 명칭을 다시 표시한다.
- 간격: 모바일 헤더 64px, 좌우 20px, 행 54px, 체크박스 20px, 이미지 슬롯 32px, 열 간격 12px, 하단 버튼 52px. PC는 520px 중앙 모달에 같은 행 리듬을 적용한다.
- 색상: 흰 바탕, `#E8E8E8` 구분선, 검정 선택 체크박스와 흰 체크. 노란 선택 배경은 없다.
- 이미지: 승인 트럭 유형 PNG를 `<img>`와 `object-fit: contain`으로 표시하고 임의 SVG·이모지·CSS 차량 도형을 쓰지 않는다.
- 문구: `트럭 유형`, 최종 13개 상위 분류, 실제 가상 매물 수 기반 `N대 보기`.

### Comparison evidence

- `docs/truck/qa/comparison-mobile.png`: 체크박스–아이콘–라벨 단일 열, 행 구분선, 고정 하단 액션을 같은 393×852에서 비교했다.
- `docs/truck/qa/implementation-truck-pc.png`: 같은 구조가 PC 중앙 모달로 전환되며 배경 목록과 충돌하거나 잘리지 않는다.
- 별도 확대는 필요하지 않았다. 393px 캡처에서 모든 핵심 요소를 판독할 수 있다.

### Interaction and console QA

- 모바일: `트럭 유형` → 카고(화물)트럭 → 준중형 → `1대 보기` 적용.
- URL: `truckFormat=카고(화물)트럭&truckSubtype=준중형` 갱신.
- 결과: 이스즈 엘프 준중형 가상 매물 1대로 필터링.
- PC: 520px 중앙 모달에 13개 유형·대수·하위 화살표 표시.
- Playwright console error 및 pageerror 0건.

### Comparison history

1. 참고 문서 확정 수치를 구현 전에 반영한 1차 비교에서 P0/P1/P2 없음.

### Follow-up polish

- P3: 운영 매물 API 연결 뒤 10대 미만 항목의 칩 숨김 정책을 재검증한다.

## 트럭 유형 필터 v41

- source visual truth: `https://bobaedream-transmission-filter-chip.bobaekim.chatgpt.site/engine`, Google Drive 핀노 캡처 폴더 `1_1BVnpfKGChcikqYvIrfI7l6e4Li4QG0`
- implementation: `http://127.0.0.1:4173/?qf=guazi&category=트럭 · 특장`, Codex 인앱 브라우저 탭 18 렌더 캡처
- state: 트럭 유형 바텀시트 초기 화면, 라이트 테마
- full-view comparison: 기준 시안의 좌측 제목·우측 닫기·고정 하단 액션 구조와 구현을 대조했다.
- focused region comparison: 핀노 목록의 구분선은 체크박스 영역을 통과하지 않고 명칭 열에서 시작한다. 구현도 체크박스 `20~40px`, 이미지 `52px`, 명칭·구분선 `96px`로 일치시켰다.
- typography: 제목 20/28px 750, 좌측 20px. 목록 15/20px 규격 유지.
- spacing: 행 54px, 체크박스 20px, 이미지 32px, 열 간격 12px. 구분선은 명칭 열 시작점인 96px부터 오른쪽 끝까지 표시.
- colors: 구분선 `#E8E8E8`, 선택 체크박스 `#111`, 흰 체크 유지.
- image quality: 기존 승인 트럭 유형 PNG를 그대로 사용해 자산 변형 없음.
- copy: 중복 `카테고리` 칩을 트럭 화면에서 제거하고 `트럭 · 특장 → 트럭 유형 → 연식 → 가격 → 연료` 순서로 정리.
- interaction: 모바일 트럭 유형 열기, PC 모달 열기, 스크롤과 하단 `30대 보기` 확인.
- console: 모바일·PC 오류 0건.
- findings: P0/P1/P2 없음.
- comparison history: 전체 폭 구분선을 발견해 행 border를 제거하고 명칭 열에서 시작하는 1px pseudo-element로 교체했다. 중앙 제목은 기준 시안에 맞춰 좌측 정렬했다.

final result: passed

## 제조사 다음 모델 · 과쯔형 바디타입 레일 v01

- source visual truth: Google Drive `과쯔 1 전체.jpg` (`1080×2400`, CSS 기준 약 `360×800`, 3x), `과쯔 2.jpg`, `과쯔 영상.mp4` — `https://drive.google.com/drive/folders/1ODOYnMUtofr1FMkHh4jkMcdfFKLgepxf`
- implementation screenshots: `C:\Users\bobae\codex-work\maker-model-skeleton-1005\reports\screenshots\maker-model-guazi-rail-all-384.png`, `C:\Users\bobae\codex-work\maker-model-skeleton-1005\reports\screenshots\maker-model-guazi-rail-sedan-384.png`
- combined comparison evidence: `C:\Users\bobae\codex-work\maker-model-skeleton-1005\reports\screenshots\guazi-vs-bobae-model-rail.png`
- viewport: 구현 `384×820` CSS px, deviceScaleFactor 1. 추가 반응형 검수 `360×820`, `412×820`.
- density normalization: 과쯔 원본은 1080px 폭을 360px CSS 폭으로 축소해 구조·밀도를 판단하고, 보배드림은 384px CSS 원본 크기로 비교했다.
- state: 현대 모델 `전체`, 현대 모델 `세단` 선택.

### Full-view comparison evidence

- 과쯔의 핵심 구조인 `전체 + 바디타입 직접 선택` 단일 가로 레일을 검색창 바로 아래에 배치했다.
- `전체`에서만 인기 모델 5개를 먼저 표시하고, 구분면 아래에 `전체 모델 / 바디타입별`과 전체 목록을 배치했다. 전체 목록은 과쯔처럼 `세단·해치백·SUV…` 중앙 구분 타이틀과 양쪽 선으로 나눴다.
- `세단` 선택 시 인기 모델을 제거하고 목록 상단에 `세단` 중앙 구분 타이틀을 다시 표시해 현재 범위를 즉시 알 수 있게 했다.
- 과쯔의 녹색 선택색·회색 카드 배경은 복제하지 않고 보배드림 공통 검정 선택색과 흰색 리스트 규칙으로 의도적으로 치환했다.

### Focused region comparison evidence

- 칩: 높이 36px, 가로 패딩 15px, 간격 8px, 좌측 여백 16px, 한 줄 가로 스크롤.
- 선택 상태: `#222` 배경·흰색 14/18px·700, 미선택은 `#F3F4F5`·14/18px·400.
- 모델 행: 기존 74×46px 이미지 슬롯, 16/22px 모델명, 우측 매물 수와 화살표 정렬을 유지했다.
- 360·384·412px 모두 문서 가로 넘침 0이며 레일만 정상 가로 스크롤한다. 첫 칩 x=16px.

### Required fidelity surfaces

- fonts and typography: 기존 Pretendard 및 400·700 위계 유지. 과쯔보다 한국어 모델명이 선명하고 구간 제목의 위계가 높다.
- spacing and layout rhythm: 검색 → 칩 레일 → 구간 제목 → 모델 행의 리듬을 유지하고, 바디타입 선택 단계를 두 줄에서 한 줄로 축소했다.
- colors and tokens: 과쯔 구조만 참고하고 보배드림 `#222`, `#F3F4F5`, `#E8E8E8` 토큰을 유지했다.
- image quality: 제공된 세대 이미지와 단일 대체 아이콘을 기존 74×46px 슬롯 안에서 그대로 사용한다.
- copy and content: `전체`, `세단`, `해치백`, `웨건`, `쿠페`, `SUV`, `RV/MPV(밴)`을 DB 값과 연결했다. 0건 유형은 숨김 처리한다.

### Interaction and console QA

- `전체` 선택 시 인기 모델 → 전체 모델 바디타입별 구분 목록이 표시된다.
- 가나다·영문 초성 칩은 노출하지 않고 목록 자체만 이름순으로 유지한다.
- 바디타입 선택 시 목록이 즉시 교체되고 스크롤이 상단으로 복귀한다.
- 검색 중에는 인기 모델 구간을 숨기고 검색 결과만 유지한다.
- 콘솔 오류 0건, 360·384·412px 문서 오버플로 0건.

### Findings

- P0/P1/P2 없음.
- P3: 현재 바디타입 데이터는 현대 40개 모델만 연결돼 있다. 다른 제조사는 데이터가 들어오기 전까지 `전체`만 표시된다.

final result: passed

---

# 트럭 톤수 다음 제조사 로고 레일 v59

- source visual truth: `docs/truck/truck_chotot_slot_rule_v01.md`의 초톳 앱·카테고리 브랜드 슬롯 실측값
- implementation screenshots: `reports/truck-maker-after-tonnage-v59/mobile-390.png`, `reports/truck-maker-after-tonnage-v59/pc-1280.png`
- viewport/state: 모바일 390×844, PC 1280×900 / 카고(화물)트럭 → 준중형 → 3톤
- focused comparison: 모바일 셀 76×102·PC 84×102, 공통 로고 상자 40×40, 간격 8, 시작선 16/20
- interaction: 톤수 선택 전 제조사 레일 없음 → 3톤 선택 후 제조사 로고 레일 → 제조사 선택 가능
- image quality: 트럭 로고 10개가 투명 배경·원본 비율 `contain`으로 정상 로드
- typography: 이름 14/400/21 `#595959`, 모바일 68px·PC 76px, 최대 2줄
- console/build errors: Playwright 회귀 검수와 `verify:qf`로 확인

## Comparison history

- 이전: 트럭 전용 축소 예외로 모바일 72×88·로고 72×45·간격 5px, PC 이름 간격 8px.
- 수정: 공통 초톳 브랜드 슬롯으로 통합하고 톤수 다음 뎁스 노출을 자동화 테스트로 고정.
- 수정 후: 모바일·PC 모두 슬롯·간격·이미지 로드와 뎁스 전환이 기준값에 일치.

final result: passed

---

# 트럭 제조사 마지막 로고 이스즈 교체 v60

- source visual truth: 사용자 제공 Google Drive 링크와 `public/assets/brand/kr/isuzu.png`
- implementation target: 트럭·특장 / 카고(화물)트럭 / 준중형 / 3톤 / 제조사 로고 레일
- viewport: 모바일 390×844, PC 1280×900
- state: 톤수 선택 완료 후 제조사 빠른 선택

## Findings

- P0/P1/P2 없음.
- 마지막 `DAF` 슬롯이 `이스즈`로 교체되고 앞선 9개 제조사 순서는 유지된다.
- ISUZU 투명 원본은 40×40 로고 상자 안에서 원본 비율을 유지한다.
- 모바일 76×102·PC 84×102 셀, 8px 간격과 이름 타이포그래피는 변경되지 않는다.

## Required fidelity surfaces

- Fonts and typography: 기존 14/400/21 `#595959` 유지.
- Spacing and layout rhythm: 모바일 16px·PC 20px 시작선, 8px 반복 간격 유지.
- Colors and visual tokens: ISUZU 고유 적색 원본 유지, 배경·테두리 없음.
- Image quality and asset fidelity: 투명 PNG 원본, 비율 왜곡 없음.
- Copy and content: `DAF` 제거, `이스즈` 노출.

## Comparison history

- 이전: 마지막 항목 DAF.
- 수정: 마지막 항목을 이스즈로 교체하고 기존 ISUZU 로고 원본 연결.
- 수정 후: 모바일·PC에서 이스즈 노출, DAF 미노출, 로고 이미지 10개 정상 로드.

final result: passed

---

# 트럭 2뎁스 마지막 칩 곡률 v58

## Source and implementation

- source visual truth: Google Drive Car300 `02-1 Screenshot_2026-09-24-07-14-53-111_com.car300.activity.jpg`
- source file ID: `1hh0zm8DQBg4XOcnG3JAsZ54ALLbYA_7H`
- implementation: `http://127.0.0.1:4182/?qf=guazi&category=트럭+·+특장&truckFormat=카고(화물)트럭`
- viewports: 모바일 390×844, PC 1280×900
- state: 트럭·특장 → 카고(화물)트럭 → 2뎁스 칩 레일 시작·끝

## Findings

- P2 해결: 보배 칩 곡률 12px가 Car300 카드군보다 둥글어 마지막 칩에서 차이가 더 도드라졌다.
- Car300은 첫 변경 카드, 일반 옵션, 마지막 옵션에 같은 약 8px 계열 곡률을 사용한다.
- 전체 텍스트 칩을 8px로 통일하고 모바일 16px·PC 20px 레일 끝 여백은 유지한다.

## Full-view comparison evidence

- Car300 02-1 전체 화면과 보배 390px 구현 화면에서 변경 카드가 첫 위치에 있고 일반 옵션이 한 줄 가로 레일로 이어지는 구조를 비교했다.
- 보배 마지막 `대형` 칩까지 스크롤해 오른쪽 모서리와 레일 끝 여백이 별개로 유지되는 것을 확인했다.

## Focused region comparison evidence

- 원본 확대: 첫 `更换车系` 카드와 마지막 보이는 연식 카드가 같은 곡률군으로 보인다.
- 구현 실측: 첫 `형식 변경`, 중간 `준중형`, 마지막 `대형` 모두 `border-radius: 8px`.
- 레일 끝 패딩: 모바일 16px, PC 20px.

## Required fidelity surfaces

- Fonts and typography: 기존 Pretendard 14/19와 2줄 계층 유지.
- Spacing and layout rhythm: 52px 높이, 8px 칩 간격, 모바일 16px·PC 20px 끝 여백 유지.
- Colors and visual tokens: 흰 변경 카드·회색 옵션 카드 색상 변경 없음.
- Image quality and asset fidelity: 이미지 자산 변경 없음.
- Copy and content: 차급명·톤수·`형식 변경` 문구 변경 없음.

## Comparison history

- 이전: 첫·중간·마지막 칩 모두 12px 곡률.
- 수정: 전체 2뎁스 텍스트 칩을 8px로 교정.
- 수정 후: 첫·중간·마지막 칩 곡률과 레일 끝 패딩을 자동 검수하고 모바일·PC 렌더링을 재확인.

## Implementation Checklist

- [x] Car300 02-1 확대 확인
- [x] 공통 곡률 8px 적용
- [x] 마지막 칩 전용 회귀 테스트 추가
- [x] 모바일·PC 끝 패딩 확인
- [x] 빌드·콘솔 확인

## Follow-up Polish

- 없음.

final result: passed

---

# 트럭 2뎁스 좌측 형식 변경 칩 v57

## Source and implementation

- source visual truth: Google Drive Car300 캡처 폴더 `1BrE3oRxiFtVFS6mMwjU-2igwFs88pQKp`의 현행 캡처 4장
- implementation: `http://127.0.0.1:4182/?qf=guazi&category=트럭+·+특장&truckFormat=카고(화물)트럭`
- viewports: 모바일 390×844, PC 1280×900
- state: 트럭·특장 → 카고(화물)트럭 선택 후 2뎁스 차급 칩 레일

## Findings

- P1 해결: 이전 v56에는 Car300의 `更换车系`에 해당하는 좌측 첫 카드가 빠져 있었다.
- 캡처의 첫 카드는 일반 회색 옵션이 아니라 흰색 배경·회색 외곽선의 변경 동작 카드이며, 레일과 함께 스크롤된다.
- 보배드림에서는 같은 역할을 `형식 변경`으로 번역하고 현재 형식 선택을 해제해 1뎁스로 복귀시킨다.

## Full-view comparison evidence

- 모바일 전체 화면에서 `형식 변경`이 차급 카드 앞에 같은 52px 높이로 배치되고 첫 매물 영역을 밀어내지 않는 것을 확인했다.
- PC 전체 화면에서도 필터 카드 내부의 칩 레일 첫 위치를 유지하며 일반 차급 옵션과 시각적으로 구분된다.

## Focused region comparison evidence

- 모바일·PC 공통 실측: 제목 칩 64×52px, 흰색 배경, 1px 회색 테두리, 12px 곡률.
- 일반 차급 칩 실측: 최소 88×52px, `#F3F3F5`, 12px 곡률.
- `형식 변경` 선택 후 `truckFormat` 쿼리가 제거되고 `트럭 형식 빠른 선택` 레일이 다시 노출된다.
- 브라우저 경고·오류 0건.

## Required fidelity surfaces

- Fonts and typography: Pretendard 14/500/19, 2줄 가운데 정렬.
- Spacing and layout rhythm: 레일 좌우 16px, 칩 사이 8px, 옵션과 같은 52px 높이.
- Colors and visual tokens: 동작 카드는 `#FFF`·`#D9D9DD`, 일반 옵션은 `#F3F3F5`.
- Image quality and asset fidelity: 1뎁스 실사 이미지는 변경하지 않았다.
- Copy and content: `형식 변경`은 동작을 직접 설명하며 카고 차급·톤수 문구는 그대로 유지한다.

## Comparison history

- 이전: 2뎁스가 `경형`부터 바로 시작해 상위 형식으로 돌아갈 레일 내 동작이 없었다.
- 수정: Car300처럼 첫 위치에 별도 외곽선 동작 카드를 추가했다.
- 수정 후: 모바일·PC 치수와 1뎁스 복귀 동작, 콘솔 상태를 재확인했다.

## Implementation Checklist

- [x] Car300 캡처 4장 재확인
- [x] 좌측 첫 동작 카드 추가
- [x] 일반 옵션과 시각적 구분
- [x] 형식 해제·1뎁스 복귀 연결
- [x] 모바일·PC 전체 화면 검수
- [x] Playwright 테스트·빌드·콘솔 확인

## Follow-up Polish

- 없음.

final result: passed

---

# 트럭 2뎁스 카드형 칩 레일 v56

## Source and implementation

- source visual truth: Google Drive의 Car300 계층 선택 캡처(상위 선택값은 적용 칩으로 압축하고 현재 하위 선택지는 2줄 카드 칩으로 표시).
- implementation: `http://127.0.0.1:4182/?qf=guazi&category=트럭+·+특장&truckFormat=카고(화물)트럭`
- viewport: 모바일 390×844 CSS px, PC 1280×900 CSS px, deviceScaleFactor 1.
- state: 카고 2뎁스 초기 상태, 준중형 선택 뒤 정확한 적재중량 상태, 윙바디·탑차 긴 명칭 상태.
- combined comparison input: 같은 검수 세션에서 Car300 2줄 계층 카드 캡처와 구현 모바일·PC 캡처를 함께 대조했다.

## Findings

- P0/P1/P2 없음.
- 반복 이미지가 2뎁스 판단에 추가 정보를 주지 않고 세로 공간을 사용하므로 제거했다.
- 기존 새 6개 차급과 구형 톤수 데이터 키가 달라 제조사로 바로 넘어가던 P1 흐름 오류를 발견해 범위 매핑으로 교정했다.
- 카고 서비스 차급은 법정 차종 명칭이 아니라 빠른 탐색 그룹이며 실제 승인 적재중량은 다음 단계에서 고른다.

## Full-view comparison evidence

- 모바일은 68px 레일 안에 높이 52px 칩과 좌우 16px 여백을 배치해 기존 86px 이미지 레일보다 18px 줄였다.
- PC는 68px 레일, 좌우 20px 여백을 사용하며 6개 차급이 한 줄에 모두 보인다.
- 목록 시작점과 상단 필터 칩은 유지되어 레이아웃 점프나 겹침이 없다.

## Focused region comparison evidence

- 카드 칩: 최소 88×52px, 반경 12px, 배경 `#F3F3F5`, 간격 8px.
- 1행: 14/19px 600 `#222`; 2행: 12/16px 500 `#777`.
- 카고 6개: `경형/1톤 미만`, `소형/1~2톤`, `준중형/2.5~3.5톤`, `중형/4~6.5톤`, `준대형/7~10.8톤`, `대형/11톤 이상`.
- 준중형 선택 후 정확한 톤수 칩은 `2.5톤 · 3톤 · 3.5톤`으로 노출된다.
- 윙바디·탑차의 가장 긴 `내장탑 - 하이탑·익스탑`은 148×52px 안에서 2줄로 표시된다.

## Required fidelity surfaces

- Fonts and typography: 기존 Pretendard와 `#222/#777` 위계를 유지한다.
- Spacing and layout rhythm: 칩 52px, 간격 8px, 모바일 16px·PC 20px 좌우 여백.
- Colors and visual tokens: 중립 회색 카드와 검정 포커스 링을 사용하고 새 브랜드 색은 추가하지 않는다.
- Image quality and asset fidelity: 2뎁스에서만 이미지를 제거하며 1뎁스 트럭 실사 이미지와 제조사 로고는 그대로 유지한다.
- Copy and content: 서비스 차급과 적재 범위를 한 묶음으로 읽게 하고 정확한 톤수는 다음 단계에 둔다.

## Interaction and console QA

- 모바일·PC 모두 `카고 → 준중형 → 2.5/3/3.5톤` 흐름을 확인했다.
- 1뎁스 실사 카드와 2뎁스 텍스트 칩 분리, 구형 URL 호환, 경형·소형 매물 분리를 자동 테스트 5건으로 확인했다.
- `npm run verify:qf` 통과, 브라우저 경고·오류 0건.

## Comparison history

1. 기존 72px 이미지 카드와 차급·톤수 문구를 확인했다.
2. 이미지를 제거하고 52px 2줄 카드형 칩으로 교체했다.
3. 새 차급에서 정확한 톤수 단계가 생략되는 데이터 키 불일치를 교정했다.
4. 390px 모바일·1280px PC·긴 세부 형식·다음 단계·콘솔을 재검수했다.

final result: passed

---

# 초톳 원본 앱 필터 칩·리스트뷰·매물 목록 v47

## Source and implementation

- source visual truth: 노션 `열기 닫기 화살표`, `리스트 뷰`, 초톳 원본 앱 목록/갤러리 캡처
- source captures: `reports/chotot-list-fidelity-20261004/notion-original-list.png`, `reports/chotot-list-fidelity-20261004/notion-original-grid.png`
- implementation: `http://127.0.0.1:4174/?qf=guazi&category=트럭+·+특장`
- viewport: CSS 412×915, DPR 1.0
- states: 목록형, 갤러리형, 트럭·특장, 중고차

## Findings

- P0/P1/P2 없음.
- 이전 고정 필터 92px은 초톳의 콘텐츠 기반 자연 폭과 달랐고, 리스트뷰 버튼의 원형 테두리는 원본에 없었다.
- 노션 필터 펼침·리스트뷰 SVG를 패스 수정 없이 신규 버전 파일로 보존했다.
- 카드 썸네일 120×120, 제목 16/600/20, 메타 14/400/20, 가격 16/700/24는 이미 기준과 일치했다.

## Full-view comparison evidence

- CUA Pixel 7 환경에서 노션 원본 목록 캡처와 로컬 트럭·특장 목록을 시각 대조했다.
- 목록형에서 아이콘 단독 보기 전환, 120px 정사각 썸네일, 제목·메타·가격의 위계를 확인했다.
- 갤러리형으로 전환한 뒤 `view-list-chotot-v02.svg`가 20×20px로 표시되고 임의 테두리가 생기지 않는 것을 확인했다.

## Focused region comparison evidence

- 필터 칩: 32px / `#F4F4F4` / 9999px / 14·500·20 / 패딩 4×12 / 내부 2 / 칩 사이 4.
- 목록 카드: 썸네일 120×120 / 반경 8 / 정보 간격 12 / 제목 16·600·20 / 메타 14·400·20 / 가격 16·700·24.
- 트럭·특장과 중고차에서 같은 computed style을 재확인했다.
- 브라우저 경고·오류 0건.

## Required fidelity surfaces

- Fonts and typography: Pretendard를 유지하고 초톳 수치 토큰을 공통 목록에 사용한다.
- Spacing and layout rhythm: 칩 4px 간격, 카드 좌우 16px, 썸네일–정보 12px.
- Colors and visual tokens: 칩 `#F4F4F4`, 본문 `#222/#595959`, 가격 `#E5193B`.
- Image quality and asset fidelity: 노션 원본 SVG 패스 무수정, 차량 이미지 데이터 무변경.
- Copy and content: 기존 한국어 모델+유형 두 줄 구조와 보배 색상 테마 유지.

## Comparison history

- 이전: 필터 92px 고정 폭·뒤 간격 6px, 조건 칩 상하 3px, 리스트뷰 원형 테두리, CSS clip-path 화살표 혼용.
- 수정: 자연 폭·뒤 간격 4px·상하 4px, 아이콘 단독 보기 전환, 노션 SVG 단일화.
- 수정 후: 트럭·특장 및 중고차 공통 컴포넌트 실측 일치, 콘솔 오류 0건.

## Implementation Checklist

- [x] 노션 원본 SVG 수집 및 무수정 보존
- [x] 필터 칩 크기·색·패딩·간격 교정
- [x] 목록/갤러리 전환 아이콘 확인
- [x] 목록 썸네일·타이포그래피 전수 측정
- [x] 트럭·특장과 중고차 교차 검증
- [x] 브라우저 오류 확인

## Follow-up Polish

- 없음.

final result: passed

# 전체 퀵필터 좌측 제목 제거 v46

- source visual truth: `https://xe.chotot.com/mua-ban-xe-tai-xe-ben`
- implementation: `http://127.0.0.1:4174/?qf=guazi&category=트럭+·+특장`
- viewport/state: 모바일 384×850, PC 1440×900, 트럭 유형→세부유형→제조사→모델
- full-view comparison: 초톳 현재 모바일처럼 좌측 고정 제목 칸 없이 이미지·로고 슬롯부터 노출
- focused comparison: 모바일 첫 슬롯 x=16px, PC 콘텐츠 안 첫 슬롯 x=20px
- category audit: 중고차·트럭/특장·바이크·캠핑카·건설기계·자재운반장비·부품/용품 좌측 제목 노드 0건
- accessibility: 화면 제목 노드는 제거했지만 각 레일의 `aria-label` 보존
- horizontal overflow: 없음
- console errors: 0
- validation: `npm run verify:qf` 통과. `check:stability --base=http://127.0.0.1:4174/ --mode=plain`의 v46 제목 없는 정렬 항목은 PC·모바일 전부 통과했으며, 기존 모바일 상단 레이어 높이 규격 항목은 별도 선행 불일치로 남음

final result: passed

## 트럭 퀵필터 초톳 브랜드 슬롯 정렬 v45

- source visual truth: `C:\Users\bobae\OneDrive\문서\ChatGPT\퀵필터 제작\.codex-remote-attachments\01a0d236-12ba-7a11-a24d-5851b9bf98ed\b0101475-21b7-4ccb-aad5-3c65ad4001ea\3-1000014826.jpg`
- implementation: `http://127.0.0.1:5174/?qf=guazi&category=트럭+·+특장&v=slotqa3`
- same-input comparison: Codex 인앱 브라우저 탭 99 `http://127.0.0.1:5174/qa-compare.html`
- viewport: 기준·구현 각 412px 폭, 비교 캔버스 1280×720
- source pixels: 592×1280 캡처를 412px 폭으로 정규화
- implementation CSS size: 모바일 빈 슬롯 76px + 간격 8px, 트럭 카드 80px, 이미지 면 64×40px; PC 빈 슬롯 92px + 간격 8px
- state: 트럭·특장 루트 유형, 카고 세부유형, 제조사, 모델 단계

### Full-view comparison evidence

- 초톳 제조사 줄의 첫 로고 슬롯과 보배드림 첫 트럭 이미지 슬롯을 같은 412px 폭으로 나란히 표시했다.
- 보배드림 트럭 이미지는 좌측 제목 문구 없이 초톳의 빈 제목 칸 뒤 첫 슬롯 축에서 시작한다.
- 필터 칩의 선택값은 유지되어 제목 제거 후에도 현재 단계와 선택 상태를 확인할 수 있다.

### Focused region comparison evidence

- 구현 DOM 실측: 첫 트럭 카드 x=84px, 이미지 면 x=92px·폭 64px·중심 124px.
- 초톳 캡처의 첫 브랜드 로고 중심축과 구현 이미지 슬롯 중심축 차이는 약 2px로 허용 범위다.
- PC 실측: 콘텐츠 시작 x=40px에서 92px 빈 슬롯 + 8px 간격 뒤 첫 카드 x=140px.
- 트럭 루트·세부유형·제조사·모델 단계에서 `.depth-rail-label` 개수는 모두 0개다.

### Required fidelity surfaces

- Fonts and typography: 이미지·로고 명칭의 기존 규격은 유지했으며 제거 대상인 좌측·상단 제목만 삭제했다.
- Spacing and layout rhythm: 초톳 제조사 슬롯의 고정 제목 칸과 8px 간격을 보이지 않는 정렬 슬롯으로 재사용했다.
- Colors and visual tokens: 색상·배경·선택 상태 토큰은 변경하지 않았다.
- Image quality and asset fidelity: 기존 승인 트럭 PNG와 브랜드 로고 파일을 변형하지 않고 감싸는 레이아웃만 조정했다.
- Copy and content: 트럭 이미지·로고 레일 제목은 삭제하고, 필터 칩과 카드 명칭은 유지했다.

### Findings

- P0/P1/P2 없음.
- P3: 트럭 실사 이미지의 비대칭 차체 형상 때문에 보이는 픽셀 무게중심은 슬롯 중심과 1~3px 다르게 느껴질 수 있으나 이미지 캔버스 중심은 일치한다.
- 브라우저 경고·오류 0건.

### Comparison history

1. 최초 렌더에서 레일 래퍼가 첫 그리드 칸에 자동 배치되어 첫 카드 x=0인 P1 정렬 오류를 확인했다.
2. `.quick-rail-carousel`을 두 번째 그리드 칸으로 명시해 모바일 첫 카드 x=84px, PC 첫 카드 x=140px로 수정했다.
3. 수정 후 동일 비교 화면에서 초톳 로고 축과 대조하고 모든 트럭 뎁스의 제목 0개를 확인했다.

final result: passed
## 트럭 유형 모바일 필터 외곽·하단 액션 v46

- source visual truth: `https://bobaekimboae.github.io/bobaedream/?qf=guazi&v=57cf09a`에서 연 기본 `필터` 바텀시트.
- implementation: `http://127.0.0.1:4173/?qf=guazi&category=트럭 · 특장&v=local-footer`의 `트럭 유형` 바텀시트.
- implementation screenshot: Codex 인앱 브라우저 로컬 렌더(394×852)와 기준·구현 동시 비교 캡처.
- viewport: 모바일 394×852 CSS px, 비교용 와이드 모바일 모드 1280×720 CSS px, deviceScaleFactor 1.
- state: 라이트 테마, 기본 필터·트럭 유형 필터가 열린 상태, 카고(화물)트럭 선택 상태 추가 검증.

### Full-view comparison evidence

- 기준과 구현 모두 모바일에서 화면 하단에 붙고, 폭은 `min(100%, 520px)`, 최대 높이는 780px이다.
- 상단 모서리 20px, 60px 헤더, 좌측 제목, 우측 닫기, 흰 배경과 동일한 딤·그림자를 적용했다.
- 394px 화면에서 시트 폭 393.6px, 높이 780px, 하단 액션 폭 393.6px로 가로 넘침이 없다.

### Focused region comparison evidence

- 기준과 구현 하단 액션은 높이 80px, 패딩 14px 20px, 버튼 간격 8px이다.
- `초기화`는 112×44px, 확인 버튼은 남은 폭×44px, 라운드 8px이다.
- 확인 버튼은 `#1B4C8C`, 글자는 흰색 16px/600이며 선택 결과에 따라 `30대 보기` → `5대 보기`로 갱신됐다.

### Required fidelity surfaces

- fonts and typography: 모바일 제목 20/28px 700, 액션 버튼 16px 600으로 기준과 일치.
- spacing and layout rhythm: 헤더 60px, 액션 80px, 좌우 20px, 버튼 간격 8px, 초기화 112px로 일치.
- colors and visual tokens: 확인 `#1B4C8C`, 초기화 흰색·`#E0E0E0`, 액션 상단 `#EBEBEB`, 딤 `rgba(15,18,24,.42)`로 일치.
- image quality and asset fidelity: 기존 승인 트럭 유형 PNG와 닫기 아이콘을 그대로 사용했으며 새 대체 자산 없음.
- copy and content: `초기화`, `N대 보기`, `트럭 유형` 문구 유지.

### Interaction and console QA

- 카고(화물)트럭 체크 후 `5대 보기`를 눌러 시트가 닫히고 URL에 `truckFormat=카고(화물)트럭`이 반영되는 것을 확인했다.
- 모바일·PC 콘솔 오류 0건.
- PC 중앙 모달은 기존 PC 공통 규격(520px, 남색 확인 버튼, 초기화 118px)을 유지했다.

### Comparison history

1. 기준 기본 필터와 트럭 시트를 측정해 트럭의 64px 헤더·76.8px 액션·118px 초기화·남색 확인 버튼 차이를 확인했다.
2. 모바일 트럭 시트 외곽과 하단을 기준 기본 필터의 60px·80px·112px·파란 확인 버튼 규격으로 수정했다.
3. 기준·구현을 같은 비교 입력에서 다시 확인하고 394×852 렌더·필터 적용·PC 회귀를 통과했다.

final result: passed

## 트럭 유형 필터 v43

- source visual truth: 사용자 수정 요청 `아이콘까지 구분선 긋자`; v41의 핀노 행 구조에서 구분선 범위만 확장.
- implementation screenshot: Codex 인앱 브라우저 탭 24 모바일 렌더, 탭 25 PC 렌더.
- viewport: 모바일 394×852 CSS px, PC 1280×720 CSS px, deviceScaleFactor 1.
- state: 트럭 유형 선택창을 연 초기 상태, 라이트 테마.
- full-view comparison: 제목·닫기·행·고정 하단 액션·목록 밀도는 v41과 동일하며 구분선 범위만 변경됐다.
- focused region comparison: 체크박스 `20~40px`, 아이콘 `52~84px`, 명칭 `96px`, 구분선 `52px` 시작을 계산값과 렌더 화면에서 확인했다.
- fonts and typography: 제목 20/28px, 목록 15/20px 규격 유지.
- spacing and layout rhythm: 행 54px, 체크박스 20px, 아이콘 32px, 열 간격 12px 유지. 구분선은 아이콘 열 시작점 52px부터 오른쪽 끝까지 표시.
- colors and visual tokens: 구분선 `#E8E8E8`, 높이 1px, 선택 체크박스 `#111` 유지.
- image quality and asset fidelity: 기존 승인 트럭 유형 PNG를 변형 없이 사용.
- copy and content: 트럭 유형명·대수·하위 화살표 변경 없음.
- interaction: 모바일 바텀시트와 PC 모달 열기, 목록 스크롤, 하단 `30대 보기` 유지 확인.
- console: 모바일·PC 오류 0건.
- findings: P0/P1/P2 없음.
- comparison history: v41의 명칭 열 96px 시작 구분선을 사용자 요청에 따라 아이콘 열 52px 시작으로 확장한 뒤 모바일·PC에서 재확인했다.

final result: passed

## 트럭 제조사 로고 간격 v44

- source visual truth: `https://xe.chotot.com/mua-ban-oto`의 제조사 레일; PC 실측 셀 84×102px, 카드 피치 92px로 카드 사이 8px.
- implementation screenshot: Codex 인앱 브라우저 탭 26 모바일 렌더, 탭 28 PC 렌더.
- viewport: 모바일 394×852 CSS px, PC 1280×720 CSS px, deviceScaleFactor 1.
- state: `윙바디·탑차 → 윙바디` 선택 후 제조사 레일 노출, 라이트 테마.
- full-view comparison: 제조사 고정 제목 뒤에 로고 레일이 이어지고 모바일 가로 스크롤·PC 한 줄 구조를 유지한다.
- focused region comparison: 제목 오른쪽–첫 로고 카드 왼쪽 8px, 로고 카드 사이 8px, 로고–명칭 8px을 모바일·PC에서 확인했다.
- fonts and typography: 제조사 명칭 14/21px 400 규격 유지.
- spacing and layout rhythm: 모바일 셀 76×102px·로고 40×40px, PC 셀 84×102px·로고 40×40px 유지. 제목–첫 로고 간격만 0px에서 8px로 보정.
- colors and visual tokens: 흰 배경·무테두리·투명 로고 슬롯 유지.
- image quality and asset fidelity: 이처·당근 기반 기존 승인 트럭 로고를 변형 없이 사용.
- copy and content: `제조사`, 상위 10개 제조사, `전체 브랜드` 문구 유지.
- interaction: 제조사 레일 노출, 모바일 가로 스크롤, PC 11칸 한 줄과 필터 결과 유지.
- console: 모바일·PC 오류 0건.
- findings: P0/P1/P2 없음.
- comparison history: 제목과 첫 로고가 0px로 붙어 있던 상태를 확인하고, 초톳의 8px 셀 피치와 같은 8px 구분 간격으로 수정한 뒤 재측정했다.

final result: passed
# 트럭 측면 이미지 시안 Design QA v02

- source visual truth:
  - `public/assets/truck/pilot/v02/truck_type_cargo_side_v02.png`
  - `public/assets/truck/pilot/v02/truck_type_wingbody_side_v02.png`
  - `public/assets/truck/pilot/v02/truck_type_tanker_side_v02.png`
  - `public/assets/truck/pilot/v02/truck_type_cargo_crane_side_v02.png`
  - `docs/truck/truck_bottomsheet_media_consensus_v01.md`
- implementation screenshot: Codex 인앱 브라우저 tab 38(모바일 모드)·tab 39(PC 모드) 캡처
- implementation URL:
  - `http://127.0.0.1:5175/?qf=guazi&category=트럭+·+특장`
  - `http://127.0.0.1:5175/?qf=guazi&pc=1&category=트럭+·+특장`
- viewport: 1280×720, devicePixelRatio 1.25
- source pixels: 정규화 이미지 228×120
- implementation CSS size: 이미지 56×40, 모바일 행 64, PC 행 60
- density normalization: 원본은 `object-fit: contain`으로 56×40 CSS 슬롯에 축소했으며 구현 캡처는 DPR 1.25에서 확인
- state: 루트 유형 목록, 카고 하위 목록, 소형 선택, 1대 보기 적용

## Full-view comparison evidence

- 모바일 모드 바텀시트와 PC 중앙 모달 모두 체크박스·이미지·명칭·대수·화살표 열이 겹치지 않는다.
- 헤더와 하단 액션은 고정되고 유형 목록만 내부 스크롤한다.
- 측면 v02 샘플은 카고·윙바디·탱크로리·카고크레인에서 앞머리 왼쪽 방향과 바닥선이 유지된다.

## Focused region comparison evidence

- 같은 CUA 비교 입력에서 카고 228×120 원본과 PC 56×40 적용 상태를 함께 대조했다.
- PC 실측: 행 520×60, 이미지 표면 56×40, 하단 액션 520×77.
- 모바일 모드 실측: 행 505×64, 이미지 표면 56×40, 하단 액션 520×80.
- 카고 하위의 소형 선택 후 확정 버튼이 1대 보기로 갱신되고 URL에 `truckFormat=카고(화물)트럭&truckSubtype=소형`이 반영됐다.
- 브라우저 경고·오류는 0건이다.

## Required fidelity surfaces

- Fonts and typography: 기존 15/20px·650 라벨과 13px 대수를 유지해 글자 잘림이 없다.
- Spacing and layout rhythm: 체크박스 20 → 12 간격 → 이미지 56 → 12 간격 → 명칭 순서이며 모바일 64/PC 60 행에 수직 중앙 정렬됐다.
- Colors and visual tokens: 이미지 표면 #F7F7F7, 경계 #ECECEC, 반경 6px가 흰색·은색 차체 외곽을 분리한다.
- Image quality and asset fidelity: 네 원본 모두 1484×1060 투명 생성본을 228×120 투명 캔버스·바닥선 y=111로 정규화했다. 로고·문자·번호판은 없다.
- Copy and content: 기존 트럭 유형명·매물 수·하위 탐색 명칭은 변경하지 않았다. 접근성 이름에 매물 수를 추가했다.

## Findings

- P0/P1/P2 없음.
- P3: 완전 측면형은 긴 차체 비율 때문에 실제 차량 높이가 56×40 슬롯 안에서 약 21~25px다. 이번 시안 목적에는 적합하며, 추가 확대는 앞뒤 잘림 없이 불가능하므로 사용자 비교 후 결정한다.

## Comparison history

- 초기 공개본: 32×28 이미지 요소에서 실제 실루엣 약 30×15, 유형 인지가 약함.
- 수정: 56×40 표면, 모바일 64/PC 60 행, 측면 v02 4종 연결.
- 수정 후 증거: 루트·카고 하위 캡처, CSS 실측, 선택·확정·URL 동작, 콘솔 오류 0건.

## Implementation Checklist

- [x] 측면 v02 4종 정규화
- [x] 루트·대표 2뎁스 연결
- [x] 모바일·PC 슬롯과 행 크기 적용
- [x] 하위 탐색·선택·확정·URL 검증
- [x] 콘솔 오류 확인

## Follow-up Polish

- 사용자 비교 결과에 따라 이미지 표면을 유지하거나 투명 무배경으로 바꿀 수 있다.
- 나머지 상위 유형은 승인 후 같은 측면 규칙으로 순차 제작한다.

final result: passed

---

# 트럭 퀵필터 텍스트 슬롯 초톳 정렬 v46

## Source and implementation

- source visual truth: `C:\Users\bobae\OneDrive\문서\ChatGPT\퀵필터 제작\.codex-remote-attachments\01a0d236-12ba-7a11-a24d-5851b9bf98ed\b0101475-21b7-4ccb-aad5-3c65ad4001ea\3-1000014826.jpg` 및 초톳 실화면 `https://xe.chotot.com/mua-ban-xe-tai-xe-ben`
- implementation: `http://127.0.0.1:5174/?qf=guazi&category=트럭+·+특장&v=text-slot-v46`
- viewport: Pixel 7 기준 CSS 412×915, DPR 1.0으로 실측·렌더링
- source pixels: 첨부 캡처 592×1280을 CSS 폭 412px로 정규화; 초톳 실화면은 CSS 412×915로 직접 측정
- implementation pixels: CSS 412×915, DPR 1.0
- state: 트럭·특장 첫 유형 퀵필터 줄, 미선택 상태

## Findings

- P0/P1/P2 없음.
- 초톳 실측은 슬롯 64×56, 이미지 36×36, 이미지–명칭 2px, 명칭 12/500/18 `#595959`, 명칭 폭 56px, 가운데 정렬이다.
- 보배 모바일은 실사 슬롯 80px 안에서 이미지 64×40, 명칭 폭 72px, 간격 2px, 명칭 12/500/18 `#595959`, 가운데 정렬로 같은 슬롯 공식을 유지한다.
- 긴 한국어 명칭은 최대 두 줄로 줄바꿈하며 `text-overflow: clip`으로 말줄임표를 만들지 않는다.

## Full-view comparison evidence

- CUA에서 초톳 원본 캡처와 보배 변경본을 한 412px 화면에 세로로 합쳐 비교했다.
- 초톳의 로고 아래 명칭 기준선과 보배의 실사 아래 명칭 기준선 모두 이미지 하단에서 2px 떨어져 시작한다.
- 좌측 상단 뎁스 제목은 변경본에 다시 생기지 않았고, 첫 이미지 슬롯은 기존 빈 제목 슬롯 이후 위치를 유지한다.

## Focused region comparison evidence

- 초톳 DOM 실측: `card 64×56 / image 36×36 / gap 2 / label 56×18 / 12px / 500 / 18px / rgb(89,89,89) / center`.
- 보배 빌드 후 실측: `card 80×84 / image 64×40 / gap 2 / label 72×36 / 12px / 500 / 18px / rgb(89,89,89) / center / text-overflow clip`.
- 브라우저 경고·오류 0건.

## Required fidelity surfaces

- Fonts and typography: 한글 호환 Pretendard를 유지하며 초톳의 12/500/18 시각 규격을 적용했다.
- Spacing and layout rhythm: 이미지–명칭 2px, 명칭 좌우 4px 여백, 8px 슬롯 간격을 유지했다.
- Colors and visual tokens: 초톳 명칭색과 같은 `#595959`; 선택 시 보배 테마 `#222`는 유지한다.
- Image quality and asset fidelity: 기존 승인된 투명 트럭 이미지는 수정하지 않고 텍스트 배치만 변경했다.
- Copy and content: 트럭 유형명과 선택값은 변경하지 않았고, 말줄임표 없이 최대 두 줄로 표시한다.

## Comparison history

- 이전: 모바일 이미지–명칭 7px, PC 9px로 초톳 실측 2px보다 벌어져 이미지와 명칭의 결속이 약했다.
- 수정: 모바일·PC 모두 2px, 12/500/18 `#595959`, 슬롯 좌우 4px 여백 공식으로 통일했다.
- 수정 후: 모바일 실측값 일치, 전체 유형 줄에 공통 적용, 콘솔 오류 0건.

## Implementation Checklist

- [x] 초톳 실화면 getComputedStyle·getBoundingClientRect 측정
- [x] 모바일 트럭 유형 텍스트 슬롯 적용
- [x] PC 트럭 유형 텍스트 슬롯 규칙 적용
- [x] 두 줄 줄바꿈·말줄임표 제거
- [x] 원본·구현 한 화면 비교
- [x] 브라우저 오류 확인

## Follow-up Polish

- 없음.

final result: passed

---

# 트럭 퀵필터 왼쪽 제목 슬롯 v47

## Source and implementation

- source visual truth: `C:\Users\bobae\OneDrive\문서\ChatGPT\퀵필터 제작\.codex-remote-attachments\01a0d236-12ba-7a11-a24d-5851b9bf98ed\b0101475-21b7-4ccb-aad5-3c65ad4001ea\3-1000014826.jpg`
- implementation: `http://127.0.0.1:5174/?qf=guazi&category=트럭+·+특장&v=left-slot-v47`
- viewport: CSS 412×915, DPR 1.0
- source pixels: 592×1280 캡처를 CSS 폭 412px로 정규화
- implementation pixels: CSS 412×915, DPR 1.0
- state: 트럭·특장 첫 유형 퀵필터 및 카고 선택 후 세부유형 퀵필터

## Findings

- P0/P1/P2 없음.
- 초톳 제조사 줄의 왼쪽 제목처럼 보배 트럭 레일도 제목을 별도 상단 행이 아니라 같은 레일의 고정 첫 열에 표시한다.
- 모바일 제목 슬롯은 76px, 왼쪽 패딩 16px, 제목 14/400/20 `#595959`; 제목 뒤 8px에서 첫 이미지 슬롯이 시작한다.
- PC 제목 슬롯은 92px, 왼쪽 패딩 20px이며 같은 글자 규격과 8px 간격을 사용한다.

## Full-view comparison evidence

- 초톳 `Hãng xe` 왼쪽 제목이 있는 원본 레일과 보배 `트럭 유형` 레일을 한 412px 비교 화면에 세로로 배치해 확인했다.
- 보배 제목은 상단에 따로 뜨지 않고 이미지와 같은 수직 중앙선에 놓였으며 첫 이미지의 기존 x축은 유지됐다.

## Focused region comparison evidence

- 보배 모바일 실측: 제목 `x=0, width=76, height=84, padding-left=16, 14/400/20, #595959`; 첫 이미지 카드 `x=84`; 제목 슬롯 뒤 간격 `8px`.
- 카고 선택 후 같은 위치에서 제목이 `세부유형`으로 바뀌고 슬롯 폭·간격이 유지된다.
- 브라우저 경고·오류 0건.

## Required fidelity surfaces

- Fonts and typography: Pretendard 14/400/20으로 초톳 왼쪽 분류 라벨의 시각 밀도에 맞췄다.
- Spacing and layout rhythm: 모바일 76px·PC 92px 제목 열과 8px 간격을 유지했다.
- Colors and visual tokens: 제목 `#595959`, 배경·테두리 없음.
- Image quality and asset fidelity: 트럭 실사 이미지와 슬롯 크기는 변경하지 않았다.
- Copy and content: 뎁스에 따라 `트럭 유형`, `세부유형`, `제조사`, `모델`, `세부모델`을 표시한다.

## Comparison history

- 이전: 제목 슬롯 폭은 남아 있었지만 텍스트 노드가 없어 왼쪽이 비어 있었다.
- 수정: 빈 슬롯 안에 뎁스명을 추가하고 초톳 기준으로 글자와 패딩을 지정했다.
- 수정 후: 루트·하위 유형 실측과 한 화면 비교에서 위치·간격이 유지되고 콘솔 오류가 없다.

## Implementation Checklist

- [x] 왼쪽 제목을 같은 레일 안에 배치
- [x] 모바일 76px / PC 92px 고정 제목 슬롯
- [x] 루트·하위 유형 전환 확인
- [x] 제조사·모델·세부모델 뎁스 제목 추가
- [x] 원본·구현 한 화면 비교
- [x] 브라우저 오류 확인

## Follow-up Polish

- 없음.

final result: passed
# 트럭 퀵필터 좌측 제목·미디어 정렬 v44

- source visual truth: Google Drive 초톳 1080×2340 캡처 2장, 384 CSS px·2.8125배율
- implementation screenshot: `reports/truck-rail-spacing-v44/implementation.png`
- viewport/state: 모바일 트럭 유형·세부유형·제조사·모델 레일
- full-view comparison: 좌측 제목 x=16px 유지, 초톳 첫 로고 중심 113.6px와 보배 첫 미디어 중심 114px 일치
- focused comparison: 유형·세부유형 68+2+44=114, 제조사 68+8+38=114, 모델 68+10+36=114
- typography: 14/20 400 `#595959` 유지
- colors/tokens: 변경 없음
- image quality: 승인 원본 유지, 재가공 없음
- copy/content: 뎁스별 제목 유지
- interaction: 유형 → 세부유형 → 제조사 → 모델 전환 정상
- console errors: 0
- validation: `npm run check:runtime`, `npm run verify:qf` 통과
- comparison history: 412px 오환산 폐기 → 384px로 재환산 → 첫 중심 114px로 교정 → 렌더링 재확인
## 건설기계 유형 1뎁스 시안 v02

- source visual truth: 초톳 실사형 카테고리 슬롯 규칙과 `heavy_type_yellow_pilot_v02_ko_contact.png`
- implementation: `http://127.0.0.1:4183/?qf=guazi&category=건설기계`
- viewport: 모바일 384×850 CSS px
- state: 건설기계 카테고리, 유형 미선택 상태

### Measured implementation

- 유형 셀: 76×102px
- 이미지 가시 슬롯: 64×40px
- 셀 간격: 8px
- 이미지: `object-fit: contain`, `object-position: center bottom`
- 라벨: 14/20px, 최대 2줄
- 카드 배경·테두리: 없음
- 원본: 투명 1024×640, 노란 본체·차콜 부품, 좌측 전면 3/4, 동일 하단 기준선

### Interaction and console QA

- 초기 화면에서 `유형`이 건설기계의 첫 번째 뎁스로 노출된다.
- 굴삭기 선택 시 세부 유형 텍스트 칩 레일로 전환한다.
- 세부 유형 선택 시 제조사 로고 레일로 전환한다.
- 상위 유형을 바꾸면 세부 유형·제조사·모델·세부모델이 초기화된다.
- 브라우저 콘솔 경고·오류 및 이미지 404는 0건이다.

### Required fidelity surfaces

- typography: 초톳형 14px 라벨, 20px 행간, 최대 2줄.
- spacing and layout: 이미지와 라벨 사이 14px, 셀 간 8px, 동일 하단 기준선.
- colors and tokens: 흰 배경 위 노란 본체와 차콜 기계 부품.
- image quality: 1024×640 투명 원본을 축소 사용하며 강제 확대·왜곡·잘림 없음.
- copy and content: 국내 사용자가 바로 이해하는 한국어 유형명.

### Findings

- P0/P1/P2 없음.
- P3: 현재 8종은 슬롯 규칙 검증용 v02 세트다. 전체 유형 확장 시 동일 캔버스·기준선·가시영역을 유지한다.
- P3: 일부 유형 0건은 가상 매물 데이터 부족이며 슬롯 UI 결함은 아니다.
final result: passed

## 건설기계 좌측 타이틀 제거 v03

- 사용자 확정 규칙에 따라 건설기계 퀵필터의 좌측 `유형` 타이틀과 80px 예약 슬롯을 제거했다.
- 모바일은 왼쪽 16px, PC는 20px에서 첫 이미지 카드가 바로 시작한다.
- 이미지 슬롯 64×40px, 카드 76×102px, 카드 간격 8px은 변경하지 않는다.
- 상단 공통 `초기화` 기능을 사용하므로 첫 레일의 별도 초기화·이전 단계 영역은 표시하지 않는다.
- 384px 렌더 실측: 좌측 타이틀 0개, 첫 카드 x=16px, 카드 76×102px, 이미지 오류·콘솔 오류 0건.

final result: passed
