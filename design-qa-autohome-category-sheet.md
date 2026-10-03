# Design QA — Autohome manufacturer sheet

- Source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/b378750e-2b15-4e7f-bdfe-ebea81412f23/1-1000015016.jpg`
- Browser-rendered implementation: `reports/autohome-category-sheet.png`
- Direct preview state: `?qf=guazi&brandlogo=autohome&preview=maker-sheet`
- Focused comparison: `reports/autohome-category-sheet-compare.png`
- Source pixels: 591×1280, estimated 393 CSS px at about 1.5× density including mobile browser chrome.
- Implementation capture: 1280×720 CSS px at 1× density in the Codex in-app browser.
- State: mobile full filter open, then nested category-style bottom sheet; source content is vehicle categories, implementation content is the requested Autohome manufacturer-logo test.

**Findings**

- No actionable P0/P1/P2 mismatch in the requested component structure.
- Fonts and typography: both use the existing Pretendard filter-sheet hierarchy; centered 16px/600 title and 14px/500 slot labels are preserved.
- Spacing and layout rhythm: the implementation reuses the category sheet header, horizontal 60px slot rhythm, dimmed full-filter background, and fixed reset/result action area.
- Colors and visual tokens: white sheet, gray divider/dim, black close control, outlined reset, and dark result button use the existing category-sheet tokens.
- Image quality and asset fidelity: all ten visible marks use the normalized Autohome raster assets with contain sizing; no placeholder or CSS-drawn brand mark is used.
- Copy and content: the shared structure is retained while the title and items intentionally change from `카테고리` vehicle types to `제조사` and the ten test brands.

**Full-view comparison evidence**

- Both states show the full filter behind a dim layer and a rounded bottom sheet anchored above the safe-area action row.
- The implementation preserves the same header/content/footer ordering and horizontal scrolling behavior.

**Focused region comparison evidence**

- `reports/autohome-category-sheet-compare.png` compares the source and implementation sheet regions together.
- The different desktop capture width changes how many slots fit on screen, but slot size, vertical rhythm, title line, and action-row structure remain the same fixed CSS metrics used by the existing category sheet.

**Primary interactions tested**

- Open full filter.
- Open `제조사 · 모델` from the full filter.
- Select `현대` as a temporary manufacturer.
- Confirm with the result button and verify `maker=현대` in the URL.
- Close/reset paths remain available.

**Console/build checks**

- `npm run verify:qf` passed after implementation.
- No browser-visible runtime error occurred during open, select, and apply checks.

**Comparison history**

- Initial pass: KGM used its shortened display label as the lookup key, leaving the logo slot empty (P2).
- Fix: preserve the full catalog name as `logoName` while keeping the short visible label.
- Post-fix evidence: final browser capture shows all ten logo slots populated, including KGM.

**Implementation Checklist**

- [x] Reuse the category bottom-sheet shell.
- [x] Keep the existing advanced list UI unchanged.
- [x] Limit the new route to `brandlogo=autohome`.
- [x] Render ten normalized Autohome logos in the category slot rhythm.
- [x] Preserve reset, apply, close, and temporary selection behavior.

**Follow-up Polish**

- P3: perform one additional physical-device capture at 393 CSS px if exact screenshot-to-screenshot density comparison is needed.

final result: passed
