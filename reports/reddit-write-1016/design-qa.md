# Reddit-style writer design QA

- source visual truth: Reddit `/submit` and the supplied Notion icon database were requested, but both source screens required human verification or login. Functional truth was taken from Reddit Help's current posting documentation and the repository's previously captured Reddit RPL SVG assets.
- implementation: `http://127.0.0.1:4192/community/reddit-write.html`
- viewport inspected: desktop browser, 1536 × 695 CSS px, device pixel ratio 1.25
- implementation evidence: browser-rendered empty composer and filled composer were visually inspected in Chrome.
- source pixels: unavailable because Reddit returned a human-verification page and Notion returned a login page.
- implementation pixels: browser screenshot rendered at 1536 × 695 CSS px; no saved image path was produced by the connected browser.
- state: empty composer; title/body filled; poll panel; flair dialog; community dialog; saved draft

## Full-view comparison evidence

The implementation uses the captured Reddit token family and layout characteristics: `#0f1a1c` content, `#576f76` weak content, `#f6f7f8` canvas, `#0045ac` primary action, 16 px rounded composer card, circular controls, left community navigation, central unified editor, and a community-rules sidebar. A pixel comparison against the current production composer could not be completed because the source page was blocked.

## Focused interaction evidence

- Title and body input enable the Post action.
- Poll opens with two required choices.
- Flair dialog applies the selected flair chip.
- Community dialog exposes eight communities and updates the selected community.
- Link validation accepts an HTTPS source.
- Draft save updates its visible status.
- Browser console contained no errors during these checks.

## Findings

- [P1] Exact production-screen parity cannot be verified.
  - Location: overall composer layout and current 2026 Reddit experiment.
  - Evidence: Reddit `/submit` showed human verification; the supplied Notion page showed a login gate.
  - Impact: functionality and icon family are source-grounded, but exact current spacing and responsive state cannot be claimed as identical.
  - Fix: capture authenticated desktop and 390 × 844 mobile source screenshots, then run a normalized visual comparison.
- [P2] Mobile visual capture was unavailable in the connected Chrome viewport.
  - Location: max-width 780 px responsive layout.
  - Evidence: temporary viewport override did not change the browser's 1536 × 695 CSS viewport.
  - Impact: responsive CSS is implemented but mobile visual fidelity remains unverified.
  - Fix: repeat in a controllable mobile viewport.

## Implementation checklist

- [x] Unified Reddit-style rich-text composer
- [x] Image, video, link, poll, and AMA controls
- [x] Flair, spoiler, and 18+ controls
- [x] Community picker and rules panel
- [x] Draft persistence and publish validation
- [x] Reddit feed write-button routing
- [ ] Authenticated source comparison
- [ ] 390 × 844 visual comparison

final result: blocked
