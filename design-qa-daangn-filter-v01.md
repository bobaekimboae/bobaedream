# Design QA — 당근형 필터 계층 v01

## 비교 기준

- source visual truth: `reports/daangn-filter-v01/source-daangn.png`
- browser-rendered implementation: `reports/daangn-filter-v01/implementation-default.png`
- combined comparison: `reports/daangn-filter-v01/comparison.png`
- expanded implementation: `reports/daangn-filter-v01/implementation-expanded.png`
- PC implementation evidence: `reports/qf-093-sidebar/1440x900-collapsed.png`
- viewport: 모바일 390×844 CSS px, deviceScaleFactor 1; PC 1440×900 CSS px, deviceScaleFactor 1
- source/implementation pixels: 모바일 양쪽 390×844px로 정규화
- state: 전체 필터 기본 상태, `필터 더보기` 확장 상태, PC 좌측 필터 숨김·복원 상태

## Full-view comparison evidence

- 당근의 딤 배경, 둥근 필터 표면, 고정 제목·닫기, 스크롤 본문, 하단 초기화·적용 구조를 보배드림 모바일 필터에 적용했다.
- 구현 시트는 y=64, 390×780이며 화면 아래 844px에 정확히 맞는다.
- 기본 노출은 상태·브랜드·차종·연료·가격·연식·주행거리·변속기·판매 방식이며 기존 상세 조건은 기본 화면에 나타나지 않는다.
- 당근의 주황색 대신 보배드림 파랑을 적용 버튼과 활성 상태에 유지한 것은 의도적인 브랜드 토큰 차이다.

## Focused region comparison evidence

- 별도 확대 이미지 없이도 390×844 1:1 캡처에서 제목, 행 높이, 스위치, 셰브론, 더보기 버튼, 고정 푸터가 모두 판독 가능했다.
- DOM 측정으로 시트 위치·크기·가로 넘침과 기본/확장 문구를 추가 확인했다.

## 필수 품질면

- 글꼴·타이포그래피: Pretendard Variable 유지. 제목 20/28 700, 항목 16/22 600으로 위계가 선명하다.
- 간격·레이아웃: 20px 좌우 인셋, 56px 항목, 60px 헤더, 80px 푸터이며 가로 넘침이 없다.
- 색상·토큰: 당근의 표면·딤 구조를 따르되 핵심 동작색은 보배드림 `#1B4C8C`을 유지한다.
- 이미지 품질: 이번 변경에서 신규 이미지·로고 대체가 없고 기존 SVG 닫기·셰브론이 선명하게 유지된다.
- 문구·콘텐츠: 당근의 필터 축을 `브랜드`, `차종`, `판매 방식`으로 맞췄고 기존 조건은 삭제하지 않고 더보기에 보존했다.

## 동작 검증

- 모바일 기본 상태에서 추가 필터 비노출, `필터 더보기` 후 카테고리·차급·지역·매매단지·색상 등 복원 확인.
- PC 기본 필터 8개가 모두 접힌 상태로 노출되고, 더보기 후 기존 27개가 복원됨을 확인.
- PC 좌측 `숨기기` 후 그리드 `48px 1128px`, 복원 후 `300px 876px` 확인.
- 모바일·PC 콘솔 오류 0건.
- `node scripts/audit-daangn-filter-v01.mjs --base=http://127.0.0.1:5175/`: 6/6 통과.
- `npm run check:sidebar`: 34/34 통과.
- `npm run verify:qf`: 통과.

## 비교 이력

- 1차 비교에서 P0/P1/P2 차이는 발견되지 않았다.
- 기능 검증 스크립트가 이전 QF-110의 27개 상시 노출을 기대하던 문제를 새 계층 기준으로 갱신했다. UI 수정 사항은 없었다.

## Findings

- 잔여 P0/P1/P2 없음.
- P3: 당근 원본의 인라인 브랜드 선택 대신 기존 보배드림 브랜드·모델 드릴다운을 별도 화면으로 유지한다. 데이터 깊이를 보존하기 위한 의도적 차이다.

## Implementation Checklist

- 기본 필터 축 9개 유지.
- 추가 조건은 `필터 더보기` 아래 유지.
- PC 숨김·복원과 모바일 고정 푸터 회귀 검증 유지.

final result: passed
