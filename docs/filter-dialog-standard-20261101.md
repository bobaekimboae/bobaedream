# Filter dialog style and transaction verification

User-approved implementation, 2026-11-01. Current Guazi PC listing and mobile bottom sheets.

## Scope and runtime

Shared CSS targets current car-site Guazi portal dialogs. No new React screen, dependency replacement, runtime protection changes, API changes or production data edits. Existing root React 19.2.7 / TypeScript 7.0.2 / Vite 8.1.3 and Nuxt consumer Nuxt 3.21.11 / Vue 3.5.43 / TS 5.9 differ from the requested renewal stack; no migration is claimed. Local Node is 24.19.0; configured pnpm command is unavailable. Existing npm lockfile/build workflow is preserved. Future new UI remains Nuxt 4/Vue 3/TypeScript; business APIs remain Laravel 12/PHP 8.4.

## Contract

See `quick-filter-spec.md`, Approved filter dialog standard. Covers common modal/sheet/full filters, price/mileage, seller/body type/category footers, manufacturer hierarchy and legacy vehicle/price/region footer appearance. Individual field reset stays local; applied conditions survive cancel. Non-filter reset confirmation retains its explicit action label.

## Verified user journeys

1. PC price: header 64px, title 20px/700, gutter 24px, close target 44px; apply 48px and gap 16px. Price preset then X did not apply.
2. PC fuel: selecting gasoline changed footer 22 → 7 while keeping the original listing. X and reopen restored unchecked gasoline. Apply displayed 7 listing cards.
3. Mobile full filter: header 56px, actions 52px, gutter 16px. Child fuel X retained 22; child apply changed the outer draft to 7; outer X and reopen restored 22.
4. Mobile price: a valid minimum 90000 produced an enabled `0대 보기`; setting maximum 1000 displayed the range error and disabled apply. Reset restored the default, then the 3000 preset produced `9대 보기`.
5. Manufacturer hierarchy: initial footer 22, Hyundai footer 8 and applied list 8. Reset stayed in the dialog and returned a 22-result action; applying restored the full paginated list. Hierarchy back/close targets 44px; mobile reset/apply targets 52px. The action now reuses the listing predicate rather than catalog totals.

These checks are desktop browser responsive emulation, not a real iOS/Android device certification. Catalog completeness, standalone independent sites, inline sidebar transaction redesign and whole-listing navigation reset are outside this patch. Navigation-only categories still navigate immediately. Manufacturer row metadata counts are legacy catalog counts; the primary action uses actual matching listings. No new Laravel/Meilisearch integration is claimed.

## Automated checks

`tests/filter-dialog-standard.test.mjs` checks search-meaning comparisons, reset immutability, numeric/month invalid ranges, valid zero matches, action labels, all CSS scopes/dimensions, nested draft separation and explicit region apply. Existing color/footer/year regression tests remain part of the gate. Runtime integrity, type checking, production build and full verify are required before merge.
