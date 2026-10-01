#!/usr/bin/env node
// QF-119 과쯔 PC 좌측 필터 흔들림 점검. PC 1024(펼침판) · 1280 · 1440 에서 주행거리를 펼친 채
// 손잡이 누름 → 끌기 → 놓기, 칩 5개 차례, 입력(0.4초 멈춤 · Enter) 단계마다
// 사이드바 top · 주행거리 제목 y · 페이지 scrollTop · 사이드바 scrollTop · 사이드바 높이 · 목록 높이를 표로 남긴다.
// 기준: 사이드바 위치·높이·제목 y·사이드바 scrollTop 변화 0, 페이지 scrollTop 은 그대로(목록이 줄어 스크롤 끝을 넘을 때만 끝에 맞춰짐).
// 끌기 중 목록 다시 그리지 않음(대수 그대로), 놓을 때 한 번 반영. 사이드바 안 스크롤로 맨 아래 "차량번호 / 판매자"까지, 페이지 스크롤과 따로.
// 모바일 393 시트: 조작 때 시트 높이 변화 0 · 눈금이 슬라이더 안.
// 사용: node scripts/sidebar-stable-check.mjs [--base=<주소>] [--tag=after] → reports/qf-119/stable-<tag>.json · 캡처
import { chromium, devices } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const arg = (name, fallback) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? "").slice(name.length + 3) || fallback;
const base = arg("base", "http://127.0.0.1:4173/bobaedream/");
const tag = arg("tag", "after");
const strict = tag !== "before";
const out = join("reports", "qf-119"); mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const result = { base, tag, measuredAt: new Date().toISOString(), pc: {}, mobile: {} }; let fails = 0;
const check = (name, ok, detail) => { if (!ok && strict) fails += 1; console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };
const r1 = (v) => (v == null ? v : Math.round(v * 10) / 10);

