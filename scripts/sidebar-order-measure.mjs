#!/usr/bin/env node
// QF-110 과쯔 PC 좌측 필터 제목 순서 · y 위치(1440·1280) + 전체 캡처(1440)
// 사용: node scripts/sidebar-order-measure.mjs <이름표(before|after)> [--base=<주소>] → reports/qf-110/order-<이름표>.json · sidebar-<이름표>-1440.png
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const tag = process.argv[2] ?? "now";
const base = (process.argv.find((a) => a.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const out = join("reports", "qf-110"); mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const result = {};
for (const width of [1440, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${base}?qf=guazi&pc=1`, { waitUntil: "networkidle" }); await page.waitForTimeout(800);
  const rows = await page.evaluate(() => {
    const aside = document.querySelector("aside.bbm-filter"); const top = aside.getBoundingClientRect().top;
    return [...aside.querySelectorAll(".bbm-filter-toggle")].map((t) => { const item = t.closest(".bbm-filter-item"); return { label: t.textContent.trim(), y: Math.round(t.getBoundingClientRect().top - top), open: item?.classList.contains("is-open") ?? null }; });
  });
  result[width] = rows;
  if (width === 1440) {
    // 좌측 필터 전체: 필터 높이만큼 창을 늘려 한 장으로
    const h = await page.evaluate(() => Math.ceil(document.querySelector("aside.bbm-filter").scrollHeight + document.querySelector("aside.bbm-filter").getBoundingClientRect().top + 40));
    await page.setViewportSize({ width, height: Math.min(h, 6000) }); await page.waitForTimeout(500);
    await page.locator("aside.bbm-filter").screenshot({ path: join(out, `sidebar-${tag}-1440.png`) });
  }
  await page.close();
}
writeFileSync(join(out, `order-${tag}.json`), JSON.stringify(result, null, 1));
for (const [w, rows] of Object.entries(result)) console.log(w, rows.slice(0, 10).map((r) => `${r.label}@${r.y}${r.open ? "(열림)" : ""}`).join(" · "), `… 총 ${rows.length}`);
await browser.close();
