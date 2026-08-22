# ChoTot Filter Sample Instruction

## Purpose

Build ChoTot filter parity one filter at a time. The first sample is the vehicle category filter because ChoTot exposes `Xe cộ` before price, condition, and seller filters.

## Source

- Source URL: https://xe.chotot.com/mua-ban-xe-tp-ho-chi-minh
- Observed top filter order: `Lọc` -> `Xe cộ` -> `Giá` -> `Tình trạng` -> `Đăng bởi`
- Observed category rail order: `Ô tô`, `Xe máy`, `Xe tải, xe ben`, `Xe đạp`, `Phương tiện khác`, `Phụ tùng xe`

## Work Loop

1. Open the ChoTot source in a mobile-sized viewport or mirrored phone browser.
2. Capture the base listing with the filter rail visible.
3. Inspect only the next filter in order.
4. Record the entry type, option order, selected state, reset behavior, and list result.
5. Implement only that confirmed filter in the GitHub prototype.
6. Verify the prototype by clicking the same filter and selecting at least one option.
7. Fix spacing, chip order, icons, and list result before moving to the next filter.

## Sample Mapping

| ChoTot text | Korean prototype text | Prototype behavior |
| --- | --- | --- |
| Xe cộ | 차량 카테고리 | First filter chip |
| Ô tô | 자동차 | Shows current car inventory |
| Xe máy | 오토바이 | Shows empty state until sample motorcycle data exists |
| Xe tải, xe ben | 화물차/덤프 | Shows empty state until sample truck data exists |
| Xe đạp | 자전거 | Shows empty state until sample bicycle data exists |
| Phương tiện khác | 기타 이동수단 | Shows empty state until matching sample data exists |
| Phụ tùng xe | 차량 부품 | Shows empty state until sample parts data exists |

## Icon Rule

- Use only icons registered in the user's Notion database or files already downloaded from that Notion source.
- Current local Notion-derived icon files are in `public/assets/ui/` and include `notion-filter.svg`, `notion-list.svg`, `notion-search.svg`, `notion-chevron-right.svg`, and `notion-close.svg`.
- Do not draw new vehicle SVGs manually.
- If a required vehicle-category SVG is not available in Notion, record the gap and keep the prototype using the closest already-registered Notion UI icon until the source icon is added.

## Sample Done Criteria

- `차량 카테고리` is the first individual filter after `필터`.
- The visible category rail replaces the previous manufacturer-logo rail.
- Category options use the ChoTot order translated into Korean.
- Selecting `자동차` keeps the current 15 listing sample visible.
- Selecting a non-car category changes the listing result to the empty state.
- The full filter sheet also lists `차량 카테고리` before `가격`.
