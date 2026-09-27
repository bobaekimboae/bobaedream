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
- Rail height: 96 with 12px top and bottom padding. The 1px bottom divider is drawn just outside the rail (`box-shadow`) so it does not reduce the bottom padding.
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
- Guazi (dev-draft baseline, QF-091·QF-089): top chips follow the bbmuseum original. Before a manufacturer: `[필터] [전체차량] [applied chips] [제조사] [연식] [가격] [연료] [판매자]`; after: `[필터] [전체차량] [요약 칩] [모델 until a model is chosen] [트림] [applied chips] [연식] [가격] [연료] [판매자]`. Group chips with a value leave the row. The summary chip keeps its 220px max width, clear, and depth-return behavior.
- Guazi (QF-091): the category landing shows the original circular vehicle-type row instead of the depth-0 type cards. Choosing a type swaps the same slot to the quick-filter rail from the manufacturer step; clearing the category chip brings the type row back. Rail, DepthCard, and trim chip specs are unchanged.
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
- Guazi (QF-097): for 벤츠·BMW·현대·기아·포르쉐·페라리·람보르기니·벤틀리·롤스로이스, models and sub-models come from the bbmuseum catalog snapshot `src/prototype/data/model-catalog-kr.json` (re-fetch `node scripts/model-catalog-kr.mjs`, then `node scripts/model-images-kr.mjs`); the screen never calls the API. Only models/sub-models with listings (count > 0) appear. Model order: numbers → Latin → 가나다, `기타` last, 벤츠 `A클래스` sorted as `A-클래스`. Names are cut at the bracket. Model card image = most-listed sub-model with an image. Sub-model cards newest first; big text = chassis code (+` HEV` for hybrids) → N세대 → year, or the sub-model name when every code in the model is the same (포르쉐 718); small text = facelift words·years (`디 올 뉴·22~현재`). Images `public/assets/models/kr/{maker_id}/{value}.png` (bobaedream image_url → 당근 code/generation/single match → none = dashed 56×28 slot); width 56, height-fit when the slot would overflow, bottom-aligned. Left filter model/grade, model chip modal/sheet and the vehicle picker sheet use the same data. Check: `npm run check:models`.
- Guazi (QF-096): maker rail, PC left filter maker list and maker chip modal/sheet use `public/assets/brand/kr/{slug}.png` (manifest.json, CREDITS.md; regenerate with `node scripts/brand-logos-kr.mjs`). Names follow the left filter labels (`bbCatalog`); aliases live in `bbm-brand-logos.tsx`. Logo size by ratio r (trimmed width÷height), balanced height (QF-096 보완 3): rail height = min(28, 24·r^-0.35), width = height·r, capped at width 72 (then height = 72÷r); list box 32×24 with height = min(22, 18·r^-0.35), capped at width 32. Rail order = left filter (domestic → 1×44 #E4E7EC divider → popular imports → remaining imports by name), no label, zero-count and 기타 makers hidden. Check: `npm run check:logos`.

## Existing Mode Notes

- Keep ChoTot and Dongchedi modes visually unchanged when working on Guazi-specific changes unless the user explicitly requests a shared change.
- The default top quick-filter row keeps the fixed gray `필터` chip, black pinned `전체` category chip with clear icon, and scrollable conditions beginning `제조사`, `연식`, `가격`.
- The category sheet keeps `중고차` expanded by default with `전체 중고차`, `국산차`, `수입차`, and `전기차` chips; its right arrow toggles only that child row.
