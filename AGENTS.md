# Bobaedream Agent Guide

## Before Work

- Read this file before planning or editing.
- For quick-filter work, also read `docs/quick-filter-spec.md` and `docs/보배드림_차량이미지_로고_에셋지침_v1.md`.
- Add new quick-filter rules to `docs/quick-filter-spec.md`, not to this file.

## 보배드림 기술 스택 (2026-10-30, 필수)

- 모든 새 작업(깃허브 시안, 키트 솔루션, 프런트엔드·백엔드·API)은 보배드림 리뉴얼 기술 스택으로 만든다. 리액트로 새 화면·기능을 만들지 않는다. 기존 리액트 시안(`src/`)은 비교·참고용이다.
- 기준 문서: 노션 「리뉴얼 기술 스택」 https://app.notion.com/p/408ee9c4b60680c3be52caefde283895
- 프런트엔드: TypeScript 6.0.3 · Nuxt 4.6.2 · Vue 3.5.33 · Node.js 24.22.1 · CSS Custom Properties(SCSS 안 씀) · 상태는 Nuxt `useState` + Vue Composition API(Pinia 안 씀) · 에디터 Tiptap 3.27.3 · 패키지 pnpm 10.33.0
- 관리자 프런트엔드: TypeScript 5.9.3 · Nuxt 4.5.2 · Vue 3.5.43 · Vuetify 3.10.8 · SCSS/Sass · Pinia · Tiptap 2.27.1 · pnpm 10.33.0
- 백엔드: PHP 8.4.27(PHP-FPM) · Laravel 12 · PostgreSQL 15.15 · Redis 7.0.15 · 검색 Meilisearch 1.54.3 · Composer
- 화면이 쓰는 데이터는 Laravel API가 줄 모양(JSON)으로 두고, 검색·필터 대수는 Meilisearch 패싯(항목별 개수)으로 계산될 수 있게 설계한다.
- 지금 `nuxt-site/`·`nuxt-shootkit/`은 Nuxt 3.21 · TypeScript 5.9 · npm이다. 새로 손댈 때 위 버전(Nuxt 4.6.2 · TS 6.0.3 · pnpm)으로 올리는 작업을 먼저 하거나 함께 한다.

## Editing Boundary

- App-specific prototype code lives in `src/Prototype.tsx`, `src/prototype.css`, and `src/prototype/`.
- Protected runtime files: `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/mobile/`, `public/assets/iphone/`, `public/assets/android/`, `public/assets/status/`, `vite.config.ts`, `worker/index.js`, and `scripts/prepare-sites-build.mjs`.
- Do not edit protected runtime files unless the user explicitly asks for runtime changes. If runtime changes are requested, update lock hashes only after verifying the new behavior.
- Preserve the responsive mobile-web runtime. Do not restore device mockups, simulated status bars, bezels, home indicators, or simulated keyboards.
- See `src/mobile/COMPONENTS.md` for the mobile component, keyboard, carousel, sheet, and gesture contract.

## Quick-Filter Scope

- Until repository splitting is complete, these paths are outside normal quick-filter work: `apps/variable-category-admin`, `admin-server`, `public/category-admin`, `public/shortform*`, `public/option-admin`, and `public/vehicle-history`.
- Do not change those out-of-scope paths for quick-filter tasks unless the user explicitly includes them.

## 작업 방식

- PC 작업 대상은 개발 시안형 레이아웃(기본 `&pc=1`, `.marketplace.is-bbm`) 하나다. 초톳형(`&pcl=chotot`, QF-042~045)은 비교용으로 동결하고 더 이상 수정하지 않는다.
- 지시문에 레이아웃이 적혀 있지 않으면 개발 시안형으로 작업한다. 헷갈리면 시작 전에 묻는다.
- 과제 ID는 사용자가 준 번호만 쓴다. 스스로 새 번호를 만들지 않는다.
- 로컬 미리보기를 보여줄 때는 어느 브랜치·커밋으로 빌드했는지 함께 알린다.

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

- Current implementation state and accepted follow-up direction live in `docs/HANDOFF.md`.
- Legacy preview and Work Mode notes live in `docs/legacy-agent-notes.md`.
- Quick-filter behavior and visual rules live in `docs/quick-filter-spec.md`.
- Vehicle image and logo asset rules live in `docs/보배드림_차량이미지_로고_에셋지침_v1.md`.
