# Design QA — 3단 조절 필터 아이콘 최종안

## Comparison target

- Source visual truth path: `public/assets/bbm/chip-filter-funnel.svg`의 FilterHeader 3단 조절 원본.
- Implementation screenshot path: Codex in-app Browser 로컬 렌더링 캡처(`http://127.0.0.1:5173/?qf=guazi&scenario=luxury30&titlepos=after-model&v=three-final`).
- Viewport: 384 × 832 CSS px, device pixel ratio 1.
- Source pixels: 24 × 24 SVG viewBox. Implementation: 20 × 20 CSS px 표시.
- State: 럭셔리 UI 테스트 가상 매물, 목록형, 라이트 테마, 필터 미적용.
- Density normalization: 벡터 원본을 20 × 20 CSS px 슬롯에 비율 유지해 축소했다.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- 세 개의 조절선과 원형 핸들이 모두 20px 슬롯 안에서 선명하게 보인다.
- 필터 칩은 기존 92 × 32px이며 텍스트와 아이콘 중심선이 유지된다.
- URL 테스트 파라미터와 관계없이 Guazi 필터 버튼은 3단 아이콘을 사용한다.
- 폰트·타이포그래피, 간격·레이아웃 리듬, 색상 토큰, 차량 이미지, 문구는 변경하지 않았다.

## Interaction verification

- SVG 로드: 자연 크기 24 × 24, 표시 크기 20 × 20px.
- 필터 버튼: 92 × 32px.
- 필터 dialog 열기 1개, 닫기 후 0개로 정상 복귀.
- 384px 화면에서 가로 넘침 없음.
- 브라우저 콘솔 오류 없음.

## Comparison history

- 이전 선택: 2단 조절 아이콘.
- 사용자 최종 결정에 따라 3단 FilterHeader 원본을 기본값으로 전환했다.
- 수정 후 전체 화면과 아이콘 집중 캡처에서 크기·정렬·주변 UI 회귀가 없음을 확인했다.

## Verification

- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.

final result: passed
