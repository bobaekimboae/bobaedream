// nuxt generate 결과(.output/public)를 시안 사이트 public/nuxt-carstudio/ 으로 복사한다.
// 기존 GitHub Pages 배포(vite build)가 public/ 을 그대로 올리므로 배포 설정을 바꾸지 않고 함께 올라간다.
import { cpSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
const from = fileURLToPath(new URL("../.output/public", import.meta.url));
const to = fileURLToPath(new URL("../../public/nuxt-carstudio", import.meta.url));
rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });
console.log("copied →", to);
// 차 찾기 계산 파일(wasm, 약 21MB)은 CDN에서 받도록 설정했다(@kit/showroom wasmPaths). 저장소에는 넣지 않는다.
import { readdirSync } from "node:fs";
for (const f of readdirSync(`${to}/_nuxt`)) if (f.endsWith(".wasm")) rmSync(`${to}/_nuxt/${f}`);
