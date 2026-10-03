# Design QA — 모바일 목록 제어행 v40

- source visual truth: `C:\Users\bobae\Downloads\notion-original-video-sort-1.png`, `C:\Users\bobae\Downloads\notion-original-video-sort-2.png`
- implementation: Codex 인앱 브라우저 로컬 렌더링 `http://127.0.0.1:5175/?qf=guazi&v=local`
- implementation screenshot: 인앱 브라우저의 384×844 전체 화면 및 384×48 제어행 근접 캡처(현재 작업 기록에 보존, 파일 저장 미지원)
- viewport: 384×844, 추가 360×800
- density normalization: 원본 945×2048 리사이즈 캡처는 CSS 384px 폭에 맞춰 구조·비율을 비교했고 구현은 CSS 384px, deviceScaleFactor 1 화면으로 확인
- state: 기본, `영상 매물` 선택, `영상 매물 + 개인` 동시 선택

## Full-view comparison evidence

- 원본과 구현 모두 퀵필터 이미지·로고 레일 바로 아래에 목록 제어행 하나가 위치한다.
- 구현에서 기존 44px 영상·정렬 행과 48px 판매자 탭 행의 이중 구조가 제거되어 목록 시작점이 원본처럼 48px 제어행 직후로 올라왔다.
- 360px와 384px 모두 문서 가로 넘침이 없고 보기 방식 아이콘이 오른쪽에 고정됐다.

## Focused region comparison evidence

- 순서: 정렬, 1px 구분선, 영상 매물, 개인, 딜러, 4칸 보기 방식이 원본과 일치한다.
- 기본 상태: 영상·판매자 항목은 회색 텍스트 탭이다.
- 선택 상태: 영상과 개인이 각각 32px Airbnb형 흰색·검정 외곽선 알약칩으로 바뀌며 동시에 표시된다.
- 아이콘: 정렬은 아래 방향 꺾쇠, 보기 방식은 24px 4칸 그리드로 원본과 일치한다.

## Required fidelity surfaces

- Fonts and typography: 14/20px, 정렬 600·비선택 탭 500·선택 600으로 확인.
- Spacing and layout rhythm: 행 48px, 상하 8px, 좌우 16px, 구분선 20px, 제어 32px로 확인.
- Colors and visual tokens: 기본 `#222`/비선택 회색, 선택 흰 배경·`#222` 글자·2px 외곽선·12% 그림자, 아래 1px 구분선으로 확인.
- Image quality and asset fidelity: 새 래스터 자산 없음. 기존 꺾쇠 SVG와 Radix 4칸 아이콘을 사용해 코드 도형을 추가하지 않음.
- Copy and content: `업데이트순 · 영상 매물 · 개인 · 딜러`를 표시하고 모바일의 `전체 · 브랜드`는 제거. PC 문구·스위치는 유지.

## Findings

- P0/P1/P2 없음.
- P3: 원본 베트남어 명칭과 한국어 명칭의 글자 폭 차이는 의도된 현지화 차이로 허용.

## Comparison history

1. 초기: 영상·정렬 행과 판매자 탭 행이 분리되고 보기 아이콘이 목록형이라 원본과 구조가 달랐다.
2. 수정: 단일 48px 행으로 통합하고 선택 알약 상태, 정렬 꺾쇠, 4칸 보기 아이콘을 적용했다.
3. 재확인: 384px 기본·복수 선택, 360px 기본에서 가로 넘침 없음과 필터 결과 갱신을 확인했다.
4. v40: 연노랑 선택색을 우리 Airbnb형 흰색·검정 선택 표면으로 교체하고 마지막으로 누른 포커스 상태에서도 2px 테두리가 유지됨을 확인했다.

final result: passed
