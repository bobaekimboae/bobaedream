#!/usr/bin/env node
// QF-111 지역 칩 시도 → 구·군 흐름 점검(과쯔). PC 1440·1280: 처음 → 서울 → 강남구 → 서초구 → 서초구 해제 → [서울 ×] → 경기 → 수원시 → 세종
// 단계마다 칩 줄 · 지역 줄 이름표 · 선택 알약 · 줄 높이 · 카드 높이 · "필터 N" · 매물 수. 모바일 393·360: 시트 1단계 → 서울 → 2단계 → 강남구(닫힘) → 칩 · 위쪽 표기 · 세종
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
  const pill = (text) => page.locator(".bbm-ct-region-row .stable-pill").filter({ hasText: new RegExp(`^${text}$`) }).first();
  const clear = (text) => page.locator(".bbm-ct-chip-row .filter-chip.is-active").filter({ hasText: new RegExp(`^${text}`) }).locator(".filter-chip-clear").first();
  const steps = [];
  const record = async (name) => {
    await page.waitForTimeout(350);
    const m = await page.evaluate(() => {
      const row = document.querySelector(".bbm-ct-region-row"); const card = document.querySelector(".bbm-hybrid-top .bbm-content-head");
      return {
        label: row.querySelector(".stable-pill-label")?.textContent, selected: [...row.querySelectorAll(".stable-pill.is-selected")].map((p) => p.textContent.trim()),
        chips: [...document.querySelectorAll(".bbm-ct-chip-row .filter-chip.is-active")].map((c) => c.textContent.trim()),
        filter: document.querySelector(".bbm-filter-button")?.textContent.trim(), rowH: row.getBoundingClientRect().height, cardH: card.getBoundingClientRect().height,
        count: Number(document.querySelector(".bbm-ct-title")?.dataset.count ?? -1), empty: /조건에 맞는 차량이 없어요/.test(document.body.textContent),
      };
    });
    steps.push({ name, ...m });
    if (width === 1440) await page.locator(".bbm-hybrid-top").screenshot({ path: join(out, `pc-${steps.length}.png`) });
  };
  await record("처음");
  await pill("서울").click(); await record("서울");
  await pill("강남구").click(); await record("강남구");
  await pill("서초구").click(); await record("서초구");
  await pill("서초구").click(); await record("서초구 해제");
  await clear("서울").click(); await record("[서울 ×]");
  await pill("경기").click(); await record("경기");
  await pill("수원시").click(); await record("수원시");
  await clear("경기").click(); await pill("세종").click(); await record("세종");
  // 제조사 흐름과 섞기: 서울 강남구 + 벤츠 → 서로 영향 없음
  await clear("세종").click(); await pill("서울").click(); await pill("강남구").click();
  await page.locator(".depth-rail .depth-card").filter({ has: page.locator(".depth-card-label", { hasText: /^벤츠$/ }) }).first().click(); await record("강남구 + 벤츠");
  await clear("벤츠").click(); await record("벤츠 ×(지역 유지)");
  result.pc[width] = { steps, errors: errors.length };
  const s = Object.fromEntries(steps.map((x) => [x.name, x]));
  check(`${width} 처음: "지역:" 시도 줄`, s["처음"].label === "지역:", `${s["처음"].label}`);
  check(`${width} 서울: 칩 [서울 ×] · "서울:" · "서울 전체" 선택`, s["서울"].chips.includes("서울") && s["서울"].label === "서울:" && s["서울"].selected.join() === "서울 전체", `${s["서울"].chips.join(" ")} · ${s["서울"].label} · ${s["서울"].selected}`);
  check(`${width} 강남구: 칩 [강남구 ×] 추가 · 줄 유지 · 강남구만 선택`, s["강남구"].chips.includes("강남구") && s["강남구"].label === "서울:" && s["강남구"].selected.join() === "강남구", `${s["강남구"].chips.join(" ")} · ${s["강남구"].selected} · 필터 ${s["강남구"].filter}`);
  check(`${width} 서초구로 바뀜(하나만)`, s["서초구"].chips.includes("서초구") && !s["서초구"].chips.includes("강남구") && s["서초구"].selected.join() === "서초구", `${s["서초구"].chips.join(" ")}`);
  check(`${width} 같은 구·군 다시 → 해제("서울 전체")`, !s["서초구 해제"].chips.includes("서초구") && s["서초구 해제"].selected.join() === "서울 전체", `${s["서초구 해제"].chips.join(" ")}`);
  check(`${width} [서울 ×] → 시도 줄`, !s["[서울 ×]"].chips.some((c) => /서울|서초구/.test(c)) && s["[서울 ×]"].label === "지역:", `${s["[서울 ×]"].chips.join(" ")} · ${s["[서울 ×]"].label}`);
  check(`${width} 경기 → 수원시`, s["수원시"].chips.includes("경기") && s["수원시"].chips.includes("수원시") && s["수원시"].label === "경기:", `${s["수원시"].chips.join(" ")}`);
  check(`${width} 세종: 시도 줄 유지 · 세종 선택`, s["세종"].label === "지역:" && s["세종"].selected.join() === "세종" && s["세종"].chips.includes("세종"), `${s["세종"].label} · ${s["세종"].selected}`);
  const regionSteps = steps.filter((x) => !/벤츠/.test(x.name));
  check(`${width} 줄 높이 항상 32 · 카드 높이 불변`, steps.every((x) => x.rowH === 32) && new Set(regionSteps.map((x) => x.cardH)).size === 1, `줄 ${[...new Set(steps.map((x) => x.rowH))]} · 카드 ${[...new Set(regionSteps.map((x) => x.cardH))]}`);
  check(`${width} "필터 N"에 시도·구·군 각각 포함(강남구 단계 2)`, /2/.test(s["강남구"].filter ?? "") && /1/.test(s["서울"].filter ?? ""), `서울 ${s["서울"].filter} · 강남구 ${s["강남구"].filter}`);
  check(`${width} 제조사 흐름과 섞어도 영향 없음`, s["강남구 + 벤츠"].chips.includes("강남구") && s["강남구 + 벤츠"].chips.includes("벤츠") && s["벤츠 ×(지역 유지)"].chips.includes("강남구") && s["벤츠 ×(지역 유지)"].label === "서울:", `${s["강남구 + 벤츠"].chips.join(" ")} → ${s["벤츠 ×(지역 유지)"].chips.join(" ")}`);
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
