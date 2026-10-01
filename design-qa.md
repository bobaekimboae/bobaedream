# Design QA — Notion FilterHeader 테스트 모드

## Comparison target

- Source visual truth: Notion `0_0_필터 FilterHeader` 페이지의 첨부 `FilterHeader.svg` (`https://app.notion.com/p/0_0_-FilterHeader-3e8ee9c4b60680bfb099f7caa82d2f3c`).
- Source visual evidence: Codex `@Browser` 노션 원본 캡처(탭 53).
- Implementation screenshot path: Codex `@Browser` 로컬 테스트 렌더링 캡처(탭 54).
- Browser-rendered implementation: `http://127.0.0.1:5173/?qf=guazi&scenario=luxury30&titlepos=after-model&filtericon=filterheader`.
- Viewport: 384 × 832 CSS px.
- State: 럭셔리 UI 테스트 가상 매물, 목록형, 라이트 테마, 필터 미적용.
- Source asset: 24 × 24 SVG. Implementation: 20 × 20 CSS px 표시, device pixel ratio 1.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- 노션 원본의 세 줄 조절형 `FilterHeader.svg`를 수정 없이 테스트 모드에서만 사용한다.
- 기본 2줄 필터 아이콘은 유지하며 `filtericon=filterheader` 쿼리가 있을 때만 원본이 표시된다.
- 필터 칩의 폭 92px, 높이 32px, 주변 칩 간격과 수직 중심 정렬은 기존과 같다.
- 폰트·타이포그래피, 간격·레이아웃 리듬, 색상 토큰, 차량 이미지 품질, 문구는 변경하지 않았다.
- 아이콘은 원본 SVG 자산을 사용하며 래스터 확대, CSS 도형, 대체 아이콘을 사용하지 않았다.

## Interaction verification

- SVG 로드 완료: 자연 크기 24 × 24, 표시 크기 20 × 20px.
- 필터 버튼 실측: 92 × 32px.
- 필터 버튼 클릭 시 전체 필터 dialog가 열리고 닫기 버튼으로 정상 복귀한다.
- 384px 화면에서 가로 넘침 없음.
- 브라우저 콘솔 오류 없음.

## Comparison history

- 기본안과 테스트안이 혼용될 위험을 확인했다.
- 수정: 쿼리 기반 테스트 모드로 분리해 기본안에는 영향을 주지 않도록 했다.
- 수정 후 증거: 384 × 832 렌더링에서 `/assets/bbm/chip-filter-funnel.svg`, 20 × 20px 표시, dialog 동작, 콘솔 오류 0건을 확인했다.

## Verification

- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.

final result: passed
