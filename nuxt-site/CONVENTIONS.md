# nuxt-site 이식 규칙 (리액트 시안 → Nuxt 3 / Vue 3)

목표: 리액트 시안(`src/`)과 **같은 화면 · 같은 동작**을 내는 Vue 컴포넌트. 리액트 판은 당분간 함께 유지되므로, 리액트 파일과 1:1로 대조할 수 있게 옮긴다.

## 무엇을 옮기고 무엇을 공유하나
- **공유(복사 금지)**: 리액트 부품이 아닌 모든 것 — 데이터, 계산 함수, 타입, 상수, CSS. `@proto/...`(= `src/prototype/...`), `@src/...`(= `src/...`)로 그대로 import 한다.
  - `.tsx` 파일 안의 비부품 export(예: `stablePageTitle`, `krRailLabel`, `bbmGroupLabel`)도 그 파일에서 바로 import 한다. 그 파일의 `react` import는 `shims/react.ts`로 대체되어 아무 일도 하지 않는다.
  - CSS는 리액트 파일이 `import "./x.css"` 하던 것을 Vue 컴포넌트에서도 같은 경로로 import 한다(`import "@proto/listing/x.css"`). 복사하지 않는다.
- **새로 씀**: 리액트 함수 부품(대문자 이름, JSX를 돌려주는 것)과 리액트 훅(`useXxx`, 상태·효과가 있는 것).

## 파일 위치 · 이름
- 리액트 `src/prototype/<경로>/<file>.tsx`의 부품 `Foo` → `nuxt-site/components/<경로>/Foo.vue` (부품 하나당 파일 하나).
  - 예: `src/prototype/quick-filter/index.tsx`의 `DepthCard` → `nuxt-site/components/quick-filter/DepthCard.vue`
  - `src/mobile/BottomSheet.tsx` → `nuxt-site/components/mobile/BottomSheet.vue`
  - `src/ChoTotFilterSheet.tsx` → `nuxt-site/components/ChoTotFilterSheet.vue`
- 리액트 훅(상태 있는 `useXxx`) → `nuxt-site/composables/<경로>/useXxx.ts`.
- 리액트 Context(Provider + useXxx) → `provide/inject` 쌍: Provider는 `.vue`(slot 감싸기), 읽는 쪽은 composable.
- 부품 파일 안에서만 쓰이는 작은 계산 함수가 export 되어 있지 않으면, 그 부품 `.vue` 안에 그대로 둔다(공유하지 못하므로 그 부분만 복사).
- `nuxt.config`의 `components:false`, `imports.autoImport:false` → 모든 import를 직접 적는다(`import { ref, computed } from "vue"` 포함).

## 문법 대응
- `<script setup lang="ts">` SFC. 템플릿은 리액트 JSX와 **같은 DOM · 같은 class · 같은 글자 · 같은 aria/role/data 속성 · 같은 순서**. 자동 시험이 class/글자/aria로 찾는다. class 이름 하나도 바꾸지 않는다.
- props: 리액트 props 타입 그대로 `defineProps<{...}>()` (+ `withDefaults`로 기본값).
- 콜백 prop `onXxx`(부모에게 알림) → `emit("xxx", ...)`. 부모 쪽은 `@xxx="..."`. 이름은 on 뒤를 첫 글자 소문자로(`onToggleLike` → `toggleLike`, 템플릿 `@toggle-like`).
  - 콜백을 **줬는지 여부로 화면이 달라지는** 경우(`onClear && <button/>`)는 boolean prop `showClear`(기본 false)를 추가하고 emit도 같이 둔다. 이 대응은 파일 맨 위 주석에 적는다.
  - 값을 **돌려받는** 콜백(예: `renderItem`, `getLabel`)은 emit으로 못 바꾸므로 함수 prop 그대로 둔다.
- `children` → 기본 slot. `ReactNode` 타입의 다른 prop(예: `icon`, `header`) → 이름 있는 slot(`<slot name="icon" />`). 문자열만 들어오는 게 확실하면 string prop으로 둬도 된다.
- `useState` → `ref`/`shallowRef`, `useMemo` → `computed`, `useEffect` → `watch`/`watchEffect`/`onMounted`(+ 정리 함수는 `onBeforeUnmount`나 watch의 `onCleanup`), `useLayoutEffect` → `watch(..., { flush: "post" })`/`onMounted`, `useRef`(DOM) → 템플릿 ref, `useRef`(값) → 일반 변수 또는 `shallowRef`.
- 리액트 `key` → `:key`. `className` → `class`, `htmlFor` → `for`, `style={{ width: 12 }}` → `:style="{ width: '12px' }"`(숫자에 px 붙이기! Vue는 px를 붙여 주지 않음. 단 `opacity`, `zIndex`, `flex`, `lineHeight`(단위 없음), `fontWeight` 등 단위 없는 속성은 숫자 그대로).
- 입력칸 `onChange`(글자 입력) → `@input`(리액트 onChange는 매 글자마다 불림). 체크박스·라디오·select는 `@change`.
- `dangerouslySetInnerHTML` → `v-html`.
- 조건부 `{a && <X/>}` → `v-if`, `{a ? <X/> : <Y/>}` → `v-if`/`v-else`, `.map` → `v-for`(+ `:key`).
- 리액트의 `<>...</>` → `<template>`(템플릿 루트는 여러 요소 가능).
- 아이콘: `@radix-ui/react-icons`는 리액트용이라 못 쓴다. 같은 SVG를 `nuxt-site/components/icons/<Name>.vue`로 옮긴다(이미 있으면 재사용). 경로(path d) 글자 그대로.
- 다른 리액트 부품을 쓰는 곳은 그 부품의 Vue 판을 import 한다. 아직 없으면 같은 규칙으로 직접 만들거나(같은 묶음이면), 맡은 사람이 다르면 import 경로만 규칙대로 적어 두고 보고에 "의존: X"로 남긴다.
- 브라우저 전용 API(window, document, localStorage)는 그대로 써도 된다(`ssr:false`).

## 금지
- `src/` 아래 리액트 파일은 고치지 않는다(다른 작업창이 쓰는 중).
- 화면 문구 · class · 크기 값을 "더 낫게" 바꾸지 않는다. 다르게 해야 하면 주석 + 보고.
- 코드에 글자 그대로 `/assets/`를 쓰지 않는다(배포 단계가 바꿔 씀). 경로는 공유 함수 `asset()`(`@proto/data`)을 쓴다.

## 확인
- `sh nuxt-site/scripts/typecheck-own.sh` → `own-errors: 0` (공유하는 `../src` 리액트 파일의 오류 87개쯤은 원래 있는 것이라 무시).
- 여러 사람이 동시에 작업하므로 `nuxt generate`/`nuxt dev`는 돌리지 않는다(총괄이 합쳐서 돌림).
