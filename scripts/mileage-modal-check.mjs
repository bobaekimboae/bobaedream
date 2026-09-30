#!/usr/bin/env node
// QF-118 과쯔 PC 상단 "주행거리" 칩 + 가운데 모달 점검(PC 1024 · 1280 · 1440).
// 수치: 칩 줄 순서 · 칩 규격(32 · 좌우 12 · 14/20 500 · #F4F4F4 · 사이 8) · 상단 카드 높이(작업 전 배포본과 같음) · 모달 폭 min(480, 화면 − 48) · 가운데 ·
//       모서리 16 · 헤더 64 · 입력 (본문 − 12 − 20) ÷ 2 · 칩 (본문 − 16) ÷ 3 · 첫 눈금 왼쪽 끝 = 첫 손잡이 중심 · 끝 눈금 오른쪽 끝 = 끝 손잡이 중심 ·
//       눈금 슬라이더 안 · 조작 중 모달 높이 변화 0 · 잘림·가로 스크롤 0 · 열고 닫을 때 페이지·사이드바 scrollTop 변화 0 · 스크롤 잠금 때 목록 가로 위치 그대로
// 동작: 적용(칩 검정 · 대수 · 사이드바) · 닫기/배경/Esc 버림 · 칩 × 는 주행거리만 · 사이드바 → 칩 표시 · 적용 값으로 열림 · 초기화가 다른 필터 안 건드림
// 접근성: dialog · aria-modal · aria-labelledby · 열 때 닫기에 포커스 · Tab 가두기 · 닫히면 칩으로 복귀 · 키보드로 손잡이(←, End)·칩·적용
// 사용: node scripts/mileage-modal-check.mjs [--base=<후>] [--before=<전, 칩 줄·카드 높이 비교>] → reports/qf-118/modal-check.json · 캡처
import { chromium, devices } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const arg = (name, fallback) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? "").slice(name.length + 3) || fallback;
const base = arg("base", "http://127.0.0.1:4173/bobaedream/");
const before = arg("before", "https://bobaekimboae.github.io/bobaedream/");
const out = join("reports", "qf-118"); mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const result = { base, before, sizes: {} }; let fails = 0;
const check = (name, ok, detail) => { if (!ok) fails += 1; console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };
const r1 = (v) => Math.round(v * 10) / 10;
const near = (a, b, tol = 0.5) => Math.abs(a - b) <= tol;
const nostyle = "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}";

