# Design QA — 노션 필터 아이콘 추가 시안

## Comparison target

- Source visual truth: supplied Notion page `3c0ee9c4b60680ca8d20efafda36a165`, attached `필터.svg`.
- Exact source asset: [`public/assets/bbm/chip-filter-notion.svg`](public/assets/bbm/chip-filter-notion.svg).
- Implementation: `http://127.0.0.1:5173/?qf=guazi&scenario=luxury30&titlepos=after-model&view=feed&filtericon=notion`.
- Viewport: 384 × 832 CSS px.
- Existing default: `chip-filter-funnel.svg`; unchanged when `filtericon=notion` is absent.

## Captured comparison

- [전체 모바일 화면](reports/filter-icon-20261002/implementation-mobile.jpg)
- [필터 칩 확대](reports/filter-icon-20261002/implementation-filter-chip.jpg)
- The implementation loads the exact supplied two-rail SVG rather than a redrawn approximation.

## Measured result

| Surface | Target | Implementation | Result |
|---|---:|---:|---|
| Icon source viewBox | 20×20 | 20×20 | match |
| Icon rendered slot | 20×20px | 20×20px | match |
| Filter chip | existing fixed geometry | 92×32px | unchanged |
| Chip padding | existing fixed geometry | 3px 12px | unchanged |
| Icon/text gap | existing fixed geometry | 2px | unchanged |
| Icon color | `#181C1F` | `#181C1F` | match |
| Rail form | 2 horizontal controls | 2 horizontal controls | match |

## Fidelity surfaces

- Shape: both round control handles, rail endpoints, and 20×20 viewBox coordinates are copied exactly from the Notion SVG.
- Layout: only the icon asset changes in the comparison mode. Chip width, height, padding, text, rail spacing, and surrounding controls remain unchanged.
- Scope: the new mockup is selected only with `filtericon=notion`; the approved three-control default remains the default.
- Accessibility: the icon remains decorative (`alt=""`, `aria-hidden="true"`) while the button keeps the existing `필터` accessible name.

## Verification

- 384×832 browser computed measurement: passed.
- Focused visual comparison of the filter chip: passed.
- Browser console errors and warnings: none observed.
- `npm run check:runtime`: passed (28 protected files unchanged).
- `npm run verify:qf`: passed.

final result: passed
