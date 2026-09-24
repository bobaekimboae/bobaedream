# Bobaedream Agent Guide

## Before Work

- Read this file before planning or editing.
- For quick-filter work, also read `docs/quick-filter-spec.md` and `docs/보배드림_차량이미지_로고_에셋지침_v1.md`.
- Add new quick-filter rules to `docs/quick-filter-spec.md`, not to this file.

## Editing Boundary

- App-specific prototype code lives in `src/Prototype.tsx`, `src/prototype.css`, and `src/prototype/`.
- Protected runtime files: `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/mobile/`, `public/assets/iphone/`, `public/assets/android/`, `public/assets/status/`, `vite.config.ts`, `worker/index.js`, and `scripts/prepare-sites-build.mjs`.
- Do not edit protected runtime files unless the user explicitly asks for runtime changes. If runtime changes are requested, update lock hashes only after verifying the new behavior.
- Preserve the responsive mobile-web runtime. Do not restore device mockups, simulated status bars, bezels, home indicators, or simulated keyboards.
- See `src/mobile/COMPONENTS.md` for the mobile component, keyboard, carousel, sheet, and gesture contract.

## Quick-Filter Scope

- Until repository splitting is complete, these paths are outside normal quick-filter work: `apps/variable-category-admin`, `admin-server`, `public/category-admin`, `public/shortform*`, `public/option-admin`, and `public/vehicle-history`.
- Do not change those out-of-scope paths for quick-filter tasks unless the user explicitly includes them.

## Validation

- Run `npm run check:runtime` before preview or handoff when prototype files changed.
- Run `npm run verify:qf` for quick-filter and prototype-screen changes. It runs runtime check, TypeScript, and Vite build without Storybook or admin tests.
- Run full `npm run verify` for main deployment or changes that touch deployment, admin, Storybook, shared package scripts, or workflows.
- Run `npm run build` when verifying Pages output; confirm `dist/client` does not contain Storybook unless intentionally building Storybook elsewhere.

## Deploy And Merge

- Publish to the existing GitHub Pages deployment only when the user asks for deployment or the current instruction explicitly approves it.
- Do not merge PRs unless the user approves merge for that step.
- Report PR links, commit hashes, validation results, deployment run, deployed `v` value, bundle name, and itemized ID results when the instruction includes IDs.

## Documentation

- Legacy preview and Work Mode notes live in `docs/legacy-agent-notes.md`.
- Quick-filter behavior and visual rules live in `docs/quick-filter-spec.md`.
- Vehicle image and logo asset rules live in `docs/보배드림_차량이미지_로고_에셋지침_v1.md`.
