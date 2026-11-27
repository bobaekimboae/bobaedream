import process from 'node:process'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  ssr: false,
  pages: false,
  devtools: { enabled: false },
  css: ['~/assets/css/history.css'],
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/bobaedream/vehicle-history/',
    head: {
      htmlAttrs: { lang: 'ko' },
      title: '보배드림 차량이력조회',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0b1220' },
        { name: 'description', content: '보배드림 딜러 차량이력 조회 · 보험·등록·검사·정비 이력 확인' },
      ],
    },
  },
  runtimeConfig: {
    public: { historyApiUrl: 'https://staging.bbmuseum.co.kr/v1/test/vehicle-history' },
  },
  typescript: { strict: true },
  nitro: { preset: 'static' },
})
