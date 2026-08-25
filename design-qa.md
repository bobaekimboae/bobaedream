# Design QA — Quick filter replacement

## Comparison target

- Source visual truth:
  - `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\figma-filter-row.png` — Figma node `1841:16243`, 399 × 54 px.
  - `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\figma-quick-filter.png` — Figma node `1841:16429`, 552 × 84 px.
- Implementation screenshot: `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\bobaedream\implementation-final-412x915.png`, 412 × 915 px.
- Viewport: 412 × 915 CSS px, `deviceScaleFactor: 1`.
- State: default listing state, no applied filters, category landing rail visible.
- Density normalization: all captures are 1×. The affected-area comparison uses the first 399 px of the implementation and quick-filter source so both sides are 399 × 138 px.

## Evidence

- Full affected-area comparison: `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\bobaedream\design-qa-affected-area-comparison.png`.
- Normalized source region: `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\bobaedream\design-qa-source-affected-area.png`, 399 × 138 px.
- Normalized implementation region: `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\bobaedream\design-qa-implementation-affected-area.png`, 399 × 138 px.
- Focused filter-row comparison: `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\bobaedream\design-qa-filter-comparison.png`.
- Focused category-row comparison: `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\bobaedream\design-qa-category-comparison.png`.

## Findings

- No actionable P0, P1, or P2 mismatch remains in the requested filter and quick-category regions.
- Fonts and typography: Pretendard 500, 15 px quick-filter labels and 14 px category labels match the Figma hierarchy, weight, line height, wrapping, and truncation. Minor raster antialiasing variation is acceptable.
- Spacing and layout rhythm: filter chips use 6 px gaps, 10 px vertical rail padding, 34 px chip height, and the category rail is 84 px tall. The category content width is exactly 552 px with 24 px leading padding and 18 px gaps.
- Colors and visual tokens: gray chips use `#f0f0f0`, active `전체차량` uses `#1a1a1a` with white copy, labels use the matching gray values, and the background remains white.
- Image quality and asset fidelity: all six unique category icons are the exact exported Figma assets already committed in the project. `올드카` intentionally reuses the exact used-car icon from the source. The filter, close, and chevron glyphs use the existing exact exported SVG assets; no icons are approximated in CSS or inline markup.
- Copy and content: the default chip reads `전체차량`; the condition order begins `제조사`, `연식`, `가격`; the category order is `중고차`, `트럭 · 특장`, `바이크`, `캠핑카`, `올드카`, `건설기계`, `부품 · 용품`.
- Responsiveness: at 412 px, the first five category items are visible as in the screen reference; the 552 px rail drags horizontally to a measured maximum `scrollLeft` of 140 px, exposing the remaining items.
- Accessibility and interactions: `전체차량` opens the category sheet, its clear control resets category state, `중고차` transitions to the manufacturer rail, and the category rail remains keyboard/drag accessible through the existing carousel runtime.

## Comparison history

1. Baseline capture (`work\original-live.png`) showed P1/P2 mismatches: gray `카테고리` instead of black `전체차량`, the wrong condition order, a 108 px category row, no `올드카`, and `트럭 · 특장 · 버스` wrapping to two lines. These were corrected in `src/Prototype.tsx` and `src/prototype.css`.
2. First implementation pass showed a P2 icon mismatch because the filter chip still used the three-line list glyph, plus a P2 16 px trailing category-rail padding that produced a 568 px content width. The filter now uses the exact slider asset and the category rail measures the Figma 552 px.
3. Post-fix comparison (`design-qa-affected-area-comparison.png`) shows no remaining actionable P0/P1/P2 mismatch.

## Verification

- `npm run check:runtime`: passed.
- `npm run build`: passed.
- Primary interactions tested: category sheet open/close, `중고차` category transition, and horizontal quick-category drag.
- Browser console errors/warnings: none.
- Focused region comparisons were required because icon, chip, and text fidelity is too small to judge reliably from the full screen alone.

## Follow-up polish

- P3: text antialiasing varies slightly between Figma export rasterization and the browser renderer; no code change is warranted.

final result: passed
