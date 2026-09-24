#!/usr/bin/env node
// QF-092: 회귀 점검 — 초톳·동처띠 모드와 초톳형 PC를 직전 배포본(GitHub Pages)과 같은 크기·같은 상태로 찍어 화면 전체 픽셀 차이 비율을 낸다.
// 사용: npm run regress:modes (vite preview 127.0.0.1:4173 필요) · 기준 주소 바꾸기: REGRESS_BASE=<배포 주소>
// 출력: reports/diff/<커밋>/regress/summary.json · <이름>.png(배포본 | 지금 | 차이) — 커밋하지 않음
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.REGRESS_BASE ?? "https://bobaekimboae.github.io/bobaedream/";
const OURS = process.env.REGRESS_OURS ?? "http://127.0.0.1:4173/bobaedream/";
const commit = (() => { try { const hash = execSync("git rev-parse --short HEAD").toString().trim(); const dirty = execSync("git status --porcelain").toString().trim(); return dirty ? `${hash}-dirty` : hash; } catch { return "local"; } })();
const outDir = join("reports", "diff", commit, "regress");
mkdirSync(outDir, { recursive: true });

const mobile = { viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true };
const pc = { viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 };
// 목록 끝까지 내린 화면도 본다(과쯔 전용 페이지 이동·푸터가 다른 모드에 새지 않았는지)
const toBottom = (page) => page.evaluate(() => { const scroller = document.querySelector(".mobile-scroll"); if (scroller) scroller.scrollTop = scroller.scrollHeight; else window.scrollTo(0, document.documentElement.scrollHeight); });
const CASES = [
  ["chotot-m-first", "?qf=chotot", mobile], ["chotot-m-bottom", "?qf=chotot", mobile, toBottom],
  ["dongchedi-m-first", "?qf=dongchedi", mobile], ["dongchedi-m-bottom", "?qf=dongchedi", mobile, toBottom],
  ["chotot-pcl-first", "?qf=chotot&pc=1&pcl=chotot", pc], ["chotot-pcl-bottom", "?qf=chotot&pc=1&pcl=chotot", pc, toBottom],
  ["chotot-pc-first", "?qf=chotot&pc=1", pc], ["chotot-pc-bottom", "?qf=chotot&pc=1", pc, toBottom],
  ["dongchedi-pc-first", "?qf=dongchedi&pc=1", pc], ["dongchedi-pc-bottom", "?qf=dongchedi&pc=1", pc, toBottom],
];

const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const tool = await browser.newPage();
const shoot = async (url, device, action) => {
  const context = await browser.newContext(device);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}" });
  if (action) { await action(page); await page.waitForTimeout(700); }
  const shot = (await page.screenshot()).toString("base64");
  await context.close();
  return { shot, errors };
};
const summary = { base: BASE, commit, measuredAt: new Date().toISOString(), cases: {} };
for (const [name, query, device, action] of CASES) {
  const [before, after] = await Promise.all([shoot(`${BASE}${query}`, device, action), shoot(`${OURS}${query}`, device, action)]);
  const result = await tool.evaluate(async ([a64, b64]) => {
    const load = (b64) => new Promise((resolve) => { const image = new Image(); image.onload = () => resolve(image); image.src = `data:image/png;base64,${b64}`; });
    const [a, b] = await Promise.all([load(a64), load(b64)]);
    const w = a.width; const h = a.height;
    const canvas = (image) => { const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(image, 0, 0); return c; };
    const ca = canvas(a); const cb = canvas(b);
    const da = ca.getContext("2d").getImageData(0, 0, w, h).data; const db = cb.getContext("2d").getImageData(0, 0, w, h).data;
    const out = document.createElement("canvas"); out.width = w * 3 + 16; out.height = h;
    const octx = out.getContext("2d"); octx.fillStyle = "#fff"; octx.fillRect(0, 0, out.width, h); octx.drawImage(ca, 0, 0); octx.drawImage(cb, w + 8, 0);
    const diff = octx.createImageData(w, h); let differing = 0;
    for (let i = 0; i < da.length; i += 4) {
      const delta = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      const gray = (da[i] + da[i + 1] + da[i + 2]) / 3;
      if (delta > 48) { differing += 1; diff.data.set([230, 30, 30, 255], i); } else diff.data.set([gray, gray, gray, 70], i);
    }
    octx.putImageData(diff, w * 2 + 16, 0);
    return { ratio: differing / (w * h), image: out.toDataURL("image/png").split(",")[1] };
  }, [before.shot, after.shot]);
  writeFileSync(join(outDir, `${name}.png`), Buffer.from(result.image, "base64"));
  summary.cases[name] = { diff: Math.round(result.ratio * 10000) / 100, errorsBefore: before.errors.length, errorsNow: after.errors.length, errors: after.errors.slice(0, 3) };
  console.log(`${name.padEnd(20)} ${String(summary.cases[name].diff).padStart(6)}%  콘솔 오류 배포본 ${before.errors.length} / 지금 ${after.errors.length}`);
}
writeFileSync(join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
await browser.close();
console.log(`결과: ${join(outDir, "summary.json")}`);
