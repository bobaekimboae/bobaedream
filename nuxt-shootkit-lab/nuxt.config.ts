export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  ssr: false,
  devtools: { enabled: false },
  app: {
    baseURL: "/bobaedream/nuxt-shootkit-lab/",
    head: {
      htmlAttrs: { lang: "ko" },
      title: "보배드림 촬영키트 Lab",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#2563eb" },
        { name: "description", content: "기존 촬영키트와 분리된 보배드림 촬영 경험 실험판" },
      ],
    },
  },
  css: ["~/assets/css/main.css"],
  typescript: { strict: true, typeCheck: true },
});
