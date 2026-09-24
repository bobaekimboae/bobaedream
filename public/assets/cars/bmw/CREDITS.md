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
