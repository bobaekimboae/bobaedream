# ChoTot Filter Sample Instruction

## Purpose

Build ChoTot filter parity one filter at a time. The first sample is the vehicle category filter because ChoTot exposes `Xe cộ` before price, condition, and seller filters.

## Source

- Source URL: https://xe.chotot.com/mua-ban-xe-tp-ho-chi-minh
- Observed top filter order: `Lọc` -> `Xe cộ` -> `Giá` -> `Tình trạng` -> `Đăng bởi`
- Observed category rail order: `Ô tô`, `Xe máy`, `Xe tải, xe ben`, `Xe đạp`, `Phương tiện khác`, `Phụ tùng xe`
- Primary source screenshots for the category system:
  - `C:/Users/bobae/Downloads/Screenshot_20260822_173326_Ch Tt.png`
  - `C:/Users/bobae/Downloads/Screenshot_20260822_173330_Ch Tt.png`
  - `C:/Users/bobae/Downloads/Screenshot_20260822_173345_Ch Tt.png`
- Airbnb visual reference folder: https://drive.google.com/drive/u/0/folders/1KGBPNTyCjgaCU50m-5RfrUGFkw-QdvdJ
- Current category-system direction: follow ChoTot's original category sheet typography, row rhythm, chip style, and category-depth behavior. Do not use the previous Airbnb-style category grid for the category sheet. Airbnb is only relevant to the black bottom CTA treatment.

## Vehicle Category Source Analysis

ChoTot has two related vehicle category surfaces:

1. `Tất cả danh mục` full category sheet.
   - Near-full-height white sheet over a dark overlay.
   - Top corners are rounded; content starts below the Android status area.
   - Header uses a left close icon, centered title, and a bottom divider.
   - Collapsed rows use icon + large category title + right chevron.
   - The expanded `Xe cộ` row uses a down chevron and exposes rounded child chips underneath it.
2. Filtered listing state after selecting a child category.
   - The selected category becomes the active black filter chip, e.g. `Xe máy`.
   - The search placeholder also changes to the selected child category, e.g. `Xe máy`.
   - The quick brand rail below the filter chips changes to the selected category's brand set, e.g. Honda, Yamaha, Suzuki, Piaggio for motorcycles.
   - The listing metadata and available filters become category-specific.

Screenshot scale note:
- Source screenshots are `1080 x 2340`.
- Treat them as a 393px-wide mobile design reference. Approximate conversion: `2.75 source px = 1 CSS px`.

## Vehicle Category Sheet Typography And Spacing

Use ChoTot's original typography and spacing as the benchmark:

- Sheet top: rounded near-full-height bottom sheet; do not use a small detached modal.
- Overlay: dark translucent background behind the sheet.
- Header height: about `80-84px` CSS including top breathing room and bottom divider.
- Header title: centered, `20px`, bold `700`, line-height about `28px`.
- Close icon: left aligned, visual size about `28px`, tap target about `44px`.
- Parent category row:
  - Row height about `50-56px`.
  - Left padding about `16-18px`.
  - Icon column about `32px`, icon visual size `22-26px`.
  - Text starts about `52-56px` from left sheet edge.
  - Category title font `18px`, line-height `26px`, weight `400-500`.
  - Right chevron visual size about `20-22px`.
  - Divider is `1px`, light gray, inset after the left icon column.
- Expanded vehicle section:
  - Parent row keeps the same row rhythm and uses a down chevron.
  - Child chip area uses two wrapped rows when needed.
  - Chip height about `40px`.
  - Chip radius pill-style, about `18-20px`.
  - Chip horizontal padding about `14-18px`.
  - Chip gap about `8px` horizontal and `10-12px` vertical.
  - Chip text font `16px`, line-height about `22px`, weight `400-500`.
  - Chip background `#f1f1f1`-like light gray; selected/active chip follows ChoTot black chip pattern when shown in the filter rail, not a checkmark inside the sheet.
- Bottom CTA:
  - ChoTot uses yellow in the source, but Bobaedream must use black.
  - Button height about `52px`.
  - Button radius about `6-8px`.
  - CTA label font about `16px`, weight `700`.
  - Bottom action stays fixed while the category list scrolls.
  - CTA copy should be Korean: `검색하기` or `{count}대 결과 보기`, depending on the current prototype surface.

Do not add:
- Check icons inside category choices.
- Two-column icon cards.
- Large rounded category tiles.
- Decorative icon grids.
- Extra explanatory text inside the app UI.

