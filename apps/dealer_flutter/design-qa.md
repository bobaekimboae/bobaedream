# Seller inventory design QA

## Evidence

- Source visual truth path: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/be27c08a-6797-45f4-a8ff-dfb9366211f6/1-1000018510.jpg`
- Implementation screenshot path: Codex in-app browser tab 52 capture at `http://127.0.0.1:4300/?screen=inventory` (browser-rendered capture retained in the QA tool evidence; the browser did not expose a filesystem export path).
- Source pixels: 656 × 1280.
- Implementation pixels: 394 × 852 at CSS 394 × 852, device scale factor 1.
- Density normalization: source was visually normalized to the same 394 px content width; the source includes phone/browser chrome while the implementation capture contains the app viewport.
- State: seller inventory, active passenger/SUV listings, list view, no selection.
- Primary interactions tested: `검수 대기` status filtering, list/grid view switching, individual vehicle selection, enabled bulk-management state.
- Console errors checked: no browser console errors or warnings.

## Full-view comparison evidence

The Encar reference and the browser-rendered Flutter implementation were both opened and inspected in this QA pass. The implementation intentionally preserves the reference task hierarchy while reducing the older 3×3 menu density: seller identity and registration action first, four high-value status summaries, category chips, search/view controls, selection, then vehicle cards. At 394 × 852 the primary management tasks remain above the fold and the fixed selection bar does not obscure the visible cards.

The source and implementation were also staged in one browser comparison board. The source rendered correctly; the local Flutter iframe was blocked from rendering by browser framing policy, so the actual implementation was judged from the browser-rendered tab 52 capture already present in the same QA review input rather than from the empty iframe panel.

## Focused region comparison evidence

- Header and summary region: dealer identity, inventory registration, sales/review/inquiry/completed counts form a clear first scan path. The implementation uses stronger hierarchy and less dead space than the reference.
- Search and view controls: search affordance and list/grid toggles are grouped and large enough for touch without displacing inventory content.
- First listing card: status, updated time, image, model, key facts, price, views, inquiries, edit, and management actions remain readable at mobile width. Real inventory imagery replaces the reference placeholder.
- Bulk action region: selection state remains persistent and becomes actionable only after a checkbox is selected.

## Findings

- No actionable P0, P1, or P2 issues remain.
- P3: the company line truncates on narrow screens. This is acceptable because the full dealer/company context is already available on the profile page and preserving a single-line header protects the primary actions.

## Required fidelity surfaces

- Fonts and typography: Korean system sans, compact weights, line heights, wrapping, truncation, and small-label hierarchy are consistent and readable.
- Spacing and layout rhythm: 12–16 px section rhythm, compact cards, aligned control rows, consistent radii, and restrained elevation provide better scanability than the source without losing task density.
- Colors and tokens: neutral white/gray surfaces, black primary actions, green active-sale badges, and muted metadata preserve semantic contrast.
- Image quality and asset fidelity: real test-listing photos are sharp, correctly cropped, and use a camera marker instead of a placeholder vehicle silhouette.
- Copy and content: labels are rewritten for current dealer tasks (`판매중`, `검수 대기`, `구매 문의`, `판매완료`, `정보 수정`, `관리`) and use the linked test inventory.

## Comparison history

1. Initial browser render exposed a 19 px vertical overflow in the list card at 393 × 852.
2. Increased the list-card image/information area from 94 px to 116 px and re-rendered at the same mobile state.
3. Post-fix evidence shows both visible cards contained within their surfaces, no clipped actions, no hidden persistent controls, and no Flutter overflow indicator.
4. Re-tested status filtering, grid switching, item selection, and the bulk-action state after the fix; all states remained functional.

## Implementation checklist

- [x] Seller identity and new-listing action
- [x] High-value status summaries
- [x] Category and status filtering
- [x] Search and list/grid switching
- [x] Real inventory cards and edit/manage actions
- [x] Individual/select-all state and fixed bulk action
- [x] Mobile overflow, widget, analyzer, and console checks

final result: passed
