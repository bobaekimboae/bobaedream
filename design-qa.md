# Design QA — 차량 히스토리 건수 링크

- Source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/cb601674-78d6-4f91-b3d6-fd390eae26b3/1-1000018232.jpg`
- Implementation capture: Codex in-app browser tab 18 screenshot, captured 2026-10-14 KST (tool-capture output; local export unavailable)
- Viewport: 384 × 820 CSS px
- Source pixels: 592 × 1280 px
- Implementation pixels: 384 × 820 px
- Density normalization: focused content-region comparison; device chrome and full-screen scale excluded
- State: BMW M3 상세 → 히스토리 탭 → 이력·권리 정보

## Full-view comparison evidence

- Existing section hierarchy, two-column alignment, 44px rows, and gray separators remain unchanged.
- The change is limited to the requested values; surrounding cards, navigation, and fixed CTA keep their previous layout.

## Focused region comparison evidence

- Source: accident/insurance counts use dark text with a visible underline as a detail affordance.
- Implementation: `수리이력 1건` and `사고이력 0건` use `rgb(34, 34, 34)`, a 1px underline, and a 3px underline offset.
- Both links resolve to `vehicle-history/?mode=dealer&plate=172%EB%AC%B42323`.
- Keyboard focus uses a 2px dark outline with 3px offset.

## Required fidelity surfaces

- Fonts and typography: inherited 16px/22px, weight 500; matches adjacent history values.
- Spacing and layout rhythm: no row-height, grid, or separator changes.
- Colors and visual tokens: link inherits the existing `#222` value color; no blue browser-link styling leaks through.
- Image quality and asset fidelity: no image or icon assets are introduced or altered.
- Copy and content: repair history is `1건`; accident history is `0건`.

## Primary interactions and browser checks

- History tab navigation tested.
- Both count links expose the correct detail-history URL.
- Browser console checked: no errors.

## Findings

- No actionable P0/P1/P2 mismatch found.

## Comparison history

- Initial implementation passed the focused comparison; no corrective iteration was required.

## Follow-up polish

- None required for this scoped change.

final result: passed
