// 보배드림 카스튜디오(2026-11-03 「폰에 연결된 Car Studio AI를 UI·UX·기능·인터랙션까지 완벽하게 동일하게」).
// 원본: 안드로이드 Car Studio AI 2.0.1(ai.carstudio)의 「Create Video(사진 → 영상)」. 화면 순서 · 입력 항목 · 결과 영상(Classic) 구성을 그대로 옮기고 글은 한국어로 쓴다.
// 리뉴얼 기술 스택: Nuxt 4.6.2 · Vue 3.5.33 · TypeScript 6.0.3 · pnpm. 영상은 브라우저 안에서 만든다(WebCodecs + Mediabunny).
// 배포 주소: https://bobaekimboae.github.io/bobaedream/nuxt-carstudio/
import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  ssr: false,
  devtools: { enabled: false },
  pages: false,
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || "/bobaedream/nuxt-carstudio/",
    head: {
      htmlAttrs: { lang: "ko" },
      title: "보배드림 카스튜디오 · 사진으로 차량 영상 만들기",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#FFFFFF" },
        { name: "description", content: "차량 사진 8~15장으로 릴스·쇼츠·유튜브용 차량 소개 영상을 만듭니다." },
      ],
    },
  },
  alias: {
    "@kit": fileURLToPath(new URL("../nuxt-shootkit/lib", import.meta.url)),
    "@sf": fileURLToPath(new URL("../nuxt-shortform/app/lib", import.meta.url)),
  },
  css: ["~/assets/css/app.css"],
  components: false,
  imports: { autoImport: false },
  typescript: { strict: true, tsConfig: { compilerOptions: { noUncheckedIndexedAccess: false } } },
  experimental: { emitRouteChunkError: false },
  hooks: {
    "build:manifest": (manifest) => {
      for (const key of Object.keys(manifest)) {
        const m = manifest[key];
        if (m) m.prefetch = false;
      }
    },
  },
  vite: { server: { fs: { allow: [".."] } } },
});
