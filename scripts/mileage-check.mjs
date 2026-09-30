#!/usr/bin/env node
// QF-117 주행거리 필터(mileage-final) 점검. 모바일 375·390·393·430: 시트 수치(헤더 64 · 제목/닫기 세로 가운데 · 입력 폭 · 구분자 12 · 트랙 인셋 11 · 첫·끝 눈금 = 양끝 손잡이 중심 · 눈금 간격 · 칩 폭 · 버튼 92×52 · 가로 넘침 0)
// 동작(393): 손잡이 드래그 1,000km 단위 · 입력·슬라이더·칩 동기화 · 10만 이상 ≠ 10만 이하 · 방향키 · 최소>최대면 적용 막힘 · 닫기로 임시 값 확정 안 됨 · 적용 대수 · 초기화가 다른 필터를 안 건드림
// PC 1024(펼침판)·1280·1440: 300 사이드바 안 입력 세로 · 칩 2열 · 잘림 0 · 즉시 반영 대수
// 사용: node scripts/mileage-check.mjs [--base=<주소>] → reports/qf-117/mileage-check.json · 캡처
import { chromium, devices } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv.find((a) => a.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const out = join("reports", "qf-117"); mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const result = { mobile: {}, pc: {}, behavior: {} }; let fails = 0;
const check = (name, ok, detail) => { if (!ok) fails += 1; console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };
const r1 = (v) => Math.round(v * 10) / 10;

const openSheet = async (page) => {
  await page.goto(`${base}?qf=guazi`, { waitUntil: "networkidle" }); await page.waitForTimeout(500);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
  await page.locator(".filter-shell.is-bbm .filter-fixed").tap(); await page.waitForTimeout(400);
  await page.locator(".bbmf-full button, .bbmf-full-item").filter({ hasText: /^주행거리/ }).first().tap(); await page.waitForTimeout(400);
};
const measureSheet = (page) => page.evaluate(() => {
  const q = (s) => document.querySelector(s); const box = (el) => el.getBoundingClientRect();
  const sheet = q(".mf-sheet"); const header = q(".mf-header"); const title = q(".mf-title"); const close = q(".mf-close");
  const fields = [...document.querySelectorAll(".mf-inputs .mf-field")].map(box); const sep = box(q(".mf-sep"));
  const slider = box(q(".mf-slider")); const track = box(q(".mf-track"));
  const handles = [...document.querySelectorAll(".mf-handle-dot")].map(box); const ticks = [...document.querySelectorAll(".mf-tick")].map(box);
  const chips = [...document.querySelectorAll(".mf-chip")].map(box); const reset = box(q(".mf-reset")); const confirm = box(q(".mf-confirm"));
  const tc = ticks.map((t) => t.left + t.width / 2); const mid = tc.slice(1, -1); const gaps = mid.slice(1).map((c, i) => c - mid[i]);
  // 보이는 것(손잡이 점 · 눈금 · 입력 · 칩 · 버튼)이 시트 안에 있는지 + 문서 가로 스크롤. 손잡이 누르는 영역(44)·숨은 말풍선은 제외
  const visible = [...document.querySelectorAll(".mf-handle-dot, .mf-tick, .mf-field, .mf-chip, .mf-reset, .mf-confirm, .mf-title, .mf-close")].map(box);
  const overflow = visible.some((v) => v.left < box(sheet).left - 0.5 || v.right > box(sheet).right + 0.5) || document.scrollingElement.scrollWidth > innerWidth + 0.5;
  const ts = getComputedStyle(title);
  return {
    sheetW: box(sheet).width, radius: getComputedStyle(sheet).borderTopLeftRadius, headerH: box(header).height,
    titleFont: `${ts.fontSize}/${ts.lineHeight} ${ts.fontWeight} ${ts.letterSpacing}`, titleCenter: box(title).top + box(title).height / 2, closeCenter: box(close).top + box(close).height / 2,
    closeHit: [box(close).width, box(close).height], closeRight: innerWidth - (box(close).right - 4), titleLeft: box(title).left,
    fieldW: fields.map((f) => f.width), fieldH: fields.map((f) => f.height), sepW: sep.width,
    sliderH: slider.height, inset: [track.left - slider.left, slider.right - track.right], trackW: track.width, trackH: track.height,
    firstTickVsHandle: ticks[0].left - (handles[0].left + handles[0].width / 2), lastTickVsHandle: ticks.at(-1).right - (handles[1].left + handles[1].width / 2),
    tickGaps: gaps, handleSize: handles[0].width, chipW: [...new Set(chips.map((c) => Math.round(c.width * 10) / 10))], chipH: [...new Set(chips.map((c) => c.height))],
    chipRows: [...new Set(chips.map((c) => Math.round(c.top)))].length, reset: [reset.width, reset.height], confirm: [confirm.width, confirm.height], actionsH: box(q(".mf-actions")).height,
    tickInside: ticks.every((t) => t.left >= slider.left - 0.5 && t.right <= slider.right + 0.5), overflow,
  };
});

// ── 모바일 4개 폭 수치
for (const width of [375, 390, 393, 430]) {
  const ctx = await browser.newContext({ ...devices["iPhone 13"], viewport: { width, height: 852 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errors = [];
  page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await openSheet(page);
  const m = await measureSheet(page);
  result.mobile[width] = { ...m, errors: errors.length };
  if (width === 393) await page.screenshot({ path: join(out, "m-393-sheet.png") });
  const wantField = (width - 32 - 12 - 20) / 2; const wantChip = (width - 32 - 16) / 3;
  check(`${width} 헤더 64 · 제목·닫기 세로 가운데 · 닫기 누르는 영역 44 · 오른쪽 24`, m.headerH === 64 && Math.abs(m.titleCenter - m.closeCenter) <= 0.5 && m.closeHit.join() === "44,44" && Math.abs(m.closeRight - 24) <= 0.5, `헤더 ${m.headerH} · 차이 ${r1(m.titleCenter - m.closeCenter)} · 닫기 ${m.closeHit.join("×")} · 오른쪽 ${r1(m.closeRight)} · 제목 ${m.titleFont}`);
  check(`${width} 입력 ${r1(wantField)} · 구분자 12 · 높이 48`, m.fieldW.every((w) => Math.abs(w - wantField) <= 0.5) && m.sepW === 12 && m.fieldH.every((h) => h === 48), `${m.fieldW.map(r1).join(" / ")} · ${m.sepW}`);
  check(`${width} 슬라이더 줄 38 · 트랙 4 · 인셋 11 · 트랙 폭 ${width - 32 - 22}`, m.sliderH === 38 && m.trackH === 4 && m.inset.every((v) => Math.abs(v - 11) <= 0.5) && Math.abs(m.trackW - (width - 54)) <= 0.5, `줄 ${m.sliderH} · 트랙 ${r1(m.trackW)}×${m.trackH} · 인셋 ${m.inset.map(r1).join("/")}`);
  check(`${width} 첫 눈금 왼쪽 끝 = 첫 손잡이 중심 · 끝 눈금 오른쪽 끝 = 끝 손잡이 중심(QF-119) · 가운데 눈금 간격 일정`, Math.abs(m.firstTickVsHandle) <= 0.5 && Math.abs(m.lastTickVsHandle) <= 0.5 && Math.max(...m.tickGaps) - Math.min(...m.tickGaps) <= 0.5, `첫 ${r1(m.firstTickVsHandle)} · 끝 ${r1(m.lastTickVsHandle)} · 간격 ${m.tickGaps.map(r1).join("/")}`);
  check(`${width} 칩 ${r1(wantChip)}×48 · 2줄`, m.chipW.length === 1 && Math.abs(m.chipW[0] - wantChip) <= 0.5 && m.chipH.join() === "48" && m.chipRows === 2, `${m.chipW.join()}×${m.chipH.join()} · ${m.chipRows}줄`);
  check(`${width} 버튼 92×52 · 나머지 폭×52 · 액션 바 80`, m.reset.join() === "92,52" && Math.abs(m.confirm[0] - (width - 40 - 92 - 10)) <= 0.5 && m.confirm[1] === 52 && m.actionsH === 80, `${m.reset.join("×")} · ${r1(m.confirm[0])}×${m.confirm[1]} · 바 ${m.actionsH}`);
  check(`${width} 잘림·가로 넘침 0 · 눈금이 슬라이더 안`, !m.overflow && m.tickInside, `넘침 ${m.overflow} · 눈금이 슬라이더 안 ${m.tickInside}`);
  check(`${width} 콘솔 오류 0`, errors.length === 0, `${errors.length}`);
  await ctx.close();
}

// ── 모바일 동작(393)
{
  const ctx = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errors = [];
  page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  const state = () => page.evaluate(() => ({
    min: document.querySelectorAll(".mf-field input")[0]?.value, max: document.querySelectorAll(".mf-field input")[1]?.value,
    handles: [...document.querySelectorAll(".mf-handle")].map((h) => [Number(h.getAttribute("aria-valuenow")), h.getAttribute("aria-valuetext")]),
    chip: [...document.querySelectorAll(".mf-chip")].filter((c) => c.getAttribute("aria-pressed") === "true").map((c) => c.textContent),
    confirm: document.querySelector(".mf-confirm")?.textContent, disabled: document.querySelector(".mf-confirm")?.disabled, open: Boolean(document.querySelector(".mf-sheet")),
  }));
  const trackX = async (value) => page.evaluate((value) => { const t = document.querySelector(".mf-track").getBoundingClientRect(); return { x: t.left + (t.width * value) / 100000, y: t.top + 2 }; }, value);
  await openSheet(page);
  const b = {};
  // 최대 손잡이를 60% 로 드래그
  const from = await trackX(100000); const to = await trackX(60400);
  await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(to.x, to.y, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(200);
  b.dragMax = await state();
  const from2 = await trackX(0); const to2 = await trackX(34600);
  await page.mouse.move(from2.x, from2.y); await page.mouse.down(); await page.mouse.move(to2.x, to2.y, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(200);
  b.dragMin = await state();
  await page.locator(".mf-chip").filter({ hasText: "3~6만km" }).tap(); await page.waitForTimeout(150); b.chip36 = await state();
  await page.locator(".mf-chip").filter({ hasText: "3~6만km" }).tap(); await page.waitForTimeout(150); b.chip36off = await state();
  await page.locator(".mf-chip").filter({ hasText: "10만km 이상" }).tap(); await page.waitForTimeout(150); b.chip10up = await state();
  await page.locator(".mf-chip").filter({ hasText: "6~10만km" }).tap(); await page.waitForTimeout(150); b.chip610 = await state();
  await page.locator(".mf-chip").filter({ hasText: "6~10만km" }).tap();
  await page.locator(".mf-handle.is-min").focus(); for (let i = 0; i < 3; i += 1) await page.keyboard.press("ArrowRight"); b.keyMin = await state();
  await page.locator(".mf-handle.is-max").focus(); await page.keyboard.press("ArrowLeft"); b.keyMax = await state(); await page.keyboard.press("End"); b.keyEnd = await state();
  await page.locator(".mf-field input").nth(0).fill("50000"); await page.locator(".mf-field input").nth(1).fill("20000"); await page.waitForTimeout(200); b.invalid = await state();
  await page.locator(".mf-field input").nth(0).fill("10000"); await page.locator(".mf-field input").nth(1).fill("30000"); await page.waitForTimeout(200); b.typed = await state();
  // 닫기 → 임시 값 확정 안 됨
  await page.locator(".mf-close").tap(); await page.waitForTimeout(300);
  b.afterClose = await page.evaluate(() => ({ list: [...document.querySelectorAll(".bbmf-full-item-wrap")].find((e) => /^주행거리/.test(e.textContent))?.textContent.trim() }));
  await page.locator(".bbmf-full button, .bbmf-full-item").filter({ hasText: /^주행거리/ }).first().tap(); await page.waitForTimeout(300); b.reopen = await state();
  // 적용: 3~6만km → N대 보기 → 목록 대수 = N
  await page.locator(".mf-chip").filter({ hasText: "3~6만km" }).tap(); await page.waitForTimeout(300); const beforeApply = await state();
  await page.locator(".mf-confirm").tap(); await page.waitForTimeout(400);
  b.applied = { button: beforeApply.confirm, list: await page.evaluate(() => [...document.querySelectorAll(".bbmf-full-item-wrap")].find((e) => /^주행거리/.test(e.textContent))?.textContent.trim()) };
  // 초기화는 주행거리만: 다른 항목(연료 디젤) 걸어 두고 시트에서 초기화 → 적용
  await page.locator(".bbmf-full button, .bbmf-full-item").filter({ hasText: /^연료/ }).first().tap(); await page.waitForTimeout(400);
  await page.locator(".bbmf-sheet .bbmf-check, .bbmf-sheet button").filter({ hasText: /^디젤/ }).first().tap(); await page.waitForTimeout(200);
  await page.locator(".bbmf-sheet .bbmf-confirm").tap(); await page.waitForTimeout(400);
  await page.locator(".bbmf-full button, .bbmf-full-item").filter({ hasText: /^주행거리/ }).first().tap(); await page.waitForTimeout(300);
  await page.locator(".mf-reset").tap(); await page.waitForTimeout(200); b.afterReset = await state();
  await page.locator(".mf-confirm").tap(); await page.waitForTimeout(400);
  b.resetApplied = await page.evaluate(() => Object.fromEntries(["연료", "주행거리"].map((label) => [label, [...document.querySelectorAll(".bbmf-full-item-wrap")].find((e) => e.textContent.trim().startsWith(label))?.textContent.trim()])));
  result.behavior = { ...b, errors: errors.length };
  check("드래그: 최대 손잡이 → 60,000(1,000 단위) · 입력 동기화", b.dragMax.handles[1][0] === 60000 && b.dragMax.max === "60,000", JSON.stringify(b.dragMax.handles));
  check("드래그: 최소 손잡이 → 35,000 · 입력 동기화", b.dragMin.handles[0][0] === 35000 && b.dragMin.min === "35,000", JSON.stringify(b.dragMin.handles));
  check("칩 3~6만km → 입력 30,000~60,000 · 손잡이 · 선택 표시", b.chip36.min === "30,000" && b.chip36.max === "60,000" && b.chip36.handles[0][0] === 30000 && b.chip36.handles[1][0] === 60000 && b.chip36.chip.join() === "3~6만km", JSON.stringify(b.chip36));
  check("같은 칩 다시 → 해제(0 ~ 제한 없음)", !b.chip36off.min && !b.chip36off.max && b.chip36off.chip.length === 0 && b.chip36off.handles[1][1] === "제한 없음", JSON.stringify(b.chip36off));
  check("10만km 이상 = 최대 없음(제한 없음) ≠ 6~10만km(100,000km)", b.chip10up.min === "100,000" && !b.chip10up.max && b.chip10up.handles[1][1] === "제한 없음" && b.chip610.max === "100,000" && b.chip610.handles[1][1] === "100,000km", `${b.chip10up.handles[1][1]} / ${b.chip610.handles[1][1]}`);
  check("방향키 1,000km 단위(최소 +3 → 3,000 · 최대 ← 99,000 · End → 제한 없음)", b.keyMin.handles[0][0] === 3000 && b.keyMax.handles[1][0] === 99000 && b.keyEnd.handles[1][1] === "제한 없음", `${b.keyMin.handles[0][0]} · ${b.keyMax.handles[1][0]} · ${b.keyEnd.handles[1][1]}`);
  check("최소 > 최대 → 적용 버튼 비활성", b.invalid.disabled === true && b.typed.disabled === false && b.typed.chip.join() === "1~3만km", `비활성 ${b.invalid.disabled} · 입력 1~3만 → 칩 ${b.typed.chip.join()}`);
  check("닫기 → 임시 값 확정 안 됨(다시 열면 비어 있음)", !/만km/.test(b.afterClose.list ?? "") && !b.reopen.min && !b.reopen.max, JSON.stringify({ list: b.afterClose.list, reopen: [b.reopen.min, b.reopen.max] }));
  check("적용 → 목록 표기 3~6만km · 버튼 대수 실시간", /3~6만km/.test(b.applied.list ?? "") && /^\d[\d,]*대 보기$/.test(b.applied.button ?? ""), JSON.stringify(b.applied));
  check("초기화는 주행거리만(연료 디젤 유지)", /디젤/.test(b.resetApplied["연료"] ?? "") && !/만km/.test(b.resetApplied["주행거리"] ?? ""), JSON.stringify(b.resetApplied));
  check("모바일 동작 콘솔 오류 0", errors.length === 0, `${errors.length}`);
  await ctx.close();
}

// ── PC 1024(펼침판) · 1280 · 1440
for (const width of [1024, 1280, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } }); const errors = [];
  page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(`${base}?qf=guazi&pc=1`, { waitUntil: "networkidle" }); await page.waitForTimeout(500);
  const scope = width < 1280 ? ".bbm-drawer" : "aside.bbm-filter";
  if (width < 1280) { await page.locator(".bbm-filter-button").first().click(); await page.waitForTimeout(400); }
  await page.locator(`${scope} .bbm-filter-toggle`).filter({ hasText: /^주행거리/ }).first().click(); await page.waitForTimeout(400);
  const m = await page.evaluate((scope) => {
    const panel = document.querySelector(`${scope} .mf-panel.is-sidebar`); if (!panel) return null;
    const aside = document.querySelector(scope).getBoundingClientRect(); const box = (el) => el.getBoundingClientRect();
    const fields = [...panel.querySelectorAll(".mf-field")].map(box); const chips = [...panel.querySelectorAll(".mf-chip")].map(box);
    const inner = box(panel);
    return { asideW: Math.round(aside.width), panelW: inner.width, fields: fields.map((f) => [Math.round(f.left), Math.round(f.top), Math.round(f.width)]), stacked: fields[1].top > fields[0].bottom, chipCols: [...new Set(chips.map((c) => Math.round(c.left)))].length, chipH: [...new Set(chips.map((c) => c.height))], overflow: [...panel.querySelectorAll(".mf-handle-dot, .mf-tick, .mf-field, .mf-chip")].some((el) => { const b = el.getBoundingClientRect(); return b.left < aside.left - 0.5 || b.right > aside.right + 0.5; }), header: Boolean(panel.closest(".mf-sheet")), actions: Boolean(document.querySelector(".mf-actions")) };
  }, scope);
  if (!m) { check(`PC ${width} 사이드바 주행거리 패널`, false, "없음"); await page.close(); continue; }
  if (width === 1440) await page.locator(`${scope} .bbm-filter-item.is-open`).filter({ has: page.locator(".bbm-filter-toggle", { hasText: /^주행거리/ }) }).screenshot({ path: join(out, "pc-1440-sidebar-after.png") });
  // 즉시 반영: 칩 → 대수 · 적용 칩
  const countBefore = await page.evaluate(() => document.querySelector(".bbm-ct-title")?.dataset.count);
  await page.locator(`${scope} .mf-chip`).filter({ hasText: "1~3만km" }).click(); await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({ count: document.querySelector(".bbm-ct-title")?.dataset.count, chips: [...document.querySelectorAll(".bbm-ct-chip-row .filter-chip.is-active, .bbm-chips .filter-chip.is-active")].filter((c) => c.getBoundingClientRect().width).map((c) => c.textContent.trim()) }));
  result.pc[width] = { ...m, countBefore, after, errors: errors.length };
  check(`PC ${width} 사이드바(${m.asideW}) 안 입력 세로 · 칩 2열 · 높이 48 · 잘림 0 · 모바일 헤더·액션 바 없음`, m.stacked && m.chipCols === 2 && m.chipH.join() === "48" && !m.overflow && !m.header && !m.actions, JSON.stringify({ fields: m.fields, cols: m.chipCols, overflow: m.overflow }));
  check(`PC ${width} 즉시 반영: 1~3만km → 적용 칩 · 대수 갱신`, after.chips.includes("1~3만km") && Number(after.count) < Number(countBefore), `${countBefore} → ${after.count} · ${after.chips.join(" ")}`);
  check(`PC ${width} 콘솔 오류 0`, errors.length === 0, `${errors.length}`);
  await page.close();
}
writeFileSync(join(out, "mileage-check.json"), JSON.stringify(result, null, 1));
await browser.close();
console.log(`결과: ${fails ? `실패 ${fails}` : "모두 통과"}`);
process.exitCode = fails ? 1 : 0;
