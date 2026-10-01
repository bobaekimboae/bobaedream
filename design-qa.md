# Design QA — 매물 설명 제목 7개 위치 비교

## Comparison target

- Source state: `reports/luxury-ui-test-20261002/mobile-list-title-above-384.jpg` — 제조사·모델까지 썸네일 위로 이동한 잘못된 중간안.
- Implemented comparison: `reports/luxury-ui-test-20261002/title-position-7-variants-contact-sheet.png`.
- Individual captures: `title-position-1-top.png` through `title-position-7-overlay.png` in the same directory.
- Browser geometry audit: `reports/luxury-ui-test-20261002/title-position-7-variants-metrics.json`.
- Mobile viewport: 384 × 832 CSS px.
- Density normalization: source and implementation are both 1× CSS-pixel captures; no resampling was needed.
- State: luxury30, update sort, list page 1; feed page 1; PC list page 1.

## Dataset verification

- Scenario rows: 30; image files: 30; unique filenames: 30; unique image hashes: 30.
- Scenario sequence and filename prefix both match 001–030 exactly.
- Rendered pagination: page 1 = 20 cards, page 2 = 10 cards.
- Browser mapping spot-check: 001 → first card, 020 → page-1 last card, 021 → page-2 first card, 030 → final card.
- All rendered images loaded; no image 404, warning, or console error.

## Seven positions

- `top`: full-width above the image/content row. Highest headline visibility, but adds the most vertical emphasis.
- `before-model`: first item in the information column. Fast visibility, but competes with the primary car name and wish action.
- `after-model`: below manufacturer/model and detail model. Best balance; preserves car-name priority and keeps the headline close to the identity block.
- `after-spec`: below year/mileage/fuel. Understandable sequence, but description and price become visually crowded.
- `after-price`: below price/badges. Preserves purchase information priority, but headline reads late and weakens location spacing.
- `bottom`: full-width below the image/content row. Clean main block, but the headline is detached from the car identity.
- `overlay`: top of the thumbnail. Most compact card, but obscures vehicle imagery and truncates long headlines.

## Recommendation

- Primary recommendation: `after-model`.
- Secondary choice when promotional copy must be dominant: `top`.
- Avoid as a default: `before-model` and `overlay`, because they compete with the wish action or the vehicle image.

## Findings

- No actionable P0, P1, or P2 implementation issue remains across the seven query-controlled variants.
- The existing information structure remains `제조사·모델` on the first line and `세부모델` on the second line in every variant.
- Existing thumbnail, spec, price, badge, location, seller, wish action, and bottom navigation styles were not changed.
- First-card geometry at 384px: card height ranges from 183px (`overlay`) to 211px (`top`/`bottom`); thumbnail remains exactly 136×136px in all variants.
- The full headline fits without text overflow in six positions. `overlay` intentionally truncates to preserve the thumbnail and demonstrates its limitation as a default.

## Verification

- `npm run check:runtime`: passed (28 protected files unchanged).
- `npm run build`: passed.
- `npm run test:sites`: passed (4/4).
- 30-row heading map: passed.
- Seven 384px list variants rendered and captured: passed.
- First-card geometry and overflow audit: passed, with the documented overlay truncation.
- Browser console errors: none.

final result: passed
