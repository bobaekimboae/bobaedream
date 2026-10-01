# Design QA — 모바일 필터칩 내부 여백

## Comparison target

- Source visual truth: live ChoTot mobile filter row, `https://xe.chotot.com/mua-ban-oto`.
- Implementation: `http://127.0.0.1:5173/?qf=guazi&scenario=luxury30&titlepos=after-model`.
- Viewport: both captures at 384 × 832 CSS px.
- Compared state: light theme, top filter row visible, one selected category chip.

## Measured result

| Surface | ChoTot reference | Bobaedream after fix | Result |
|---|---:|---:|---|
| Row left/right screen margin | 16 / 16px | 16 / 16px | match |
| Chip height | 32px | 32px | match |
| Normal chip inline padding | 12 / 12px | 12 / 12px | match |
| Selected chip inline padding | 12 / 12px | 12 / 12px | match |
| Fixed filter chip inline padding | 12 / 12px | 12 / 12px | match |
| Internal icon/text or text/control gap | 2px | 2px | match |
| Fixed filter chip width | reference is content-sized | 92px | intentionally retained |

## Fidelity surfaces

- Layout and spacing: the Guazi mobile row keeps its existing 16px outer margin, 32px height, and 92px fixed filter control; only the asymmetric inner spacing was corrected.
- Typography: unchanged.
- Color and elevation: unchanged.
- Images and icons: the selected three-control filter SVG is unchanged and remains centered.
- Content and responsive behavior: chip labels, ordering, selected state, and horizontal scrolling behavior are unchanged; the 384px page has no horizontal document overflow.

## Interaction verification

- Filter dialog opens from the fixed filter chip and closes through its close button.
- Dialog count changes from 0 → 1 → 0.
- Browser console errors: none.
- Document horizontal overflow at 384px: 0px.

## Verification

- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.
- P0/P1/P2 fidelity findings: none.

final result: passed
