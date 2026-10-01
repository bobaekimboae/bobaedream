# Design QA — 3B 블루 제목 시안

## Comparison target

- Source visual truth: 3번 기본 시안 at `reports/title-position-links-20261002/mobile-links-after-model.png`.
- Browser-rendered implementation: `reports/title-blue-variant-20261002/mobile-3b-blue.png`.
- Side-by-side evidence: `reports/title-blue-variant-20261002/comparison-3-vs-3b.png`.
- Viewport and pixels: 384 × 832 CSS px, 384 × 832 image px, 1× density.
- State: luxury30 UI-test listings, `titlepos=after-model`, `titlecolor=blue`, light theme.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- Fonts and typography: the headline keeps the 3번 placement and 13/18 size, with weight raised from 500 to 600 for blue-text legibility.
- Spacing and layout: title position, margins, card height, image size, price, location, and seller rhythm are unchanged from 3번.
- Colors and tokens: the only card change is the headline color, using the existing Bobaedream token `#1B4C8C`; surrounding titles and metadata stay unchanged.
- Image quality and assets: thumbnails, avatars, icons, and crop behavior are unchanged.
- Copy and content: headline text and listing data are identical to 3번.
- The navigation now shows `3B 블루` directly after 3번 and removes the color parameter when another position is chosen.

## Focused comparison

- The full 384px side-by-side comparison is sufficient because the requested change is limited to one readable headline line and its adjacent selection pill.
- Computed headline style: `rgb(27, 76, 140)`, 13px, 18px line height, weight 600.

## Interaction verification

- Preview links: 18 total — 17 positions plus the 3B color alternative.
- Selected link: `3B 블루`.
- Document horizontal overflow: none.
- Browser console errors and warnings: none.

## Comparison history

- First comparison found no P0/P1/P2 issue, so no correction loop was required.

## Verification

- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.

final result: passed
