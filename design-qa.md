# Design QA — 럭셔리 30대 담당 딜러명 시나리오

## Comparison target

- Source visual truth: `reports/luxury-ui-test-20261002/title-position-public-after-model.png`의 기존 판매자 줄.
- Implementation screenshot: 이 작업의 Codex `@Browser` 목록형·피드형 캡처.
- Browser-rendered implementation: 로컬 `?qf=guazi&scenario=luxury30&titlepos=after-model` 및 `&view=feed`.
- Viewport: 384 × 832 CSS px.
- State: 럭셔리 UI 테스트 가상 매물 30대, 목록형·피드형, 라이트 테마.
- Source pixels: 384 × 832. Implementation pixels: 384 × 832. CSS viewport: 384 × 832. Density normalization: 1:1 CSS 크기 비교.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- 딜러 매물 23대에 서로 다른 가상 담당자명을 배치했다.
- 판매자 줄은 `담당자명 딜러`만 표시하고 상사명은 노출하지 않는다.
- 개인 매물 7대는 기존 `개인판매자`를 유지한다.
- 프사, 판매자 줄 높이, 타이포그래피, 지역·차량·가격 정보와 카드 간격은 변경하지 않았다.
- 전체 화면 비교에서 정보 밀도와 카드 높이는 기존 시안과 같다.
- 판매자 줄 집중 비교에서 담당자명이 온전히 표시되고 다음 카드와 겹치지 않는다.
- 색상 토큰, 차량 이미지 품질·크롭, 지역 아이콘, 문구 계층은 기존과 동일하다.

## Interaction verification

- 목록형 1·2페이지 합계: 30대, 딜러 23대, 개인 7대.
- 딜러 담당자명: 23개 모두 고유하며 누락 없음.
- 목록형·피드형에서 담당자명만 노출되고 상사명이 표시되지 않는 것을 확인했다.
- 384px 화면에서 가로 넘침 없음.
- 브라우저 콘솔 경고·오류 없음.

## Comparison history

- 최초 비교에서 P0/P1/P2 차이 없음. 담당자명 추가 외의 시각 변경은 발생하지 않았다.

## Verification

- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.

final result: passed
