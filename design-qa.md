# Design QA — 제목 위치 17개 링크

## Comparison target

- Source visual truth: existing mobile listing capture at `reports/location-icon-20261002/mobile-list-after.png`.
- Browser-rendered implementation: `reports/title-position-links-20261002/mobile-links-after-model.png`.
- Side-by-side evidence: `reports/title-position-links-20261002/comparison-before-after.png`.
- PC evidence: `reports/title-position-links-20261002/pc-links-after-model.png`.
- Mobile viewport and pixels: 384 × 832 CSS px, 384 × 832 image px, 1× density.
- PC viewport and pixels: 1440 × 900 CSS px, 1440 × 900 image px, 1× density.
- State: luxury30 UI-test listings, `after-model` selected, light theme.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- Fonts and typography: the 13px section label and 12px link labels follow the existing Pretendard hierarchy; the selected link uses the existing black selected-state language.
- Spacing and layout: the navigation is isolated between the test disclaimer and listing controls. Mobile stays one horizontal scroll row without page overflow; PC wraps the 17 links into two rows.
- Colors and tokens: white surface, `#222` selected state, gray border, and existing blue focus ring reuse current listing tokens.
- Image quality and assets: listing thumbnails, seller avatars, icons, and the new location asset are unchanged.
- Copy and content: all 17 links have a visible number, short position name, full accessible label, and the correct `titlepos` value.
- Existing production listing routes do not show the navigation; it appears only with `scenario=luxury30`.

## Interaction verification

- Link count: 17.
- Current state: `3 모델 후` is selected for `titlepos=after-model`.
- Navigation test: `4 제원 후` changes the URL to `titlepos=after-spec` and updates the listing headline position.
- Mobile horizontal overflow: none at document level.
- PC horizontal overflow: none; link group uses two rows at 1440px.
- Browser console errors and warnings: none.

## Comparison history

- First comparison found no P0/P1/P2 issue, so no visual correction loop was required.

## Verification

- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.

final result: passed
