# Region bottom-sheet design QA

## Evidence

- Source visual truth: Figma node `1674:17620` from file `bXm6a9oU2IlKcjv9xEum3l`, saved locally as `reference-region.png`.
- Browser-rendered implementation: `http://localhost:4173/`, saved locally as `implementation-region.png`.
- Full-view comparison: `comparison-region.png`.
- Focused sheet comparison: `comparison-region-sheet.png`.
- Source pixels: `412 x 917` at the node's natural export size.
- Implementation pixels: `412 x 917`, CSS viewport `412 x 917`, device scale factor `1`; no density normalization was required.
- Responsive check: CSS viewport `393 x 852`, device scale factor `1`.
- State: market list with the region sheet open, no draft region selected.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: the sheet now uses Pretendard throughout; title is 18px/600, selectors and actions are 16px, and quick chips are 14px/500 as specified by the Figma styles.
- Spacing and layout rhythm: the browser-rendered sheet is `412 x 449` at `y=468`, with a 60px title row, 20px horizontal insets, 54px selectors, 32px chips, 14px top radii, and 52px bottom actions. The 118px reset and 246px confirm actions match the source proportions.
- Colors and visual tokens: the overlay is 20% black, sheet surface is white, borders use `#ebebeb`, copy uses the gray/900 and gray/600 tokens, and the confirm action uses primary/500 `#1b4c8c`.
- Image quality and asset fidelity: the existing Figma-exported close and chevron assets are reused at their exact 12px and 11px-by-6px glyph sizes inside the specified 18px containers. No placeholder or hand-drawn asset was introduced.
- Copy and content: `지역`, all three placeholders, the six quick regions, `내 주변 검색`, `초기화`, and `798대 보기` match the Figma source.

## Full-view comparison evidence

- The source and implementation were combined at equal `412 x 917` dimensions in `comparison-region.png` before judgment.
- The app content remains visible behind the 20% dimmed overlay; this is the intended production context replacing the source node's neutral placeholder background.
- Sheet top, bottom, width, major vertical regions, and CTA baseline align with the source.

## Focused region comparison evidence

- The sheet-only crops were combined at `824 x 449` in `comparison-region-sheet.png`.
- Header title/close alignment, selector padding, chevron alignment, quick-chip spacing, divider position, nearby-search hierarchy, and bottom-action proportions match at readable scale.

## Primary interactions tested

- Tapping `지역: 전국` opens the region sheet.
- Close dismisses the sheet after its exit animation.
- Selecting `서울` and `강남구`, then tapping `798대 보기`, updates the header to `서울 강남구` and filters the list.
- Selecting a different draft region and closing the sheet preserves the previously applied region.
- `초기화` followed by confirm restores the header to `전국`.
- At `393 x 852`, the 449px sheet fits the viewport, the last quick chip remains within its 20px inset, and both actions remain fully visible.
- Browser console check returned no warnings or errors.
- Runtime integrity and TypeScript/Vite production compilation pass.

## Comparison history

1. Initial implementation had P2 differences: 34% overlay opacity instead of 20%, an unstable snap-height cap, the close glyph nine pixels too high, Inter fallback on the title, and a generic `확인` action instead of `798대 보기`.
2. The region-specific sheet was fixed to 449px, overlay opacity changed to 20%, the close control aligned to the Figma 18px container, the title inherited Pretendard, chevrons received their 18px containers, and the source CTA copy was restored.
3. The first post-fix capture exposed a P2 automatic-focus ring around the close action. A region-specific focus override removed that visual drift without changing its button semantics.
4. The final full-view and focused combined comparisons show no actionable P0/P1/P2 differences.

## Implementation checklist

- [x] Open from `지역: 전국`
- [x] Figma-matched 449px bottom-sheet anatomy
- [x] Exact overlay, radius, spacing, typography, and asset sizing
- [x] Province, district, quick-region, and nearby-radius controls
- [x] Draft selection with close-without-apply behavior
- [x] Reset and `798대 보기` actions
- [x] 412px source viewport and 393px responsive verification
- [x] Browser interaction and console verification
- [x] Runtime integrity and production compilation

