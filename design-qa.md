# Design QA — list/card view toggle

- Source visual truth: `qa-figma-card-view.png`, exported from Figma node `1412:147789` after `get_design_context` was completed on the frame and focused card sublayers.
- Browser-rendered implementation: `qa-card-view-screen.png`.
- Side-by-side comparison evidence: `qa-card-view-comparison.png`.
- Viewport: 1400 × 1200 browser viewport; protected phone screen measured at 393 × 852 CSS px; deviceScaleFactor 1.
- Pixel dimensions and normalization: source 412 × 1301 px resized proportionally to 393 px width and cropped to 393 × 852; implementation cropped at 393 × 852 from the unscaled phone screen.
- State: default filters, seller tab `전체`, sort `최신순`, full-width card view active.

**Full-view comparison evidence**

- `qa-card-view-comparison.png` places the Figma source and the browser-rendered card state in the same comparison input.
- The hierarchy matches: filter area, manufacturer rail, video toggle, seller/sort toolbar, 16 px card margins, 380:220 media, metadata overlay, two-line title slot, specs, price, badges, location, seller information, and three action icons.
- The protected iPhone dynamic island differs from the older status-bar treatment in Figma; this is intentional template-owned device chrome.
- Vehicle model, seller, price, and photo differ because the existing randomized inventory is intentionally preserved.

**Focused region comparison evidence**

- The full 393 × 852 comparison keeps the toolbar and complete first card readable at 1:1 density, so a second crop was not required.
- The image aspect ratio, 12 px radius, metadata positions, title/action alignment, and lower seller actions are clearly visible in the combined comparison.

**Required fidelity surfaces**

- Fonts and typography: Pretendard uses the Figma hierarchy—17 px semibold title, 15 px specifications, 17 px bold price, and 12–13 px seller/location text—with matching line-height and truncation behavior.
- Spacing and layout rhythm: the card uses 16 px horizontal margins, a 380:220 media ratio, 12 px top spacing, 20 px content-to-seller separation, 12 px radius, and a 1 px divider consistent with the source.
- Colors and visual tokens: white surfaces, `#1a1a1a` primary text, `#6a6a6a` specs, `#e73662` price, `#ebebeb` badges/dividers, and the photo metadata fade match the source tokens.
- Image quality and asset fidelity: current committed vehicle photos are used without placeholders; the Figma photo-count, more, call, message, and heart SVG assets are committed locally and rendered at their source sizes.
- Copy and content: existing randomized listing copy remains intact while the view-mode labels correctly announce `카드형 보기로 전환` and `목록형 보기로 전환`.

**Interaction checks**

- First icon tap changes all eight rendered listings from the original compact list to full-width cards.
- Second tap restores all eight original list rows without clearing filters or inventory.
- A full-width card opens the existing detail screen.
- Card-view heart toggles without opening the detail screen.
- Browser console errors: none.
- Runtime integrity, production build, and hosting package tests: passed.

**Findings**

- No actionable P0, P1, or P2 mismatch remains.

**Comparison history**

- Earlier behavior only changed row density and did not expose the Figma full-width card pattern.
- The icon now performs a reversible list/card state transition; post-fix visual evidence confirms the Figma card anatomy and spacing while preserving the original list state.

**Follow-up polish**

- None required for this handoff.

final result: passed

