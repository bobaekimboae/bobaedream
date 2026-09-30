#!/usr/bin/env node
// QF-120 첫 화면 로딩 시간 전후. 같은 빌드·같은 서버에서 "전" = 과쯔 글꼴 파일(/fonts/pretendard/) 차단(= 작업 전 동작),
// "후" = 그대로. 네트워크는 CDP 로 느린 4G(10Mbps · 지연 40ms) 흉내, 캐시 없이 3회 중앙값.
// 재는 값: DOMContentLoaded · load · 글꼴 준비(document.fonts.ready) · 과쯔 글꼴 요청 수·바이트
// 사용: node scripts/font-load-measure.mjs [--base=<주소>] → reports/qf-120/font-load.json
import { chromium, devices } from "@playwright/test";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv.find((a) => a.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const out = join("reports", "qf-120"); mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const median = (list) => { const s = [...list].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const result = {};
for (const [name, opts, query] of [["PC 1440", { viewport: { width: 1440, height: 900 } }, "?qf=guazi&pc=1"], ["모바일 393", { ...devices["iPhone 13"], viewport: { width: 393, height: 852 } }, "?qf=guazi"]]) {
  for (const tag of ["전", "후"]) {
    const runs = [];
    for (let i = 0; i < 3; i += 1) {
      const ctx = await browser.newContext(opts); const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send("Network.enable"); await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 40, downloadThroughput: (10 * 1024 * 1024) / 8, uploadThroughput: (5 * 1024 * 1024) / 8 });
      if (tag === "전") await page.route(/\/fonts\/pretendard\//, (route) => route.abort());
      let bytes = 0; let count = 0;
      // 바이트는 받은 조각 파일 크기(public/assets/fonts/pretendard/…)로 셈(woff2 는 이미 압축돼 전송 크기와 거의 같음)
      page.on("response", (res) => { const m = res.url().match(/\/fonts\/pretendard\/(woff2-dynamic-subset\/[^/?]+\.woff2)/); if (m && res.ok()) { count += 1; bytes += statSync(join("public", "assets", "fonts", "pretendard", m[1])).size; } });
      await page.goto(base + query, { waitUntil: "load" });
      const t = await page.evaluate(async () => { await document.fonts.ready; const nav = performance.getEntriesByType("navigation")[0]; return { dcl: nav.domContentLoadedEventEnd, load: nav.loadEventEnd, fonts: performance.now() }; });
      await page.waitForTimeout(500);
      runs.push({ ...t, count, bytes });
      await ctx.close();
    }
    result[`${name} ${tag}`] = { dcl: Math.round(median(runs.map((r) => r.dcl))), load: Math.round(median(runs.map((r) => r.load))), fontsReady: Math.round(median(runs.map((r) => r.fonts))), fontFiles: median(runs.map((r) => r.count)), fontKB: Math.round(median(runs.map((r) => r.bytes)) / 1024) };
    console.log(`${name} ${tag}: DOMContentLoaded ${result[`${name} ${tag}`].dcl}ms · load ${result[`${name} ${tag}`].load}ms · 글꼴 준비 ${result[`${name} ${tag}`].fontsReady}ms · 글꼴 ${result[`${name} ${tag}`].fontFiles}개 ${result[`${name} ${tag}`].fontKB}KB`);
  }
}
writeFileSync(join(out, "font-load.json"), JSON.stringify(result, null, 1));
await browser.close();