## Card-view and toolbar follow-up

### Evidence

- Source visual truth: Figma node `1412:147789` from file `bXm6a9oU2IlKcjv9xEum3l`, exported at its natural `412 x 1301` size as `reference-card-feed.png`.
- Exact Figma sublayers inspected before implementation: region chevron `1439:196916`, sort arrow `1412:157675`, standard card information `1412:157711`, and lease-price card information `1412:195691`.
- Browser-rendered implementation: `http://localhost:4173/`, captured at a `412 x 917` CSS viewport as `implementation-card-final.png`.
- Equal-width source/implementation comparisons: `comparison-card-feed.png` and the focused `comparison-card-details.png`. The 45px Figma status bar was removed before comparison so the app content shares the same origin.
- Responsive browser check: `393 x 852` CSS viewport, with a 393px card, 361px image, contact actions ending at x=375, and no horizontal overflow.

### Findings

- No actionable P0, P1, or P2 visual differences remain in the requested areas.
- `전국` now uses the exact Figma triangle glyph at `10 x 5` inside its `20 x 20` frame. Its text starts at x=80 and the icon frame at x=110, matching the source.
- `최신순` now uses the exact Figma down-arrow geometry inside an `18 x 18` frame. The sort group starts at x=286, the arrow frame at x=329, divider at x=363, and view toggle at x=376, matching the source.
- Card information begins 10px below the image and keeps the source's 20px main-to-footer gap. Title is 17px/600/1.4, metadata is 15px/400/1.4, price uses a 17px amount with 16px prefix/unit, lease copy is 14px/600, badges are 12px in 20px-high pills, and address is 13px.
- The card address omits the list-view-only view counter. Seller information uses the Figma two-line structure with a 26px avatar, 12px/600 name, 12px/400 sales line, and three 20px actions separated by 24px.
- List view remains available, and switching list → card → list → card preserves the intended content and control labels.

### Verification

- Region and sort controls still open their respective bottom sheets; closing the region sheet and selecting the active sort option both work.
- Browser logs contain no warnings or errors from the implementation.
- Mobile runtime integrity, TypeScript compilation, Vite production build, Sites packaging, and all four Sites worker tests pass. Vite reports only its informational large-chunk advisory.

## Marketplace behavior follow-up

### Requested changes verified

- Region sheet confirm action now reads `737대 매물 보기` and renders with `rgb(26, 26, 26)` (`#1a1a1a`) background and white text.
- Listing badges are assigned when each inventory is shuffled. The first eight default listings visibly cover 0, 1, 2, and 3 badges, selected without duplicates from `브랜드인증`, `제조사보증`, `1인소유`, `가격인하`, and `인증중고차`.
- Price-to-badge spacing measures 2px in compact list view and approximately 2px in full-width card view for both the first and second listings.
- Selecting the BMW logo changes the manufacturer chip to `BMW` with a dedicated clear action. Tapping `BMW` opens the manufacturer sheet with BMW selected; tapping `BMW 제조사 필터 해제` restores the `제조사` chip, the five-logo manufacturer rail, and the default eight-listing inventory.

### Verification

- Tested at a `412 x 917` mobile viewport in the in-app browser.
- Browser logs contain no warnings or errors.
- Mobile runtime integrity, TypeScript compilation, Vite production build, Sites packaging, and all four Sites worker tests pass. Vite reports only its informational large-chunk advisory.

## Listing vertical-spacing follow-up

### Requested changes verified

- Removed the second listing's position-specific extra minimum height so all eight compact listings render at the same 208px minimum height.
- Compact listings now keep the location exactly 10px after the final price/badge element, including listings with zero badges.
- Card view preserves its intended 20px content-to-location gap, with the same measurement whether a listing has zero, one, two, or three badges.
- Compact listings with zero badges reduce their row height by the missing 22px badge row, keeping the seller line exactly 22px above the bottom divider just like badged listings. Card view remains consistent at 17px for every badge count.

