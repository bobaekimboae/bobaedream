# Manufacturer and price-filter design QA

## Evidence

- Manufacturer source visual truth: `N:\개인\Screenshot_20260821_185215_Ch Tt.png` (`1080 x 2100` pixels).
- Price source visual truth: Figma node `1313:139816`, rendered by Figma at `412 x 805` pixels.
- Browser-rendered implementation: `http://localhost:4173/`, captured in the in-app browser during this task in the open manufacturer and open price states.
- Comparison evidence: each source and its matching browser screenshot were emitted together in the same comparison input during this task.
- Browser stage screenshot: `1280 x 720`, device scale factor `1`.
- Mobile runtime screen: iPhone preset, `393 x 852` CSS pixels; the surrounding device frame and status/home chrome are template-owned and excluded from fidelity findings.
- State: manufacturer sheet open with no search/selection; price sheet open on `현금 차량` with `0 ~ 전체`.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: manufacturer names now use a readable 17px medium weight and the price sheet follows the Figma 18px title, 16px tabs/values, 13px quick ranges, and 12px helper labels.
- Spacing and layout rhythm: manufacturer rows use 54px height with 20px sheet insets and 12px logo-to-label spacing. The price sheet reproduces the 60px header, 52px tab strip, paired amount fields, dual range, two rows of quick filters, and safe-area-aware action bar.
- Colors and visual tokens: white surfaces, gray search/quick-filter fills, light separators, black range/control states, dimmed overlay, and navy confirm action match the supplied references.
- Image quality and asset fidelity: manufacturer rows keep the project's real sourced brand marks; no placeholder logos or improvised icon drawings were introduced. Existing close/search assets are reused.
- Copy and content: Korean manufacturer labels, `가격`, `현금 차량`, `리스/렌트`, minimum/maximum labels, all eight price ranges, reset action, and dynamic result-count CTA match the requested product language.

## Full-view comparison evidence

- Manufacturer comparison shows the requested larger names, generous vertical rhythm, left breathing room for the brand marks, and consistently aligned radio controls.
- Price comparison shows the same bottom-sheet anatomy and hierarchy as Figma, including the dual-ended price range, quick selections, and bottom actions.
- The implementation keeps the existing market list visible under the dimmed overlay, which matches the intended bottom-sheet interaction.

## Focused region comparison evidence

- Manufacturer header/search/first six rows were inspected at readable scale: title hierarchy, search-field radius, logo inset, label size, row separators, and radio alignment are consistent.
- Price input/range/preset/action regions were inspected together: field padding, thumb size, selected-range line, chip grid, and CTA proportions are consistent with the Figma node.

## Primary interactions tested

- Opened and closed the manufacturer sheet; the complete list remains scrollable and selectable.
- Opened the price sheet from the filter rail and switched the cash/lease tabs.
- Selected `5천~7천`; the draft fields changed to `5,000 ~ 7,000만원` and the CTA changed from `8대` to `1대`.
- Confirmed the draft; the filter chip changed to `5,000~7,000만원` and the list reduced to the matching 5,480만원 vehicle.
- Reloaded and reopened the sheet to verify the default `0 ~ 전체` state.
- Closing sheets dismisses the simulated keyboard/focus state.
- Runtime integrity, production build, and Sites packaging tests pass; browser-driven interaction surfaced no uncaught runtime failure.

## Comparison history

1. Initial price implementation had a P2 bottom safe-area issue: the action row was partially clipped by the home-indicator region.
2. Increased the price sheet's maximum snap height and added safe-area bottom padding to the action row.
3. Post-fix combined comparison shows both buttons fully visible above the home indicator with no actionable P0/P1/P2 drift.
4. Manufacturer source and implementation comparison passed on the first post-change review; its remaining differences are intentional product constraints (Korean names and real project logos rather than the reference's Vietnamese, logo-free list).

## Implementation checklist

- [x] Larger manufacturer title and row labels
- [x] Clear left padding and real brand marks
- [x] Figma-matched price bottom sheet
- [x] Cash/lease tabs
- [x] Dual range controls
- [x] Eight quick price ranges
- [x] Draft reset and close-without-apply behavior
- [x] Dynamic result count and confirm-to-filter behavior
- [x] Keyboard/focus dismissal
- [x] Browser-rendered visual and interaction verification

final result: passed

