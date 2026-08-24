# Mobile Web Prototype Agent Guide

## Prototype Instructions

In ChatGPT Work Mode, run `sites-preview start "$PWD"`, open `http://terminal.local:4173/` in the cloud browser, and verify the rendered app and its primary interactions. Keep that preview open and tell the user to inspect it in the cloud browser; do not present the local URL as a user-facing chat link. In Codex Desktop, run the local server yourself, open the preview in the in-app browser, and provide the clickable local URL. Do not deploy to Sites unless the user explicitly asks to share, publish, or deploy. Do not give the user server-start instructions when you can run it.

Before planning or implementing any mobile-app change, read this `AGENTS.md` in full. It is the source of truth for the template's runtime and component guidance.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Editing Boundary

- Build app-specific UI in `src/Prototype.tsx` and `src/prototype.css`.
- Treat `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/mobile/`, `public/assets/iphone/`, `public/assets/android/`, `public/assets/status/`, `vite.config.ts`, `worker/index.js`, and `scripts/prepare-sites-build.mjs` as protected runtime files. Do not edit, replace, remove, or recreate them unless the user explicitly asks to change the mobile runtime itself. The approved runtime is now responsive mobile web; do not restore the device mockup. For an explicit runtime change, update the affected lock hashes only after verifying the new runtime behavior.
- Run `npm run check:runtime` before preview or handoff. If it fails, restore the protected runtime instead of weakening or bypassing the check.
- `npm run build` preserves the mobile runtime and prepares the static Cloudflare Worker output required by Sites. Before a Sites handoff, confirm `dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json`, and source `.openai/hosting.json` exist, then run `npm run test:sites`. Do not replace this project with a Vinext starter.

## Runtime Contract

- Preserve the responsive mobile-web runtime. Do not render an iPhone/Android bezel, device picker, simulated status bar, camera cutout, home indicator, custom cursor, or simulated keyboard.
- Keep `App` composed around `MobileRuntime` -> `MobileDeviceProvider` -> `PhoneFrame` -> `KeyboardProvider`. `PhoneFrame` is now a browser viewport shell and portal host, not a device frame.
- On phones, the shell fills the full browser width and `100dvh`. On wider screens, keep the content column centered at a maximum width of 430px without adding device chrome.
- Resolve top and bottom safe areas with `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`. Use the browser's native text-entry keyboard; do not reserve the legacy simulated-keyboard height.
- Legacy device presets and assets remain checked in for compatibility only and must not appear in the deployed interface.
- Use `MobileScroll` directly for simple single-screen prototypes. Use `FlowStack` for conventional multi-screen flows whose routes can own their fixed header and footer; when using it, define each route as a `FlowScreen`: `{ id, header?, headerHeight?, footer?, footerHeight?, render }`, and use `flow.push(screen)`, `flow.pop()`, and `flow.replace(screen)` from `FlowStack` render callbacks or `useFlow()` instead of introducing another router.
- Use `Carousel` for a carousel, horizontal rail, swipeable cards, image or media strip, horizontally scrollable cards, chip rail, or other horizontal collection.
- For a layered app shell—such as a persistent composer, independently presented sheet, pushed/peek sidebar, or app-wide transition—compose directly in `Prototype.tsx` rather than forcing it through `FlowStack`. Keep app-owned fixed chrome as sibling layers outside `MobileScroll`.
- When using `FlowScreen`, put route-owned fixed headers or footers in `FlowScreen.header` or `FlowScreen.footer`. Set `headerHeight` to the visible app-toolbar height; `FlowStack` adds the device's top safe-area/status-bar inset automatically. Do not include `StatusBar` or its height in the header. Set `footerHeight` to the full app-footer height. `FlowScreen.footer` is an overlay, not reserved layout space; screens using it must add their own bottom content padding such as `padding-bottom: calc(var(--flow-footer-height) + var(--mobile-safe-area-height) + 24px)` so final content can scroll above the footer while still painting behind it.
- Render only scrollable content inside `MobileScroll`; it is for content that should move with scroll and rubber-band overscroll. Keep app-owned headers, nav bars, tabs, composers, and overlays outside it. This keeps scroll physics, safe areas, keyboard insets, scrollbars, and drag click suppression active without letting content paint under fixed chrome.
- Buttons, links, cards, and images inside `MobileScroll` should still allow drag scrolling when the pointer moves beyond tap slop. Use `data-scroll-drag="ignore"` only for rare controls that must own the drag gesture themselves.
- Do not add `var(--keyboard-height)` to ordinary screen/content padding inside `MobileScroll`; the scroll viewport already shrinks above the simulated keyboard. For custom fixed composers, search bars, or toast chrome, use `useKeyboardInsets().bottomInset`. It is relative to the app viewport: Android returns `0` while the closed-keyboard viewport already reserves navigation, then returns the keyboard height while open; iOS continues to clear the home indicator while closed and ride directly above the keyboard while open. Do not pin custom bottom chrome to `bottom: 0` or only `keyboardHeight`.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for every text-entry control. A raw `input` or `textarea` disconnects focus, keyboard animation, safe-area insets, and attached surfaces.
- Use `BottomSheet` for phone-scoped sheets. Its props are `open`, `onOpenChange`, `title`, optional `description`, optional `snap`, and `children`; it renders through the phone screen portal and dismisses the keyboard before opening.

