# Design QA

**Source visual truth**

- Figma node: `1412:158566` in file `bXm6a9oU2IlKcjv9xEum3l`
- Local capture: `C:\Users\sungn\Documents\Codex\2026-08-21\github-plugin-github-openai-curated-remote\work\qa\figma-reference.png`
- Source pixels: 412 × 1239, normalized to 393 px wide for comparison

**Implementation evidence**

- Local URL: `http://localhost:4173/`
- Screenshot: `C:\Users\sungn\Documents\Codex\2026-08-21\github-plugin-github-openai-curated-remote\work\qa\implementation-final.png`
- Side-by-side comparison: `C:\Users\sungn\Documents\Codex\2026-08-21\github-plugin-github-openai-curated-remote\work\qa\side-by-side-final.png`
- CSS viewport: 393 × 852, device scale factor 1
- Implementation pixels: 393 × 852
- State: iPhone, default filters, keyboard closed, top of list

**Findings**

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: Pretendard, weights, hierarchy, line heights, truncation, and Korean copy match the source. The 393 px runtime naturally has slightly less horizontal room than the 412 px source frame.
- Spacing and layout rhythm: header, region, chip rail, 86 px brand rail, 52 px video row, tabs, and 208/226 px card rhythm align with the source. The runtime-owned iOS status area is 9 px taller than the source status bar; this is an expected mobile-runtime difference.
- Colors and visual tokens: gray scale, navy region accent, black selected chips, pink price, dividers, and badge fills match the Figma values.
- Image quality and asset fidelity: all visible logos, icons, avatar, and the composed 130 × 128 vehicle thumbnail use exact Figma exports. No placeholder or hand-drawn asset remains.
- Copy and content: labels, tabs, vehicle details, pricing, location, dealer, badges, and counts match the source.

**Focused comparison**

- Header/filter/brand region: confirmed exact source icons and matching 44/54/86 px section sizing.
- First two vehicle cards: confirmed exact composite thumbnail crop, 130 × 128 media slot, 16 px column gap, price/badge hierarchy, and dealer footer.

**Interaction and browser checks**

- Manufacturer selection reduced the list to the matching result and reflected its pressed state.
- Individual/dealer tabs changed the visible result set; the individual card retained lease copy.
- Like, compact list, video-only switch, and sort controls changed state correctly.
- Search produced an accessible empty state and reset restored the list.
- Filter and sort sheets opened and closed correctly.
- Browser console warnings/errors: none.
- Runtime integrity, production build, and Sites worker tests: passed.

**Comparison history**

- Initial P2: the vehicle image used the correct source raster but did not preserve Figma's exact composed crop and overlays.
- Fix: replaced the layered recreation with the exact Figma export for node `1412:190485`.
- Post-fix evidence: `side-by-side-final.png` shows matching thumbnail composition and metadata overlay.

**Follow-up polish**

- P3: the runtime uses a live status-bar time and device bezel/dynamic island, while the Figma capture has a flat 9:41 status bar. This is intentionally preserved by the protected mobile runtime.

final result: passed