const chipRow = (page) => page.evaluate(() => [...document.querySelectorAll(".bbm-ct-chip-row .bbm-chips .filter-chip")].filter((c) => c.getBoundingClientRect().width).map((c) => c.textContent.trim()));
const cardH = (page) => page.evaluate(() => Math.round(document.querySelector(".bbm-content-head.is-chotot").getBoundingClientRect().height * 10) / 10);
const scrolls = (page) => page.evaluate(() => ({ page: document.querySelector(".mobile-scroll").scrollTop, side: document.querySelector("aside.bbm-filter > .bbm-filter-menu")?.scrollTop ?? null, listX: document.querySelector(".bbm-results")?.getBoundingClientRect().left ?? null, listW: document.querySelector(".bbm-results")?.getBoundingClientRect().width ?? null }));
const modalBox = (page) => page.evaluate(() => {
  const d = document.querySelector(".mf-sheet.is-modal"); if (!d) return null;
  const b = (el) => el.getBoundingClientRect();
  const body = d.querySelector(".mf-body"); const bs = getComputedStyle(body);
  const bodyW = b(body).width - parseFloat(bs.paddingLeft) - parseFloat(bs.paddingRight) - (body.offsetWidth - body.clientWidth);
  const fields = [...d.querySelectorAll(".mf-inputs .mf-field")].map((f) => b(f).width);
  const chips = [...d.querySelectorAll(".mf-chip")].map((c) => b(c).width);
  const slider = b(d.querySelector(".mf-slider")); const dots = [...d.querySelectorAll(".mf-handle-dot")].map(b); const ticks = [...d.querySelectorAll(".mf-tick")].map(b);
  const tc = ticks.map((t) => t.left + t.width / 2); const track = b(d.querySelector(".mf-track"));
  const midErr = tc.slice(1, -1).map((c, i) => c - (track.left + track.width * ((i + 1) / 5)));
  const dr = b(d);
  return {
    w: dr.width, h: dr.height, left: dr.left, right: innerWidth - dr.right, top: dr.top, bottom: innerHeight - dr.bottom, radius: getComputedStyle(d).borderTopLeftRadius,
    header: b(d.querySelector(".mf-header")).height, actions: b(d.querySelector(".mf-actions")).height, bodyW, fields, chips, chipCols: new Set([...d.querySelectorAll(".mf-chip")].map((c) => Math.round(b(c).left))).size,
    firstTick: ticks[0].left - (dots[0].left + dots[0].width / 2), lastTick: ticks.at(-1).right - (dots[1].left + dots[1].width / 2), midErr,
    tickInside: ticks.every((t) => t.left >= slider.left - 0.5 && t.right <= slider.right + 0.5),
    hScroll: d.scrollWidth > d.clientWidth + 1 || body.scrollWidth > body.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 0.5,
    dialog: { role: d.getAttribute("role"), modal: d.getAttribute("aria-modal"), labelled: document.getElementById(d.getAttribute("aria-labelledby") ?? "")?.textContent ?? null },
    active: document.activeElement?.className ?? "", confirm: d.querySelector(".mf-confirm").textContent, selected: [...d.querySelectorAll(".mf-chip.is-selected")].map((c) => c.textContent),
  };
});
const count = (page) => page.evaluate(() => Number(document.querySelector(".bbm-ct-title")?.dataset.count));
const sidebarSel = (page) => page.evaluate(() => [...document.querySelectorAll("aside.bbm-filter .mf-chip.is-selected, .bbm-drawer .mf-chip.is-selected")].map((c) => c.textContent));
const openModal = async (page) => { await page.locator(".bbm-ct-chip-row .filter-chip.is-mileage").first().evaluate((el) => (el.matches("button") ? el : el.querySelector(".filter-chip-label")).click()); await page.waitForTimeout(250); };

