#!/usr/bin/env node
// QF-103: 과쯔 퀵필터 줄 위아래 간격 실측 — 단계(제조사 → 모델 → 세부모델 → 트림 → 닫힘)마다 줄 상자·칸 높이, 칸 넘침, 칸 아래 → 상단 카드 끝(PC) / 줄 상자 위·아래 여백(모바일), 줄이 닫혔을 때 칩 줄 아래 → 카드 끝
// 사용: npm run check:rail-vertical [-- --base=<주소>] [-- --mode=card] [-- --out=<json>]
// 판정: PC 줄 상자 = 칸 높이 · 넘침 0 · 칩 → 칸 18 · 칸 아래 → 카드 끝 16 · 닫힘 칩 줄 아래 → 카드 끝 16 / 모바일 위 2 · 아래 6 · 넘침 0 / 콘솔 오류 0
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
const arg = (name) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? "").slice(name.length + 3);
const base = arg("base") || "http://127.0.0.1:4173/bobaedream/"; const mode = arg("mode"); const out = arg("out");
const b = await chromium.launch();
const result = {};
for (const [tag, vp, pc] of [["pc-1440", { width: 1440, height: 900 }, true], ["pc-1280", { width: 1280, height: 720 }, true], ["m-393", { width: 393, height: 852 }, false], ["m-360", { width: 360, height: 780 }, false]]) {
  const ctx = await b.newContext({ viewport: vp, ...(pc ? {} : { isMobile: true, hasTouch: true }) }); const p = await ctx.newPage(); const errors = [];
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await p.goto(`${base}?qf=guazi${pc ? "&pc=1" : ""}${mode ? `&qfcard=${mode}` : ""}`, { waitUntil: "networkidle" }); await p.waitForTimeout(300);
  await p.addStyleTag({ content: "*{transition:none!important;animation:none!important}" });
  const click = async (l) => { await (pc ? l.click() : l.tap()); await p.waitForTimeout(400); };
  const card = (l) => p.locator("section.depth-rail .depth-card").filter({ has: p.locator(".depth-card-label", { hasText: new RegExp(`^${l}$`) }) }).first();
  const measure = (step) => p.evaluate((step) => {
    const rail = document.querySelector("section.depth-rail"); const top = document.querySelector(".bbm-hybrid-top .bbm-content-head") ?? document.querySelector(".bbm-hybrid-top");
    const chips = [...document.querySelectorAll(".filter-chip, .bbm-filter-button, .filter-fixed")].filter((c) => c.getBoundingClientRect().width && (!rail || c.getBoundingClientRect().bottom <= rail.getBoundingClientRect().top + 1));
    const chipBottom = Math.max(...chips.map((c) => c.getBoundingClientRect().bottom));
    const topRect = document.querySelector(".bbm-hybrid-top")?.getBoundingClientRect();
    const r = (v) => Math.round(v * 10) / 10;
    if (!rail) return { step, rail: null, topCard: topRect ? r(topRect.height) : null, chipToCardEnd: topRect ? r(topRect.bottom - chipBottom) : null };
    const rr = rail.getBoundingClientRect(); const cells = [...rail.querySelectorAll(".depth-card, .trim-chip")].map((c) => c.getBoundingClientRect());
    const cellTop = Math.min(...cells.map((c) => c.top)); const cellBottom = Math.max(...cells.map((c) => c.bottom));
    const scroller = rail.querySelector(".brand-carousel, [class*=carousel]"); const sc = scroller ? getComputedStyle(scroller) : null;
    const scrollEl = [...rail.querySelectorAll("*")].find((e) => e.scrollWidth > e.clientWidth + 1 && ["auto", "scroll"].includes(getComputedStyle(e).overflowX));
    return { step, kind: rail.classList.contains("is-trim-row") ? "trim" : rail.getAttribute("aria-label"), railBox: r(rr.height), cellH: r(cellBottom - cellTop), overflowTop: r(rr.top - cellTop), overflowBottom: r(cellBottom - rr.bottom), padTop: r(cellTop - rr.top), padBottom: r(rr.bottom - cellBottom), chipToCell: r(cellTop - chipBottom), cellToCardEnd: topRect ? r(topRect.bottom - cellBottom) : null, topCard: topRect ? r(topRect.height) : null, scrollbar: scrollEl ? `${getComputedStyle(scrollEl).scrollbarWidth}/${scrollEl.offsetHeight - scrollEl.clientHeight}px` : "스크롤 없음" };
  }, step);
  const steps = [];
  await click(p.locator(".bbm-category-menu__button").filter({ hasText: /^중고차/ }).first()); steps.push(await measure("제조사"));
  await click(card("벤츠")); steps.push(await measure("모델(벤츠)"));
  await click(card("C클래스")); steps.push(await measure("세부모델(C클래스)"));
  await click(card("W206")); steps.push(await measure("트림(W206)"));
  await click(p.locator("section.depth-rail.is-trim-row .trim-chip").filter({ hasText: /^C200$/ }).first()); steps.push(await measure("닫힘(C200)"));
  result[tag] = { steps, errors: errors.length };
  await ctx.close();
}
await b.close();
if (out) writeFileSync(out, JSON.stringify(result, null, 1));
let failed = 0;
const check = (name, ok, detail) => { if (!ok) failed += 1; console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };
for (const [tag, r] of Object.entries(result)) {
  const pc = tag.startsWith("pc"); const rails = r.steps.filter((step) => step.railBox !== undefined); const closed = r.steps.find((step) => step.rail === null);
  const label = `${tag}${mode ? ` (${mode})` : " (plain)"}`;
  check(`${label} 넘침 0`, rails.every((step) => step.overflowTop <= 0.5 && step.overflowBottom <= 0.5), rails.map((step) => `${step.step} ${step.cellH}/${step.railBox}`).join(" · "));
  if (pc) {
    check(`${label} 줄 상자 = 칸 높이 · 칩 → 칸 18 · 칸 아래 → 카드 끝 16`, rails.every((step) => Math.abs(step.railBox - step.cellH) <= 0.5 && Math.abs(step.chipToCell - 18) <= 0.6 && Math.abs(step.cellToCardEnd - 16) <= 0.6), rails.map((step) => `${step.step} 상자 ${step.railBox} 칩→칸 ${step.chipToCell} 칸→끝 ${step.cellToCardEnd}`).join(" · "));
    check(`${label} 줄이 닫히면 칩 줄 아래 → 카드 끝 16`, closed && Math.abs(closed.chipToCardEnd - 16) <= 0.6, `${closed?.chipToCardEnd} (카드 ${closed?.topCard})`);
  } else {
    check(`${label} 줄 상자 위 2 · 칸 아래 6`, rails.every((step) => Math.abs(step.padTop - 2) <= 0.6 && Math.abs(step.padBottom - 6) <= 0.6), rails.map((step) => `${step.step} ${step.padTop}/${step.padBottom}`).join(" · "));
  }
  check(`${label} 콘솔 오류 0`, r.errors === 0, String(r.errors));
}
console.log(`결과: 통과 ${Object.keys(result).length * 3 + Object.keys(result).filter((t) => t.startsWith("pc")).length - failed}/${Object.keys(result).length * 3 + Object.keys(result).filter((t) => t.startsWith("pc")).length}`);
process.exitCode = failed ? 1 : 0;
