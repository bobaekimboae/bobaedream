# Design QA — Mercedes-Benz model chips

- Source visual truth: `qa-figma-benz.png`, exported from Figma node `1412:196155` after `get_design_context`.
- Browser-rendered implementation: `qa-benz-screen.png`.
- Side-by-side comparison evidence: `qa-benz-comparison.png`.
- Viewport: 1400 × 1200 browser viewport; protected phone screen measured at 393 × 852 CSS px; deviceScaleFactor 1.
- Pixel dimensions and normalization: source 412 × 393 px, normalized proportionally to 393 × 375 px; implementation cropped at 393 × 375 px from the unscaled 393 × 852 phone screen.
- State: Mercedes-Benz (`벤츠`) selected, model-chip rail visible, no individual model selected.

**Full-view comparison evidence**

- `qa-benz-comparison.png` places the complete exported source node and the matching implementation region in one comparison input.
- The implementation reproduces the `모델` label followed by `E클래스`, `S클래스`, `GLC클래스`, `GLE클래스`, and `C클래스` in a horizontally clipped chip rail.
- The protected iPhone dynamic island differs from the older status-bar device shown in Figma; this is intentional template-owned device chrome and does not alter app-owned content.

**Focused region comparison evidence**

- The full Figma node is already a focused 412 × 393 upper-list region, so a second crop was not needed.
- At the 393 px implementation width, `GLE클래스` peeks at the right edge, preserving the horizontal-scroll affordance visible in the source.

**Required fidelity surfaces**

- Fonts and typography: Pretendard medium, 15 px, 20 px line height is used for the model label and chips; weights and truncation match the source hierarchy.
- Spacing and layout rhythm: 54 px model row, 6 px chip gaps, 16 px label/rail edges, 34 px chip height, and pill radii match the Figma measurements after viewport normalization.
- Colors and visual tokens: white background, `#616161` label, `#3a3a3a` chip text, and `#e0e0e0` outlines match the supplied gray tokens.
- Image quality and asset fidelity: the targeted model pattern contains no raster imagery; existing Mercedes-Benz listing photos remain sharp and use committed local assets.
- Copy and content: all five Korean model names and their order match the Figma node exactly.

**Interaction checks**

- Tapping the Mercedes-Benz logo replaces the manufacturer-logo rail with the model-chip rail.
- Each model chip toggles its selected state and filters the randomized Mercedes-Benz inventory; `E클래스` produced only two E-Class listings during verification.
- A filtered listing opens the existing working vehicle-detail screen.
- Browser console errors: none.
- Runtime integrity, production build, and hosting package tests: passed.

**Findings**

- No actionable P0, P1, or P2 mismatch remains.

**Comparison history**

- Initial implementation state had no Mercedes-Benz model rail.
- The new Figma-matched chip rail, randomized Mercedes-Benz inventory, chip filtering, and detail navigation were added and verified in the post-fix visual evidence.

**Follow-up polish**

- None required for this handoff.

final result: passed

