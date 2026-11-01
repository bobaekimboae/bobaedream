// 보배드림 차량 리뷰 · 연비 게시판(2026-11-01 「동처띠 리뷰 게시판과 연비 게시판, 초톳 매물등록처럼 원본 그대로 기능 · 인터랙션 · UI/UX」).
// 원본 = 동처띠(懂车帝) 앱 9.2.9, POCO 24117RK2CG 1080×2400 adb 실측(懂车分 · 能耗 · 车主续航).
// 리뉴얼 기술 스택: Nuxt 4.6.2 · Vue 3.5.33 · TypeScript 6.0.3 · pnpm. 서버 없이 브라우저 안에서 동작하는 시안.
// 주소: https://bobaekimboae.github.io/bobaedream/nuxt-review/?board=review|fuel&view=list|detail|write&id=
import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  ssr: false,
  devtools: { enabled: false },
  pages: false,
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || "/bobaedream/nuxt-review/",
    head: {
      htmlAttrs: { lang: "ko" },
      title: "보배드림 · 차량 리뷰 · 연비",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#F4F5F7" },
        { name: "description", content: "보배드림 커뮤니티 차량 리뷰 · 연비 게시판 시안 — 목록, 상세, 글쓰기" },
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
