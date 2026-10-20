# Dealer Store Review Design QA

## Comparison target

- Source visual truth: `reports/audits/dealer-store-review-crosscheck-2026-10-21/01-chotot-all-desktop.png`
- Implementation: `reports/design-qa/dealer-store-review-2026-10-21/01-implementation-desktop-pass1.png`
- Combined comparison: `reports/design-qa/dealer-store-review-2026-10-21/02-side-by-side-pass1.png`
- Mobile implementation: `reports/design-qa/dealer-store-review-2026-10-21/04-implementation-mobile.png`
- Desktop viewport: 1280×800 CSS px, device density 1; source 1270×794 px, implementation 1280×800 px. The screenshots were aligned at native density without resampling.
- Mobile viewport: 390×844 CSS px, device density 1; implementation 390×843 px.
- State: 판매점리뷰 > 전체(17). Additional tested states: 차량 구매(16), 내차 판매(1).

## Full-view comparison evidence

- The desktop page now uses the source's 320px seller column, 16px gutter, and 668px review column. Measured shell: `320px 668px`, width 1004px, x 132.8px.
- The source review column begins at x 467px; implementation begins at x 468.8px.
- The source review content width is 636px; implementation review article width is 636px.
- The source summary score is 32px/700/48px; implementation is 32px/700/48px.
- The source review panel is 668px wide; implementation is 668px wide.

## Focused comparison evidence

- Summary tags: both 12px/18px with `#f4f4f4` fill and 28px visual height.
- Review tags: implementation changed from 11px outlined white pills to 12px/18px, 4px×12px, `#f4f4f4`, 24px radius.
- Review author and body: 14px, author 700 and body 400, 21px line height.
- Reply label: implementation changed from 12px/800 boxed treatment to 14px/700 flat treatment.
- Review tabs: implementation changed from 58px to 52px content height and preserves the three-way selected underline.
- Vehicle strip: 54px thumbnail and neutral gray surface; real vehicle imagery is retained.

## Findings

No actionable P0, P1, or P2 design mismatch remains in the review experience.

### Accepted product differences

- The global header uses the existing Bobaedream design system rather than copying Chợ Tốt branding.
- Korean review content has different wrapping and keyword counts from Vietnamese production data.
- The left column uses Bobaedream dealer identity, performance counts, contact controls, and valuation CTA rather than Chợ Tốt's Vietnamese policy list.
- Chợ Tốt's web page retains a roughly 1270px minimum width at a 390px test viewport. Bobaedream intentionally preserves its responsive mobile layout instead of reproducing horizontal clipping.

## Required fidelity surfaces

- Fonts and typography: passed. Pretendard/system Korean stack is the appropriate local equivalent; measured sizes and weights match the source hierarchy.
- Spacing and layout rhythm: passed. Desktop tracks, gutter, summary width, panel width, card width, and tab height now match the source measurements.
- Colors and visual tokens: passed. Ink `#222`, muted grays, `#f4f4f4` chips, white panels, dividers, and gold star treatment map to the source.
- Image quality and asset fidelity: passed. Existing real dealer, banner, and vehicle assets are used; no placeholder/CSS-drawn imagery was introduced.
- Copy and content: passed. Korean buyer/seller terminology and dealer replies are coherent and the 17/16/1 counts stay internally consistent.
- Icons: passed. Existing project icon assets remain aligned and no new handcrafted SVG/CSS icon was introduced.
- States and interactions: passed. 전체, 차량 구매, 내차 판매 tabs all switch and expose 17/16/1 states respectively.
- Responsiveness and accessibility: passed for the tested scope. 390px layout reflows without overlap; selected tabs expose matching `aria-selected`; the browser console reported no warnings or errors. This is not a full WCAG certification.

## Comparison history

### Audit baseline

- P2: full-width stacked profile and 860px review panel differed from the source two-column shell.
- P2: review tags were 11px white outlined pills rather than 12px filled gray pills.
- P2: dealer reply used a heavy gray callout and 12px label.
- P3: score was 34px/800 instead of 32px/700; review tabs were 58px instead of 52px.
- P3: source-absent buyer/seller role badges increased visual noise.

### Fixes applied

- Added review-only desktop 320px + 668px grid with 16px gap.
- Constrained panel/article widths to 668px/636px.
- Converted card tags to the measured source style.
- Flattened and resized dealer replies.
- Matched score typography and tab height.
- Removed redundant visible section title/subtitle and role badges while preserving the accessible heading.

### Post-fix evidence

- `reports/design-qa/dealer-store-review-2026-10-21/01-implementation-desktop-pass1.png`
- `reports/design-qa/dealer-store-review-2026-10-21/02-side-by-side-pass1.png`
- `reports/design-qa/dealer-store-review-2026-10-21/03-implementation-seller-desktop.png`
- `reports/design-qa/dealer-store-review-2026-10-21/04-implementation-mobile.png`

## Follow-up polish

- P3: if the business wants even closer source density, the Korean left column could gain a compact benefits/policies module. It is intentionally excluded because it changes product content rather than review fidelity.

final result: passed
