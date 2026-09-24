# Dongchedi Brand Emblems

Source workbook: `동처티_브랜드_및_로고.xlsx`

Original Drive file:
https://docs.google.com/spreadsheets/d/1-hOSO93sjyzicEKCmWIr_2z7sWu75QQC/edit

The workbook contains Korean brand names, Chinese brand names, and 100x100 logo URLs. Downloaded assets are stored as PNG files under this folder and are used for manufacturer rail and sheet brand marks when a matching row exists.

Rows were matched by brand name. `리막` and `루시드` were not present in the workbook at the time of import, so their existing fallback assets remain in code.

2026-09-24 asset-quality pass:

- PNG logo edge alpha was tightened and transparent bounds were trimmed to prevent white/near-white boxes in manufacturer cards.
- `아우디` display now prefers `public/assets/brand/audi.svg` because the Dongchedi wordmark is too small at 44px card width.
- `포르쉐` display now uses the user-provided `public/assets/brand/porsche-symbol.png` per the repository prototype rule.
