#!/usr/bin/env node
// QF-119: 과쯔 PC 좌측 필터 "위 기준 sticky + 자기 스크롤" 점검(1440×900 · 1280×720 · 1920×1080 · 1440×1700).
// ① 높이 = 화면 − 32 고정, 머리(필터 · 초기화 · 검색조건 유지) 아래 항목 목록만 overflow-y auto · overscroll contain
// ② 처음 필터 맨 위 = 상단 영역 아래 24 ③ 내리면 위 16 에 붙고 높이 그대로 ④ 맨 끝에서 푸터를 덮지 않음 ⑤ 다시 올리면 원래 자리
// ⑥ "필터 더보기"를 연 뒤 사이드바 안 스크롤로 마지막 항목 "차량번호 / 판매자"가 보이고 페이지 scrollTop 은 그대로 ⑦ 항목을 모두 접어도 높이·위치 그대로
// (예전 QF-093 보완 "아래 붙는 사이드바"(음수 top)는 QF-119 에서 없앰. 캡처: reports/qf-093-sidebar/)
// QF-110: 좌측 필터 순서(제조사 · 모델 맨 위, 바디타입·차급은 가격 아래)도 확인
// 사용: npm run check:sidebar [-- --base=<주소>]
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv.find((arg) => arg.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const outDir = join("reports", "qf-093-sidebar");
mkdirSync(outDir, { recursive: true });
mkdirSync(join("reports", "diff"), { recursive: true });
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const summary = { base, measuredAt: new Date().toISOString(), sizes: {}, checks: [] };
const check = (name, ok, detail) => { summary.checks.push({ name, ok, detail }); console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };

const state = (page) => page.evaluate(() => {
  const scroller = document.querySelector(".mobile-scroll");
  const filter = document.querySelector(".bbm-page > .bbm-filter");
  const menu = filter.querySelector(":scope > .bbm-filter-menu");
  const head = filter.querySelector(":scope > .bbm-filter-summary").getBoundingClientRect();
  const f = filter.getBoundingClientRect();
  const top = document.querySelector(".bbm-hybrid-top").getBoundingClientRect();
  const last = [...filter.querySelectorAll(".bbm-filter-toggle")].find((toggle) => /차량번호/.test(toggle.textContent));
  const l = last?.getBoundingClientRect();
  const footer = document.querySelector("footer.app-shell__footer")?.getBoundingClientRect();
  const ms = getComputedStyle(menu);
  return {
    viewport: scroller.clientHeight, scrollTop: Math.round(scroller.scrollTop), max: scroller.scrollHeight - scroller.clientHeight,
    filterTop: Math.round(f.top), filterBottom: Math.round(f.bottom), filterH: Math.round(f.height), topAreaBottom: Math.round(top.bottom), headOffset: Math.round(head.top - f.top),
    menuOverflow: ms.overflowY, menuOverscroll: ms.overscrollBehaviorY, menuScrollTop: Math.round(menu.scrollTop), menuScrollable: menu.scrollHeight > menu.clientHeight + 1, stickyTop: getComputedStyle(filter).top,
    lastVisible: l ? l.top >= f.top - 0.5 && l.bottom <= f.bottom + 0.5 : false, lastLabel: last?.textContent.trim(), footerTop: footer ? Math.round(footer.top) : null,
  };
});
const scrollTo = (page, top) => page.evaluate((top) => { document.querySelector(".mobile-scroll").scrollTop = top; }, top);

for (const [width, height] of [[1440, 900], [1280, 720], [1920, 1080], [1440, 1700]]) {
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
  const wantH = s0.viewport - 32;
  check(`${tag} 높이 = 화면 − 32 · 항목 목록만 자기 스크롤(auto · contain) · 머리 맨 위`, Math.abs(s0.filterH - wantH) <= 1 && s0.menuOverflow === "auto" && s0.menuOverscroll === "contain" && s0.headOffset === 0, `높이 ${s0.filterH}(기대 ${wantH}) · ${s0.menuOverflow}/${s0.menuOverscroll} · 머리 ${s0.headOffset}`);
  check(`${tag} 처음 필터 맨 위 = 상단 영역 아래 24`, s0.filterTop - s0.topAreaBottom === 24, `${s0.filterTop} − ${s0.topAreaBottom} = ${s0.filterTop - s0.topAreaBottom}`);
  await scrollTo(page, 1500); await page.waitForTimeout(300);
  const s1 = await state(page);
  check(`${tag} 내리면 위 16 에 붙고 높이 그대로(음수 top 없음)`, s1.filterTop === 16 && s1.filterH === s0.filterH && s1.stickyTop === "16px", `필터 ${s1.filterTop}~${s1.filterBottom} · top ${s1.stickyTop} · 높이 ${s1.filterH}`);
  await page.getByRole("button", { name: "필터 더보기", exact: true }).click();
  await page.waitForTimeout(120);
  // 사이드바 안에서만 끝까지 스크롤 → 마지막 항목 보임 · 페이지 scrollTop 그대로
  const box = await page.locator(".bbm-page > .bbm-filter > .bbm-filter-menu").boundingBox();
  // 제조사·모델 목록은 자기 스크롤 상자라, 그 아래 항목 줄(사이드바 아래쪽)에서 휠
  await page.mouse.move(box.x + 40, box.y + box.height - 12);
  for (let i = 0; i < 40; i += 1) { await page.mouse.wheel(0, 400); await page.waitForTimeout(15); }
  await page.waitForTimeout(300);
  const s2 = await state(page);
  check(`${tag} 사이드바 안 스크롤로 마지막 항목 "${s2.lastLabel}" 보임 · 페이지 scrollTop 그대로`, s2.lastVisible && s2.scrollTop === s1.scrollTop && s2.filterTop === 16, `사이드바 scrollTop ${s2.menuScrollTop} · 페이지 ${s1.scrollTop} → ${s2.scrollTop}`);
  await page.screenshot({ path: join(outDir, `${width}x${height}-last-item.png`) });
  await scrollTo(page, 999999); await page.waitForTimeout(300);
  const s3 = await state(page);
  check(`${tag} 맨 끝에서 필터가 푸터를 덮지 않음`, s3.footerTop === null || s3.filterBottom <= s3.footerTop, `필터 아래 ${s3.filterBottom} · 푸터 위 ${s3.footerTop}`);
  await scrollTo(page, 0); await page.waitForTimeout(300);
  const s4 = await state(page);
  check(`${tag} 다시 올리면 필터 맨 위가 원래 자리`, s4.filterTop === s0.filterTop, `${s4.filterTop} (처음 ${s0.filterTop})`);
  // 펼쳐진 항목을 모두 접어도 높이·붙는 자리 그대로
  await page.evaluate(() => { document.querySelector(".bbm-page > .bbm-filter > .bbm-filter-menu").scrollTop = 0; });
  for (let i = 0; i < 12; i += 1) { const open = page.locator(".bbm-page > .bbm-filter .bbm-filter-item.is-open > .bbm-filter-toggle").first(); if (!(await open.count())) break; await open.click(); await page.waitForTimeout(120); }
  await scrollTo(page, 1500); await page.waitForTimeout(300);
  const s5 = await state(page);
  check(`${tag} 모든 항목을 접어도 높이 ${s0.filterH} · 위 16 그대로`, s5.filterH === s0.filterH && s5.filterTop === 16, `필터 ${s5.filterTop}~${s5.filterBottom} · 높이 ${s5.filterH}`);
  if (width === 1440 && height === 900) await page.screenshot({ path: join(outDir, `${width}x${height}-collapsed.png`) });
  check(`${tag} 콘솔 오류 0`, errors.length === 0, `${errors.length}`);
  summary.sizes[tag] = { start: s0, stuck: s1, sidebarEnd: s2, end: s3, back: s4, collapsed: s5 };
  await context.close();
}
// 당근형 기본 순서 8개 + 더보기 아래 기존 19개(총 27)
for (const width of [1440, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${base}?qf=guazi&pc=1`, { waitUntil: "networkidle" }); await page.waitForTimeout(600);
  const defaultRows = await page.evaluate(() => [...document.querySelectorAll("aside.bbm-filter .bbm-filter-toggle")].map((t) => ({ label: t.textContent.trim(), open: t.closest(".bbm-filter-item")?.classList.contains("is-open") })));
  const head = defaultRows.map((r) => r.label).join(" → ");
  const want = "브랜드 → 차종 → 연료 → 가격 → 연식 → 주행거리 → 변속기 → 판매 방식";
  await page.getByRole("button", { name: "필터 더보기", exact: true }).click();
  const expandedRows = await page.evaluate(() => [...document.querySelectorAll("aside.bbm-filter .bbm-filter-toggle")].map((t) => t.textContent.trim()));
  const closedOk = defaultRows.every((row) => row.open === false);
  check(`${width} 당근형 기본 필터 8개 · 전부 접힘 · 더보기 후 기존 27개`, head === want && closedOk && defaultRows.length === 8 && expandedRows.length === 27, `${head} · 기본 ${defaultRows.length} / 전체 ${expandedRows.length}`);
  await page.close();
}
writeFileSync(join("reports", "diff", "sidebar-summary.json"), JSON.stringify(summary, null, 2));
await browser.close();
const failed = summary.checks.filter((item) => !item.ok).length;
console.log(`결과: reports/diff/sidebar-summary.json · 통과 ${summary.checks.length - failed}/${summary.checks.length}`);
