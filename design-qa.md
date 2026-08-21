# Manufacturer sheet design QA

## Evidence

- Source visual truth: `C:\Users\sungn\Downloads\ChatGPT Image 2026년 8월 21일 오후 07_17_54.png`
- Browser-rendered implementation: `C:\Users\sungn\Documents\Codex\2026-08-21\github-plugin-github-openai-curated-remote\work\bobaedream\maker-sheet-implementation.png`
- Side-by-side comparison: `C:\Users\sungn\Documents\Codex\2026-08-21\github-plugin-github-openai-curated-remote\work\bobaedream\maker-sheet-comparison.png`
- Browser viewport: `1400 x 1200`, device scale factor `1`
- Mobile screen: `393 x 852` CSS pixels and rendered pixels
- Source pixels: `898 x 1751`; normalized to `393 x 766`
- Implementation sheet: `393 x 767`; compared as a `393 x 766` sheet crop so browser stage, phone frame, and density do not affect judgment
- State: default manufacturer sheet, no search query, no selected manufacturer

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: Korean sans-serif hierarchy, weights, sizes, and row-label density match the reference after normalization.
- Spacing and layout rhythm: the 45px title bar, compact search field, 32px brand rows, separators, edge insets, and right radio alignment reproduce the source composition.
- Colors and visual tokens: white sheet, soft gray search field, light separators, muted placeholder, and dark text match the reference palette.
- Image quality and asset fidelity: actual supplied/project brand assets, Simple Icons marks, and sourced brand logo images are used; no placeholder boxes, emoji, CSS drawings, or handwritten SVG substitutes are present.
- Copy and content: title, search placeholder, Korean manufacturer names, and reference ordering are reproduced through the visible Maserati row.
- Residual P3: the browser QA capture includes its translucent pointer indicator over the search field and the mobile template's home indicator at the bottom; both are preview-environment chrome and not app UI drift.

## Full-view comparison evidence

- The normalized side-by-side image shows the same near-full-height bottom-sheet proportion, rounded top corners, centered title, right close control, search bar, dense manufacturer rows, and aligned radio column.
- The implementation exposes the same number of visible rows at the normalized sheet height, including the bottom Maserati row.

## Focused region comparison evidence

- The header/search/first-five-row region was inspected in the same comparison image at readable scale.
- Title centering, close-icon offset, search radius, logo-to-label spacing, row separators, and radio sizing align with the reference.

## Primary interactions tested

- Opened the sheet from the `제조사` filter chip.
- Entered `벤츠` and confirmed only `메르세데스-벤츠` remained.
- Selected `메르세데스-벤츠` and confirmed the filter changed to `벤츠` and the inventory switched to Mercedes listings.
- Reopened the sheet and confirmed the selected radio state persisted.
- Closed the sheet with the X control without changing the current selection.
- Browser-driven testing surfaced no uncaught runtime failure; `check:runtime`, production build, and Sites tests are used as the repeatable runtime checks.

## Comparison history

1. Initial comparison found a P2 density mismatch: 55px rows and a 52px search field exposed far fewer manufacturers than the reference. It also found missing reference brands (랜드로버, 렉서스, 재규어, 링컨) and a clipped close icon.
2. Fixed the close control overflow, added real brand marks and the missing manufacturers, reduced the sheet to the reference 90% height, and compacted the header, search, rows, typography, logos, and radios.
3. Post-fix visual evidence in `maker-sheet-comparison.png` shows no remaining actionable P0/P1/P2 difference.

## Implementation checklist

- [x] Reference-matched manufacturer bottom sheet
- [x] Search filtering
- [x] Single-select radio state
- [x] Immediate inventory filtering
- [x] Close action and scrolling
- [x] Browser-rendered comparison at 1:1 mobile scale

final result: passed

