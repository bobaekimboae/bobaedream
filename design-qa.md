# Design QA — 노션 필터 아이콘 시각 균형

## Comparison target

- Source visual truth: supplied Notion `필터.svg` from page `3c0ee9c4b60680ca8d20efafda36a165`.
- Source asset: original path uses a 20×20 viewBox and is authored for a 16×16px intrinsic display.
- Implementation: `http://127.0.0.1:5173/?qf=guazi&filtericon=notion&v=balance-2`.
- State: light theme, no applied filters, mobile top filter rail at its initial position.
- CSS viewport: 384×832px, device density normalized to 1× browser capture.
- Implementation capture: 384×832px.

## Evidence

- [Full-view revised implementation](reports/filter-icon-20261002/implementation-balanced-mobile.jpg)
- [Focused revised filter chip](reports/filter-icon-20261002/implementation-balanced-chip.jpg)
- [Focused before/after comparison — left before, right after](reports/filter-icon-20261002/before-after-balance.jpg)
- Focused comparison dimensions: before 112×56px + after 112×56px on one 230×56px canvas.

## Findings

- [P2 resolved] Icon was visually heavier than its label.
  - Location: mobile `.filter-fixed` notion icon.
  - Evidence: the source's 20×20 path was stretched to the full 20px slot, producing a 16px visible width and roughly 8px control circles beside a 14px label. In the before/after comparison the left icon dominates the word `필터`.
  - Impact: the icon pulled the chip's optical center left and looked heavier than adjacent chip typography.
  - Fix: preserve the supplied source path but center it on a 24×24 optical canvas. The 20px slot is unchanged; visible width becomes approximately 13.3px and the control circles approximately 6.7px.
  - Post-fix evidence: the right side of the focused comparison aligns the icon mass with the 14px label while keeping the chip's 92×32px geometry.

## Required fidelity surfaces

- Fonts and typography: unchanged; the `필터` label remains 14px and no wrapping or weight changed.
- Spacing and layout rhythm: chip 92×32px, icon slot 20×20px, padding 3px 12px, and layout gap 2px are unchanged. Optical whitespace inside the icon now supplies the needed visual separation.
- Colors and tokens: icon remains `#181C1F`; chip background and all state colors are unchanged.
- Image quality and asset fidelity: the original vector path is retained. Only its SVG canvas gains symmetric optical padding, so no raster scaling or redraw was introduced.
- Copy and content: no copy changed.

## Comparison history

1. Initial capture: 20px slot rendered the supplied 20×20 path at a 16px visible width; P2 visual-weight mismatch recorded.
2. Fix: changed the asset canvas to 24×24 and translated the unchanged source path by 2px on both axes.
3. Revised capture: icon and 14px label have matching visible height and the chip remains centered; no P0/P1/P2 findings remain.

## Verification

- Mobile computed geometry: passed.
- Full-view and focused before/after comparison: passed.
- Browser console errors and warnings: none observed.
- `npm run check:runtime`: passed (28 protected files unchanged).
- `npm run verify:qf`: passed.

**Open Questions**

- None.

**Implementation Checklist**

- [x] Match icon optical weight to the 14px label.
- [x] Preserve the 20px icon slot and 92×32px chip.
- [x] Preserve the original vector path and color.
- [x] Confirm surrounding chips do not shift.

**Follow-up Polish**

- None required for this scope.

final result: passed
