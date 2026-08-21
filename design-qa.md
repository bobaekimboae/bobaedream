# Design QA — view-mode icon state

- Source visual truth: `qa-figma-card-icon.png`, exported from Figma node `1412:157677` after `get_design_context`.
- Browser-rendered implementation: `qa-card-icon-state.png`.
- Focused side-by-side evidence: `qa-card-icon-comparison.png`.
- Viewport: 1400 × 1200 browser viewport; protected phone screen measured at 393 × 852 CSS px; deviceScaleFactor 1.
- Pixel dimensions and normalization: source icon 20 × 20 px; implementation screenshot 1400 × 1200 px with a 393 × 852 CSS phone screen. The focused crop enlarges both states only for inspection.
- State: default filters, seller tab `전체`, sort `최신순`, full-width card view active.

**Full-view comparison evidence**

- `qa-card-icon-state.png` captures the complete rendered phone and shows the card-view icon directly to the right of `최신순` while the full-width card feed is active.
- Existing card layout, filters, randomized inventory, device chrome, and scroll composition remain unchanged.

**Focused region comparison evidence**

- `qa-card-icon-comparison.png` puts the Figma icon export and the rendered toolbar icon in the same comparison input.
- The 20 × 20 outline rectangle, two lower horizontal strokes, `#3A3A3A` color, 1.6 px stroke, rounded caps, and rounded joins match the source asset.

**Required fidelity surfaces**

- Fonts and typography: no typography changed; the icon remains aligned with the existing `최신순` label and 20 px toolbar slot.
- Spacing and layout rhythm: the icon preserves the existing 20 × 32 px button hit area and toolbar alignment.
- Colors and visual tokens: the exact Figma `#3A3A3A` stroke is used with no CSS approximation.
- Image quality and asset fidelity: `public/assets/ui/card-view.svg` is the exact vector asset exported from Figma node `1412:157677`; no handcrafted or CSS-drawn substitute is used.
- Copy and content: the accessible action label changes to `목록형 보기로 전환` while card mode is active and back to `카드형 보기로 전환` in list mode.

**Interaction checks**

- Initial list mode renders `/assets/ui/list.svg` and zero `.is-card-view` listings.
- First tap renders eight card listings and switches the toolbar image to `/assets/ui/card-view.svg`.
- Second tap restores the original list rows and `/assets/ui/list.svg`.
- Browser console errors: none.
- Runtime integrity, production build, and hosting package tests: passed.

**Findings**

- No actionable P0, P1, or P2 mismatch remains.

**Comparison history**

- Earlier implementation toggled the layout correctly but kept `/assets/ui/list.svg` in both states.
- The button now switches to the exact Figma card-view icon when card mode is active and returns to the list icon when list mode is restored.
- Post-fix focused evidence confirms source-vector fidelity and state synchronization.

**Follow-up polish**

- None required for this handoff.

final result: passed

