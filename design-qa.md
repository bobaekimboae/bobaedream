# Design QA — 럭셔리 매물 제목 상단 임시 배치

## Comparison target

- Source state: `reports/luxury-ui-test-20261002/mobile-list-384.jpg` — 기존 제목이 썸네일 오른쪽에 있던 384px 리스트.
- Implemented list: `reports/luxury-ui-test-20261002/mobile-list-title-above-384.jpg`.
- Implemented feed: `reports/luxury-ui-test-20261002/mobile-feed-title-above-384.jpg`.
- Implemented PC: `reports/luxury-ui-test-20261002/pc-list-title-above-1280.jpg`.
- Full-view comparison: `reports/luxury-ui-test-20261002/comparison-title-before-after.jpg`, 768 × 832 px.
- Focused card comparison: `reports/luxury-ui-test-20261002/comparison-title-cards.jpg`, 768 × 450 px.
- Mobile viewport: 384 × 832 CSS px. PC viewport: 1280 × 720 CSS px.
- Density normalization: source and implementation are both 1× CSS-pixel captures; no resampling was needed.
- State: luxury30, update sort, list page 1; feed page 1; PC list page 1.

## Dataset verification

- Scenario rows: 30; image files: 30; unique filenames: 30; unique image hashes: 30.
- Scenario sequence and filename prefix both match 001–030 exactly.
- Rendered pagination: page 1 = 20 cards, page 2 = 10 cards.
- Browser mapping spot-check: 001 → first card, 020 → page-1 last card, 021 → page-2 first card, 030 → final card.
- All rendered images loaded; no image 404, warning, or console error.

## Findings

- No actionable P0, P1, or P2 issue remains.
- Typography: every UI-test title is now two semantic lines: `제조사 모델` then `세부모델`. Advertising copy remains only in the accessible full title, not the visible heading.
- Layout rhythm: the two-line heading is a full-width block above the thumbnail. Existing thumbnail dimensions, spec, price, badge, seller, and action geometry remain unchanged below it.
- Colors/tokens: no color, border, badge, or icon token changed.
- Image quality: existing `object-fit: cover`, crop, dimensions, and radii are unchanged in list and feed.
- Copy/content: non-personal listings show a specific complex after the region; personal listings show only their region. All 30 location strings fit without overflow at 384px.
- The first four rendered examples verified the intended alternation: 판교단지, 강남단지, no complex for personal, and 도이치오토월드.

## Comparison history

- First pass: the second line still included sales description text, making the heading unnecessarily long.
- Fix: replaced automatic five-word splitting with an explicit 30-row `제조사 모델` / `세부모델` heading map.
- Post-fix evidence: the full-view and focused comparisons show short two-line headings above the image; the browser DOM confirms the title precedes `.bbm-card-main`.

## Focused comparison

- The focused card crop was required because the change affects two-line hierarchy and the relative start position of the thumbnail.
- It confirms that the thumbnail moved downward only by the new heading block and that price, badges, location, seller, and bottom navigation remain aligned.

## Verification

- `npm run check:runtime`: passed (28 protected files unchanged).
- `npm run build`: passed.
- `npm run test:sites`: passed (4/4).
- 30-row heading map: passed.
- 384 px list/feed visual inspection: passed.
- 1280 px PC visual inspection: passed.
- 30 location overflow audit: passed.
- Browser console errors: none.

final result: passed