## Horizontal Carousels

- Use `Carousel` for horizontally draggable cards, images, media, chips, or other horizontal collections. Do not recreate these with `overflow-x`, custom pointer handlers, or a generic div.
- `Carousel` can be nested directly inside `MobileScroll`. It owns horizontal gestures and automatically yields vertical gestures to the parent.
- Never put `data-scroll-drag="ignore"` on or around a `Carousel`; doing so prevents vertical parent scrolling when a gesture begins inside it.
- Do not add CSS scroll snapping to `Carousel`; its runtime owns momentum and release motion.
- Use `data-scroll-drag="ignore"` only when a control must prevent parent scrolling in every drag direction.

See `src/mobile/COMPONENTS.md` for the full component and gesture contract.

## Keyboard Rule

Text fields use the browser's native keyboard. Before presenting navigation or modal UI, blur the active field first.

Call `keyboard.hide()` before:

- pushing, popping, or replacing FlowStack routes
- opening bottom sheets, action sheets, dialogs, menus, or navigation sheets
- starting transitions where the destination should not inherit text-input focus

`FlowStack` already hides the keyboard for `push`, `pop`, and `replace`. `BottomSheet` already hides it before opening. If you add new modal/sheet/navigation primitives, follow the same rule.

When a composer, search surface, or other keyboard-attached component closes, call `keyboard.hide()` in the same event before changing that component's open state. Do not add a simulated keyboard asset or a fixed keyboard-height inset.

When any text-entry control loses focus, clear the keyboard context. If the control is custom or does not use the runtime's keyboard-aware fields, handle its blur event and call `keyboard.hide()` explicitly.

## Interaction Rules

- Do not trigger buttons or inputs after a pointer has become a drag. Preserve the drag suppression behavior in `MobileScroll`.
- Do not allow native browser image/file dragging inside the mobile-web shell. Preserve the shell-level `dragstart` suppression and non-draggable image styles so scroll drags that begin on images still scroll the prototype.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for text entry so focus and modal-dismissal behavior stay connected.
- Fixed mobile-web headers and footers should not animate with pushed screens. Screen content can animate while browser chrome remains outside the app.

## Prototype-Specific Design Decisions

- Deploy this prototype as responsive mobile web: remove all iPhone/Pixel mockup chrome and fill the browser viewport on mobile, while centering a bezel-free 430px content column on wider screens.
- Listing location rows show only the address. Do not append a separator, views icon, or numeric view count beside it in either list or card view.

