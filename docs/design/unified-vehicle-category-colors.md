# Unified vehicle category color specification

Scope: CAR, BIKE, TRUCK_SPECIAL, BUS, CONSTRUCTION, CAMPING_CARAVAN, BOAT_PWC, ATV_UTV and all other vehicle types.

All categories MUST use the same semantic color tokens. Category changes may alter vehicle imagery and labels but never background, text, borders, checkbox, chip, primary button or active-state colors.

Reference: https://www.autoscout24.de/ . Do not claim pixel-exact brand colors until the live CSS has been inspected and verified.

Implementation:
1. Audit existing global CSS variables and vehicle-category-specific overrides.
2. Define shared tokens once in a dedicated theme stylesheet/module.
3. Map every category to the same tokens; remove color-based category branching.
4. Preserve protected src/App.tsx, src/main.tsx, src/styles.css and src/mobile/ until explicit approval to modify.
5. Verify desktop and mobile filter sheets, chips, checkboxes, icon strokes and selected states.
6. Capture screenshots and compare against reference before merging.

Status: specification only; not deployed.
