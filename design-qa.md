# Design QA — 매물 리스트 지역 아이콘 교체

## Comparison target

- Source visual truth: Notion `주소 위치 (1)` 첨부 원본 `svgexport-22.svg`.
- Source asset path: `C:/Users/bobae/AppData/Local/Temp/browser-use/assets/75d276fd-ca18-490c-b863-4529b84052ea/ab96640c9256baed.svg`.
- Implementation screenshot: 이 작업의 Codex `@Browser` 목록형·피드형 캡처.
- Browser-rendered implementation: 로컬 `?qf=guazi&scenario=luxury30&titlepos=after-model` 및 `&view=feed`.
- Viewport: 384 × 832 CSS px.
- State: 럭셔리 UI 테스트 가상 매물 30대, 목록형·피드형, 라이트 테마.
- Source asset: 24 × 24 vector. Implementation pixels: 384 × 832. CSS viewport: 384 × 832. Density normalization: SVG를 16 × 16 CSS px 슬롯에 렌더링.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- 노션 첨부 SVG와 구현 자산은 공백을 제외하고 완전히 동일하다.
- 새 아이콘은 24 × 24 `LocationFilled` 경로와 `#C0C0C0` 색상을 사용한다.
- 목록형·피드형 모두 동일한 공용 자산을 16 × 16px로 표시한다.
- 전체 화면 비교에서 지역 아이콘 외의 정보 밀도와 카드 높이는 기존 시안과 같다.
- 집중 비교에서 채워진 핀 모양, 원형 중심부, 색상과 시각적 중심이 원본과 일치한다.
- 타이포그래피, 간격, 차량 이미지, 지역 문구와 담당 딜러명은 변경하지 않았다.

## Interaction verification

- 목록형: SVG 로드 완료, 원본 24 × 24, 표시 16 × 16px.
- 피드형: SVG 로드 완료, 원본 24 × 24, 표시 16 × 16px.
- 384px 화면에서 가로 넘침 없음.
- 브라우저 콘솔 경고·오류 없음.

## Comparison history

- 최초 비교에서 P0/P1/P2 차이 없음. 원본 아이콘 교체 외의 시각 변경은 발생하지 않았다.

## Verification

- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.

final result: passed
