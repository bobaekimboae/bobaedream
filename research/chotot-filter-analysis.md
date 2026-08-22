# ChoTot Filter Research Log

## Initial Evidence Set

Screenshots are stored in the shared Drive folder and indexed in the Google
Sheet `초톳 중고차 필터 UX 분석 및 보배드림 적용표`.

The first capture pass establishes these confirmed behavior rules:

- The all-filter screen is a near-full-height sheet with an always-visible
  bottom action area. The left action resets filters and the right yellow CTA
  shows the current result count before opening the listing.
- The sheet scrolls through price, seat count, brand, year, condition, owner
  count, transmission, fuel, color, origin, body type, video availability, and
  seller type. The CTA remains fixed while the content scrolls.
- Price is a minimum/maximum numeric range. Entering the minimum value changes
  the result count immediately; the listing remains unchanged until the user
  chooses the bottom result CTA.
- A quick brand selection updates the search label and creates a brand chip.
  It also reveals quick model suggestions. Selecting a model creates a second
  chip and changes the listing again.
- The complete model list is a separate full-screen selection view with search,
  a single circular selection indicator per model, and a bottom reset action.
- Body type chips are single-select: choosing Hatchback after Sedan removes the
  Sedan selection. Fuel chips use the same single-select behavior: choosing
  Diesel removes the previously selected Gasoline state.
- Body type and fuel selections change the bottom CTA count immediately. The
  filtered listing appears after choosing the CTA.
- The top-level reset control removes the current automobile category as well,
  so Bobaedream must distinguish a global reset from an in-category reset.

## Implementation Implications

The initial GitHub prototype should first reproduce the confirmed rules below
before adding unverified controls:

1. A full-height all-filter sheet with fixed reset and result CTA buttons.
2. Brand selection that conditionally reveals model selection.
3. Price minimum/maximum fields with preview count and explicit apply.
4. Single-select chips for fuel and body type.
5. Applied filter chips, a scoped in-list reset, real test-listing filtering,
   and return-state restoration after opening a detail page.

Remaining capture work: color, origin, transmission, owner count, condition,
seller type, video toggle, year, seat count, full price range, and every
unseen child screen must be captured to the final scroll position before those
controls are implemented.
