export default defineNuxtConfig({
  compatibilityDate: '2026-10-31',
  devtools: { enabled: false },
  vite: {
    server: {
      allowedHosts: ['terminal.local']
    }
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'ko' },
      title: '보배드림 숏폼 스튜디오',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: '딜러용 사실 기반 중고차 숏폼 자동 제작 검수 키트' },
        { name: 'theme-color', content: '#111827' }
      ],
      link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }]
    }
  },
  nitro: {
    preset: 'node-server'
  },
  typescript: {
    strict: true,
    typeCheck: true
  }
})

