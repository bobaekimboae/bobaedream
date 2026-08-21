# Region bottom-sheet design QA

## Evidence

- Source visual truth: Figma node `1674:17620` from file `bXm6a9oU2IlKcjv9xEum3l`, saved locally as `reference-region.png`.
- Browser-rendered implementation: `http://localhost:4173/`, saved locally as `implementation-region.png`.
- Full-view comparison: `comparison-region.png`.
- Focused sheet comparison: `comparison-region-sheet.png`.
- Source pixels: `412 x 917` at the node's natural export size.
- Implementation pixels: `412 x 917`, CSS viewport `412 x 917`, device scale factor `1`; no density normalization was required.
- Responsive check: CSS viewport `393 x 852`, device scale factor `1`.
- State: market list with the region sheet open, no draft region selected.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the sheet now uses Pretendard throughout; title is 18px/600, selectors and actions are 16px, and quick chips are 14px/500 as specified by the Figma styles.
- Spacing and layout rhythm: the browser-rendered sheet is `412 x 449` at `y=468`, with a 60px title row, 20px horizontal insets, 54px selectors, 32px chips, 14px top radii, and 52px bottom actions. The 118px reset and 246px confirm actions match the source proportions.
- Colors and visual tokens: the overlay is 20% black, sheet surface is white, borders use `#ebebeb`, copy uses the gray/900 and gray/600 tokens, and the confirm action uses primary/500 `#1b4c8c`.
- Image quality and asset fidelity: the existing Figma-exported close and chevron assets are reused at their exact 12px and 11px-by-6px glyph sizes inside the specified 18px containers. No placeholder or hand-drawn asset was introduced.
- Copy and content: `지역`, all three placeholders, the six quick regions, `내 주변 검색`, `초기화`, and `798대 보기` match the Figma source.

## Full-view comparison evidence

- The source and implementation were combined at equal `412 x 917` dimensions in `comparison-region.png` before judgment.
- The app content remains visible behind the 20% dimmed overlay; this is the intended production context replacing the source node's neutral placeholder background.
- Sheet top, bottom, width, major vertical regions, and CTA baseline align with the source.

## Focused region comparison evidence

- The sheet-only crops were combined at `824 x 449` in `comparison-region-sheet.png`.
- Header title/close alignment, selector padding, chevron alignment, quick-chip spacing, divider position, nearby-search hierarchy, and bottom-action proportions match at readable scale.

## Primary interactions tested

- Tapping `지역: 전국` opens the region sheet.
- Close dismisses the sheet after its exit animation.
- Selecting `서울` and `강남구`, then tapping `798대 보기`, updates the header to `서울 강남구` and filters the list.
- Selecting a different draft region and closing the sheet preserves the previously applied region.
- `초기화` followed by confirm restores the header to `전국`.
- At `393 x 852`, the 449px sheet fits the viewport, the last quick chip remains within its 20px inset, and both actions remain fully visible.
- Browser console check returned no warnings or errors.
- Runtime integrity and TypeScript/Vite production compilation pass.

## Comparison history

1. Initial implementation had P2 differences: 34% overlay opacity instead of 20%, an unstable snap-height cap, the close glyph nine pixels too high, Inter fallback on the title, and a generic `확인` action instead of `798대 보기`.
2. The region-specific sheet was fixed to 449px, overlay opacity changed to 20%, the close control aligned to the Figma 18px container, the title inherited Pretendard, chevrons received their 18px containers, and the source CTA copy was restored.
3. The first post-fix capture exposed a P2 automatic-focus ring around the close action. A region-specific focus override removed that visual drift without changing its button semantics.
4. The final full-view and focused combined comparisons show no actionable P0/P1/P2 differences.

## Implementation checklist

- [x] Open from `지역: 전국`
- [x] Figma-matched 449px bottom-sheet anatomy
- [x] Exact overlay, radius, spacing, typography, and asset sizing
- [x] Province, district, quick-region, and nearby-radius controls
- [x] Draft selection with close-without-apply behavior
- [x] Reset and `798대 보기` actions
- [x] 412px source viewport and 393px responsive verification
- [x] Browser interaction and console verification
- [x] Runtime integrity and production compilation

final result: passed

