# Design QA — 매물 리스트 지역 아이콘

## Comparison target

- Source visual truth: Notion `12_지역 Location` 첨부 SVG `12_지역_Location_8C8C8C.svg`.
- Browser-rendered implementation: 로컬 `?qf=guazi&scenario=luxury30&titlepos=after-model` 및 `&view=feed`.
- Viewport: 384 × 832 CSS px.
- State: 럭셔리 UI 테스트 가상 매물 30대, 목록형·피드형, 라이트 테마.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- 노션 첨부 원본의 `viewBox="0 0 25 24"`, 핀 경로, 색상 `#8C8C8C`를 그대로 적용했다.
- 목록형과 피드형 모두 동일한 `/assets/bbm/card-location.svg`를 사용한다.
- 화면 표시 크기는 기존 규격인 16 × 16px, 텍스트 간격은 4px로 유지된다.
- 지역 텍스트, 카드 높이, 제목·가격·판매자 배치는 변경되지 않았다.

## Interaction verification

- 목록형: 아이콘 로드 완료, 16 × 16px, 행 높이 18px, 수직 중앙 정렬.
- 피드형: 아이콘 로드 완료, 16 × 16px, 행 높이 19px, 수직 중앙 정렬.
- 384px 화면에서 가로 넘침 없음.
- 브라우저 콘솔 경고·오류 없음.

## Verification

- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.

final result: passed
