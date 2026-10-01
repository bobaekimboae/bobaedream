# Design QA — 매물 제목 상단·기존 모델 구조

## Comparison target

- Source state: `reports/luxury-ui-test-20261002/mobile-list-title-above-384.jpg` — 제조사·모델까지 썸네일 위로 이동한 잘못된 중간안.
- Implemented list: `reports/luxury-ui-test-20261002/mobile-list-headline-above-384.jpg`.
- Implemented feed: `reports/luxury-ui-test-20261002/mobile-feed-headline-above-384.jpg`.
- Implemented PC: `reports/luxury-ui-test-20261002/pc-list-headline-above-1280.jpg`.
- Full-view comparison: `reports/luxury-ui-test-20261002/comparison-headline-correction.jpg`, 768 × 832 px.
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
- Typography: the description-style listing headline alone is the full-width block above the thumbnail. The existing information structure remains `제조사·모델` on the first line and `세부모델` on the second line.
- Layout rhythm: only the new headline adds vertical space. Existing model hierarchy, thumbnail, spec, price, badge, seller, and action geometry remain in their original card structure.
- Colors/tokens: no color, border, badge, or icon token changed.
- Image quality: existing `object-fit: cover`, crop, dimensions, and radii are unchanged in list and feed.
- Copy/content: non-personal listings show a specific complex after the region; personal listings show only their region. All 30 location strings fit without overflow at 384px.
- The first four rendered examples verified the intended alternation: 판교단지, 강남단지, no complex for personal, and 도이치오토월드.

## Comparison history

- First pass: `제조사 모델` and `세부모델` were incorrectly moved above the thumbnail.
- Fix: extracted only the description headline from each full title, placed that headline above the thumbnail, and returned the two model lines to `.bbm-card-content`.
- Post-fix evidence: the correction comparison shows the headline above the image and `람보르기니 우르스 / SE 4.0 V8` back in the original right-hand column. Browser DOM confirms the headline precedes `.bbm-card-main` while model/trim remain inside `.bbm-card-content`.
- Final correction: the temporary combined car-name experiment was reverted; the existing model/trim two-line structure is retained.

## Focused comparison

- The focused card crop was required because the change affects two-line hierarchy and the relative start position of the thumbnail.
- It confirms that only the description headline sits above the thumbnail; model, trim, price, badges, location, seller, and bottom navigation retain their intended alignment.

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
