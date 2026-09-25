#!/usr/bin/env node
// QF-093: PC 혼합 배치 수치·동작 점검(원본에 없는 배치라 픽셀 대조 대신 수치로 확인).
// 사용: npm run check:hybrid [-- --base=<주소>] (기본 vite preview 127.0.0.1:4173)
// 출력: reports/diff/<커밋>/hybrid/summary.json · 캡처 PNG(1440 첫 화면 · 1440 스크롤 후 · 1280 · 1100 펼침판) — 커밋하지 않음
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv.find((arg) => arg.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const url = `${base}?qf=guazi&pc=1`;
const commit = (() => { try { const hash = execSync("git rev-parse --short HEAD").toString().trim(); const dirty = execSync("git status --porcelain").toString().trim(); return dirty ? `${hash}-dirty` : hash; } catch { return "local"; } })();
const outDir = join("reports", "diff", commit, "hybrid");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const summary = { url, commit, measuredAt: new Date().toISOString(), widths: {}, checks: [] };
const check = (name, ok, detail) => { summary.checks.push({ name, ok, detail }); console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };

const open = async (width, height = 900) => {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}" });
  return { context, page, errors };
};
const layout = (page) => page.evaluate(() => {
  const box = (selector) => { const element = document.querySelector(selector); if (!element || !element.getClientRects().length) return null; const r = element.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; };
  const scroller = document.querySelector(".mobile-scroll");
  return {
    pc: Boolean(document.querySelector(".marketplace.is-bbm")), mobile: Boolean(document.querySelector(".is-bbm-m")),
    top: box(".bbm-hybrid-top") ?? box(".bbm-content-head"), filter: box(".bbm-page > .bbm-filter"), list: box(".bbm-content"), toolbar: box(".bbm-toolbar"),
    overflowX: Math.max(scroller ? scroller.scrollWidth - scroller.clientWidth : 0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    filterChipDisabled: document.querySelector(".bbm-filter-button")?.getAttribute("aria-disabled") === "true",
  };
});
const scrollTo = (page, top) => page.evaluate((top) => { const scroller = document.querySelector(".mobile-scroll"); if (scroller) scroller.scrollTop = top; else window.scrollTo(0, top); }, top);
// 퀵필터 레일에서 완전히 보이는 카드 수(차량 유형 "중고차" → 제조사 레일)
const railCards = async (page) => {
  const button = page.locator(".bbm-category-menu__button, .bbm-category-menu button").filter({ hasText: /^중고차/ }).first();
  if (await button.count()) { await button.click(); await page.waitForTimeout(700); }
  return page.evaluate(() => {
    const rail = document.querySelector(".bbm-quick-slot .depth-rail, .bbm-quick-slot [class*=rail]") ?? document.querySelector(".bbm-quick-slot");
    const r = rail.getBoundingClientRect();
    const cards = [...document.querySelectorAll(".bbm-quick-slot .depth-card")].map((card) => card.getBoundingClientRect());
    return { railWidth: Math.round(r.width), full: cards.filter((c) => c.left >= r.left - 0.5 && c.right <= r.right + 0.5).length, partial: cards.filter((c) => c.right > r.left && c.left < r.right).length, total: cards.length };
  });
};

// 폭별 배치
for (const width of [1440, 1280, 1279, 1100, 1024, 1023]) {
  const { context, page, errors } = await open(width);
  const info = await layout(page);
  summary.widths[width] = { ...info, consoleErrors: errors.length };
  if (width === 1440 || width === 1280) await page.screenshot({ path: join(outDir, `${width}-first.png`) });
  if (width === 1440 || width === 1280) summary.widths[width].rail = await railCards(page);
  await context.close();
}
const w = summary.widths;
check("1440 상단 영역 x 120 · 폭 1200", w[1440].top?.x === 120 && w[1440].top?.w === 1200, JSON.stringify(w[1440].top));
check("1280 상단 영역 x 40 · 폭 1200", w[1280].top?.x === 40 && w[1280].top?.w === 1200, JSON.stringify(w[1280].top));
check("1440 좌측 필터 x 120 · 폭 300 / 목록 x 444 · 폭 876", w[1440].filter?.x === 120 && w[1440].filter?.w === 300 && w[1440].list?.x === 444 && w[1440].list?.w === 876, `필터 ${JSON.stringify(w[1440].filter)} 목록 ${JSON.stringify(w[1440].list)}`);
check("1280 좌측 필터 x 40 · 폭 300 / 목록 x 364 · 폭 876", w[1280].filter?.x === 40 && w[1280].filter?.w === 300 && w[1280].list?.x === 364 && w[1280].list?.w === 876, `필터 ${JSON.stringify(w[1280].filter)} 목록 ${JSON.stringify(w[1280].list)}`);
check("좌측 필터 윗선 = 목록 툴바 윗선(1440·1280)", w[1440].filter?.y === w[1440].toolbar?.y && w[1280].filter?.y === w[1280].toolbar?.y, `1440 ${w[1440].filter?.y}/${w[1440].toolbar?.y} · 1280 ${w[1280].filter?.y}/${w[1280].toolbar?.y}`);
check("상단 영역과 아래 두 칸 사이 24", w[1440].toolbar && w[1440].top && w[1440].toolbar.y - (w[1440].top.y + w[1440].top.h) === 24, `${w[1440].toolbar.y - (w[1440].top.y + w[1440].top.h)}`);
check("1280 이상 필터 칩 비활성", w[1440].filterChipDisabled && w[1280].filterChipDisabled, `1440 ${w[1440].filterChipDisabled} · 1280 ${w[1280].filterChipDisabled}`);
check("1024~1279 좌측 필터 숨김 · 목록 본문 폭 전체 · 필터 칩 활성", [1279, 1100, 1024].every((width) => !w[width].filter && !w[width].filterChipDisabled && w[width].list?.x === w[width].top?.x && w[width].list?.w === w[width].top?.w), [1279, 1100, 1024].map((width) => `${width}: 목록 x${w[width].list?.x} w${w[width].list?.w}`).join(" · "));
check("1024 · 1100 · 1279 가로 넘침 없음", [1024, 1100, 1279].every((width) => w[width].overflowX === 0), [1024, 1100, 1279].map((width) => `${width}: ${w[width].overflowX}`).join(" · "));
check("1023 이하 모바일 화면", w[1023].mobile && !w[1023].pc, `mobile=${w[1023].mobile}`);
check("콘솔 오류 0", Object.values(w).every((value) => value.consoleErrors === 0), Object.entries(w).map(([width, value]) => `${width}:${value.consoleErrors}`).join(" "));
summary.rail = { 1440: w[1440].rail, 1280: w[1280].rail };
console.log(`퀵필터 레일 보이는 카드: 1440 ${w[1440].rail.full}개(일부 ${w[1440].rail.partial} / 전체 ${w[1440].rail.total}, 폭 ${w[1440].rail.railWidth}) · 1280 ${w[1280].rail.full}개`);

// 1440 목록 2,000px 스크롤 후 좌측 필터(화면 위 16), 목록 끝까지 내려도 푸터를 덮지 않음
{
  const { context, page } = await open(1440);
  await scrollTo(page, 2000); await page.waitForTimeout(400);
  const after = await layout(page);
  check("1440 2,000px 스크롤 후 좌측 필터 화면 위 16", after.filter?.y === 16, JSON.stringify(after.filter));
  await page.screenshot({ path: join(outDir, "1440-scrolled.png") });
  await scrollTo(page, 999999); await page.waitForTimeout(400);
  const end = await page.evaluate(() => { const f = document.querySelector(".bbm-page > .bbm-filter").getBoundingClientRect(); const footer = document.querySelector("footer.app-shell__footer").getBoundingClientRect(); return { filterBottom: Math.round(f.bottom), footerTop: Math.round(footer.top) }; });
  check("좌측 필터가 푸터를 덮지 않음(맨 끝)", end.filterBottom <= end.footerTop, JSON.stringify(end));
  // 2페이지 이동 후 목록 툴바 윗선이 화면 위 16
  await scrollTo(page, 0); await page.waitForTimeout(200);
  const two = page.locator(".ui-pagination__page").filter({ hasText: /^2$/ }).first();
  await two.scrollIntoViewIfNeeded(); await two.click(); await page.waitForTimeout(700);
  const moved = await layout(page);
  const active = await page.locator(".ui-pagination__page.is-active").textContent();
  check("1440 2페이지 이동 후 목록 툴바 윗선 화면 위 16", moved.toolbar?.y === 16 && active === "2", `툴바 y ${moved.toolbar?.y} · 현재 페이지 ${active}`);
  await context.close();
}

// 1100 "필터" 칩 → 펼침판 → SUV 체크 → N대 보기 → 적용 칩 SUV
{
  const { context, page, errors } = await open(1100);
  const before = await page.locator(".bbm-summary strong").first().textContent();
  await page.locator(".bbm-filter-button").click(); await page.waitForTimeout(500);
  const drawer = await page.evaluate(() => { const d = document.querySelector(".bbm-drawer"); if (!d) return null; const r = d.getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), dim: getComputedStyle(document.querySelector(".bbm-drawer-dim")).backgroundColor, scrollLocked: getComputedStyle(document.querySelector(".mobile-scroll")).overflowY === "hidden" }; });
  check("1100 펼침판 폭 320 · 딤 rgba(0,0,0,0.5) · 뒤 스크롤 막힘", drawer?.x === 0 && drawer?.w === 320 && drawer?.dim === "rgba(0, 0, 0, 0.5)" && drawer?.scrollLocked, JSON.stringify(drawer));
  const toggle = page.locator(".bbm-drawer .bbm-filter-toggle").filter({ hasText: /^바디타입/ }).first();
  if (!(await page.locator(".bbm-drawer .bbm-filter-item.is-open .bbmf-check").filter({ hasText: /^SUV/ }).count())) await toggle.click();
  await page.waitForTimeout(300);
  await page.locator(".bbm-drawer .bbmf-check").filter({ hasText: /^SUV/ }).first().click(); await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, "1100-drawer.png") });
  const confirmText = (await page.locator(".bbm-drawer .bbmf-confirm").textContent())?.trim();
  await page.locator(".bbm-drawer .bbmf-confirm").click(); await page.waitForTimeout(500);
  const closed = !(await page.locator(".bbm-drawer").count());
  const applied = await page.evaluate(() => [...document.querySelectorAll(".bbm-chips .filter-chip.is-active")].map((chip) => chip.textContent.trim()));
  const after = await page.locator(".bbm-summary strong").first().textContent();
  check("1100 펼침판 SUV 체크 → N대 보기 → 닫힘 · 적용 칩 SUV · 목록 줄어듦", closed && applied.includes("SUV") && parseInt(after) < parseInt(before), `버튼 "${confirmText}" · 적용 칩 ${applied.join(",")} · ${before} → ${after}`);
  // 바깥 누르기·Esc 로 닫힘
  await page.locator(".bbm-filter-button").click(); await page.waitForTimeout(300);
  await page.mouse.click(1000, 450); await page.waitForTimeout(300);
  const outside = !(await page.locator(".bbm-drawer").count());
  await page.locator(".bbm-filter-button").click(); await page.waitForTimeout(300);
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  const esc = !(await page.locator(".bbm-drawer").count());
  check("펼침판 바깥 누르기 · Esc 로 닫힘", outside && esc, `바깥 ${outside} · Esc ${esc}`);
  // 펼침판 [초기화] → 원본과 같은 확인 창
  await page.locator(".bbm-filter-button").click(); await page.waitForTimeout(300);
  await page.locator(".bbm-drawer .bbmf-reset").click(); await page.waitForTimeout(400);
  const confirm = await page.evaluate(() => [...document.querySelectorAll(".bbmf-modal")].map((modal) => modal.textContent.replace(/\s+/g, " ").trim()).pop() ?? "");
  check("펼침판 [초기화] → 필터 초기화 확인 창", /필터 초기화/.test(confirm), confirm.slice(0, 60));
  check("1100 콘솔 오류 0", errors.length === 0, `${errors.length}`);
  await context.close();
}

writeFileSync(join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
await browser.close();
const failed = summary.checks.filter((item) => !item.ok).length;
console.log(`결과: ${join(outDir, "summary.json")} · 통과 ${summary.checks.length - failed}/${summary.checks.length}`);
