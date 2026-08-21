# Design QA — BMW model selector and randomized listings

- Source visual truth: `C:\Users\sungn\AppData\Local\Temp\codex-clipboard-0440265a-e1d1-4b7e-a02d-3175bf5ea7c1.png`
- Browser-rendered implementation: `qa-implementation-full.png`
- Focused implementation region: `qa-implementation-models.png`
- Side-by-side comparison evidence: `qa-comparison.png`
- Viewport: 1400 × 1200 browser viewport; protected phone screen measured at 393 × 852 CSS px; deviceScaleFactor 1.
- Pixel dimensions: source 1220 × 274 px; full implementation 1400 × 1200 px; focused implementation 393 × 126 px. The focused region was enlarged 2× only for visual inspection in the comparison board; the original evidence remains 1:1.
- State: BMW manufacturer selected, no individual BMW model selected, randomized BMW inventory visible below the model rail.

**Full-view evidence**

- The protected mobile frame is intact, the BMW rail fits the 393 px app viewport without vertical or page overflow, and the horizontal carousel clearly indicates more models off-screen.
- The listing section begins immediately below the selector and shows BMW photos, Korean model names, prices, locations, and varied seller identities.

**Focused comparison evidence**

- `qa-comparison.png` places the supplied reference and the rendered BMW selector in the same image. Both use white rounded cards, front three-quarter vehicle photography, centered model imagery, labels below the image, and a horizontally scrollable sequence.
- The reference is a wide desktop crop while the implementation is the product's 393 px mobile viewport. Showing three cards at once is the expected responsive adaptation; the remaining cards are available by horizontal drag.

**Required fidelity surfaces**

- Fonts and typography: Pretendard remains consistent with the existing app; 14 px semibold Korean model labels remain legible and do not wrap.
- Spacing and layout rhythm: 10 px rail gaps, 16 px card radii, centered 72 px image slots, and a 126 px selector row preserve the reference's compact catalog rhythm inside the mobile viewport.
- Colors and visual tokens: white cards, subtle neutral borders, dark text, and the existing blue selected state match the source and product tokens.
- Image quality and asset fidelity: five dedicated photorealistic BMW product images are used; images are sharp, centered, uncropped, and use consistent white studio backgrounds. No placeholders or code-drawn vehicle assets are present.
- Copy and content: Chinese labels in the reference were intentionally localized to the requested Korean names: 3시리즈, X1, 5시리즈, X3, 1시리즈.

**Interaction checks**

- Default list loads eight mixed listings in a randomized order.
- BMW tap replaces manufacturer logos with five BMW model cards and reshuffles ten BMW listings.
- 3시리즈 tap filters the list to the two matching BMW listings; tapping again clears the model filter.
- A listing opens the existing detail screen.
- 가격 변동 opens the existing price-history bottom sheet.
- Browser console warnings/errors: none.
- Runtime integrity, production build, and hosting package tests: passed.

**Findings**

- No actionable P0, P1, or P2 mismatch remains.
- The wider source shows five cards simultaneously, while the mobile implementation shows three and uses the existing horizontal carousel. This is an intentional viewport adaptation, not a fidelity defect.

**Comparison history**

- Initial focused capture showed the runtime's inspection cursor over the first card. The pointer was moved outside the phone frame and the implementation was recaptured.
- Post-fix evidence in `qa-comparison.png` is clean and confirms the intended card anatomy, imagery, labels, and spacing.

**Follow-up polish**

- None required for handoff.

final result: passed