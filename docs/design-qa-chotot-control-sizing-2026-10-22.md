# Design QA — Chợ Tốt search and pill sizing

## Comparison target

- Source visual truth: `.design-qa/chotot-my-ads-mobile-reference.png`
- Implementation: `.design-qa/bobaedream-main-chotot-sizing-mobile.png`
- Combined comparison evidence: `.design-qa/comparison-chotot-sizing-mobile.png`
- Source URL: `https://www.chotot.com/my-ads`
- Implementation URL: `http://127.0.0.1:4345/?home=1&v=chotot-sizing`
- State: mobile header, horizontal service pills, and primary search field visible.

## Viewport and normalization

- Source capture: 390 × 844 px at device density 1.
- Implementation capture: 394 × 851 px at device density 1; explicit CSS viewport 394 × 852.
- The captures differ by 4 CSS px in width because the authenticated Chợ Tốt browser surface reported 390 px while the implementation test surface was set to 394 px. The requested components were judged by DOM-rendered CSS dimensions and by the combined top-region visual comparison, not by whole-page content alignment.

## Full-view comparison

- The combined evidence confirms that both pages use a compact 40 px search control above content and a 32 px horizontal pill rail.
- The pages intentionally contain different products and content sections; only the requested search and service-pill sizing is treated as the design target.

## Focused component comparison

- Search field: implementation `40px` high, `12px 16px` horizontal padding, `8px` icon/text gap, `16px/400` input type. This matches the measured Chợ Tốt primary search dimensions.
- Service pills: implementation `32px` high, `4px 8px` padding, `8px` inter-pill gap, `14px/500` default type, and content-driven width. This matches the measured Chợ Tốt pills.
- The active Bobaedream pill intentionally retains the existing black selected state; the user requested Chợ Tốt sizing, not a Bobaedream color-token replacement.

## Required fidelity surfaces

- Fonts and typography: pill type is 14px/500 and search type is 16px/400, matching the source measurements. Korean glyph fallback remains the existing system/Pretendard stack.
- Spacing and layout rhythm: search height, pill height, internal padding, horizontal gaps, and 12px rail insets match the measured source system.
- Colors and visual tokens: sizing follows Chợ Tốt; Bobaedream blue search border and black selected state are intentionally preserved.
- Image quality and asset fidelity: existing production logo and icon assets remain sharp; browser verification found no broken images.
- Copy and content: Korean Bobaedream labels remain unchanged as requested.

## Interaction and runtime checks

- Service chip interaction tested: selecting `중고차` updates the active state.
- Search interaction tested: entering `BMW 5시리즈` and pressing Enter navigates with the expected encoded query.
- Browser console errors: none.
- Broken images: none.
- `npm run verify`: passed.

## Findings

- No actionable P0/P1/P2 mismatch remains for the requested component sizing.

## Comparison history

- Initial implementation used a 42px search field and 36px service pills.
- Updated implementation uses a 40px search field and 32px service pills, with Chợ Tốt padding and typography measurements.
- Post-fix evidence: `.design-qa/bobaedream-main-chotot-sizing-mobile.png` and `.design-qa/comparison-chotot-sizing-mobile.png`.

## Follow-up polish

- P3: If requested later, the search field can also adopt Chợ Tốt's neutral `#F4F4F4` fill and borderless treatment. It is intentionally not part of this sizing-only change.

final result: passed
