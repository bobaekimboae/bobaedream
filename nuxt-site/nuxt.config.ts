// 보배드림 시안 — 넉스트(Nuxt 3) 판.
// 리액트 시안(src/)의 데이터·계산 로직과 CSS는 복사하지 않고 그대로 불러온다(@proto 별칭). 화면 부품만 Vue로 새로 쓴다.
// 그래서 리액트 판에서 데이터·CSS를 고치면 넉스트 판에도 자동으로 반영된다.
// 배포 주소: https://bobaekimboae.github.io/bobaedream/nuxt/
import { fileURLToPath } from "node:url";

const src = fileURLToPath(new URL("../src", import.meta.url));
const baseURL = process.env.NUXT_APP_BASE_URL || "/bobaedream/nuxt/";
// 공용 파일은 리액트 판(/bobaedream/)에서 쓰던 상대 주소를 그대로 쓴다. 그래서 문서의 기준 주소를 사이트 맨 위로 둔다.
const siteBase = baseURL.replace(/nuxt\/$/, "");
const shim = (f: string) => fileURLToPath(new URL(`./shims/${f}`, import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: "2026-08-01",
  ssr: false,
  devtools: { enabled: false },
  app: {
    baseURL,
    // 리액트 판(src/main.tsx)은 #root 에 그린다. 공용 CSS(styles.css · base.css)가 #root 를 쓰므로 같은 id 로 둔다.
    rootAttrs: { id: "root" },
    head: {
      htmlAttrs: { lang: "ko" },
      title: "보배드림 · 넉스트",
      // 공용 파일이 불러오기 전에 사이트 맨 위 주소를 정해 둔다(/bobaedream/nuxt/ → /bobaedream/)
      base: { href: siteBase },
      script: [{ innerHTML: `globalThis.__BBM_SITE_BASE__=${JSON.stringify(siteBase)}`, tagPosition: "head" }],
      // 리액트 index.html 과 같이 공용 덮어쓰기 CSS · 파비콘을 붙인다(문서 기준 주소가 사이트 맨 위라 상대 주소로 쓴다)
      link: [
        { rel: "icon", type: "image/svg+xml", href: "assets/bbm/favicon.svg" },
        { rel: "stylesheet", href: "assets/detail-title-override.css" },
      ],
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
        { find: /^react-dom(\/client)?$/, replacement: shim("react-dom.ts") },
      ],
    },
    // 공용 파일의 import.meta.env.BASE_URL(사이트 맨 위 /bobaedream/)을 실행할 때 계산한다.
    // 글자 그대로 넣으면 배포 단계의 /assets/ 바꾸기가 한 번 더 걸려 경로가 깨진다.
    define: { "import.meta.env.BASE_URL": "globalThis.__BBM_SITE_BASE__" },
    server: { fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] } },
  },
});
