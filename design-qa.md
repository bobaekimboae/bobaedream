# Design QA — 2줄 필터 아이콘 교정

## Comparison target

- Source visual truth: 직전 승인본 `svgexport-20_24_chotot.svg`와 Git 커밋 `d34e051`의 2줄 필터 아이콘.
- Source asset path: `git show d34e051:public/assets/bbm/chip-filter-funnel.svg`.
- Implementation screenshot path: 이 작업의 Codex `@Browser` 로컬 렌더링 검수(탭 50).
- Browser-rendered implementation: `http://127.0.0.1:5173/?qf=guazi&scenario=luxury30&titlepos=after-model&v=2stage`.
- Viewport: 384 × 832 CSS px.
- State: 럭셔리 UI 테스트 가상 매물, 목록형, 라이트 테마, 필터 미적용.
- Source asset: 24 × 24 vector, `viewBox="0 0 16 16"`. 표시 크기: 20 × 20 CSS px. Device pixel ratio: 1.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- 사용자가 제외 요청한 3줄 조절형을 제거하고, 직전 승인된 2줄 조절형을 새 자산명 `chip-filter-controls.svg`로 적용했다.
- 캐시된 3줄 아이콘이 다시 보이지 않도록 기존 파일명을 재사용하지 않았다.
- 전체 화면 비교에서 필터 칩의 폭 92px, 높이 32px, 라벨과 주변 칩 간격은 기존과 같다.
- 폰트·타이포그래피, 간격·레이아웃 리듬, 색상 토큰, 차량 이미지 품질, 문구는 변경하지 않았다.

## Interaction verification

- SVG 로드 완료: 원본 24 × 24, 표시 20 × 20px.
- 필터 버튼 실측: 92 × 32px.
- 필터 버튼 클릭 시 전체 필터 dialog가 열리고 닫기 버튼으로 정상 복귀한다.
- 384px 화면에서 가로 넘침 없음.
- 브라우저 콘솔 오류 없음.

## Comparison history

- 이전 배포본 P1: 사용 의도와 다른 3줄 조절 아이콘.
- 수정: 직전 승인된 2줄 필터 아이콘으로 교체하고 새 파일명으로 캐시를 분리했다.
- 수정 후 증거: 384 × 832 브라우저 렌더링에서 `/assets/bbm/chip-filter-controls.svg`, 20 × 20px 표시, dialog 동작, 콘솔 오류 0건을 확인했다.

## Verification

- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.

final result: passed
