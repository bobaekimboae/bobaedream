# Design QA — compact BMW model selector

- Source visual truth: `C:\Users\sungn\AppData\Local\Temp\codex-clipboard-e4d5e8a0-9b93-4e00-b314-9cd5245ad70a.png`
- Browser-rendered implementation: `qa-small-full.png`
- Focused implementation region: `qa-small-region.png`
- Side-by-side comparison evidence: `qa-small-comparison.png`
- Viewport: 1400 × 1200 browser viewport; protected phone screen measured at 393 × 852 CSS px; deviceScaleFactor 1.
- Pixel dimensions: source 1220 × 274 px; full implementation 1400 × 1200 px; focused implementation 393 × 96 px. The focused implementation was enlarged only on the comparison board; the saved focused evidence remains 1:1.
- State: BMW manufacturer selected, all BMW models unfiltered, randomized BMW listings visible below.

**Full-view evidence**

- The mobile screen shows four complete BMW model cards and 43 px of the fifth card at the right edge.
- The selector height is reduced from 126 px to 96 px, keeping more listing content visible while preserving the existing horizontal carousel behavior.

**Focused comparison evidence**

- `qa-small-comparison.png` places the supplied reference and implementation in the same comparison input.
- Both show compact white catalog cards, centered front three-quarter vehicle images, labels beneath the image, small neutral borders, rounded corners, and a clipped fifth card that communicates horizontal scrolling.

**Required fidelity surfaces**

- Fonts and typography: Korean model labels use the existing Pretendard stack at 12 px semibold and remain single-line and legible.
- Spacing and layout rhythm: 72 × 78 px cards, 6 px gaps, 12 px radii, and a 96 px rail provide the requested compact density. Four cards are fully visible and the fifth peeks by 43 px.
- Colors and visual tokens: white cards, neutral gray borders, dark labels, and the existing blue selected state remain consistent with both the source and product UI.
- Image quality and asset fidelity: all five dedicated BMW product images remain centered and uncropped with consistent white studio backgrounds.
- Copy and content: Korean labels remain 3시리즈, X1, 5시리즈, X3, 1시리즈. X3 intentionally replaces the source's import-specific label to match the existing requested model set.

**Interaction checks**

- BMW tap reveals all five model cards in the compact rail.
- Fifth card remains reachable by horizontal drag.
- Individual model filtering and list-to-detail navigation remain intact.
- Browser console warnings/errors: none.
- Runtime integrity, production build, and hosting package tests: passed.

**Findings**

- No actionable P0, P1, or P2 mismatch remains.
- The implementation retains the small `BMW` context label at the left; this is an intentional product-context addition and does not prevent the requested 4-plus-peek composition.

**Comparison history**

- Earlier implementation showed only three complete cards and part of a fourth. Card width, gap, row height, image slot, and left label column were reduced.
- Post-fix evidence confirms four complete cards and a 43 px fifth-card peek with no clipping of the first four labels.

**Follow-up polish**

- None required for handoff.

final result: passed