for (const [width, height] of [[1024, 768], [1280, 800], [1440, 900]]) {
  const tag = `PC ${width}`;
  const errors = [];
  // 작업 전(배포본) 칩 줄 · 상단 카드 높이
  const bp = await browser.newPage({ viewport: { width, height } });
  await bp.goto(`${before}?qf=guazi&pc=1`, { waitUntil: "networkidle" }); await bp.waitForTimeout(600);
  const beforeRow = await chipRow(bp); const beforeCard = await cardH(bp);
  if (width === 1440) await bp.locator(".bbm-ct-chip-row").screenshot({ path: join(out, "pc-1440-chips-before.png") });
  await bp.close();

  const page = await browser.newPage({ viewport: { width, height } });
  page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${base}?qf=guazi&pc=1`, { waitUntil: "networkidle" }); await page.waitForTimeout(600);
  const row = await chipRow(page); const card0 = await cardH(page);
  if (width === 1440) await page.locator(".bbm-ct-chip-row").screenshot({ path: join(out, "pc-1440-chips-after.png") });
  const spec = await page.evaluate(() => {
    const chips = [...document.querySelectorAll(".bbm-ct-chip-row .bbm-chips .filter-chip")];
    const m = chips.find((c) => c.classList.contains("is-mileage")); const y = chips[chips.indexOf(m) - 1];
    const cs = getComputedStyle(m); const r = m.getBoundingClientRect();
    return { h: r.height, pl: cs.paddingLeft, pr: cs.paddingRight, font: `${cs.fontSize}/${cs.lineHeight} ${cs.fontWeight}`, bg: cs.backgroundColor, gap: r.left - y.getBoundingClientRect().right, prev: y.textContent.trim() };
  });
  const want = ["중고차", "제조사", "연식", "주행거리", "가격", "연료", "판매자"];
  check(`${tag} 칩 줄 순서 필터 · ${want.join(" · ")}`, JSON.stringify(row) === JSON.stringify(want), `${row.join(" · ")} (전: ${beforeRow.join(" · ")})`);
  check(`${tag} 주행거리 칩 규격 32 · 좌우 12 · 14/20 500 · #F4F4F4 · 사이 8`, spec.h === 32 && spec.pl === "12px" && spec.pr === "12px" && spec.font === "14px/20px 500" && spec.bg === "rgb(244, 244, 244)" && near(spec.gap, 8), JSON.stringify(spec));
  check(`${tag} 상단 카드 높이 전후 같음`, near(card0, beforeCard), `${beforeCard} → ${card0}`);

  // 페이지를 내린 상태에서 열고 닫기 → scrollTop · 목록 가로 위치
  await page.evaluate(() => { document.querySelector(".mobile-scroll").scrollTop = 600; const m = document.querySelector("aside.bbm-filter > .bbm-filter-menu"); if (m) m.scrollTop = 200; });
  await page.evaluate(() => { const s = document.querySelector(".mobile-scroll"); const c = document.querySelector(".bbm-ct-chip-row"); s.scrollTop = 600; }); await page.waitForTimeout(150);
  const s0 = await scrolls(page);
  // 칩은 스크롤로 화면 밖일 수 있어 스크립트로 누름(포커스 복귀 확인용으로 먼저 칩에 포커스)
  await page.locator(".bbm-ct-chip-row .filter-chip.is-mileage").first().evaluate((el) => el.focus({ preventScroll: true }));
  await page.keyboard.press("Enter"); await page.waitForTimeout(300);
  const s1 = await scrolls(page);
  const lock = await page.evaluate(() => getComputedStyle(document.querySelector(".mobile-scroll")).overflowY);
  const m0 = await modalBox(page);
  if (width === 1440) { await page.addStyleTag({ content: nostyle }); await page.screenshot({ path: join(out, "pc-1440-modal-default.png") }); }
  const wantW = Math.min(480, width - 48);
  check(`${tag} 모달 폭 ${wantW} · 가운데 · 모서리 16 · 헤더 64 · 액션 바 80`, near(m0.w, wantW) && near(m0.left, m0.right, 1) && near(m0.top, m0.bottom, 1) && m0.radius === "16px" && m0.header === 64 && m0.actions === 80, `폭 ${r1(m0.w)} · 좌우 ${r1(m0.left)}/${r1(m0.right)} · 위아래 ${r1(m0.top)}/${r1(m0.bottom)} · ${m0.radius} · 헤더 ${m0.header} · 바 ${m0.actions}`);
  const wantField = (m0.bodyW - 12 - 20) / 2; const wantChip = (m0.bodyW - 16) / 3;
  check(`${tag} 본문 ${r1(m0.bodyW)} → 입력 ${r1(wantField)} · 칩 ${r1(wantChip)} 3열`, m0.fields.every((f) => near(f, wantField)) && m0.chips.every((c) => near(c, wantChip)) && m0.chipCols === 3, `입력 ${m0.fields.map(r1).join("/")} · 칩 ${[...new Set(m0.chips.map(r1))].join("/")}`);
  check(`${tag} 첫 눈금 왼쪽 끝 = 첫 손잡이 중심 · 끝 눈금 오른쪽 끝 = 끝 손잡이 중심 · 가운데 눈금 = 20·40·60·80% · 슬라이더 안`, near(m0.firstTick, 0) && near(m0.lastTick, 0) && m0.midErr.every((e) => near(e, 0)) && m0.tickInside, `첫 ${r1(m0.firstTick)} · 끝 ${r1(m0.lastTick)} · 가운데 ${m0.midErr.map(r1).join("/")}`);
  check(`${tag} 잘림·가로 스크롤 0`, !m0.hScroll, `${m0.hScroll}`);
  check(`${tag} 접근성: dialog · aria-modal · 제목 연결 · 열 때 닫기에 포커스`, m0.dialog.role === "dialog" && m0.dialog.modal === "true" && m0.dialog.labelled === "주행거리" && /mf-close/.test(m0.active), `${JSON.stringify(m0.dialog)} · 포커스 ${m0.active}`);
  check(`${tag} 열 때 스크롤 잠금 · 페이지·사이드바 scrollTop · 목록 가로 위치 그대로`, lock === "hidden" && s1.page === s0.page && s1.side === s0.side && near(s1.listX, s0.listX) && near(s1.listW, s0.listW), `잠금 ${lock} · 페이지 ${s0.page}→${s1.page} · 사이드바 ${s0.side}→${s1.side} · 목록 x ${r1(s0.listX)}→${r1(s1.listX)} 폭 ${r1(s0.listW)}→${r1(s1.listW)}`);

  // 조작 중 모달 높이 변화 0
  const hs = [m0.h]; const cnt0 = await count(page);
  const hb = await page.locator(".mf-sheet.is-modal .mf-handle.is-max .mf-handle-dot").boundingBox(); const tb = await page.locator(".mf-sheet.is-modal .mf-track").boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down(); hs.push((await modalBox(page)).h);
  await page.mouse.move(tb.x + tb.width * 0.55, hb.y + hb.height / 2, { steps: 6 }); await page.waitForTimeout(150); hs.push((await modalBox(page)).h);
  if (width === 1440) await page.screenshot({ path: join(out, "pc-1440-modal-drag.png") });
  const dragBtn = (await modalBox(page)).confirm; const listDuring = await count(page);
  await page.mouse.up(); await page.waitForTimeout(200); hs.push((await modalBox(page)).h);
  for (const chip of ["1만km 이하", "1~3만km", "3~6만km", "6~10만km", "10만km 이상", "3~6만km"]) { await page.locator(".mf-sheet.is-modal .mf-chip").filter({ hasText: chip }).click(); await page.waitForTimeout(120); hs.push((await modalBox(page)).h); }
  if (width === 1440) await page.screenshot({ path: join(out, "pc-1440-modal-chip.png") });
  const chosen = await modalBox(page);
  check(`${tag} 조작 중 모달 높이 변화 0 · 목록은 그대로 · 버튼 대수는 임시 값 기준`, Math.max(...hs) - Math.min(...hs) <= 0.5 && listDuring === cnt0 && dragBtn !== `${cnt0}대 보기`, `높이 ${[...new Set(hs.map(r1))].join("/")} · 목록 ${cnt0}→${listDuring} · 끄는 중 버튼 ${dragBtn} · 칩 ${chosen.confirm}`);

  // 적용 → 칩 검정 · 목록 · 사이드바, 포커스 복귀, scrollTop
  await page.locator(".mf-sheet.is-modal .mf-confirm").click(); await page.waitForTimeout(450);
  const s2 = await scrolls(page); const cnt1 = await count(page); const row1 = await chipRow(page);
  const applied = await page.evaluate(() => { const c = document.querySelector(".bbm-ct-chip-row .filter-chip.is-mileage"); return c ? { text: c.textContent.trim(), active: c.classList.contains("is-active"), clear: Boolean(c.querySelector(".filter-chip-clear")), bg: getComputedStyle(c).backgroundColor } : null; });
  const focusBack = await page.evaluate(() => Boolean(document.activeElement?.closest(".filter-chip.is-mileage")));
  // 사이드바 주행거리 항목을 펼쳐 선택 칩 확인(1280 이상) — 펼친 채 둔다
  const openSide = async () => { const item = page.locator("aside.bbm-filter .bbm-filter-item").filter({ has: page.locator(".bbm-filter-toggle", { hasText: /^주행거리/ }) }).first(); if (!(await item.evaluate((el) => el.classList.contains("is-open")))) { await item.locator(".bbm-filter-toggle").click(); await page.waitForTimeout(300); } };
  if (width >= 1280) await openSide();
  const side = await sidebarSel(page);
  const filterN = await page.evaluate(() => document.querySelector(".bbm-ct-chip-row .bbm-filter-button")?.textContent.trim());
  if (width === 1440) await page.locator(".bbm-ct-chip-row").screenshot({ path: join(out, "pc-1440-chips-applied.png") });
  check(`${tag} 적용 → 검정 칩 "3~6만km" ×  · 목록 ${cnt0}→${cnt1} · 사이드바 3~6만km · 필터 N · 주행거리 ▾ 칩 빠짐`, applied?.text === "3~6만km" && applied.active && applied.clear && cnt1 < cnt0 && cnt1 === Number(chosen.confirm.replace(/[^\d]/g, "")) && (width < 1280 || side.includes("3~6만km")) && /필터\s*1/.test(filterN) && !row1.includes("주행거리"), `${JSON.stringify(applied)} · 사이드바 ${side.join()} · ${filterN} · ${row1.join(" · ")}`);
  check(`${tag} 닫히면 주행거리 칩으로 포커스 · 열고 닫을 때 scrollTop 변화 0`, focusBack && s2.page === s0.page && s2.side === s0.side, `포커스 ${focusBack} · 페이지 ${s0.page}→${s2.page} · 사이드바 ${s0.side}→${s2.side}`);

  // 적용 값으로 열림 + 닫기 · 배경 · Esc 는 버림
  const discard = [];
  for (const how of ["닫기", "배경", "Esc"]) {
    await openModal(page);
    const opened = (await modalBox(page)).selected.join();
    await page.locator(".mf-sheet.is-modal .mf-chip").filter({ hasText: "1만km 이하" }).click(); await page.waitForTimeout(100);
    if (how === "닫기") await page.locator(".mf-sheet.is-modal .mf-close").click();
    else if (how === "배경") await page.mouse.click(8, height - 8);
    else await page.keyboard.press("Escape");
    await page.waitForTimeout(350);
    const still = await page.evaluate(() => document.querySelector(".bbm-ct-chip-row .filter-chip.is-mileage")?.textContent.trim());
    discard.push(`${how}: 열림 ${opened} → ${still}`);
    if (opened !== "3~6만km" || still !== "3~6만km" || await page.locator(".mf-sheet.is-modal").count()) discard.push("X");
  }
  check(`${tag} 적용 값(3~6만km)으로 열림 · 닫기·배경·Esc 는 임시 값 버림`, !discard.includes("X"), discard.join(" · "));

  // 다른 필터(지역 서울) + 모달 초기화 → 주행거리만 풀림
  await page.evaluate(() => { document.querySelector(".mobile-scroll").scrollTop = 0; }); await page.waitForTimeout(100);
  await page.locator(".bbm-ct-region-row button, .stable-region-row button, [class*='region'] button").filter({ hasText: /^서울$/ }).first().click(); await page.waitForTimeout(350);
  await openModal(page);
  await page.locator(".mf-sheet.is-modal .mf-reset").click(); await page.waitForTimeout(150);
  const afterReset = await modalBox(page);
  await page.locator(".mf-sheet.is-modal .mf-confirm").click(); await page.waitForTimeout(400);
  const row2 = await chipRow(page);
  check(`${tag} 모달 초기화는 주행거리만(닫히지 않음 · 서울 유지)`, afterReset && afterReset.selected.length === 0 && row2.includes("서울") && row2.includes("주행거리") && !row2.includes("3~6만km"), `초기화 뒤 선택 ${afterReset?.selected.join() || "없음"} · ${row2.join(" · ")}`);

  // 사이드바에서 바꾸면 칩 표시, 칩 × 는 주행거리만
  if (width >= 1280) {
    await openSide();
    await page.locator("aside.bbm-filter .mf-chip").filter({ hasText: "1~3만km" }).click(); await page.waitForTimeout(350);
    const row3 = await chipRow(page);
    await page.locator(".bbm-ct-chip-row .filter-chip.is-mileage .filter-chip-clear").click(); await page.waitForTimeout(350);
    const row4 = await chipRow(page);
    check(`${tag} 사이드바 1~3만km → 칩 표시 · 칩 × 는 주행거리만(서울 유지)`, row3.includes("1~3만km") && !row4.includes("1~3만km") && row4.includes("서울") && row4.includes("주행거리"), `${row3.join(" · ")} → ${row4.join(" · ")}`);
  }

  // 키보드만으로: 칩 포커스 Enter → Tab 가두기 → 손잡이 ← · End → 칩 Space → 적용 Enter
  await page.locator(".bbm-ct-chip-row .filter-chip.is-mileage").first().evaluate((el) => (el.matches("button") ? el : el.querySelector("button")).focus({ preventScroll: true }));
  await page.keyboard.press("Enter"); await page.waitForTimeout(300);
  const inside = [];
  for (let i = 0; i < 16; i += 1) { await page.keyboard.press("Tab"); inside.push(await page.evaluate(() => Boolean(document.activeElement?.closest(".mf-sheet.is-modal")))); }
  await page.keyboard.press("Shift+Tab"); inside.push(await page.evaluate(() => Boolean(document.activeElement?.closest(".mf-sheet.is-modal"))));
  await page.locator(".mf-sheet.is-modal .mf-handle.is-max").focus();
  await page.keyboard.press("ArrowLeft"); const k1 = await page.locator(".mf-sheet.is-modal .mf-handle.is-max").getAttribute("aria-valuetext");
  await page.keyboard.press("End"); const k2 = await page.locator(".mf-sheet.is-modal .mf-handle.is-max").getAttribute("aria-valuetext");
  await page.locator(".mf-sheet.is-modal .mf-chip").filter({ hasText: "6~10만km" }).focus(); await page.keyboard.press("Space");
  const pressed = await page.locator(".mf-sheet.is-modal .mf-chip").filter({ hasText: "6~10만km" }).getAttribute("aria-pressed");
  await page.locator(".mf-sheet.is-modal .mf-confirm").focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(400);
  const row5 = await chipRow(page);
  const labels = await page.evaluate(() => [...document.querySelectorAll("aside.bbm-filter .mf-handle, .bbm-drawer .mf-handle")].map((h) => h.getAttribute("aria-label")));
  check(`${tag} 키보드: Tab 가두기 · ← 99,000km · End 제한 없음 · 칩 aria-pressed · Enter 적용`, inside.every(Boolean) && k1 === "99,000km" && k2 === "제한 없음" && pressed === "true" && row5.includes("6~10만km"), `가둠 ${inside.filter(Boolean).length}/${inside.length} · ${k1} · ${k2} · ${pressed} · ${row5.join(" · ")}`);
  check(`${tag} 콘솔 오류 0`, errors.length === 0, `${errors.length}${errors.length ? ` ${errors[0].slice(0, 100)}` : ""}`);
  result.sizes[width] = { row, beforeRow, card0, beforeCard, spec, modal: m0, heights: hs, scroll: { s0, s1, s2 }, discard, labels };
  await page.close();
}

