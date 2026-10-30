# 보배드림 리뉴얼 기술 스택 (개발 기준)

원본: 노션 「리뉴얼 기술 스택」 https://app.notion.com/p/408ee9c4b60680c3be52caefde283895 (2026-10-30 확인).
노션 값이 바뀌면 이 표도 같이 고친다. 노션과 이 표가 다르면 노션이 우선이다.

## 결정 (2026-10-30)

- 보배드림의 모든 저장소·키트·솔루션은 아래 기술 스택으로 만든다. 코덱스·클로드 등 모든 에이전트가 따른다.
- **새 화면은 React로 만들지 않는다. Nuxt(Vue)로 만든다.**
- 백엔드·API가 필요하면 Laravel(PHP) 규칙으로 설계한다. Node 서버(Express 등)나 다른 언어로 새 백엔드를 만들지 않는다.
- 버전은 아래 표에 맞춘다. 표에 없는 라이브러리를 새로 넣을 때는 이유를 PR에 적는다.

## 표

| 분류 | 백엔드 | 관리자 프론트엔드 | 사용자 프론트엔드 |
| --- | --- | --- | --- |
| 언어 | PHP 8.4.27 | TypeScript 5.9.3 | TypeScript 6.0.3 |
| 프레임워크 | Laravel 12 | Nuxt 4.5.2 | Nuxt 4.6.2 |
| UI | — | Vue 3.5.43 · Vuetify 3.10.8 | Vue 3.5.33 |
| 서버 런타임 | PHP-FPM 8.4.27 | Node.js 24.22.1 | Node.js 24.22.1 |
| 데이터베이스 | PostgreSQL 15.15 | — | — |
| 캐시 | Redis 7.0.15 | — | — |
| 검색 | Meilisearch 1.54.3 | — | — |
| 스타일 | — | SCSS · Sass | CSS · CSS Custom Properties |
| 상태 관리 | — | Pinia | Nuxt useState · Vue Composition API |
| 에디터 | — | Tiptap 2.27.1 | Tiptap 3.27.3 |
| 패키지 관리 | Composer | pnpm 10.33.0 | pnpm 10.33.0 |

## 작업할 때 지킬 것

- 사용자 화면: Nuxt 4 + Vue 3 Composition API(`<script setup lang="ts">`), 스타일은 일반 CSS와 CSS 변수(토큰). Tailwind·CSS-in-JS·Vuetify는 쓰지 않는다.
- 관리자 화면: Nuxt 4 + Vuetify 3 + Pinia + SCSS.
- 상태: 사용자 화면은 `useState`·composable, 관리자 화면은 Pinia.
- 패키지: pnpm(`pnpm-lock.yaml`). npm·yarn 잠금 파일을 새로 만들지 않는다. 백엔드는 Composer.
- API: Laravel 라우트·컨트롤러 규칙에 맞는 REST(JSON). 프론트에서 부를 때는 Nuxt `useFetch`/`$fetch`.
- 데이터 모델은 PostgreSQL 기준(테이블·마이그레이션 설계), 캐시·큐는 Redis, 검색은 Meilisearch를 가정한다.
- 무거운 처리(영상 렌더링·이미지 변환)는 브라우저(WebCodecs 등) 또는 Laravel 큐 작업자로 설계한다.

## 기존 코드와의 관계

- 이 저장소의 메인 시안(`src/`, React 19 + Vite)은 기존 결정에 따라 유지보수만 한다. 새 기능·새 화면은 Nuxt로 만든다. React 시안을 Nuxt로 옮기는 일정은 사용자가 정한다.
- `nuxt-shootkit/`은 Nuxt 3 · npm · TypeScript 5.9로 되어 있어 표(Nuxt 4 · pnpm · TypeScript 6)와 다르다. 다음 작업 때 맞춘다.
