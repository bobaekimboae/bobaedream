# Oldcar quick-rail design QA

- Source visual truth: `C:\Users\bobae\OneDrive\문서\ChatGPT\퀵필터 제작\.codex-remote-attachments\01a0f512-065a-7300-9ce1-d86601ce6384\13a5e76d-95eb-407f-895b-4f1ed02f3202\1-1000017904.jpg`
- Implementation: `http://127.0.0.1:4210/?qf=guazi&category=%EC%98%AC%EB%93%9C%EC%B9%B4&view=feed`
- Implementation evidence: Codex in-app browser capture, focused clip `x=0, y=260, 412×150`
- Viewport: 390×844 and 412×915 CSS px
- Source pixels: 591×1280; normalized against the user's 412dp device width (about 1.434 source px per CSS px)
- Implementation pixels: browser capture at DPR 1, 412 CSS px wide
- State: 올드카, 제조사 미선택, 연대 미선택, 초톳 퀵필터

## Full-view comparison

The change is intentionally scoped to the oldcar manufacturer rail, so the full page composition was checked only for regression. The hero, filter chips, decade rail, toolbar, and listings retain their existing geometry. There is no page-level horizontal overflow.

## Focused-region comparison

The source category rail and the implementation oldcar manufacturer rail were compared at the same 412 CSS-pixel width. The shared vertical stack now matches the measured source rule:

| Surface | Target | Implementation | Result |
| --- | ---: | ---: | --- |
| Logo slot | 40×40 | 40×40 | passed |
| Slot bottom → label line box | 8 | 8 | passed |
| Label type | 14/20, 400 | 14/20, 400 | passed |
| Label color | #595959 | #595959 | passed |
| Label width | 68 | 68 | passed |
| Two-line capacity | max 2 lines | max 2 lines | passed |
| First label top across cards | one baseline | y=354 for first 6 cards | passed |

## Required fidelity surfaces

- Fonts and typography: 14px size, 20px line height, weight 400, two-line clamp. Passed.
- Spacing and layout rhythm: 40px mark slot and exact 8px label gap; first-line baseline is identical across visible brands. Passed.
- Colors and visual tokens: label `#595959`; existing white rail background preserved. Passed.
- Image quality and asset fidelity: existing manufacturer logo assets are unchanged; broken images 0. Passed.
- Copy and content: manufacturer names are unchanged and the removed redundant `올드카` second label remains absent. Passed.

## Interaction and runtime checks

- `npm run verify:qf`: passed.
- Console errors: 0.
- Broken images: 0.
- Horizontal viewport overflow: none.
- The rail remains horizontally scrollable and manufacturer buttons retain their existing actions.

## Comparison history

1. Before: the oldcar maker labels inherited a 14px logo-to-label gap and 21px line height.
2. Fix: scoped the oldcar rail to a 40px mark slot, 8px gap, and 14/20/400 two-line label stack.
3. After: measured gap is 8px at both 390 and 412 widths; visible first-line baselines are identical.

## Findings

No actionable P0/P1/P2 mismatch remains within the requested oldcar sample scope.

final result: passed
