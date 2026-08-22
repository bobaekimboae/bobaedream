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

## Applied Prototype

The GitHub prototype now applies the confirmed filter structure to the 15-car
benchmark listing set.

1. A full-height all-filter sheet keeps reset and the current result count
   fixed at the bottom while its content scrolls.
2. It includes all 13 observed groups: price, seats, manufacturer, year,
   condition, owner count, transmission, fuel, color, origin, body type,
   video availability, and seller type.
3. Manufacturer selection reveals a model selector; model and origin use
   single-choice sub-screens, while color uses a checkbox sub-screen.
4. Fuel, body type, seller, condition, transmission, year, seats, and owner
   count use single-choice chips. Selecting used condition exposes the
   mileage field.
5. The listing does not change until the sheet's result CTA is pressed. The
   preview count changes immediately for each draft selection.
6. The production prototype uses the user-provided Notion originals for the
   filter, search, close, list-view, and right-chevron icons.

The previous DOM override is intentionally not loaded on the filter prototype:
it forced every list card visible and would have broken real filter results.
