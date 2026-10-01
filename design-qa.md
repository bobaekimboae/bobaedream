# Design QA — 매물 설명 제목 17개 위치 비교

## Comparison target

- Source visual truth: `reports/luxury-ui-test-20261002/mobile-list-headline-above-384.jpg`.
- Rendered comparison: `reports/luxury-ui-test-20261002/title-position-all-17-contact-sheet.png`.
- New variants comparison: `reports/luxury-ui-test-20261002/title-position-8-17-contact-sheet.png`.
- Individual rendered captures: `title-position-1-top.png` through `title-position-17-spec-inline.png` in the same directory.
- Browser geometry evidence: `title-position-7-variants-metrics.json` and `title-position-8-17-metrics.json`.
- Viewport: 384 × 832 CSS px; screenshots are 384 × 832 px at 1× density.
- State: luxury30, update sort, list page 1, light theme.

## Position inventory

1. Full-width card top
2. Before manufacturer/model
3. After detail model
4. After vehicle specs
5. After price/badges
6. Full-width card bottom
7. Thumbnail top overlay
8. Above thumbnail
9. Vertical label between thumbnail and information
10. Caption below thumbnail
11. Thumbnail center overlay
12. Thumbnail bottom overlay
13. Above location
14. Below location
15. Below seller
16. Inline to the right of price
17. Inline to the right of specs

## Findings

- No P0/P1/P2 implementation defect remains. All 17 routes render independently and retain the existing car data and controls.
- Typography: the model/trim hierarchy remains unchanged in every variant. The headline uses secondary weight and color except for image overlays, which use white text on a dark translucent surface.
- Spacing/layout: all variants fit the 384px viewport without horizontal overflow. Card heights range from 183px to 211px; the 136×136px thumbnail remains unchanged.
- Colors/tokens: the original white surface, text, badge, location, and seller tokens remain unchanged. New overlay backgrounds are limited to image-bound variants.
- Image quality: source images, crop, `object-fit: cover`, 136×136px dimensions, and 8px radius are unchanged.
- Copy/content: every variant uses the same listing headline, model, detail model, specs, price, badges, complex, and seller.
- Positions 7, 8, 9, 11, 12, 16, and 17 intentionally truncate the long headline; the captures make that tradeoff visible rather than hiding it.

## Consultant recommendation

- Best default: 3, after detail model. It preserves car-name priority and keeps the headline close to vehicle identity.
- Best alternative for stronger promotional emphasis: 1, full-width card top.
- Best compact alternative: 10, caption below thumbnail, provided a two-line headline is acceptable.
- Avoid as default: 9, 11, 12, 16, and 17 because they reduce image or data readability.

## Focused comparison

- A combined 17-up contact sheet was required because the requested decision is comparative hierarchy, not pixel matching to one source.
- Individual 384×832 captures verify text collision, truncation, thumbnail preservation, card height, and the relationship to price/location/seller regions.

## Verification

- `npm run check:runtime`: passed (28 protected files unchanged).
- `npm run build`: passed.
- `npm run test:sites`: passed (4/4).
- 17 route variants at 384px: passed.
- Horizontal viewport overflow: none.
- Thumbnail size: 136×136px in all measured variants.
- Browser console errors: none.

final result: passed
