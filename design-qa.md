# Design QA

## Source visual truth

- List Figma node: `1412:158566` in file `bXm6a9oU2IlKcjv9xEum3l`.
- Detail Figma node: `1656:8414` in the same file.
- Updated detail-top Figma node: `1656:8438` in the same file.
- Updated detail-top reference: `C:\Users\sungn\Documents\Codex\2026-08-21\github-plugin-github-openai-curated-remote\work\bobaedream\qa\detail-top-reference-20260821.png` (412 × 296 px).
- Detail reference: `C:\Users\sungn\Documents\Codex\2026-08-21\github-plugin-github-openai-curated-remote\work\qa\detail-reference.png`.
- Detail source pixels: 412 × 4493, normalized to 393 px wide for the mobile-runtime comparison.

## Implementation evidence

- Local URL: `http://localhost:4173/`.
- Top screenshot: `C:\Users\sungn\Documents\Codex\2026-08-21\github-plugin-github-openai-curated-remote\work\qa\detail-implementation-final.png`.
- Mid-page screenshot: `C:\Users\sungn\Documents\Codex\2026-08-21\github-plugin-github-openai-curated-remote\work\qa\detail-implementation-mid.png`.
- Final side-by-side: `C:\Users\sungn\Documents\Codex\2026-08-21\github-plugin-github-openai-curated-remote\work\qa\detail-side-by-side-final.png`.
- Updated top implementation capture: `C:\Users\sungn\Documents\Codex\2026-08-21\github-plugin-github-openai-curated-remote\work\bobaedream\qa\detail-top-implementation-20260821.jpg` (1280 × 720 browser capture; app content shown in the protected phone runtime).
- Updated top side-by-side comparison: `C:\Users\sungn\Documents\Codex\2026-08-21\github-plugin-github-openai-curated-remote\work\bobaedream\qa\detail-top-side-by-side-20260821.jpg`.
- Browser viewport: 1400 × 1200 during QA; device screen measured 393 × 852 CSS px at device scale factor 1.
- Implementation capture pixels: 393 × 852.
- State: iPhone, detail route, photo mode, keyboard closed, top and seller/sales regions.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: Pretendard family, Korean hierarchy, 18 px section headings, 14 px body copy, price emphasis, line heights, and wrapping follow the Figma source. The protected runtime uses its live device typography for the status bar.
- Spacing and layout rhythm: the 305 px media area, summary hierarchy, gray 8 px section gaps, white 8 px cards, two-column information grid, four-column option grid, seller card, pricing card, and horizontal related-car rails match the source structure. The fixed action footer is an intentional functional treatment so the primary actions remain reachable while scrolling.
- Colors and visual tokens: navy call-to-action, pink price, blue inspection states, white cards, `#f1f1f1` page background, gray labels, dividers, badges, and progress bars match the Figma palette.
- Image quality and asset fidelity: hero, option icons, dealer portrait, recommended-car photos, top action icons, and phone icon use exact exported Figma assets. The hero uses `object-fit: contain` on black to preserve the source crop and side bar.
- Copy and content: title, description, specifications, option labels, insurance and inspection data, warranty, dealer details, estimated costs, sales copy, related inventory, safety notice, and phone number match the provided design.
- Updated top content: the price-variation link and the two equal-width calculator buttons match node `1656:8438`; all three controls provide visible feedback when tapped.

## Full-view and focused comparison

- Top full-view comparison: `detail-side-by-side-final.png` confirms the same hero composition, media controls, title wrap, metadata, badges, price, stats, card start, and information density.
- Updated focused top comparison: `detail-top-side-by-side-20260821.jpg` places the 412 × 296 Figma reference and the live implementation in the same comparison input. Both were normalized to approximately 268 px wide in the comparison canvas; the app itself remains 393 CSS px wide at device scale factor 1.
- Focused mid-page comparison: `detail-implementation-mid.png` confirms the warranty, dealer, sales-cost, secondary action, and fixed-footer regions.
- The Figma source is a 412 px-wide long frame while the protected mobile runtime is a 393 × 852 iPhone screen. Source evidence was normalized to 393 px before judging app-owned content. The bezel, dynamic island, live clock, status-bar colors, and home indicator are template-owned and intentionally preserved.

## Interaction and browser checks

- Tapping any list card pushes the detail route; the detail back button returns to the preserved list state.
- Media tabs switch between photo and video states; the image rail remains horizontally draggable.
- Header share shows feedback; the overflow menu opens and closes its action sheet.
- Header and footer like controls stay synchronized.
- Consultation opens the dealer-contact sheet; the phone action exposes the `tel:` link.
- Option and insurance buttons expand and collapse their additional information.
- Sale actions, reporting, description expansion, and related-car cards provide visible feedback.
- Updated top controls tested: `가격 변동`, `비용 계산기`, and `보험료 계산` each show the intended confirmation state.
- Browser console errors in a clean local preview: none.
- Runtime integrity, production build, and Sites worker tests: passed.

## Comparison history

- Initial P1: the hero used `object-fit: cover`, which enlarged and cropped the vehicle compared with the Figma composition.
- Fix: switched the exported hero media to `object-fit: contain` on the black source background.
- Initial P2: the fixed phone action used a generic rectangular phone glyph.
- Fix: replaced it with the exact Figma call icon export.
- Post-fix evidence: `detail-side-by-side-final.png` shows the corrected vehicle scale, source side bar, media layout, and call action.
- Updated-top pass: the first side-by-side comparison found no actionable P0/P1/P2 mismatch, so no additional visual-fix iteration was required.

## Follow-up polish

- P3: the protected iPhone runtime shows a live white status bar and device frame, while the Figma long frame uses a flat black 9:41 status bar. This difference is intentional and outside app-owned content.

final result: passed

