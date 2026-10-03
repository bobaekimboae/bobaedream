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
