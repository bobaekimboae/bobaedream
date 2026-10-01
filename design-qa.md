# Design QA — Airbnb 필터_2 테스트 모드

## Comparison target

- Source visual truth: Notion `필터_2 (1)` 페이지의 `svgexport-10.svg` (`https://app.notion.com/p/_2-1-3ecee9c4b606806aa872ed3f52e361d2`).
- Source asset path: 노션 첨부 원본의 16 × 16 SVG와 path 데이터를 직접 확인했다.
- Implementation screenshot path: Codex `@Browser` 로컬 테스트 렌더링 캡처(탭 58).
- Browser-rendered implementation: `http://127.0.0.1:5173/?qf=guazi&scenario=luxury30&titlepos=after-model&filtericon=airbnb2`.
- Viewport: 384 × 832 CSS px.
- State: 럭셔리 UI 테스트 가상 매물, 목록형, 라이트 테마, 필터 미적용.
- Source asset: 16 × 16 SVG. Implementation: 20 × 20 CSS px 표시, device pixel ratio 1.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- 에어비앤비 원본 `svgexport-10.svg`의 path, viewBox, 색상과 접근성 속성을 별도 자산으로 보존했다.
- `filtericon=airbnb2` 쿼리가 있을 때만 새 아이콘이 표시되어 기본안과 기존 FilterHeader 테스트에 영향을 주지 않는다.
- 필터 칩은 기존 92 × 32px이고, 원본 16px SVG는 공통 20px 아이콘 슬롯에서 선명하게 렌더링된다.
- 폰트·타이포그래피, 간격·레이아웃 리듬, 색상 토큰, 차량 이미지 품질, 문구는 변경하지 않았다.

## Interaction verification

- SVG 로드 완료: 자연 크기 16 × 16, 표시 크기 20 × 20px.
- 필터 버튼 실측: 92 × 32px.
- 필터 버튼 클릭 시 전체 필터 dialog가 열리고 닫기 버튼으로 정상 복귀한다.
- 384px 화면에서 가로 넘침 없음.
- 브라우저 콘솔 오류 없음.

## Comparison history

- 최초 비교에서 P0/P1/P2 차이 없음. 원본 자산 추가 외의 시각 변경은 발생하지 않았다.
- 집중 비교는 아이콘 path와 16 × 16 viewBox를 원본과 직접 대조했으며 구현 자산이 일치한다.

## Verification

- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.

final result: passed