const PC_SIZES = [[1024, 768], [1280, 800], [1440, 900]];
for (const [width, height] of PC_SIZES) {
  const page = await browser.newPage({ viewport: { width, height } }); const errors = [];
  page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${base}?qf=guazi&pc=1`, { waitUntil: "networkidle" }); await page.waitForTimeout(600);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
  const drawer = width < 1280;
  const scope = drawer ? ".bbm-drawer" : "aside.bbm-filter";
  if (drawer) { await page.locator(".bbm-filter-button").first().click(); await page.waitForTimeout(400); }
  // 사용자가 목록을 조금 내려 본 상태(1280 이상)
  if (!drawer) await page.evaluate(() => { document.querySelector(".mobile-scroll").scrollTop = 832; });
  await page.waitForTimeout(200);
  await page.locator(`${scope} .bbm-filter-toggle`).filter({ hasText: /^주행거리/ }).first().click(); await page.waitForTimeout(400);
  // 주행거리 제목이 사이드바 위쪽 120 에 오도록 사이드바 안에서만 스크롤
  await page.evaluate(({ scope, drawer }) => {
    const box = drawer ? document.querySelector(".bbm-drawer-body") : document.querySelector(`${scope} > .bbm-filter-menu`);
    const title = [...document.querySelectorAll(`${scope} .bbm-filter-toggle`)].find((b) => /^주행거리/.test(b.textContent.trim()));
    if (box && title) box.scrollTop += title.getBoundingClientRect().top - box.getBoundingClientRect().top - 120;
  }, { scope, drawer });
  await page.waitForTimeout(200);
  const state = (step) => page.evaluate(({ scope, drawer, step }) => {
    const s = document.querySelector(".mobile-scroll"); const aside = document.querySelector(scope);
    const inner = drawer ? document.querySelector(".bbm-drawer-body") : aside.querySelector(":scope > .bbm-filter-menu");
    const title = [...aside.querySelectorAll(".bbm-filter-toggle")].find((b) => /^주행거리/.test(b.textContent.trim()));
    const results = document.querySelector(".bbm-results");
    const handles = [...aside.querySelectorAll(".mf-handle")].map((h) => h.getAttribute("aria-valuetext"));
    return {
      step, sidebarTop: aside.getBoundingClientRect().top, titleY: title.getBoundingClientRect().top, pageScrollTop: s.scrollTop, pageMax: s.scrollHeight - s.clientHeight,
      sidebarScrollTop: inner ? inner.scrollTop : null, sidebarH: aside.getBoundingClientRect().height, listH: results ? results.getBoundingClientRect().height : null,
      count: document.querySelector(".bbm-ct-title")?.dataset.count ?? null, cards: document.querySelectorAll(".bbm-card").length, handles: handles.join(" ~ "),
    };
  }, { scope, drawer, step });
  const rows = [await state("시작")];
  const handle = page.locator(`${scope} .mf-handle.is-max .mf-handle-dot`);
  const hb = await handle.boundingBox(); const track = await page.locator(`${scope} .mf-track`).boundingBox();
  const cy = hb.y + hb.height / 2;
  await page.mouse.move(hb.x + hb.width / 2, cy); await page.mouse.down(); await page.waitForTimeout(150);
  rows.push(await state("손잡이 누름"));
  if (!drawer) await page.screenshot({ path: join(out, `pc-${width}-${tag}-drag-0.png`), clip: { x: 0, y: 0, width, height } });
  await page.mouse.move(track.x + track.width * 0.7, cy, { steps: 8 }); await page.waitForTimeout(150);
  rows.push(await state("끄는 중 70%"));
  if (!drawer) await page.screenshot({ path: join(out, `pc-${width}-${tag}-drag-1.png`), clip: { x: 0, y: 0, width, height } });
  await page.mouse.move(track.x + track.width * 0.3, cy, { steps: 8 }); await page.waitForTimeout(150);
  rows.push(await state("끄는 중 30%"));
  await page.mouse.up(); await page.waitForTimeout(400);
  rows.push(await state("놓기"));
  if (!drawer) await page.screenshot({ path: join(out, `pc-${width}-${tag}-drag-2.png`), clip: { x: 0, y: 0, width, height } });
  for (const chip of ["1만km 이하", "1~3만km", "3~6만km", "6~10만km", "10~15만km", "15만km 이상"]) {
    await page.locator(`${scope} .mf-chip`).filter({ hasText: chip }).click(); await page.waitForTimeout(400);
    rows.push(await state(`칩 ${chip}`));
  }
  await page.locator(`${scope} .mf-chip`).filter({ hasText: "15만km 이상" }).click(); await page.waitForTimeout(300);
  rows.push(await state("칩 풀기(결과 늘어남)"));
  const minField = page.locator(`${scope} .mf-field input`).first();
  await minField.click(); await page.keyboard.type("35000", { delay: 60 }); await page.waitForTimeout(150);
  rows.push(await state("입력 중(0.4초 전)"));
  await page.waitForTimeout(600);
  rows.push(await state("입력 0.4초 멈춤"));
  await page.keyboard.press("Enter"); await page.waitForTimeout(300);
  rows.push(await state("Enter"));
  result.pc[width] = { rows, errors: errors.length };
  const first = rows[0];
  const diff = (key) => Math.max(...rows.map((r) => Math.abs((r[key] ?? 0) - (first[key] ?? 0))));
  // 페이지 scrollTop: 그대로이거나, 목록이 줄어 스크롤 끝을 넘은 만큼만 끝에 맞춰짐
  const scrollOk = rows.every((r) => Math.abs(r.pageScrollTop - Math.min(first.pageScrollTop, r.pageMax)) <= 1);
  console.log(`\nPC ${width}×${height}${drawer ? "(펼침판)" : ""}`);
  console.log("단계 | 사이드바 top | 제목 y | 페이지 scrollTop(끝) | 사이드바 scrollTop | 사이드바 높이 | 목록 높이 | 대수 | 손잡이");
  for (const r of rows) console.log(`${r.step} | ${r1(r.sidebarTop)} | ${r1(r.titleY)} | ${r1(r.pageScrollTop)}(${r1(r.pageMax)}) | ${r1(r.sidebarScrollTop)} | ${r1(r.sidebarH)} | ${r1(r.listH)} | ${r.count} | ${r.handles}`);
  check(`PC ${width} 사이드바 위치·높이 변화 0`, diff("sidebarTop") <= 0.5 && diff("sidebarH") <= 0.5, `top ${r1(diff("sidebarTop"))} · 높이 ${r1(diff("sidebarH"))}`);
  check(`PC ${width} 주행거리 제목 y · 사이드바 scrollTop 변화 0`, diff("titleY") <= 0.5 && diff("sidebarScrollTop") <= 0.5, `제목 ${r1(diff("titleY"))} · 사이드바 scrollTop ${r1(diff("sidebarScrollTop"))}`);
  check(`PC ${width} 페이지 scrollTop 유지(끝을 넘을 때만 끝에 맞춤)`, scrollOk, rows.map((r) => r1(r.pageScrollTop)).join(" → "));
  const dragRows = rows.slice(1, 4);
  check(`PC ${width} 끄는 동안 목록 그대로 · 놓을 때 한 번 반영`, dragRows.every((r) => r.count === first.count) && rows[4].count !== first.count, `${first.count} → 끄는 중 ${dragRows.map((r) => r.count).join("/")} → 놓기 ${rows[4].count}`);
  const typing = rows.find((r) => r.step === "입력 중(0.4초 전)"); const typed = rows.find((r) => r.step === "입력 0.4초 멈춤"); const prev = rows[rows.indexOf(typing) - 1];
  check(`PC ${width} 입력: 0.4초 전 목록 그대로 · 멈추면 반영`, typing.count === prev.count && typed.count !== prev.count, `${prev.count} → ${typing.count} → ${typed.count}`);
  check(`PC ${width} 콘솔 오류 0`, errors.length === 0, `${errors.length}`);
  // 사이드바 안 스크롤로 맨 아래 "차량번호 / 판매자"까지, 페이지 스크롤과 따로(1280 이상)
  if (!drawer) {
    const before = await page.evaluate(() => document.querySelector(".mobile-scroll").scrollTop);
    const box = await page.locator("aside.bbm-filter > .bbm-filter-menu").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 40; i += 1) { await page.mouse.wheel(0, 400); await page.waitForTimeout(20); }
    await page.waitForTimeout(300);
    const end = await page.evaluate(() => {
      const menu = document.querySelector("aside.bbm-filter > .bbm-filter-menu"); const aside = document.querySelector("aside.bbm-filter").getBoundingClientRect();
      const last = [...menu.querySelectorAll(".bbm-filter-toggle")].at(-1); const lb = last.getBoundingClientRect();
      const head = document.querySelector("aside.bbm-filter .bbm-filter-summary").getBoundingClientRect();
      return { pageScrollTop: document.querySelector(".mobile-scroll").scrollTop, atEnd: Math.abs(menu.scrollTop + menu.clientHeight - menu.scrollHeight) <= 1, last: last.textContent.trim(), lastVisible: lb.top >= aside.top - 0.5 && lb.bottom <= aside.bottom + 0.5, headTop: head.top - aside.top, overscroll: getComputedStyle(menu).overscrollBehaviorY, overflow: getComputedStyle(menu).overflowY };
    });
    result.pc[width].sidebarEnd = { before, ...end };
    check(`PC ${width} 사이드바 안 스크롤로 맨 아래 "${end.last}"까지 · 페이지 scrollTop 그대로 · 머리 맨 위 고정`, end.atEnd && end.lastVisible && /차량번호/.test(end.last) && end.pageScrollTop === before && end.headTop === 0 && end.overscroll === "contain",
      `끝 ${end.atEnd} · 보임 ${end.lastVisible} · 페이지 ${before} → ${end.pageScrollTop} · 머리 ${r1(end.headTop)} · ${end.overflow}/${end.overscroll}`);
    // 목록 쪽 휠은 페이지만 움직이고 사이드바 scrollTop 은 그대로
    const sb = await page.evaluate(() => document.querySelector("aside.bbm-filter > .bbm-filter-menu").scrollTop);
    await page.mouse.move(width - 200, height / 2); await page.mouse.wheel(0, 600); await page.waitForTimeout(300);
    const after = await page.evaluate(() => ({ page: document.querySelector(".mobile-scroll").scrollTop, side: document.querySelector("aside.bbm-filter > .bbm-filter-menu").scrollTop, top: document.querySelector("aside.bbm-filter").getBoundingClientRect().top }));
    check(`PC ${width} 목록 스크롤과 사이드바 스크롤 분리 · 사이드바 top 16`, after.side === sb && after.page !== end.pageScrollTop && Math.abs(after.top - 16) <= 0.5, `사이드바 ${sb} → ${after.side} · 페이지 ${end.pageScrollTop} → ${after.page} · top ${r1(after.top)}`);
  }
  // 눈금이 슬라이더 안
  const ticks = await page.evaluate((scope) => { const sl = document.querySelector(`${scope} .mf-slider`).getBoundingClientRect(); return [...document.querySelectorAll(`${scope} .mf-tick`)].map((t) => { const b = t.getBoundingClientRect(); return [t.textContent, r(b.left - sl.left), r(sl.right - b.right)]; }); function r(v) { return Math.round(v * 10) / 10; } }, scope);
  check(`PC ${width} 눈금이 슬라이더 안(0 왼쪽 · 15만+ 오른쪽 정렬)`, ticks.every(([, l, rr]) => l >= -0.5 && rr >= -0.5), ticks.map(([t, l, rr]) => `${t} ${l}/${rr}`).join(" · "));
  await page.close();
}

// 모바일 393 시트
{
  const ctx = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errors = [];
  page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${base}?qf=guazi`, { waitUntil: "networkidle" }); await page.waitForTimeout(500);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
  await page.locator(".filter-shell.is-bbm .filter-fixed").tap(); await page.waitForTimeout(400);
  await page.locator(".bbmf-full button, .bbmf-full-item").filter({ hasText: /^주행거리/ }).first().tap(); await page.waitForTimeout(400);
  const st = (step) => page.evaluate((step) => { const sheet = document.querySelector(".mf-sheet").getBoundingClientRect(); const body = document.querySelector(".mf-body"); const sl = document.querySelector(".mf-slider").getBoundingClientRect(); const ticks = [...document.querySelectorAll(".mf-tick")].map((t) => t.getBoundingClientRect()); return { step, sheetTop: sheet.top, sheetH: sheet.height, bodyScrollH: body.scrollHeight, tickInside: ticks.every((t) => t.left >= sl.left - 0.5 && t.right <= sl.right + 0.5) }; }, step);
  const rows = [await st("시작")];
  const hb = await page.locator(".mf-handle.is-max .mf-handle-dot").boundingBox(); const track = await page.locator(".mf-track").boundingBox(); const cy = hb.y + hb.height / 2;
  await page.mouse.move(hb.x + hb.width / 2, cy); await page.mouse.down(); await page.waitForTimeout(100); rows.push(await st("손잡이 누름"));
  await page.mouse.move(track.x + track.width * 0.5, cy, { steps: 6 }); await page.waitForTimeout(100); rows.push(await st("끄는 중"));
  await page.mouse.up(); await page.waitForTimeout(200); rows.push(await st("놓기"));
  for (const chip of ["1만km 이하", "1~3만km", "3~6만km", "6~10만km", "10~15만km", "15만km 이상"]) { await page.locator(".mf-chip").filter({ hasText: chip }).tap(); await page.waitForTimeout(200); rows.push(await st(`칩 ${chip}`)); }
  await page.locator(".mf-field input").first().fill("90,000"); await page.locator(".mf-field input").nth(1).fill("10,000"); await page.waitForTimeout(200); rows.push(await st("최소>최대 오류"));
  result.mobile = { rows, errors: errors.length };
  console.log("\n모바일 393 시트\n단계 | 시트 top | 시트 높이 | 본문 scrollHeight | 눈금 안");
  for (const r of rows) console.log(`${r.step} | ${r1(r.sheetTop)} | ${r1(r.sheetH)} | ${r.bodyScrollH} | ${r.tickInside}`);
  const d = (k) => Math.max(...rows.map((r) => Math.abs(r[k] - rows[0][k])));
  check("모바일 393 시트 높이·위치·본문 높이 변화 0(오류 문구 포함)", d("sheetH") <= 0.5 && d("sheetTop") <= 0.5 && d("bodyScrollH") <= 0.5, `높이 ${r1(d("sheetH"))} · top ${r1(d("sheetTop"))} · 본문 ${d("bodyScrollH")}`);
  check("모바일 393 눈금이 슬라이더 안", rows.every((r) => r.tickInside), `${rows.every((r) => r.tickInside)}`);
  check("모바일 393 콘솔 오류 0", errors.length === 0, `${errors.length}`);
  await ctx.close();
}
writeFileSync(join(out, `stable-${tag}.json`), JSON.stringify(result, null, 1));
await browser.close();
console.log(`\n결과: ${!strict ? "(작업 전 기록)" : fails ? `실패 ${fails}` : "모두 통과"}`);
process.exitCode = fails ? 1 : 0;
