#!/usr/bin/env node
// QF-111 지역 흐름 점검(과쯔). PC 1440·1280: 상단 지역 칩 줄 없음 · 전체 필터 지역 항목 유지.
// 모바일 393·360: 시트 1단계 → 서울 → 2단계 → 강남구(닫힘) → 칩 · 위쪽 표기 · 세종
// 사용: node scripts/region-flow-check.mjs [--base=<주소>] → reports/qf-111/region-flow.json · 캡처 reports/qf-111/*.png
import { chromium, devices } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv.find((a) => a.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const out = join("reports", "qf-111"); mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const result = { pc: {}, m: {} }; let fails = 0;
const check = (name, ok, detail) => { if (!ok) fails += 1; console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };

for (const width of [1440, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } }); const errors = [];
  page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${base}?qf=guazi&pc=1`, { waitUntil: "networkidle" }); await page.waitForTimeout(500);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
  await page.locator(".bbm-category-menu__button").filter({ hasText: /^중고차/ }).first().click(); await page.waitForTimeout(400);
  await page.getByText("필터 더보기", { exact: true }).click(); await page.waitForTimeout(250);
  const state = await page.evaluate(() => ({
    regionRow: Boolean(document.querySelector(".bbm-ct-region-row")),
    fullFilterRegion: [...document.querySelectorAll("aside.bbm-filter .bbm-filter-toggle")].some((el) => el.textContent?.trim() === "지역"),
    cardH: document.querySelector(".bbm-hybrid-top .bbm-content-head")?.getBoundingClientRect().height,
  }));
  result.pc[width] = { state, errors: errors.length };
  if (width === 1440) await page.locator(".bbm-hybrid-top").screenshot({ path: join(out, "pc-region-hidden.png") });
  check(`${width} PC 상단 지역 칩 줄 없음`, !state.regionRow, JSON.stringify(state));
  check(`${width} PC 전체 필터 지역 항목 유지`, state.fullFilterRegion, JSON.stringify(state));
  check(`${width} 콘솔 오류 0`, errors.length === 0, `${errors.length}`);
  await page.close();
}

for (const [tag, viewport] of [["m-393", { width: 393, height: 852 }], ["m-360", { width: 360, height: 780 }]]) {
  const ctx = await browser.newContext({ ...devices["iPhone 13"], viewport, deviceScaleFactor: 2 }); const page = await ctx.newPage(); const errors = [];
  page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${base}?qf=guazi`, { waitUntil: "networkidle" }); await page.waitForTimeout(500);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
  await page.locator(".bbm-category-menu__button").filter({ hasText: /^중고차/ }).first().tap(); await page.waitForTimeout(400);
  const shot = (n) => page.screenshot({ path: join(out, `${tag}-${n}.png`) });
  await page.locator(".region-bar.is-bbm button").first().tap(); await page.waitForTimeout(400);
  const s1 = await page.evaluate(() => ({ title: document.querySelector(".bbmf-sheet-header h3")?.textContent, cells: document.querySelectorAll(".stable-region-cell").length, h: document.querySelector(".stable-region-cell")?.getBoundingClientRect().height, cols: getComputedStyle(document.querySelector(".stable-region-grid")).gridTemplateColumns.split(" ").length }));
  await shot("1-sheet");
  await page.locator(".stable-region-cell").filter({ hasText: /^서울$/ }).tap(); await page.waitForTimeout(400);
  const s2 = await page.evaluate(() => ({ title: document.querySelector(".bbmf-sheet-header h3")?.textContent, selected: [...document.querySelectorAll(".stable-region-cell.is-selected")].map((e) => e.textContent), cells: document.querySelectorAll(".stable-region-cell").length }));
  await shot("2-seoul");
  await page.locator(".bbmf-sheet-back").tap(); await page.waitForTimeout(300);
  const back = await page.evaluate(() => document.querySelector(".bbmf-sheet-header h3")?.textContent);
  await page.locator(".stable-region-cell").filter({ hasText: /^서울$/ }).tap(); await page.waitForTimeout(300);
  await page.locator(".stable-region-cell").filter({ hasText: /^강남구$/ }).tap(); await page.waitForTimeout(500);
  const s3 = await page.evaluate(() => ({ open: Boolean(document.querySelector(".bbmf-sheet")), bar: document.querySelector(".region-bar.is-bbm strong")?.textContent, chips: [...document.querySelectorAll(".filter-shell.is-bbm .filter-chip.is-active")].map((c) => c.textContent.trim()), filter: document.querySelector(".filter-shell.is-bbm .filter-fixed")?.textContent.trim(), regionRow: Boolean(document.querySelector(".bbm-ct-region-row")) }));
  await shot("3-gangnam");
  await page.locator(".filter-shell.is-bbm .filter-chip.is-active").filter({ hasText: /^서울/ }).locator(".filter-chip-clear").first().tap(); await page.waitForTimeout(300);
  const afterClear = await page.evaluate(() => ({ bar: document.querySelector(".region-bar.is-bbm strong")?.textContent, chips: [...document.querySelectorAll(".filter-shell.is-bbm .filter-chip.is-active")].map((c) => c.textContent.trim()) }));
  await page.locator(".region-bar.is-bbm button").first().tap(); await page.waitForTimeout(300);
  await page.locator(".stable-region-cell").filter({ hasText: /^세종$/ }).tap(); await page.waitForTimeout(400);
  const s4 = await page.evaluate(() => ({ open: Boolean(document.querySelector(".bbmf-sheet")), bar: document.querySelector(".region-bar.is-bbm strong")?.textContent }));
  await shot("4-sejong");
  result.m[tag] = { s1, s2, back, s3, afterClear, s4, errors: errors.length };
  check(`${tag} 1단계: 시도 17 + 내 주변 · 3열 · 높이 40`, s1.cells === 18 && s1.cols === 3 && s1.h === 40, JSON.stringify(s1));
  check(`${tag} 서울 → 2단계 "← 서울" · "서울 전체" 선택 · 구·군 25`, /서울/.test(s2.title ?? "") && s2.selected.join() === "서울 전체" && s2.cells === 26, JSON.stringify(s2));
  check(`${tag} "←" → 1단계`, back === "지역", `${back}`);
  check(`${tag} 강남구 → 닫힘 · 칩 [서울 ×][강남구 ×] · "지역: 서울 강남구" · 지역 칩 줄 없음`, !s3.open && s3.chips.includes("서울") && s3.chips.includes("강남구") && s3.bar === "서울 강남구" && !s3.regionRow, JSON.stringify(s3));
  check(`${tag} [서울 ×] → 구·군까지 풀림 · "전국"`, afterClear.bar === "전국" && !afterClear.chips.some((c) => /서울|강남구/.test(c)), JSON.stringify(afterClear));
  check(`${tag} 세종: 1단계에서 바로 적용·닫힘`, !s4.open && s4.bar === "세종", JSON.stringify(s4));
  check(`${tag} 콘솔 오류 0`, errors.length === 0, `${errors.length}`);
  await ctx.close();
}
writeFileSync(join(out, "region-flow.json"), JSON.stringify(result, null, 1));
await browser.close();
console.log(`결과: ${fails ? `실패 ${fails}` : "모두 통과"}`);
process.exitCode = fails ? 1 : 0;
