# Design QA — filter bottom sheet and search v01

## Source and implementation

- source deck: `reports/filter-bottomsheet-v01/reference.pptx`
- source live screenshots: `reports/filter-bottomsheet-v01/source-category.png`, `reports/filter-bottomsheet-v01/source-search.png`
- implementation screenshots: `reports/filter-bottomsheet-v01/implementation-category.png`, `reports/filter-bottomsheet-v01/implementation-search.png`
- same-canvas comparison: `reports/filter-bottomsheet-v01/comparison.png`
- measured values: `reports/filter-bottomsheet-v01/metrics.json`

## Verification context

- viewport: 390×844 CSS px
- density: 1x
- source: `https://xe.chotot.com/mua-ban-oto`
- implementation: `http://127.0.0.1:4173/bobaedream/?qf=guazi`
- states: category bottom sheet / focused empty search / typed search / clear button / search close

## Measured comparison

| item | ChoTot | implementation | result |
|---|---:|---:|---|
| bottom sheet width | 390px | 390px | passed |
| bottom sheet height | 302px | 306px | passed (4px content-language difference) |
| selected pill height | 32px | 32px | passed |
| selected pill radius | 9999px | 9999px | passed |
| selected pill fill | rgb(34,34,34) | rgb(34,34,34) | passed |
| selected pill text | 14px | 14px | passed |

## Visual and behavior findings

- listing remains visible under a 50% black dim layer while the sheet is open.
- sheet is bottom anchored, has rounded top corners, a left close control, centered title, view-all pill, group heading, wrapping pills, and one full-width reset action.
- active category is black; inactive categories use `#f4f4f4`.
- focusing the search field opens suggestions immediately without navigation.
- typed text shows a clear control, up to eight live related terms, category context, and a seller-search row.
- the back control closes search first; selecting a suggestion closes the panel and applies the query to the list.
- no clipping, overlap, or horizontal overflow at 390px.

## Iteration history

1. Initial implementation used the browser default 16px in pills and produced a 356px sheet.
2. Set explicit 14px type, shortened only the in-sheet construction category label, and reduced footer padding.
3. Re-measured at 306px with all key slot values matching ChoTot.
4. Expanded typed-search suggestions to the ChoTot-like eight-row density.

## Final result

passed
