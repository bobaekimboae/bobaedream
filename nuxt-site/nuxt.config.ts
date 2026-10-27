// 보배드림 시안 — 넉스트(Nuxt 3) 판.
// 리액트 시안(src/)의 데이터·계산 로직과 CSS는 복사하지 않고 그대로 불러온다(@proto 별칭). 화면 부품만 Vue로 새로 쓴다.
// 그래서 리액트 판에서 데이터·CSS를 고치면 넉스트 판에도 자동으로 반영된다.
// 배포 주소: https://bobaekimboae.github.io/bobaedream/nuxt/
import { fileURLToPath } from "node:url";

const src = fileURLToPath(new URL("../src", import.meta.url));
const shim = (f: string) => fileURLToPath(new URL(`./shims/${f}`, import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: "2026-08-01",
  ssr: false,
  devtools: { enabled: false },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || "/bobaedream/nuxt/",
    head: {
      htmlAttrs: { lang: "ko" },
      title: "보배드림 · 넉스트",
      // 공용 파일이 불러오기 전에 사이트 맨 위 주소를 정해 둔다(/bobaedream/nuxt/ → /bobaedream/)
      script: [{ innerHTML: 'globalThis.__BBM_SITE_BASE__=new URL("../",document.baseURI).pathname', tagPosition: "head" }],
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#ffffff" },
      ],
    },
  },
  components: false,
  imports: { autoImport: false },
  typescript: { strict: true },
  alias: { "@proto": `${src}/prototype`, "@src": src },
  vite: {
    resolve: {
      alias: [
        
        { find: /^react$/, replacement: shim("react.ts") },
      ],
    },
    // 공용 파일의 import.meta.env.BASE_URL(사이트 맨 위 /bobaedream/)을 실행할 때 계산한다.
    // 글자 그대로 넣으면 배포 단계의 /assets/ 바꾸기가 한 번 더 걸려 경로가 깨진다.
    define: { "import.meta.env.BASE_URL": "globalThis.__BBM_SITE_BASE__" },
    server: { fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] } },
  },
});
