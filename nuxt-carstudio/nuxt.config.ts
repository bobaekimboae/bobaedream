// 보배드림 AI 스튜디오(2026-11-02 「Car Studio AI를 UI · UX · 동작 · 인터랙션까지 그대로 재현 · PC 웹과 모바일 앱 두 가지」).
// 리뉴얼 기술 스택: Nuxt 4.6.2 · Vue 3.5.33 · TypeScript 6.0.3 · pnpm. 서버 없이 브라우저 안에서 동작하는 시안이다.
// - 차 오려 내기: 촬영 키트 쇼룸 배경과 같은 U-2-Netp(Apache-2.0) 모델을 폰 · PC 안에서 돌린다(@kit/showroom).
// - 영상: 촬영 키트 그리기 엔진(@kit/render) + 숏폼 키트 음악(@sf/music).
// - 배경 그림 · 일러스트는 보배드림이 캔버스로 직접 그린다(Car Studio 그림 · 로고는 쓰지 않음).
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
      title: "보배드림 AI 스튜디오",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#0E1B2B" },
        { name: "description", content: "중고차 사진 배경을 바꾸고 번호판을 가리고, 사진으로 매물 소개 영상을 만듭니다." },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-title", content: "AI 스튜디오" },
      ],
      link: [
        { rel: "manifest", href: "manifest.webmanifest" },
        { rel: "icon", href: "icon-192.png" },
        { rel: "apple-touch-icon", href: "apple-touch-icon.png" },
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
  vite: { server: { fs: { allow: [".."] } }, optimizeDeps: { exclude: ["onnxruntime-web"] }, resolve: { dedupe: ["mediabunny", "qrcode-generator", "onnxruntime-web", "vue"] } },
});
