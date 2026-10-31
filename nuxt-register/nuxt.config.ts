// 보배드림 매물 등록(2026-11-01 「초톳 네이티브 앱과 같은 UI/UX로 먼저 만들고, 촬영 키트를 붙여 상용화」).
// 리뉴얼 기술 스택: Nuxt 4.6.2 · Vue 3.5.33 · TypeScript 6.0.3 · pnpm. 서버 없이 브라우저 안에서 동작하는 시안.
// 앱 버전 = 초톳 네이티브 앱(SM-S938N, 2026-11-01 adb 실측), PC 버전 = 같은 데이터 · 두 칸 배치.
// 촬영 키트(nuxt-shootkit)와는 같은 사이트 IndexedDB로 사진 · 영상을 넘겨받는다(lib/shoot-handoff.ts).
// 배포 주소: https://bobaekimboae.github.io/bobaedream/nuxt-register/
import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  ssr: false,
  devtools: { enabled: false },
  pages: false,
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || "/bobaedream/nuxt-register/",
    head: {
      htmlAttrs: { lang: "ko" },
      title: "보배드림 · 매물 등록",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#F7F7F7" },
        { name: "description", content: "보배드림 차량 매물 등록 시안 — 사진 · 영상, 상세 정보, 촬영 키트 연결" },
      ],
    },
  },
  alias: {
    "@kit": fileURLToPath(new URL("../nuxt-shootkit/lib", import.meta.url)),
    "@proto": fileURLToPath(new URL("../src/prototype", import.meta.url)),
  },
  css: ["~/assets/css/app.css"],
  components: false,
  imports: { autoImport: false },
  typescript: { strict: true, tsConfig: { compilerOptions: { noUncheckedIndexedAccess: false } } },
  experimental: { emitRouteChunkError: false },
  vite: { server: { fs: { allow: [".."] } } },
});
