# Design QA — 초톳 피드형 대조

## Comparison target

- Source visual truth: the supplied Notion page (`초톳 피드 모바일웹`, `모바일앱`) and live ChoTot mobile listing at `https://xe.chotot.com/mua-ban-oto`.
- Implementation: `http://127.0.0.1:5173/?qf=guazi&scenario=luxury30&titlepos=after-model&view=feed`.
- Viewport: 384 × 832 CSS px.
- Intentional Bobaedream addition: one 13/18 listing headline row between the trim and specification. No other information row was added.

## Captured steps

1. **첫 강조 카드 — 양호**
   - [초톳 원본](reports/feed-crosscheck-20261002/01-chotot-featured.jpg)
   - [보배드림 수정본](reports/feed-crosscheck-20261002/02-boba-featured.jpg)
   - 한 장만 강조되는 계층, 16/24 제목, 약 7:5 미디어 비율이 일치한다.
2. **후속 가로형 카드 — 양호**
   - [초톳 원본](reports/feed-crosscheck-20261002/03-chotot-following.jpg)
   - [보배드림 수정본](reports/feed-crosscheck-20261002/04-boba-following.jpg)
   - 120×120px 썸네일, 12px 이미지·텍스트 간격, 16/20 제목이 일치한다.

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

## Visible differences and limits

- The ChoTot featured card has a multi-image gallery and contact/chat actions. The test dataset supplies one approved vehicle image per listing, and the Bobaedream scenario intentionally keeps its existing seller/favorite actions, so those content assets are not duplicated or fabricated.
- ChoTot uses a red price accent while the Bobaedream design keeps its established dark price color. This audit matched hierarchy, measurements, and text rhythm rather than copying ChoTot branding.
- The Bobaedream headline is the only new information row. In following cards it produces an approximately 6px taller rendered card after the rest of the text rhythm is compacted.
- Screenshot review confirms visible layout and target placement only; keyboard order and screen-reader announcements still require interaction testing.

## Verification

- 384px browser computed-style measurement: passed.
- Visual check of first featured card and three following horizontal cards: passed.
- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.
- Browser console errors: none observed.

final result: passed