## Work Loop

1. Open the ChoTot source in a mobile-sized viewport or mirrored phone browser.
2. Capture the base listing with the filter rail visible.
3. Inspect only the next filter in order.
4. Record the entry type, option order, selected state, reset behavior, and list result.
5. Implement only that confirmed filter in the GitHub prototype.
6. Verify the prototype by clicking the same filter and selecting at least one option.
7. Fix spacing, chip order, icons, and list result before moving to the next filter.

## Sample Mapping

| ChoTot text / source | Korean prototype text | Prototype behavior |
| --- | --- | --- |
| Tất cả danh mục | 전체 카테고리 | Full category sheet title in ChoTot; Bobaedream sheet title can be `차량 카테고리` when opened from the vehicle filter chip |
| Xe cộ | 차량 | Parent row for every vehicle-related category |
| Tất cả xe cộ | 전체 | Shows every vehicle-related listing group |
| Ô tô | 중고차 | Shows passenger used-car inventory |
| Bobaedream taxonomy | 국산차 | Child of `중고차`; shows domestic passenger used cars |
| Bobaedream taxonomy | 수입차 | Child of `중고차`; shows imported passenger used cars |
| Bobaedream taxonomy | 전기차 | Quick child of `중고차`; internally maps to `중고차 + 연료/동력=전기` |
| Xe tải, xe ben | 화물 · 특장 · 버스 | Separate vehicle group; update downstream filters to truck/specialty/bus rules |
| Xe máy | 바이크 | Separate vehicle group; update downstream filters to motorcycle rules |
| Bobaedream taxonomy | 캠핑카 | Separate vehicle group |
| Bobaedream taxonomy | 올드카 | Separate vehicle group |
| Bobaedream taxonomy | 건설기계 | Separate vehicle group |
| Phụ tùng xe | 부품 · 용품 | Separate vehicle group |

Do not include `하이브리드` in the vehicle category sheet. Hybrid belongs in the fuel/powertrain filter, not the vehicle category taxonomy.

## Recommended Bobaedream Vehicle Category IA

The category state must distinguish `전체` from `중고차`.

```text
차량 카테고리

차량
[전체] [중고차] [국산차] [수입차]
[전기차] [화물 · 특장 · 버스]
[바이크] [캠핑카] [올드카]
[건설기계] [부품 · 용품]
```

State meaning:

- `전체`: no vehicle-group restriction; include all vehicle-related categories.
- `중고차`: passenger used cars only; includes domestic, imported, and electric passenger used cars.
- `국산차`: passenger used cars where maker origin is domestic.
- `수입차`: passenger used cars where maker origin is imported.
- `전기차`: passenger used cars where powertrain is electric. This is a quick entry, not a separate database category.
- `화물 · 특장 · 버스`, `바이크`, `캠핑카`, `올드카`, `건설기계`, `부품 · 용품`: peer vehicle groups outside passenger used cars.

After selecting a category, downstream UI must change like ChoTot:

- Active top chip label becomes the selected category.
- Search placeholder becomes the selected category when appropriate.
- Brand rail changes to category-specific brands.
- Filter chips change to category-specific filters.
- Listing data changes only after applying through the bottom CTA when inside a sheet.

## Icon Rule

- Use only icons registered in the user's Notion database or files already downloaded from that Notion source.
- Current local Notion-derived icon files are in `public/assets/ui/` and include `notion-filter.svg`, `notion-list.svg`, `notion-search.svg`, `notion-chevron-right.svg`, and `notion-close.svg`.
- Do not draw new vehicle SVGs manually.
- If a required vehicle-category SVG is not available in Notion, record the gap and keep the prototype using the closest already-registered Notion UI icon until the source icon is added.

## Sample Done Criteria

- `차량 카테고리` is the first individual filter after `필터`.
- The category sheet follows ChoTot's original parent-row and child-chip structure.
- Category options use the Bobaedream vehicle taxonomy while preserving ChoTot's `vehicle parent + child chips` pattern.
- The sheet must not show checkmarks, icon cards, or a two-column category grid.
- Selecting `중고차` keeps the current 15 listing sample visible.
- Selecting a non-used-car category changes the listing result according to category-specific sample data; until data exists, it may show the empty state.
- The full filter sheet also lists `차량 카테고리` before `가격`.
- The bottom CTA is black, not ChoTot yellow.
