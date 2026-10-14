# Dealer Profile Stats Design QA

- Source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/3a9dca73-35c1-44a7-8a83-d97f2702b4f3/1-1000018316.jpg`
- Implementation capture: Codex in-app Browser capture of `http://127.0.0.1:4211/?profile=dealer&shop=450554&emp=1&qf=guazi&v=profile-stats`
- Viewport: 390 × 844 CSS px, device pixel ratio 1
- Source pixels: 591 × 1280; normalized to the 390px implementation width for comparison
- Implementation pixels: 390 × 844
- State: dealer profile, 판매차량 tab, 판매중 mode, not following

## Full-view comparison evidence

The source places a bordered performance summary directly below the seller metadata and keeps the share/follow actions compact. The implementation follows that hierarchy without changing the existing dealer-page header, profile identity, navigation, or listing layout. The two-column box is intentional because the requested metrics are 판매중 and 판매완료.

## Focused region comparison evidence

- Source summary box normalized height: approximately 69px; implementation: 69.6px.
- Implementation summary box width: 348px inside the existing 16px profile gutters.
- Implementation action controls: 공유 84 × 32px, 팔로우 90 × 32px.
- 팔로우 toggled to 팔로잉 successfully and restored.
- 판매완료 (12) tab selected successfully and 판매중 (24) was restored.
- Browser console: no warnings or errors.

## Required fidelity surfaces

- Fonts and typography: Existing Pretendard/system stack retained. Metric labels use 13/18 and values use 19/24 with restrained 600 weight, matching the source hierarchy.
- Spacing and layout rhythm: The 69.6px summary box, centered two-column values, 16px top gap, 10px radius, and 32px action height match the source density while preserving established page gutters.
- Colors and visual tokens: Existing ink, neutral gray, line, and white tokens are reused; no new competing brand color was introduced.
- Image quality and asset fidelity: No image assets were added or approximated for this change. Existing generated showroom header and real dealer portrait remain unchanged.
- Copy and content: 판매중 24 and 판매완료 12 match the page's existing inventory data and listing-mode counts.

## Findings

No actionable P0, P1, or P2 differences remain. The Korean follow label is shorter than the Vietnamese reference label, so the narrower 90px width is an intentional content-fit adaptation rather than a fidelity issue.

## Comparison history

One comparison pass was sufficient. No P0/P1/P2 findings required a repair iteration.

## Follow-up polish

None required for this bounded change.

final result: passed
