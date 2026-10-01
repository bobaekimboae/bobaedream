# Design QA — 매물 리스트 위치 아이콘 교체

## Comparison target

- Source visual truth: Notion `12_지역 Location` attachment and `reports/location-icon-20261002/notion-source-svg.png`.
- Rendered comparison: `reports/location-icon-20261002/comparison-source-vs-list.png`.
- List capture: `reports/location-icon-20261002/mobile-list-after.png`.
- Feed capture: `reports/location-icon-20261002/mobile-feed-after.png`.
- Viewport: 384 × 832 CSS px; screenshots are 384 × 832 px at 1× density.
- State: luxury30, after-model title position, list/feed views, light theme.

## Source fidelity

- The Notion SVG path data was copied without redrawing or simplifying it.
- Source `viewBox` is 25 × 24 and the fill color is `#C0C0C0`.
- The listing keeps its existing 16 × 16px icon slot, so the new asset preserves text alignment and row height.

## Findings

- No P0/P1/P2 defect remains.
- The circular target and pin outline match the Notion source in both list and feed views.
- Location copy, text size, color, gap, seller row, thumbnail, badges, and card structure are unchanged.
- The source asset reports a natural size of 25 × 24px and renders at 16 × 16px in both views.
- No image 404, console error, or warning was observed in the checked routes.

## Verification

- `npm run build`: passed; runtime integrity reports 28 protected files unchanged.
- `npm run test:sites`: passed (4/4).
- List view at 384px: passed.
- Feed view at 384px: passed.
- Browser console errors and warnings: none.

final result: passed
