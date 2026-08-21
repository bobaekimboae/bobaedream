# Design QA — region-selection bottom sheet

- Source visual truth: `qa-figma-region-sheet.png`, captured from Figma node `1674:17622` after `get_design_context`.
- Browser-rendered implementation: `qa-region-sheet-implementation.png`; full phone evidence: `qa-region-sheet-screen.png`.
- Side-by-side comparison evidence: `qa-region-sheet-comparison.png`.
- Viewport: 1400 × 1200 browser viewport; protected phone screen measured at 393 × 852 CSS px; deviceScaleFactor 1.
- Pixel dimensions and normalization: Figma source 412 × 449 px; implementation sheet 393 × 449 px. Both retain the design's fixed 449 px sheet height; the 19 px width difference reflects the current 393 px mobile runtime viewport.
- State: default nationwide inventory with the `지역` sheet open and all selectors unselected.

**Full-view comparison evidence**

- `qa-region-sheet-comparison.png` places the full Figma sheet and the complete browser-rendered sheet in the same comparison input.
- App-owned composition matches: 14 px top corners, 60 px title row, close icon, two 54 px location selectors, six quick chips, divider and nearby-search section, plus 52 px reset/confirm actions.
- The implementation's home indicator and lower device clipping are protected runtime chrome; they are intentionally not recreated as app content.

**Focused region comparison evidence**

- The full 449 px sheet is already a focused component capture and keeps all typography, borders, icons, spacing, and action widths readable at 1:1 density; a second crop was not needed.
- The exact Figma close and chevron vectors are committed as local assets and visibly match the source.

**Required fidelity surfaces**

- Fonts and typography: Pretendard hierarchy matches the source—18 px semibold title, 16 px regular selector text, 14 px medium chips, and 16 px semibold section/action labels.
- Spacing and layout rhythm: 20 px side padding, 12 px control gaps, 8 px chip gaps, 54 px selectors, 10 px radii, 24 px divider-to-heading gap, 118 px reset action, and the flexible confirm action match the Figma geometry.
- Colors and visual tokens: `#1A1A1A` primary text, `#616161` selector copy, `#9E9E9E` icons, `#EBEBEB` outlines/divider, white surfaces, and `#1B4C8C` confirmation button use the supplied Figma tokens.
- Image quality and asset fidelity: `sheet-close.svg` and `sheet-chevron.svg` are exact Figma exports; no CSS-drawn or inline substitutes are used.
- Copy and content: `지역`, `시/도 선택`, all six quick regions, `시/군/구 선택`, `내 주변 검색`, `내 위치와 검색 반경 선택`, `초기화`, and `확인` match the source.

**Interaction checks**

- Tapping the `지역: 전국` control opens the phone-scoped bottom sheet and dims the listing behind it.
- Quick-selecting `서울` and confirming updates the header to `지역: 서울` and filters all visible locations to Seoul.
- Changing a draft selection to `경기` and tapping close keeps the previously applied `서울` selection.
- The province menu, district menu, nearby-radius menu, reset action, confirm action, overlay dismissal, and close action are all interactive.
- Selecting `경기 > 수원시` updates the header to `지역: 경기 수원시`; selecting `10km` updates it to `지역: 내 주변 10km`; reset plus confirm returns it to `지역: 전국`.
- Browser console errors: none.
- Runtime integrity, production build, and hosting-package tests: passed.

**Findings**

- No actionable P0, P1, or P2 mismatch remains.

**Comparison history**

- Earlier behavior opened a generic two-column condition sheet that did not match the supplied regional workflow.
- The generic region branch was replaced with the complete Figma structure, exact icon assets, draft/apply semantics, visible region labels, and inventory filtering.
- Post-fix combined evidence confirms the source geometry and visual hierarchy at the live mobile viewport.

**Follow-up polish**

- None required for this handoff.

final result: passed

