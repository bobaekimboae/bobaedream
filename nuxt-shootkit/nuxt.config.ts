// 보배드림 촬영 쇼츠 키트 — 넉스트(Nuxt 3) 판.
// 리액트 시안(?register=shootkit)과 같은 화면 · 같은 동작을 Vue 컴포넌트로 옮겼다. 실제 등록 · 업로드 요청은 보내지 않는다.
// 카메라 · 녹화 · 캔버스를 쓰는 화면이라 서버 렌더링 없이(ssr: false) 브라우저에서만 그린다.
// 배포 주소: https://bobaekimboae.github.io/bobaedream/nuxt-shootkit/ (아이콘 · 예시 사진은 기존 시안 사이트 /bobaedream/ 의 파일을 그대로 쓴다)
export default defineNuxtConfig({
  compatibilityDate: "2026-08-01",
  ssr: false,
  devtools: { enabled: false },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || "/bobaedream/nuxt-shootkit/",
    head: {
      htmlAttrs: { lang: "ko" },
      title: "보배드림 촬영 · 넉스트",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#000000" },
      ],
    },
  },
  css: ["~/assets/css/base.css", "~/assets/css/shoot.css", "~/assets/css/shorts.css", "~/assets/css/shortform-studio.css"],
  // 나중에 불러오는 조각(mp4 · 인식기)을 못 받아도 페이지를 새로 고치지 않는다(찍어 둔 사진·영상이 날아가지 않게)
  experimental: { emitRouteChunkError: false },
  components: false,
  imports: { autoImport: false },
  typescript: { strict: true },
  vite: {
    optimizeDeps: { exclude: ["@huggingface/transformers"] },
  },
});
