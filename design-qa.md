# Design QA — 초톳 피드형 대조

## Comparison target

- Source visual truth: the supplied Notion page (`초톳 피드 모바일웹`, `모바일앱`) and live ChoTot mobile listing at `https://xe.chotot.com/mua-ban-oto`.
- Implementation: `http://127.0.0.1:5173/?qf=guazi&scenario=luxury30&titlepos=after-model&view=feed`.
- Viewport: 384 × 832 CSS px.
- Intentional Bobaedream addition: one 13/18 listing headline row between the trim and specification. No other information row was added.

## Measured result

| Surface | ChoTot reference | Bobaedream after fix | Result |
|---|---:|---:|---|
| Feed hierarchy | first card featured; following cards horizontal | first card featured; following cards horizontal | match |
| Featured media area | about 348×248px | 352×251px | proportional match |
| Featured media corner | compact corner | 8px | matches approved Boba/ChoTot reference |
| Featured title | 16px / 24px / 600 | 16px / 24px / 600 | match |
| Following thumbnail | 120×120px | 120×120px | match |
| Following image/text gap | 12px | 12px | match |
| Following title | 16px / 20px / 600 | 16px / 20px / 600 | match |
| Following card height | about 201px | about 207px | +6px with Boba content |
| Added listing headline | none | 13px / 18px / 500 | intentional |

## Fidelity surfaces

- Layout: the previous implementation repeated a full-width image card for every result. The corrected implementation promotes only the first result and returns every later result to the measured image-left/content-right layout.
- Typography: featured and following-card titles now retain the separate ChoTot measurements rather than sharing one feed rule.
- Images: featured media keeps the source-like wide frame; following thumbnails use a 120px square with cover cropping. Existing vehicle images and crop positions are unchanged.
- Content: manufacturer/model and detail model stay in their existing positions. The UI-test headline remains directly below them and above the specification as the sole added content row.
- Interaction: view switching, card opening, favorite controls, seller tabs, pagination, and the fixed bottom navigation are unchanged.

## Verification

- 384px browser computed-style measurement: passed.
- Visual check of first featured card and three following horizontal cards: passed.
- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.
- Browser console errors: none observed.

final result: passed