// 모바일 393: 칩 줄 변화 없음(주행거리 칩 없음) · 모바일 시트 캡처와 PC 모달 나란히
{
  const ctx = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${base}?qf=guazi`, { waitUntil: "networkidle" }); await page.waitForTimeout(600);
  const mrow = await page.evaluate(() => [...document.querySelectorAll(".filter-shell.is-bbm .filter-chip")].map((c) => c.textContent.trim()));
  const bctx = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 393, height: 852 } });
  const bpage = await bctx.newPage(); await bpage.goto(`${before}?qf=guazi`, { waitUntil: "networkidle" }); await bpage.waitForTimeout(600);
  const brow = await bpage.evaluate(() => [...document.querySelectorAll(".filter-shell.is-bbm .filter-chip")].map((c) => c.textContent.trim()));
  await bctx.close();
  check("모바일 393 칩 줄 변화 없음(주행거리 칩 없음)", JSON.stringify(mrow) === JSON.stringify(brow) && !mrow.includes("주행거리"), mrow.join(" · "));
  await page.addStyleTag({ content: nostyle });
  await page.locator(".filter-shell.is-bbm .filter-fixed").tap(); await page.waitForTimeout(400);
  await page.locator(".bbmf-full button, .bbmf-full-item").filter({ hasText: /^주행거리/ }).first().tap(); await page.waitForTimeout(500);
  await page.screenshot({ path: join(out, "m-393-sheet.png") });
  result.mobile = { mrow, brow };
  await ctx.close();
}
writeFileSync(join(out, "modal-check.json"), JSON.stringify(result, null, 1));
await browser.close();
console.log(`결과: ${fails ? `실패 ${fails}` : "모두 통과"}`);
process.exitCode = fails ? 1 : 0;
