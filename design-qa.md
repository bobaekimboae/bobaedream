# 서울오토갤러리 탐색 탭 시안 QA

- source visual truth: `reports/seoul-auto-gallery-dealer-suits-deployed.png`
- implementation: `reports/seoul-auto-gallery-tabs-v01-vehicles.png`
- interaction states: `reports/seoul-auto-gallery-tabs-v01-companies.png`, `reports/seoul-auto-gallery-tabs-v01-dealers.png`
- side-by-side evidence: `reports/seoul-auto-gallery-tabs-v01-compare.png`
- viewport: 390 × 844 CSS px
- source pixels: 390 × 844
- implementation pixels: 390 × 844
- deviceScaleFactor: 1
- density normalization: none required
- state: 서울오토갤러리 첫 화면, 필터 미선택, 판매 차량 기본 탭

## Findings

- P0/P1/P2 findings: none.
- Fonts and typography: 기존 Pretendard 위계와 동일하며 탭은 16/22, 선택 700, 미선택 400으로 분리된다.
- Spacing and layout rhythm: 지역 행을 48px 탭으로 교체했고, 브랜드 카드 높이를 102px에서 80px로 줄여 이름 아래 불필요한 여백을 제거했다.
- Colors and tokens: 선택 #222, 미선택 #8B95A1, 구분선 #EDEDED로 기존 필터 토큰과 맞는다.
- Image quality: 헤더, 브랜드 로고, 딜러 정장 프로필 원본 자산을 그대로 사용하며 대체 그래픽은 없다.
- Copy and content: 판매 차량 · 입점 상사 · 소속 딜러 · 소개의 역할이 명확하며 탐색 화면에서 중복 필터와 목록을 숨긴다.
- Accessibility: role=tablist/tab과 aria-selected 상태가 탭 전환에 맞게 바뀐다.

## Focused region evidence

상단 헤더부터 첫 매물까지 같은 390px 크롭으로 비교했다. 탭, 브랜드 레일, 목록 시작점이 모두 한 화면에 보여 별도 확대 크롭은 필요하지 않았다.

## Interaction verification

- 판매 차량: 필터, 브랜드 레일, 매물 목록 표시
- 입점 상사: 상사명, 소속 딜러 수, 매물 수 표시
- 소속 딜러: 정장 프로필, 이름, 매물 수 표시
- 소개: 단지 설명과 세 탐색 경로 요약, 판매 차량 복귀 버튼 표시
- 선택 밑줄과 aria-selected가 세 탭 모두 정상 전환
- 브라우저 console errors/warnings: 0

## Comparison history

- Initial finding: 기존 화면은 지역 정보가 불필요하고 브랜드 이름 아래 21px의 빈 공간과 딜러 레일 중복 노출로 상단이 길었다.
- Fix: 지역 행을 3개 기능 탭으로 교체하고 탭별 콘텐츠를 분리했다. 브랜드 카드의 로고-명칭 간격을 14px에서 6px로, 카드 높이를 102px에서 80px로 줄였다.
- Post-fix evidence: `reports/seoul-auto-gallery-tabs-v01-compare.png`; 첫 매물이 더 일찍 시작하고 탐색 목적이 명확해졌다.

## Implementation checklist

- [x] 지역·초기화 행 제거
- [x] 3개 탭 및 선택 상태 구현
- [x] 판매 차량 기본 상태
- [x] 입점 상사 실제 데이터 요약
- [x] 전문 딜러 정장 프로필 연결
- [x] 브랜드 레일 하단 여백 축소
- [x] 390px 렌더링 및 상호작용 확인

## Follow-up polish

- P3: 실제 상사 상세 화면이 연결되면 상사 행의 꺾쇠를 상세 화면으로 연결한다.

final result: passed
