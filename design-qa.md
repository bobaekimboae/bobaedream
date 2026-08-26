# Design QA — 상세 사진 썸네일 레일

## Comparison target

- Source visual truth: `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\figma-detail-thumbnail-strip.png` — Figma node `1956:17967`, 412 × 391 px.
- Implementation screenshot: `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\implementation-detail-thumbnail-strip.png`, 412 × 391 px.
- Combined comparison: `C:\Users\sungn\Documents\Codex\2026-08-25\https-bobaekimboae-github-io-bobaedream-https\work\detail-thumbnail-comparison.png`, 824 × 391 px.
- Viewport: 412 × 915 CSS px.
- State: Bentley detail, first photo selected.

## Findings

- No actionable P0, P1, or P2 mismatch remains in the requested thumbnail region.
- Geometry matches the source: 305 px hero photo, 8 px separation, and a 78 px thumbnail rail.
- The rail uses 12 px side padding and shows five equal thumbnail slots across the 412 px viewport.
- Thumbnails use 6 px inner padding, 8 px image radii, and a 2 px dark inset outline on the active 12 px-radius item.
- The first thumbnail uses the exact 32 px Figma play asset.
- The rail uses the exact exported right-arrow asset in a 32 px white circular control with the source shadow and right inset.
- The `영상` / `사진 24` media tabs have been removed from inside the hero photo; the synchronized lower-right photo counter remains.

## Interaction verification

- Tapping photo 2 changes the main carousel to photo 2, the counter to `2/24`, and the active thumbnail to item 2.
- Returning to photo 1 changes the main carousel to scroll position 0, the counter to `1/24`, and the active thumbnail to item 1.
- Swiping the main photo changed the counter and active thumbnail together.
- The next-arrow control advances the selected main photo and thumbnail.
- Dragging the thumbnail rail changed its horizontal scroll position while keeping the main-photo selection unchanged.
- No media tab container or `영상` / `사진 24` button remains in the rendered detail hero.
- Browser console errors: none.

## Verification

- `npm run check:runtime`: passed (28 protected files unchanged).
- `npm run build`: passed.
- `npm run test:sites`: passed (4/4 tests).
- `git diff --check`: passed.

final result: passed
