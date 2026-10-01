# Design QA — 럭셔리 중고차 30대 UI 테스트

## Comparison target

- Source layout: existing deployed BBM mobile list at `reports/thumbnail-audit-20261002/bbm-public-384.jpg`.
- Implemented list: `reports/luxury-ui-test-20261002/mobile-list-384.jpg`.
- Implemented feed: `reports/luxury-ui-test-20261002/mobile-feed-384.jpg`.
- Implemented PC: `reports/luxury-ui-test-20261002/pc-list-1280.jpg`.
- Crop contact sheets: `reports/luxury-ui-test-20261002/crop-contact-list.jpg`, `crop-contact-feed.jpg`.
- Mobile viewport: 384 × 832 CSS px. PC viewport: 1280 × 720 CSS px.

## Dataset verification

- Scenario rows: 30; image files: 30; unique filenames: 30; unique image hashes: 30.
- Scenario sequence and filename prefix both match 001–030 exactly.
- Rendered pagination: page 1 = 20 cards, page 2 = 10 cards.
- Browser mapping spot-check: 001 → first card, 020 → page-1 last card, 021 → page-2 first card, 030 → final card.
- All rendered images loaded; no image 404, warning, or console error.

## Visual findings

- List thumbnail remains 136 × 136 px, 1:1, radius 8 px, `object-fit: cover`, centered.
- Feed thumbnail remains 352 × 234.66 px at the 384 px viewport, 1.5:1, radius 12 px, `object-fit: cover`.
- Contact-sheet review of all 30 center crops found every vehicle identifiable with no stretched image or blank band. No per-car object-position override was needed.
- Long titles use two fixed lines with ellipsis in list view; feed view has more horizontal room and preserves the two-line hierarchy.
- The list uses 15/19 px title, 13 px spec, and 16 px price. Feed uses 16/24 px title, 14 px spec, and 17 px price.
- Two badges fit on one row in both list and feed examples. Hundred-million-won prices stay on one line.
- Exact scenario region and fake seller name are shown. Dealer-complex rewriting is bypassed only for this test dataset.
- The long hybrid fuel string truncates the last part of the one-line spec in compact list view; full year/mileage/fuel/transmission remain visible in feed view and in the underlying accessible text. This is accepted to preserve the existing list density.
- PC title segments initially joined without a space. The joining whitespace was corrected and rechecked.
- A persistent test notice states that the content is virtual UI-test data and not actual sale pricing or conditions.

## Verification

- `npm run check:runtime`: passed (28 protected files unchanged).
- `npm run build`: passed.
- `npm run test:sites`: passed (4/4).
- Image number/file/hash audit: passed.
- 384 px list/feed visual inspection: passed.
- 1280 px PC visual inspection: passed.
- Browser console errors: none.

final result: passed
