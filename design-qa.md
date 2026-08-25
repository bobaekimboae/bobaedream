# Design QA — 전체차량 카테고리 바텀시트

## Comparison target

- Source visual truth: `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\figma-category-bottom-sheet.png` — Figma node `1841:16124`, 412 × 917 px.
- Implementation screenshot: `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\implementation-category-bottom-sheet.png`, 412 × 915 px.
- Combined comparison: `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\category-bottom-sheet-comparison.png`, 848 × 961 px.
- Viewport: 412 × 915 CSS px.
- State: default listing with the `전체차량` filter opened.

## Findings

- No actionable P0, P1, or P2 mismatch remains in the requested bottom-sheet region.
- Geometry: the sheet is 526 px high, begins at y=389 in the 412 × 915 viewport, and uses the Figma 14 px top radius.
- Header: the 56 px header has a centered 18 px/600 title, a transparent 26 px close target, and the exact Figma 12 px close glyph.
- Overlay: the background uses the source 20% black scrim with no extra sheet shadow.
- Content: the order and copy match the source: `중고차`, `트럭 · 특장`, `바이크`, `캠핑카`, `올드카`, `건설기계`, `부품 · 용품`.
- Assets: the close, down-chevron, and right-chevron SVGs are exact exports from node `1841:16124`; category icons reuse the matching exported project assets. `올드카` correctly reuses the used-car icon.
- Chips: `전체 중고차`, `국산차`, `수입차`, and `전기차` use the source gray treatment in the default sheet state.
- Responsiveness: the fixed visual height is capped by `calc(100vh - 28px)` so the content remains usable on shorter mobile screens.

## Interaction verification

- `전체차량` opens the category bottom sheet.
- The close control dismisses the sheet after the existing exit animation.
- The sheet can be reopened after closing.
- Selecting `국산차` applies the category, updates the filter chip, and closes the sheet.
- Browser console errors: none.

## Comparison history

1. Baseline implementation was 550 px tall, started 24 px too high, left-aligned the title, used a gray circular close control, showed a full arrow instead of a chevron, omitted the `올드카` icon, and used `트럭 · 특장 · 버스` copy.
2. The first correction aligned the sheet geometry, overlay, centered header, row copy, old-car icon, and neutral chip styling.
3. The final correction replaced the close and navigation glyphs with the exact Figma-exported SVGs. The combined comparison shows no remaining actionable mismatch.

## Verification

- `npm run check:runtime`: passed (28 protected files unchanged).
- `npm run build`: passed.
- `npm run test:sites`: passed (4/4 tests).
- `git diff --check`: passed.

## Filter rail and applied-count follow-up

- Browser evidence: `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\filter-count-and-rail-412x915.png`, 412 × 915 px.
- Only the left filter control remains fixed. `중고차`, `벤츠`, `연식`, `가격`, and all later conditions are children of the same horizontal `Carousel`.
- A measured horizontal drag changed the condition rail from `scrollLeft: 0` to its `scrollLeft: 1200` maximum while the filter control stayed fixed.
- Category alone keeps the default `필터` label because category is excluded from the applied count.
- Selecting `벤츠` changes the fixed control to the black filter icon plus `1` with accessible label `필터 1개 적용됨`.
- Applying `2021~2023` increases the control to `2` with accessible label `필터 2개 적용됨`.
- Browser console errors: none.

final result: passed
