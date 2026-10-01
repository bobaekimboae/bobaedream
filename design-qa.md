# Design QA — 매물 리스트 필터 아이콘 교체

## Comparison target

- Source visual truth: Notion `필터 (24px)` 페이지의 첨부 원본 `svgexport-20_24_chotot.svg` (`https://app.notion.com/p/24px-3ecee9c4b60681eaaf1bcd097e4a677d`).
- Source asset path: Chrome에서 연 원본 Notion SVG URL과 `pageAssets`가 확인한 인라인 SVG 원본.
- Implementation screenshot path: 이 작업의 Codex `@Browser` 캡처(로컬 탭 39, 384 × 832)와 결합 비교 캡처(로컬 탭 40, 760 × 420).
- Browser-rendered implementation: `http://127.0.0.1:5173/?qf=guazi&scenario=luxury30&titlepos=after-model`.
- Viewport: 384 × 832 CSS px.
- State: 럭셔리 UI 테스트 가상 매물 30대, 목록형, 라이트 테마, 필터 미적용.
- Source asset: 24 × 24 vector (`viewBox="0 0 16 16"`). Implementation pixels: 384 × 832. CSS viewport: 384 × 832. Device pixel ratio: 1. Density normalization: SVG를 기존 필터 칩의 20 × 20 CSS px 슬롯에 렌더링.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- 노션 첨부 SVG의 경로·색상·뷰박스를 공용 필터 자산에 그대로 적용했다.
- 새 아이콘은 두 개의 조절 손잡이가 있는 슬라이더 형태와 `#222222` 색상을 사용한다.
- 전체 화면 비교에서 필터 칩의 폭 92px, 높이 32px, 라벨과 주변 칩 간격은 기존과 같다.
- 집중 비교에서 원본의 손잡이 위치, 획의 시각적 무게, 중심 정렬이 구현 화면과 일치한다.
- 폰트·타이포그래피, 간격·레이아웃 리듬, 색상 토큰, 차량 이미지 품질, 문구는 변경하지 않았다.

## Interaction verification

- SVG 로드 완료: 원본 24 × 24, 표시 20 × 20px.
- 필터 버튼 실측: 92 × 32px, 아이콘 세로 중앙 정렬.
- 필터 버튼 클릭 시 전체 필터 dialog가 열리고 닫기 버튼으로 정상 복귀한다.
- 384px 화면에서 가로 넘침 없음.
- 브라우저 콘솔 오류 없음.

## Comparison history

- 최초 비교에서 P0/P1/P2 차이 없음. 원본 아이콘 교체 외의 시각 변경은 발생하지 않았다.

## Verification

- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.

final result: passed
