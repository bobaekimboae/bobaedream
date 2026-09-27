#!/usr/bin/env node
// QF-093 보완: 과쯔 PC 좌측 필터 "아래 붙는 사이드바" 점검(1440×900 · 1280×720 · 1920×1080).
// ① 칸 안 스크롤 없음(scrollHeight ≤ clientHeight) ② 끝까지 내리면 마지막 항목 "차량번호 / 판매자"가 화면에 보임
// ③ 더 내려도 필터 맨 아래가 화면 아래 16에 붙음 ④ 다시 올리면 필터 맨 위가 원래 자리(상단 영역 아래 24)
// ⑤ 제조사·모델을 접어 필터가 화면보다 짧아지면 위 16에 붙음. 캡처: reports/qf-093-sidebar/
// 사용: npm run check:sidebar [-- --base=<주소>]
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv.find((arg) => arg.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const outDir = join("reports", "qf-093-sidebar");
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const summary = { base, measuredAt: new Date().toISOString(), sizes: {}, checks: [] };
const check = (name, ok, detail) => { summary.checks.push({ name, ok, detail }); console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };

const state = (page) => page.evaluate(() => {
  const scroller = document.querySelector(".mobile-scroll");
  const filter = document.querySelector(".bbm-page > .bbm-filter");
  const f = filter.getBoundingClientRect();
  const top = document.querySelector(".bbm-hybrid-top").getBoundingClientRect();
  const last = [...filter.querySelectorAll(".bbm-filter-toggle")].find((toggle) => /차량번호/.test(toggle.textContent));
  const l = last?.getBoundingClientRect();
  const footer = document.querySelector("footer.app-shell__footer")?.getBoundingClientRect();
  return {
    viewport: scroller.clientHeight, scrollTop: Math.round(scroller.scrollTop), max: scroller.scrollHeight - scroller.clientHeight,
    filterTop: Math.round(f.top), filterBottom: Math.round(f.bottom), filterH: Math.round(f.height), topAreaBottom: Math.round(top.bottom),
    innerScroll: filter.scrollHeight > filter.clientHeight + 1, overflowY: getComputedStyle(filter).overflowY, stickyTop: getComputedStyle(filter).top,
    lastVisible: l ? l.top >= 0 && l.bottom <= scroller.clientHeight : false, lastLabel: last?.textContent.trim(), footerTop: footer ? Math.round(footer.top) : null,
  };
});
const scrollTo = (page, top) => page.evaluate((top) => { document.querySelector(".mobile-scroll").scrollTop = top; }, top);

for (const [width, height] of [[1440, 900], [1280, 720], [1920, 1080]]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(`${base}?qf=guazi&pc=1`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(900);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}" });
  const s0 = await state(page);
  const tag = `${width}×${height}`;
  check(`${tag} 칸 안 스크롤 없음`, !s0.innerScroll && s0.overflowY !== "auto" && s0.overflowY !== "scroll", `scrollHeight>clientHeight ${s0.innerScroll} · overflow-y ${s0.overflowY} · 필터 높이 ${s0.filterH} · 화면 ${s0.viewport}`);
  check(`${tag} 처음 필터 맨 위 = 상단 영역 아래 24`, s0.filterTop - s0.topAreaBottom === 24, `${s0.filterTop} − ${s0.topAreaBottom} = ${s0.filterTop - s0.topAreaBottom}`);
  // 필터 끝이 화면에 들어올 때까지 내린다: 필터가 길면 필터 맨 아래가 화면 아래 16 에 붙는 지점(= 필터 높이 + 원래 위치 − 화면 + 16)
  const stickPoint = Math.max(0, s0.filterTop + s0.filterH - s0.viewport + 16);
  await scrollTo(page, stickPoint + 40); await page.waitForTimeout(300);
  const s1 = await state(page);
  check(`${tag} 내리면 마지막 항목 "${s1.lastLabel}" 이 화면에 보임`, s1.lastVisible, `필터 아래 ${s1.filterBottom} · 화면 ${s1.viewport}`);
  await page.screenshot({ path: join(outDir, `${width}x${height}-last-item.png`) });
  const tall = s0.filterH > s0.viewport - 32;
  await scrollTo(page, stickPoint + 1500); await page.waitForTimeout(300);
  const s2 = await state(page);
  check(`${tag} 더 내려도 ${tall ? "필터 맨 아래가 화면 아래 16" : "필터 맨 위가 16"}에 붙음`, tall ? s2.filterBottom === s2.viewport - 16 || (s2.footerTop !== null && s2.filterBottom <= s2.footerTop) : s2.filterTop === 16, `필터 ${s2.filterTop}~${s2.filterBottom} · 화면 ${s2.viewport} · top ${s2.stickyTop}`);
  await scrollTo(page, 999999); await page.waitForTimeout(300);
  const s3 = await state(page);
  check(`${tag} 맨 끝에서 필터가 푸터를 덮지 않음`, s3.footerTop === null || s3.filterBottom <= s3.footerTop, `필터 아래 ${s3.filterBottom} · 푸터 위 ${s3.footerTop}`);
  await scrollTo(page, 0); await page.waitForTimeout(300);
  const s4 = await state(page);
  check(`${tag} 다시 올리면 필터 맨 위가 원래 자리`, s4.filterTop === s0.filterTop, `${s4.filterTop} (처음 ${s0.filterTop})`);
  // 제조사·모델 접기 → 필터가 화면보다 짧아지면 위 16
  await page.locator(".bbm-page > .bbm-filter .bbm-filter-toggle").filter({ hasText: /^제조사 · 모델/ }).first().click(); await page.waitForTimeout(400);
  const s5 = await state(page);
  await scrollTo(page, 2000); await page.waitForTimeout(300);
  const s6 = await state(page);
  const shortNow = s5.filterH <= s5.viewport - 32;
  check(`${tag} 제조사·모델 접으면(필터 ${s5.filterH}) ${shortNow ? "위 16에 붙음" : "여전히 화면보다 길어 아래에 붙음"}`, shortNow ? s6.filterTop === 16 : s6.filterBottom === s6.viewport - 16, `필터 ${s6.filterTop}~${s6.filterBottom} · 화면 ${s6.viewport} · top ${s6.stickyTop}`);
  // 펼쳐진 항목을 모두 접어 필터가 화면보다 짧아지는 경우(위 16)
  await scrollTo(page, 0); await page.waitForTimeout(200);
  for (let i = 0; i < 12; i += 1) { const open = page.locator(".bbm-page > .bbm-filter .bbm-filter-item.is-open > .bbm-filter-toggle").first(); if (!(await open.count())) break; await open.click(); await page.waitForTimeout(120); }
  const s7 = await state(page);
  await scrollTo(page, 2000); await page.waitForTimeout(300);
  const s8 = await state(page);
  const shortAll = s7.filterH <= s7.viewport - 32;
  check(`${tag} 모든 항목을 접으면(필터 ${s7.filterH}) ${shortAll ? "위 16에 붙음" : "여전히 화면보다 길어 아래에 붙음"}`, shortAll ? s8.filterTop === 16 : s8.filterBottom === s8.viewport - 16, `필터 ${s8.filterTop}~${s8.filterBottom} · 화면 ${s8.viewport} · top ${s8.stickyTop}`);
  if (width === 1440) await page.screenshot({ path: join(outDir, `${width}x${height}-collapsed.png`) });
  // 다시 펼치면 바로 아래 붙음으로 돌아가는지(길이 변화에 바로 맞춤)
  await page.locator(".bbm-page > .bbm-filter .bbm-filter-toggle").filter({ hasText: /^제조사 · 모델/ }).first().click(); await page.waitForTimeout(300);
  const s9 = await state(page);
  const tallAgain = s9.filterH > s9.viewport - 32;
  check(`${tag} 다시 펼치면(필터 ${s9.filterH}) 규칙이 바로 다시 맞춰짐`, tallAgain ? s9.stickyTop === `${Math.min(16, s9.viewport - s9.filterH - 16)}px` : s9.stickyTop === "16px", `top ${s9.stickyTop}`);
  check(`${tag} 콘솔 오류 0`, errors.length === 0, `${errors.length}`);
  summary.sizes[tag] = { start: s0, stuck: s2, end: s3, back: s4, collapsed: s6 };
  await context.close();
}
// 필터가 화면보다 짧은 경우(모든 항목을 접어도 필터 1486 이라 1440×1700 창에서 확인): 위 16에 붙음
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1700 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(`${base}?qf=guazi&pc=1`, { waitUntil: "networkidle", timeout: 60000 }); await page.waitForTimeout(900);
  for (let i = 0; i < 12; i += 1) { const open = page.locator(".bbm-page > .bbm-filter .bbm-filter-item.is-open > .bbm-filter-toggle").first(); if (!(await open.count())) break; await open.click(); await page.waitForTimeout(120); }
  const a = await state(page);
  await scrollTo(page, 2000); await page.waitForTimeout(300);
  const b = await state(page);
  check(`1440×1700 모든 항목 접음(필터 ${a.filterH} < 화면 ${a.viewport}) → 위 16에 붙음`, a.filterH <= a.viewport - 32 && b.filterTop === 16 && b.stickyTop === "16px", `필터 위 ${b.filterTop} · top ${b.stickyTop}`);
  await context.close();
}
writeFileSync(join("reports", "diff", "sidebar-summary.json"), JSON.stringify(summary, null, 2));
await browser.close();
const failed = summary.checks.filter((item) => !item.ok).length;
console.log(`결과: reports/diff/sidebar-summary.json · 통과 ${summary.checks.length - failed}/${summary.checks.length}`);
