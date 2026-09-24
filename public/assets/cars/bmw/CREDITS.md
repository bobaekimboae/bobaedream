# BMW Quick Filter Vehicle Assets

Source files already present in this repository:

- `public/assets/cars/bmw/1-series.webp`
- `public/assets/cars/bmw/3-series.webp`
- `public/assets/cars/bmw/5-series.webp`
- `public/assets/cars/bmw/x1.webp`
- `public/assets/cars/bmw/x3.webp`

2026-09-24 asset-quality pass:

- Model cards in `public/assets/cars/bmw/card/` were regenerated as transparent `192×96` 2:1 assets for the 과쯔 48×24 depth-card slot.
- `1-series` and `x1` were rebuilt from the existing transparent card crops with direction normalized to front-left.
- `3-series`, `5-series`, and `x3` were rebuilt from the repository source images with edge background removal and silver studio-card toning.
- BMW 3 Series generation files were added under `public/assets/cars/bmw/3-series/`.
- Exact generation-specific external source images were not available in the repository; `g20.webp`, `f30.webp`, and `e90.webp` are separate transparent crops derived from the existing 3 Series repository source so the UI no longer reuses one identical file for all generations.

2026-09-24 QF-026/QF-033 v5 pass:

- `3-series`, `5-series`, and `x3` model cards plus BMW 3 Series `g20`, `f30`, and `e90` generation cards were retuned from dark gray/black toward white/silver studio-card presentation.
- The affected card assets remain transparent `192×96` 2:1 files for the updated 56×28 model/generation slot.
- `x1` was intentionally left unchanged per the v5 instruction.

2026-09-24 QF-026 hotfix:

- The v5 white/silver retuning created visible blotches/noise, so the affected BMW cards were rebuilt from the original repository color images without vehicle color conversion.
- Background cleanup and 192×96 transparent canvas placement were applied, but no white/silver vehicle color filter was used.
- White/silver original source unavailable: `3-series`, `5-series`, `x3`, `3-series/g20`, `3-series/f30`, `3-series/e90`.
- `x1` remains unchanged.

2026-09-24 QF-040 trim pass:

- `card/3-series.png`, `card/5-series.png`, `card/x3.png`, `3-series/g20.webp`, `3-series/f30.webp`, and `3-series/e90.webp` were whitespace-trimmed to the vehicle outline and re-placed on the `192×96` canvas (width fit, bottom aligned) with `scripts/car-image-trim.mjs`. No color or filter changes.
- `3-series/g20.webp`, `f30.webp`, and `e90.webp` still show the same G20 vehicle; generation-specific photos remain unavailable.
