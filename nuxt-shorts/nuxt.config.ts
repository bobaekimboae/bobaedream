// 보배드림 숏폼 보기(카스24 비디오 투어형) — 상용 화면(2026-11-03 「상용화시켜, 시안 수준은 이젠 안 만들어」)
// 리뉴얼 기술 스택: Nuxt 4.6.2 · Vue 3.5.33 · TypeScript 6.0.3 · pnpm 10.33.0 · CSS Custom Properties · useState/Composition API.
// 데이터: 보배드림 숏폼 API(shorts-api, Laravel 12) → 같은 도메인이면 원본 BFF → 그 밖(GitHub Pages)은 실매물 사본.
// 주소: https://bobaekimboae.github.io/bobaedream/nuxt-shorts/?id=<매물 번호>
import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  ssr: false,
  devtools: { enabled: false },
  pages: false,
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || "/bobaedream/nuxt-shorts/",
    head: {
      htmlAttrs: { lang: "ko" },
      title: "보배드림 · 숏폼 매물",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#000000" },
        { name: "description", content: "보배드림 중고차 숏폼 매물 — 위아래로 넘기며 매물 영상과 부위별 비디오 투어를 봐요." },
        { property: "og:title", content: "보배드림 숏폼 매물" },
        { property: "og:type", content: "website" },
      ],
    },
  },
  runtimeConfig: {
    public: {
      // 숏폼 API 주소(비우면 원본 BFF 또는 사본). 배포 때 NUXT_PUBLIC_SHORTS_API 로 넣는다.
      shortsApi: process.env.NUXT_PUBLIC_SHORTS_API || "",
      // 원본 백엔드(같은 도메인이 아닐 때 ?source=live 로 시험할 때만 씀)
      liveBase: process.env.NUXT_PUBLIC_SHORTS_LIVE || "https://staging.bbmuseum.co.kr",
      // 매물 상세 · 딜러 · 로그인 화면이 있는 보배드림 리뉴얼 사이트
      siteBase: process.env.NUXT_PUBLIC_SITE_BASE || "https://dev.bbmuseum.co.kr",
    },
  },
  alias: {
    "@kitdata": fileURLToPath(new URL("../nuxt-shootkit/data", import.meta.url)),
  },
  css: ["~/assets/css/app.css"],
  components: false,
  imports: { autoImport: false },
  typescript: { strict: true, tsConfig: { compilerOptions: { noUncheckedIndexedAccess: false, allowJs: true } } },
  experimental: { emitRouteChunkError: false },
  vite: { server: { fs: { allow: [".."] } } },
});
