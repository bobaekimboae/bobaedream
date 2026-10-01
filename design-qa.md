# Design QA — 얇은 필터 아이콘 교체

## Comparison target

- Source visual truth path: Notion `필터` 페이지의 첨부 `필터.svg` (`https://app.notion.com/p/3a3ee9c4b60680719310dca88b696694`).
- Source capture: Codex in-app Browser SVG 원본 탭 63. 원본은 24 × 24 SVG, Seed icon v0.0.23, `#1A1C20`이다.
- Implementation screenshot path: Codex in-app Browser 로컬 렌더링 캡처(384 × 832 탭, `http://127.0.0.1:5173/?qf=guazi&scenario=luxury30&titlepos=after-model&filtericon=airbnb2&v=thin-seed-2`).
- Source pixels: 24 × 24 vector viewBox. Implementation pixels: 20 × 20 CSS px, device pixel ratio 1.
- State: 럭셔리 UI 테스트 가상 매물, 목록형, 라이트 테마, 필터 미적용.
- Density normalization: 원본 SVG와 구현 모두 벡터이며 구현 슬롯만 20 × 20 CSS px로 축소했다.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- 기존 16 × 16 Airbnb path는 20px 슬롯에서 상대적으로 두껍게 보였다. 새 원본은 24 × 24 viewBox를 같은 20px 슬롯에 축소해 요청대로 더 가볍게 보인다.
- 원본의 두 조절선, 원형 핸들 위치, 색상, fill rule을 그대로 보존했다.
- 필터 칩 92 × 32px, 텍스트, 간격, 다른 아이콘과 목록 UI는 변경하지 않았다.
- 폰트·타이포그래피, 레이아웃 리듬, 색상 토큰, 차량 이미지 품질, 문구에 회귀가 없다.

## Interaction verification

- SVG 로드: 자연 크기 24 × 24, 표시 크기 20 × 20px.
- 필터 버튼: 92 × 32px.
- 필터 버튼 클릭 시 dialog 1개가 열리고 닫기 버튼으로 0개로 복귀한다.
- 384px 화면에서 가로 넘침 없음.
- 브라우저 콘솔 오류 없음.

## Comparison history

- 이전 구현: 16 × 16 SVG를 20px로 확대해 선이 두꺼워 보인다는 사용자 지적.
- 수정: 노션 `필터.svg`의 24 × 24 원본 path로 자산을 교체.
- 수정 후 집중 비교: 원본과 구현의 viewBox/path/fill이 일치하고, 20px 슬롯에서 시각 무게가 낮아진 것을 브라우저 캡처로 확인.
- 전체 화면 비교: 필터 칩 이외의 배치·타이포·목록 카드 변화 없음.

## Verification

- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.

final result: passed