- In BMW model-selection mode on the 393px mobile viewport, keep four model cards fully visible and show the fifth card partially at the right edge to communicate horizontal scrolling.
- Label the BMW model-selection rail as `모델` and vertically center that label against the full rail height.
- When Mercedes-Benz (`벤츠`) is selected, replace the manufacturer-logo rail with the Figma chip pattern: label it `모델` and show horizontally scrollable `E클래스`, `S클래스`, `GLC클래스`, `GLE클래스`, and `C클래스` outline chips. Selecting a chip filters the randomized Mercedes-Benz inventory.
- The view-mode icon to the right of `최신순` toggles between the default compact list and the Figma full-width card feed. Show the three-line list icon in list mode and the exact Figma card-view icon (node `1412:157677`) in card mode so the icon always reflects the active layout. Card mode uses a large 380:220 vehicle photo, photo metadata overlay, two-line title, full specs/price/badges, seller details, and action icons; tapping it again restores the original list without clearing filters or randomized inventory.
- Tapping `지역: 전국` opens the Figma region-selection sheet from node `1674:17622`. Preserve its 14 px top radius, 60 px title row, exact close/chevron assets, province and district selectors, six quick-region chips, nearby-radius selector, and 118 px reset plus flexible black `737대 매물 보기` confirm action. Confirmed province/district selections update the header label and filter inventory; dismissing the sheet does not apply draft changes.
- The bookmark control inside the top search field is a reversible saved-search toggle. Its inactive state uses the existing outline asset; its active state uses a solid blue bookmark. Show `검색 조건을 저장했습니다.` after saving and `저장한 검색 조건을 삭제했습니다.` after removing, then dismiss each phone-scoped toast automatically.
- Listing metadata uses the corrected user-facing labels: Jeong Yujin listings show `개인판매자`, Kim Taeyoon shows `와이즈오토 김태윤`, relevant complexes show `오토갤러리`, and white/gray seat colors show `흰색시트`/`회색시트`; seller availability text must wrap instead of clipping.
- All private-party listings display only `개인판매자` with no personal name, and all dealer listings omit the trailing `딜러` label after the seller's name.
- Each listing heart toggles between a gray outline and a solid red saved state. The header heart opens a `저장한 매물` FlowStack screen with dynamic listing/video counts, removable saved rows, and an empty state.
- Tapping the `제조사` filter opens a near-full-height manufacturer sheet matching the supplied reference, with a centered title, close action, keyboard-aware search, real brand marks, scrollable rows, native single-select radios, and immediate inventory filtering on selection.
- After a quick manufacturer logo is selected, the active manufacturer chip separates its label and clear action: tapping the label (for example `BMW`) reopens the manufacturer sheet, while tapping its `X` resets manufacturer/model selection and restores the default manufacturer rail and inventory.
- Listing cards receive 0–3 non-duplicated badges when their inventory is shuffled, selected from `브랜드인증`, `제조사보증`, `1인소유`, `가격인하`, and `인증중고차`. Keep the price-to-badge gap consistently 2 px in both compact and card views, and render no empty badge row when a listing receives zero badges.
- Keep the compact listing's price/badge block and location block in normal flow with a consistent 10px gap. Listings without badges must use the same visual gap from price to location that badged listings use from badges to location, reduce their compact row height by the absent 22px badge row, and keep the seller-to-bottom-divider spacing equal to badged listings. No row may receive a special extra height based on its list position.
- Display vehicle mileage in truncated buckets across listing and detail surfaces: `54,200km` becomes `5만km`, `26,500km` becomes `2만km`, and values below 10,000km use truncated thousand-kilometer buckets such as `9,820km → 9천km` and `8,130km → 8천km`.
- Keep manufacturer rows easy to scan on mobile: use large Korean brand names, generous row height, and clear left padding before the real brand marks.
- Tapping the `가격` filter opens the Figma price sheet from node `1313:139816`, with cash/lease tabs, dual price controls, eight quick ranges, draft reset, dynamic result count, and confirm-to-apply behavior. Closing the sheet discards draft changes.
- Keep the filter control fixed at the left of the filter rail. In the default state it shows the filter icon and `필터` text; after the user horizontally swipes the condition rail, collapse it to the icon-only state. `중고차`, `제조사`, `연식`, and `가격` move inside the horizontal `Carousel` without moving the fixed filter control.
- Manufacturer brand marks start at least 28px from the sheet's left edge.
- The detail hero contains 24 swipeable photo slides. Keep the lower-right counter synchronized with the visible slide so the first swipe changes `1/24` to `2/24` and subsequent swipes continue through `24/24`.
- Match the price-history pagination arrows to Figma node `1674:15566`: 36px gray circular buttons, an 18px icon frame, and the exact exported 10px-by-6px chevron rotated 90 degrees for previous and -90 degrees for next. Preserve the asset's own gray states and never fade the entire disabled button.
- On first entry, show the Figma vehicle-category rail (`중고차`, `트럭 · 특장 · 버스`, `바이크`, `캠핑카`, `건설기계`, `부품 · 용품`) in place of the manufacturer rail, using the exact exported category icons. Tapping `중고차` replaces that rail with the existing BMW/Mercedes manufacturer selector without leaving the listing screen.
- Tapping the pinned `카테고리` chip, including after it changes to `중고차`, opens the Figma category sheet from node `8698:49850`. Keep the `중고차` row expanded by default with `전체 중고차`, `국산차`, `수입차`, and `전기차` chips; its right arrow toggles only that child row without dismissing the sheet.


