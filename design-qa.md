# Design QA — BMW model label

- Source visual truth: `C:\Users\sungn\AppData\Local\Temp\codex-clipboard-e4d5e8a0-9b93-4e00-b314-9cd5245ad70a.png` plus the user's explicit label/alignment instruction.
- Browser-rendered implementation: `qa-model-label-full.png`
- Focused implementation region: `qa-model-label-region.png`
- Side-by-side comparison evidence: `qa-model-label-comparison.png`
- Viewport: 1400 × 1200 browser viewport; protected phone screen measured at 393 × 852 CSS px; deviceScaleFactor 1.
- Pixel dimensions: source 1220 × 274 px; full implementation 1400 × 1200 px; focused implementation 393 × 96 px. Focused evidence remains saved at 1:1 density.
- State: BMW selected, model rail visible, no individual BMW model filter selected.

**Full-view evidence**

- The left rail label reads `모델`; the four-complete-plus-fifth-peek card composition is unchanged.
- The label box spans 94 px inside the 96 px row and its measured center equals the row center exactly (`centerDelta: 0`).

**Focused comparison evidence**

- `qa-model-label-comparison.png` places the source and implementation in one comparison input.
- The updated label sits beside the first 3시리즈 card and aligns vertically to the center of the compact model rail.

**Required fidelity surfaces**

- Fonts and typography: `모델` uses the existing Pretendard 12 px semibold treatment and remains legible.
- Spacing and layout rhythm: the label is vertically centered without changing card width, gap, row height, or fifth-card peek.
- Colors and visual tokens: neutral dark text and white rail background remain unchanged.
- Image quality and asset fidelity: all five BMW vehicle images remain centered, sharp, and uncropped.
- Copy and content: the prior `BMW` rail label is replaced exactly with `모델`.

**Interaction checks**

- BMW tap reveals the updated model rail.
- Five model cards remain horizontally draggable and selectable.
- Browser console warnings/errors: none.
- Runtime integrity, production build, and hosting package tests: passed.

**Findings**

- No actionable P0, P1, or P2 mismatch remains.

**Comparison history**

- Earlier state used `BMW` and top-aligned the label with manual padding.
- The label is now `모델`, stretched across the rail height, and centered with flex alignment; post-fix measurement confirms zero vertical-center offset.

**Follow-up polish**

- None required for handoff.

final result: passed