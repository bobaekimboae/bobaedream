# Design QA

## 모바일 목록 제어행 v40

- source visual truth: `C:\Users\bobae\Downloads\notion-original-video-sort-1.png`, `C:\Users\bobae\Downloads\notion-original-video-sort-2.png`
- implementation: Codex 인앱 브라우저 로컬 렌더링 `http://127.0.0.1:5175/?qf=guazi&v=local`
- implementation screenshot: 인앱 브라우저의 384×844 전체 화면 및 384×48 제어행 근접 캡처
- viewport: 384×844, 추가 360×800
- density normalization: 원본 945×2048 캡처는 CSS 384px 폭에 맞춰 구조·비율을 비교했고 구현은 CSS 384px, deviceScaleFactor 1 화면으로 확인
- state: 기본, `영상 매물` 선택, `영상 매물 + 개인` 동시 선택

## Full-view comparison evidence

- 원본과 구현 모두 퀵필터 이미지·로고 레일 바로 아래에 목록 제어행 하나가 위치한다.
- 구현에서 기존 44px 영상·정렬 행과 48px 판매자 탭 행의 이중 구조가 제거되어 목록 시작점이 원본처럼 48px 제어행 직후로 올라왔다.
- 360px와 384px 모두 문서 가로 넘침이 없고 보기 방식 아이콘이 오른쪽에 고정됐다.

## Focused region comparison evidence

- 순서: 정렬, 영상 매물, 개인, 딜러, 4칸 보기 방식이며 항목 사이 세로 구분선은 없다.
- 기본 상태: 영상·판매자 항목은 회색 텍스트 탭이다.
- 선택 상태: 영상과 개인이 각각 32px Airbnb형 흰색·검정 외곽선 알약칩으로 바뀌며 동시에 표시된다.
- 아이콘: 정렬은 아래 방향 꺾쇠, 보기 방식은 24px 4칸 그리드로 원본과 일치한다.

## Required fidelity surfaces

- Fonts and typography: 14/20px, 정렬 600·비선택 탭 500·선택 600으로 확인.
- Spacing and layout rhythm: 행 48px, 상하 8px, 좌우 16px, 제어 32px로 확인. 정렬 뒤 인위적인 세로 구분선은 제거했다.
- Colors and visual tokens: 기본 `#222`/비선택 회색, 선택 흰 배경·`#222` 글자·2px 외곽선·12% 그림자, 아래 1px 구분선으로 확인.
- Image quality and asset fidelity: 새 래스터 자산 없음. 기존 꺾쇠 SVG와 Radix 4칸 아이콘을 사용해 코드 도형을 추가하지 않음.
- Copy and content: `업데이트순 · 영상 매물 · 개인 · 딜러`를 표시하고 모바일의 `전체 · 브랜드`는 제거. PC 문구·스위치는 유지.

## Findings

- P0/P1/P2 없음.
- 원본과 구현 모두 퀵필터 이미지·로고 레일 바로 아래에 목록 제어행 하나가 위치한다.
- 기존 44px 영상·정렬 행과 48px 판매자 탭 행을 48px 제어행 하나로 통합했다.
- 360px와 384px 모두 가로 넘침이 없고 보기 방식 아이콘이 오른쪽에 고정됐다.
- 순서: 정렬, 구분선, 영상 매물, 개인, 딜러, 4칸 보기 방식.
- 선택 상태: 32px Airbnb형 흰색·검정 외곽선 알약칩.
- Fonts: 14/20px, 정렬 600·비선택 500·선택 600.
- Spacing: 행 48px, 상하 8px, 좌우 16px, 구분선 20px, 제어 32px.
- Colors: 기본 `#222`, 비선택 회색, 선택 흰 배경·`#222`·2px 외곽선·12% 그림자.
- Assets: 기존 꺾쇠 SVG와 Radix 4칸 아이콘을 사용한다.
- Copy: `업데이트순 · 영상 매물 · 개인 · 딜러`; 모바일의 `전체 · 브랜드`는 제거하고 PC는 유지한다.
- P3: 원본 베트남어와 한국어의 글자 폭 차이는 현지화 차이로 허용한다.

### Comparison history

1. 초기 이중 행과 목록형 아이콘을 확인했다.
2. 단일 48px 행, 선택 알약, 정렬 꺾쇠, 4칸 보기 아이콘으로 수정했다.
3. 384px 기본·복수 선택, 360px 기본에서 가로 넘침 없음과 결과 갱신을 확인했다.
4. v40에서 연노랑 선택색을 Airbnb형 흰색·검정 선택 표면으로 교체했다.

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

final result: passed
