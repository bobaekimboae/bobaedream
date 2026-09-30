#!/usr/bin/env node
// QF-120 글꼴 바뀜 영향 점검: 작업 전(--before, 기본 배포본)과 작업 후(--base, 로컬)를 같은 상태로 열어
// ① 글자 요소마다 높이(줄 수)·잘림(scrollWidth > clientWidth) 비교 → 줄바꿈이 바뀐 곳·새로 넘친 곳 목록
// ② 같은 위치 캡처(reports/qf-120/caps/<폭>-<상태>-{before,after}.png)
// 상태: 첫 화면 · 벤츠(모델 레일) · PC 좌측 필터 · 전체 브랜드 창 · 주행거리(모바일 시트 / PC 사이드바) · 매물 카드
// 사용: node scripts/font-impact-check.mjs [--base=<후>] [--before=<전>] → reports/qf-120/font-impact.json
import { chromium, devices } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const arg = (name, fallback) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? "").slice(name.length + 3) || fallback;
const after = arg("base", "http://127.0.0.1:4173/bobaedream/");
const before = arg("before", "https://bobaekimboae.github.io/bobaedream/");
const out = join("reports", "qf-120"); const caps = join(out, "caps"); mkdirSync(caps, { recursive: true });
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });

const SIZES = [
  { key: "pc-1440", pc: true, opts: { viewport: { width: 1440, height: 900 } } },
  { key: "pc-1280", pc: true, opts: { viewport: { width: 1280, height: 800 } } },
  { key: "m-393", pc: false, opts: { ...devices["iPhone 13"], viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 } },
  { key: "m-360", pc: false, opts: { ...devices["iPhone 13"], viewport: { width: 360, height: 780 }, deviceScaleFactor: 2 } },
];
const click = async (page, pc, locator) => { if (pc) await locator.click(); else await locator.tap(); };
const card = (page, label) => page.locator(".depth-rail .depth-card").filter({ has: page.locator(".depth-card-label", { hasText: new RegExp(`^${label}$`) }) }).first();
const useUsed = async (page, pc) => { await click(page, pc, page.locator(".bbm-category-menu__button").filter({ hasText: /^중고차/ }).first()); await page.waitForTimeout(500); };
const STATES = [
  { key: "first", run: async () => {} },
  { key: "makers", run: async (page, pc) => { await useUsed(page, pc); } },
  { key: "benz", run: async (page, pc) => { await useUsed(page, pc); await click(page, pc, card(page, "벤츠")); await page.waitForTimeout(500); } },
  { key: "allbrands", run: async (page, pc) => { await useUsed(page, pc); await click(page, pc, card(page, "전체 브랜드")); await page.waitForTimeout(500); } },
  { key: "mileage", run: async (page, pc) => {
    if (pc) { await page.locator("aside.bbm-filter .bbm-filter-toggle").filter({ hasText: /^주행거리/ }).first().click(); await page.waitForTimeout(400); await page.evaluate(() => { const m = document.querySelector("aside.bbm-filter > .bbm-filter-menu"); const t = [...m.querySelectorAll(".bbm-filter-toggle")].find((b) => /^주행거리/.test(b.textContent.trim())); m.scrollTop += t.getBoundingClientRect().top - m.getBoundingClientRect().top - 40; }); }
    else { await page.locator(".filter-shell.is-bbm .filter-fixed").tap(); await page.waitForTimeout(400); await page.locator(".bbmf-full button, .bbmf-full-item").filter({ hasText: /^주행거리/ }).first().tap(); }
    await page.waitForTimeout(500);
  } },
  { key: "cards", run: async (page) => { await page.evaluate(() => { const s = document.querySelector(".mobile-scroll"); const c = document.querySelector(".bbm-card, .bbm-m-card, article"); if (s && c) s.scrollTop += c.getBoundingClientRect().top - s.getBoundingClientRect().top - 8; }); await page.waitForTimeout(400); } },
];

// 화면 안 글자 요소 목록(같은 순서·같은 글자로 짝 맞춤)
const collect = (page) => page.evaluate(() => {
  const items = [];
  const seen = new Map();
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest(".build-badge, .qf-debug-overlay, svg")) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
    if (!own) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    const cs = getComputedStyle(el);
    const cls = (el.className && typeof el.className === "string" ? el.className.split(" ")[0] : el.tagName.toLowerCase());
    const id = `${cls}|${own.slice(0, 30)}`;
    const n = (seen.get(id) ?? 0) + 1; seen.set(id, n);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
    const clipped = (cs.overflow.includes("hidden") || cs.textOverflow === "ellipsis" || cs.webkitLineClamp !== "none") && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    items.push({ id: `${id}#${n}`, text: own.slice(0, 40), w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, lines: Math.round(r.height / lh), clipped, weight: cs.fontWeight });
  }
  return items;
});

const report = { before, after, sizes: {} };
for (const size of SIZES) {
  report.sizes[size.key] = {};
  for (const state of STATES) {
    const got = {};
    for (const [tag, base] of [["before", before], ["after", after]]) {
      const ctx = await browser.newContext(size.opts); const page = await ctx.newPage();
      await page.goto(`${base}?qf=guazi${size.pc ? "&pc=1" : ""}`, { waitUntil: "networkidle" }); await page.waitForTimeout(700);
      await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}" });
      try { await state.run(page, size.pc); } catch (error) { got[tag] = { error: String(error).slice(0, 120) }; await ctx.close(); continue; }
      await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
      await page.screenshot({ path: join(caps, `${size.key}-${state.key}-${tag}.png`) });
      got[tag] = { items: await collect(page) };
      await ctx.close();
    }
    if (got.before?.error || got.after?.error) { report.sizes[size.key][state.key] = { error: got.before?.error ?? got.after?.error }; console.log(`${size.key} ${state.key}: 열지 못함 ${got.before?.error ?? got.after?.error}`); continue; }
    const map = new Map(got.before.items.map((i) => [i.id, i]));
    const wrapChanged = []; const newlyClipped = []; let widthSum = 0; let widthN = 0;
    for (const item of got.after.items) {
      const prev = map.get(item.id); if (!prev) continue;
      if (prev.lines !== item.lines) wrapChanged.push(`${item.text} ${prev.lines}→${item.lines}줄`);
      if (!prev.clipped && item.clipped) newlyClipped.push(item.text);
      if (prev.w > 0) { widthSum += item.w / prev.w; widthN += 1; }
    }
    const allClipped = got.after.items.filter((i) => i.clipped).map((i) => i.text);
    report.sizes[size.key][state.key] = { wrapChanged, newlyClipped, clippedAfter: allClipped, avgWidthRatio: widthN ? Math.round((widthSum / widthN) * 1000) / 1000 : null, matched: widthN };
    console.log(`${size.key} ${state.key}: 짝 ${widthN} · 평균 글자 폭 ${widthN ? Math.round((widthSum / widthN) * 1000) / 10 : "-"}% · 줄 수 바뀜 ${wrapChanged.length} · 새로 잘림 ${newlyClipped.length}${wrapChanged.length ? ` [${wrapChanged.slice(0, 6).join(" / ")}]` : ""}${newlyClipped.length ? ` {${newlyClipped.slice(0, 6).join(" / ")}}` : ""}`);
  }
}
writeFileSync(join(out, "font-impact.json"), JSON.stringify(report, null, 1));
await browser.close();
