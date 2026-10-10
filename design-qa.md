# Design QA — 서울오토갤러리 카테고리 헤더

- source visual truth path: `C:\Users\bobae\Documents\Codex\bobaedream-genesis-1008\reports\seoul-auto-gallery-youtube-reference.png`
- implementation screenshot path: `C:\Users\bobae\Documents\Codex\bobaedream-genesis-1008\reports\seoul-auto-gallery-header-mobile-v01.png`
- focused implementation path: `C:\Users\bobae\Documents\Codex\bobaedream-genesis-1008\reports\seoul-auto-gallery-header-region-v01.png`
- combined comparison path: `C:\Users\bobae\Documents\Codex\bobaedream-genesis-1008\reports\seoul-auto-gallery-header-qa-side-by-side.png`
- scroll-state evidence: `C:\Users\bobae\Documents\Codex\bobaedream-genesis-1008\reports\seoul-auto-gallery-header-scroll-v02.png`
- desktop evidence: `C:\Users\bobae\Documents\Codex\bobaedream-genesis-1008\reports\seoul-auto-gallery-header-desktop-v01.png`
- viewport: mobile 390×844 CSS px, desktop 1440×1000 CSS px
- source pixels: 415×900; source banner crop 380×104, normalized to 358×98
- implementation pixels: full mobile 390×844, focused banner 358×98
- density normalization: deviceScaleFactor 1; source banner crop and implementation banner normalized to equal 358×98 pixels
- state: 서울오토갤러리 카테고리 첫 화면, 필터 미선택, 모바일 피드

## Full-view comparison evidence

The implementation preserves the existing search, region, filter-chip, logo rail, dealer rail, and listing hierarchy. The new header is inserted between the search header and region/filter controls, so it does not replace or obscure any existing interaction.

## Focused region comparison evidence

The combined image compares the YouTube mobile channel banner crop on the left with the implemented 서울오토갤러리 banner on the right at the same 358×98 pixels. Both use the same 3.65:1 proportion and 8px rounded visual treatment. The implementation intentionally substitutes Seoul Auto Gallery content while preserving the compact channel-banner density.

## Required fidelity surfaces

- Fonts and typography: title 18/23·700, subtitle 12/17·400; no wrapping or truncation at 390px.
- Spacing and layout rhythm: x=16, width=358, height=98, 16px side margins, 8px radius; filter begins below the header without overlap.
- Colors and visual tokens: deep navy photographic background, white title, 84% white subtitle, restrained left-to-right legibility overlay.
- Image quality and asset fidelity: 2084×755 photographic master remains sharp at 358×98 and 1200×132; official SAG source mark is used as the basis for the transparent symbol asset.
- Copy and content: `서울오토갤러리` / `수입차 전문 매매단지` matches the approved shortened copy.

## Interaction and runtime checks

- The `.mobile-scroll` container reaches `scrollTop=260`; banner bounding box moves to `y=-198`, confirming it scrolls away naturally.
- Persistent bottom navigation remains visible.
- Browser console and page errors: 0.
- `npm run check:runtime`: passed.
- `npm run verify:qf`: passed.

## Findings

No actionable P0, P1, or P2 mismatch remains.

## Comparison history

- Pass 1: source and implementation were normalized to 358×98. No P0/P1/P2 issue was found, so no visual-fix iteration was required.

## Follow-up polish

- P3: If a future official high-resolution transparent SAG symbol becomes available, it can replace the current derived transparent symbol without changing layout metrics.

final result: passed
