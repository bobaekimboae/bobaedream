# Quick Filter Spec

## Shared Rules

- Preserve the depth order: `차량유형 → 제조사 → 모델 → 세대 → 트림`.
- `제조사`, `모델`, and `세대` use the shared `DepthCard` pattern.
- `트림` uses text-only `TrimChip` controls and keeps only the leading `전체` chip.
- No `전체` card appears in the `제조사`, `모델`, or `세대` card rails.
- If a selected model has no generation data, skip to trim when trim data exists. If neither generation nor trim data exists, stay on the current model rail with the model selected.
- In the vehicle picker sheet, show `세대 정보 없음` only after selecting a model with no generation data.

## Depth Card

- Card size: 80×72.
- Rail height: 96 with 12px top and bottom padding.
- Rail label: 13px, vertically centered against the rail.
- Card background: `#F7F8FC`.
- Card radius: 8px.
- Card gap: 8px.
- Selected state: Bobaedream blue tint and border.
- Model and generation image slot: 56×28.
- Vehicle target inside slot: visible width 53–56 and height 24–27.
- Card vertical layout: top 7, image 28, gap 6, name 15, gap 1, second line 13.
- Manufacturer logo slot remains 48×28.
- Manufacturer logos use 28px symbol marks or 44px wordmarks, centered and bottom-aligned.
- In Guazi mode, the `차량유형` depth uses photorealistic transparent vehicle cutouts in the same 56×28 media slot as model cards; do not use category illustration icons there.
- Passenger-car and classic-car type cards use width fit. Truck, motorcycle, and camper type cards use height fit.

## Body Type And EV

- Model and generation card second line is one body-type word only: `세단`, `SUV`, `해치백`, `쿠페`, `컨버터블`, `왜건`, `MPV`, `밴`, or `픽업`.
- BEV cards also show only the body-type word. Do not use `전기 ○○` on the second line.
- BEV model and generation cards show one spark SVG icon only.
- Spark icon: 16×16, `#177245`, no circle or box background, `aria-label="전기차"`, top 4 and left 4.
- `bodyType` and `isEV` data stay available for card text, icon display, and future filtering.
- Do not show the removed model body-type tab row.

## Trim Chips

- Trim chips are immediate-toggle ChoTot-style text pills.
- Height: 32.
- Background: white.
- Border: `#DDE1E7`.
- Text: 14px, weight 400.
- Selected state uses Bobaedream blue.
- Zero-inventory choices are disabled.
- No checkbox, apply button, or vehicle-header replacement appears in the trim rail.

## Summary Chips And Top Rail

- Top chip order: `[필터] [중고차/카테고리] [요약 칩] [트림] [가격] [연식] [주행] [색상]`.
- Show `연식` until generation selection; hide it after generation selection.
- Always show `색상`.
- Vehicle summary chip combines manufacturer, model, and generation.
- Summary chip max width is 220px with ellipsis, while the clear `X` remains visible.
- Clear `X` unwinds the deepest selected level first.
- Tapping the chip label opens the vehicle picker sheet.
- Tapping selected model, generation, or trim chips returns to that depth without changing the selection.

## Vehicle Picker Sheet

- Vehicle picker sheet opens from the merged summary chip.
- Model and generation options wrap to multiple lines.
- Manufacturer options wrap when the list grows beyond one row.
- Sheet height is capped at 80% viewport height with internal vertical scrolling.
- Reset and apply actions stay sticky at the bottom.

## Images And Logos

- Vehicle images and manufacturer marks follow `docs/보배드림_차량이미지_로고_에셋지침_v1.md`.
- Vehicle images should be front-left three-quarter views, white or silver/light-colored, transparent, whitespace-trimmed 2:1 assets at 144×72 or larger.
- Model and generation assets should be 192×96 when available.
- Passenger vehicles use `bodyFit: "width"`.
- Trucks, special vehicles, buses, campers, vans, and motorcycles use `bodyFit: "height"` without changing the active slot size.
- Prefer `public/assets/brand/dongchedi/` brand marks for matched manufacturer rails and picker sheets.
- Keep explicit fallback assets only for brands missing from the workbook, such as `리막` and `루시드`.

## Existing Mode Notes

- Keep ChoTot and Dongchedi modes visually unchanged when working on Guazi-specific changes unless the user explicitly requests a shared change.
- The default top quick-filter row keeps the fixed gray `필터` chip, black pinned `전체` category chip with clear icon, and scrollable conditions beginning `제조사`, `연식`, `가격`.
- The category sheet keeps `중고차` expanded by default with `전체 중고차`, `국산차`, `수입차`, and `전기차` chips; its right arrow toggles only that child row.
