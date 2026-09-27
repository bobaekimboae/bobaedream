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
- Guazi (QF-097 보완, PR #88): model order = numeric current models → Latin → 가나다 → numeric old models (no sub-model with `~현재`, e.g. 벤츠 190·280) → `기타`. One count basis = on-screen sample listings (all filters except model/sub-model/trim): quick-filter model/sub-model cards appear only with ≥1 listing; the left filter, model chip modal/sheet and vehicle picker list every catalog model/sub-model including 0 (0 is greyed/disabled). Each listing links to one catalog model (longest model name at the start of the title after the maker, or modelGroup). Top chips are per step: `[벤츠 ×][E클래스 ×][W213 ×]`; each `×` clears that step and below; empty `제조사`/`모델` chips hide once chosen; breadcrumb/title still join the step names. The sub-model rail label is `세부모델`. Missing bobaedream images (no extension) are listed in `reports/qf-097/missing-images.csv`.
- Guazi (QF-096): maker rail, PC left filter maker list and maker chip modal/sheet use `public/assets/brand/kr/{slug}.png` (manifest.json, CREDITS.md; regenerate with `node scripts/brand-logos-kr.mjs`). Names follow the left filter labels (`bbCatalog`); aliases live in `bbm-brand-logos.tsx`. Logo size by ratio r (trimmed width÷height), design v1 (restored in QF-096 보완 3; the earlier 72-wide balance, 56×26 frame, 36×36 canvas and 64-wide wordmark rules are cancelled): rail box 48×28 at card top 8, centered; r ≤ 1.25 → width = min(44, 28·r), height = min(28, width÷r); r > 1.25 → width = min(44, 28·√r), height = width÷r; every logo stays inside the box. List box 24×24 (left filter, drawer, chip modal, mobile maker sheet, vehicle picker), logo contained and centered, name gap 8, row 39.6. Debug: with `&debug=1`, the `로고 칸 안내선` checkbox next to the build badge outlines the 48×28 / 56×28 / 24×24 boxes (outline only, remembered in localStorage) and puts an 8px red dot on any box whose logo/image overflows. Rail order = left filter (domestic → 1×44 #E4E7EC divider → popular imports → remaining imports by name), no label, zero-count and 기타 makers hidden. Check: `npm run check:logos`.
- Guazi (QF-100, preview only): `&qfcard=plain` switches the maker/model/sub-model rails to a ChoTot-style plain look (`.marketplace.is-qf-plain`, `src/prototype/listing/qf-plain.css`); without it the default Guazi cards are unchanged. ChoTot brand-row measurements (2026-09-27): PC cell 84×102, pitch 92, logo box 40×40 at top 6, name 14/21 400 #595959 14 below; mobile cell 64×74, pitch 72, box 36×36 at top 0, name 12/18 500 #595959 2 below; no background/border/selected state, pressed opacity 0.6 for 0.1s. Logo inside box: emblem (r ≤ 1.25) long side 82%, wide logos width 100%, centered. Rail gap below the chip row PC 16 · mobile 10; mobile first cell 4px left of the first chip. Model/sub-model rails use the same cell width/pitch with the 56×28 image slot (top 6 PC · 0 mobile), name PC 14/21 600 #222 · mobile 12/18 600 #222 8 below, sub text 12px (mobile 11px) 400 #8C8C8C; model cards show the listing count. Measurements: `reports/qf-100/chotot-measure.md`.
- Guazi (QF-100 final): the plain ChoTot-style rails are the Guazi default (no parameter or `&qfcard=plain`); `&qfcard=card` shows the previous Guazi cards for comparison. Gap from the chip row to the maker/model/sub-model rail is PC 18 · mobile 14 (ChoTot's filter-chip row → region-chip row); if a region-chip row is added later, that row → maker rail is PC 16 · mobile 10. Model card second line is the body type in both looks (no listing count); sub-model second line stays the years.
- Guazi (QF-105): the trim rail is a ChoTot pill row in every Guazi look (`.marketplace.is-qf-guazi`, `src/prototype/listing/qf-trim.css`): white, 1px #DDDDDD, height 32, fully rounded, 16 side padding, 14px 400 #222, 8 gap, horizontal scroll, pressed opacity 0.6; no leading `전체` chip and no selected style. Start with all trims; pressing a pill applies that one trim at once, adds a black step chip after the sub-model chip (`[벤츠][C클래스][W206][C200 ×]`), closes the rail, and appends the trim to the title and breadcrumb; its × clears only the trim and reopens the rail. A sub-model with one trim shows no trim rail. Trim rail box = pill 32 (PC: chip row → pill 18, pill → top-card end 16; mobile: 2 above, 6 below). Rail labels (`모델` `세부모델` `트림`) are 14px 400 #595959 without colon, text left = first chip left (PC 140 at 1440, mobile 16), 12 to the first cell/pill, vertically centered on the cells. The left filter grade list keeps multi-select.
- Guazi (QF-103): rail vertical spacing follows ChoTot (plain and card; `src/prototype/listing/qf-rail-vertical.css`). PC: the maker/model/sub-model rail box equals the cell height (maker 102, model/sub-model their cell height; card 72), no overflow, chip row → cell 18, cell bottom → top-card end 16; the 110 quick slot shrinks to the rail and disappears when no rail is shown (trim chosen), so chip row → top-card end is 16. Mobile: rail box = 2 above + cells + 6 below (chip row → cell 12). Horizontal scrollbars are hidden. Check: `npm run check:rail-vertical` (`-- --mode=card` for the card look).

## Stable Top (QF-106)

- Guazi PC·mobile top structure follows `docs/stable-top-manual.md` v1.1 (layer tables, gaps, cell sizes, state table). `npm run check:stability` values must match that document; it replaces `check:rail-vertical` (QF-103 rules kept: rail box = cell height, no overflow, hidden scrollbars).
- Title is fixed by the entry category: `중고차` / `국산 중고차` / `수입 중고차` (no counts, dates, or chosen conditions). `<title>` is unchanged.
- PC card: ① crumbs 18 → 11 → title row 32 → 18 → ② chip row 32 → 18 → ③ region pill row 32 (always; `지역:` + regions + `내 주변`; single select, re-click clears) → 16 → ④ quick slot (always) → card end 16 (image row) / 24 (pill row). Only two card heights.
- Mobile: ① search 40 (top 10) → 8 → ② `지역: 전국 ▾` 32 (no region pill row; chosen region shows as `[서울 ×]` chip) → 10 → ③ chips 32 gap 4 → 14 → ④ slot (2 + cell + 6; first cell/label x = first chip − 4) → ⑤ 8px gray band, crumbs, title, related keyword pills 28.
- ④ never closes: maker → model → sub-model → trim pills (skipped when none) → year pills (`2026`…`2019`·`이전`, re-click clears, row stays). Labels `모델:` `세부모델:` `트림:` `연식:`. Guazi region/trim/year pills: 32 tall, 1px `#DADADA`, 14/20 500, selected `#222` (overrides the Trim Chips border/weight above for guazi). Model/sub-model cells keep a fixed height (PC 102 / mobile 74) with one-line name and sub text. `필터 초기화` returns to state 1 keeping the entry category.
- Debug (`&debug=1`): `로고·이미지 칸` (red, replaces `로고 칸 안내선`), `층 상자` (blue dashed + layer numbers), `간격 숫자` (green = manual, red = differs); violations get an 8px red dot + short reason. Overlay only, remembered in localStorage.

## Existing Mode Notes

- Keep ChoTot and Dongchedi modes visually unchanged when working on Guazi-specific changes unless the user explicitly requests a shared change.
- The default top quick-filter row keeps the fixed gray `필터` chip, black pinned `전체` category chip with clear icon, and scrollable conditions beginning `제조사`, `연식`, `가격`.
- The category sheet keeps `중고차` expanded by default with `전체 중고차`, `국산차`, `수입차`, and `전기차` chips; its right arrow toggles only that child row.
