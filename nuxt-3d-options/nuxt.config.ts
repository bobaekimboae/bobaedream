export default defineNuxtConfig({
  compatibilityDate: '2026-10-31',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'ko' },
      title: '보배드림 3D 옵션 오토모션',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#ffffff' },
        { name: 'description', content: '실제 매물 데이터와 촬영 영상을 연결하는 차량 3D 기능 설명 자동화 시안' }
      ]
    }
  },
  nitro: { preset: 'node-server' },
  vite: {
    optimizeDeps: {
      include: ['three']
    }
  },
  typescript: { strict: true, typeCheck: true }
})
