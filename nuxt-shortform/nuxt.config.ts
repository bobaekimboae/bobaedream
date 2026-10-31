// 보배드림 숏폼 자동 제작 키트(2026-10-31 「사진만으로 숏폼 자동 제작 · autohaus-video와 같은 기능·화면으로 먼저 만들고 커스텀」).
// 리뉴얼 기술 스택: Nuxt 4.6.2 · Vue 3.5.33 · TypeScript 6.0.3 · pnpm. 서버 없이 브라우저 안에서 mp4를 만든다(WebCodecs + Mediabunny).
// 영상 그리기 엔진은 촬영 키트(nuxt-shootkit/lib/render.ts)를 그대로 불러 쓴다(@kit). 엔진을 고치면 두 앱이 함께 바뀐다.
// 배포 주소: https://bobaekimboae.github.io/bobaedream/nuxt-shortform/
import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  ssr: false,
  devtools: { enabled: false },
  pages: false,
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || "/bobaedream/nuxt-shortform/",
    head: {
      htmlAttrs: { lang: "ko" },
      title: "보배드림 숏폼 · 사진으로 쇼츠 만들기",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#14161A" },
        { name: "description", content: "매물 사진만 올리면 릴스·틱톡·쇼츠용 세로 영상을 바로 만들어 줍니다." },
      ],
    },
  },
  alias: { "@kit": fileURLToPath(new URL("../nuxt-shootkit/lib", import.meta.url)) },
  css: ["~/assets/css/app.css"],
  components: false,
  imports: { autoImport: false },
  // 촬영 키트 엔진(@kit)은 Nuxt 3 규칙(배열 칸 검사 끔)으로 쓰였다: 같은 규칙으로 맞춘다
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
