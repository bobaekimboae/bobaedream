export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/bobaedream/nuxt-community/',
    head: {
      htmlAttrs: { lang: 'ko' },
      title: '보배드림 커뮤니티',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#ffffff' },
        { name: 'description', content: '보배드림 커뮤니티 모바일 게시판과 글쓰기' },
      ],
    },
  },
  runtimeConfig: {
    public: {
      communityApiBase: process.env.NUXT_PUBLIC_COMMUNITY_API_BASE || '',
    },
  },
  nitro: { preset: 'static' },
  typescript: { strict: true, typeCheck: true },
})