### Verification

- Measured all eight default listings at a `412 x 917` mobile viewport in list and card views, including content-to-location and seller-to-divider gaps.
- Mobile runtime integrity, TypeScript compilation, Vite production build, Sites packaging, and all four Sites worker tests pass. Vite reports only its informational large-chunk advisory.

## Price-history pagination arrow follow-up

### Source and implementation

- Source visual truth: Figma node `1674:15393`, with pagination node `1674:15566` and previous/next icon nodes `1674:15568` and `1674:15587`.
- Reused the exact Figma-exported chevron assets already stored as `pagination-left.svg` and `pagination-right.svg`; normalized source comparison confirmed their vector markup matches the current Figma exports.
- Both controls keep the Figma 36px gray circle and 18px icon frame. The chevron leaf is now rendered at its natural 10px-by-6px size, rotated 90 degrees left and -90 degrees right.
- The disabled previous button keeps full opacity so its `#f3f3f3` surface and asset-provided `#c0c0c0` chevron match Figma instead of fading together.

### Verification

- Verified the price-history bottom sheet at a 375px mobile viewport, including disabled previous and enabled next states.
- Mobile runtime integrity, TypeScript compilation, Vite production build, Sites packaging, and all four Sites worker tests pass. Vite reports only its informational large-chunk advisory.

## ChoTot detail/listing tuning follow-up

### Requested changes verified

- The temporary 15-listing override now uses the requested Korean benchmark metadata format: `연식 · 주행거리 · 연료 · 차량번호`.
- Detail top information follows the requested order: car name, title, metadata, pink price, region, sale/view/posted state, and chat/phone CTA.
- The detail title hierarchy preserves the ChoTot-tuned typography: 19px title lines, 27px line height, 700 weight, tight 14px metadata, and heart-only save control.
- Selecting a list card stores that listing and rewrites the detail hero, name, subtitle, metadata, price, region, seller name, and selected vehicle information values.
- Existing repo assets are reused only from `public/assets`; no external vehicle photos were rehosted. The first listing no longer points to the dealer portrait as a vehicle hero image.

### Browser checks

- At `http://127.0.0.1:5174/`, the list screen rendered the 15-listing override with the normalized metadata format.
- Opening the Audi A6 listing produced: `아우디 A6 3.0 TDI 콰트로`, `정식수입 무사고 실매물`, `2012년식 · 125,109km · 디젤 · 28나7105`, `600만원`, and `서울 강남구 도곡동 · 오토갤러리`.
- Opening the Hyundai Grandeur listing produced: `현대 그랜저 GN7`, `캘리그래피 하이브리드 무사고`, `2023년식 · 30,000km · 하이브리드 · 312하8451`, and `4,150만원`.

### Verification

- JavaScript syntax check passes for `public/assets/test-listings-override.js`.
- Mobile runtime integrity passes.
- TypeScript compilation, Vite production build, Sites packaging, and all four Sites worker tests pass. Vite reports only its informational large-chunk advisory.

final result: passed

## ChoTot Filter Prototype Follow-up

### Cross-check

- Compared the shared ChoTot captures and the research sheet against the implementation: the all-filter sheet has the same 13-group hierarchy and an internal scroll area with a fixed bottom action area.
- The bottom actions retain the two-part anatomy: reset at left and an emphasized live result-count CTA at right.
- Notion source SVGs now provide the filter, search, close, list-view, and right-chevron glyphs; no replacement drawings were introduced.

### Functional Verification

- The full-width desktop draft uses 15 mixed test listings.
- Diesel changed the preview count to 2; adding white in the color selection sub-screen changed it to 1, and applying returned the single Kia Carnival listing.
- Hyundai followed by Grandeur GN7 in the model sub-screen changed the preview count to 1.
- TypeScript, Vite build, Sites worker tests, and mobile-runtime integrity all pass. Browser console warnings and errors are absent.

