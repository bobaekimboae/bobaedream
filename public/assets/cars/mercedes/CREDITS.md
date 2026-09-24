# Mercedes-Benz Quick Filter Vehicle Assets

Source files already present in this repository:

- `public/assets/cars/mercedes/models/*.png`
- `public/assets/cars/mercedes/a-class/*.png`

2026-09-24 QF-030/QF-033 v5 pass:

- Model-card assets in `public/assets/cars/mercedes/models/card/` were re-output as transparent `192×96` 2:1 card files.
- A-Class generation-card assets in `public/assets/cars/mercedes/a-class/card/` were re-output as transparent `192×96` 2:1 card files.
- Files were regenerated from repository-held transparent vehicle crops; no new external source images were added in this pass.

2026-09-24 QF-036 hotfix:

- Added E-Class generation asset paths `public/assets/cars/mercedes/e-class/w214.webp`, `w213.webp`, and `w212.webp`.
- Generation-specific source photos were not available in the repository, so these are separate 192×96 transparent cards derived from the existing E-Class model crop.
- Generation image source unavailable: `W214`, `W213`, `W212`.

2026-09-24 QF-040 / QF-036 pass:

- `e-class/w214.webp`, `w213.webp`, and `w212.webp` were whitespace-trimmed to the vehicle outline and re-placed on the `192×96` canvas (width fit, bottom aligned) with `scripts/car-image-trim.mjs`. No color or filter changes.
- Generation-specific studio cutouts were not found: Wikimedia Commons only has street/show photos, which asset guide A excludes. Generation image source unavailable: `W214`, `W213`, `W212`.
