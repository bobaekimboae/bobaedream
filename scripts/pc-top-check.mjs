#!/usr/bin/env node
// QF-095: 과쯔 PC 상단 카드(초톳 PC 상단 구조) 수치·동작 점검. 원본(개발 시안)에 없는 모양이라 초톳 실측 수치로 확인한다.
// 사용: npm run check:top [-- --base=<주소>] (기본 vite preview 127.0.0.1:4173)
// 출력: reports/diff/<커밋>/top/summary.json · 캡처(1440 · 1280 · 1100 · 적용 칩 2개) — 커밋하지 않음
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv.find((arg) => arg.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const url = `${base}?qf=guazi&pc=1`;
const commit = (() => { try { const hash = execSync("git rev-parse --short HEAD").toString().trim(); const dirty = execSync("git status --porcelain").toString().trim(); return dirty ? `${hash}-dirty` : hash; } catch { return "local"; } })();
const outDir = join("reports", "diff", commit, "top");
mkdirSync(outDir, { recursive: true });
const browser = await browserLaunch();
async function browserLaunch() { return chromium.launch({ args: ["--disable-lcd-text"] }); }
const summary = { url, commit, measuredAt: new Date().toISOString(), numbers: {}, checks: [] };
const check = (name, ok, detail) => { summary.checks.push({ name, ok, detail }); console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };
const open = async (width) => {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(900);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}" });
  return { context, page, errors };
};
const card = ".bbm-hybrid-top .bbm-content-head";
const measure = (page) => page.evaluate((card) => {
  const root = document.querySelector(card); const cr = root.getBoundingClientRect(); const cs = getComputedStyle(root);
  const box = (selector, scope = root) => { const element = scope.querySelector(selector); if (!element || !element.getClientRects().length) return null; const r = element.getBoundingClientRect(); return { x: Math.round(r.left - cr.left), y: Math.round(r.top - cr.top), w: Math.round(r.width), h: Math.round(r.height) }; };
  const style = (selector) => { const element = root.querySelector(selector); if (!element) return null; const s = getComputedStyle(element); return { font: `${s.fontSize}/${s.lineHeight} ${s.fontWeight}`, color: s.color, bg: s.backgroundColor, border: s.border, radius: s.borderRadius, padding: s.padding, gap: s.gap }; };
  const chips = [...root.querySelectorAll(".bbm-ct-chip-track .filter-chip")].map((chip) => chip.getBoundingClientRect());
  return {
    card: { x: Math.round(cr.left), y: Math.round(cr.top), w: Math.round(cr.width), h: Math.round(cr.height), radius: cs.borderRadius, padding: cs.padding, bg: cs.backgroundColor },
    crumbs: box(".bbm-ct-crumbs"), crumbItem: style(".bbm-ct-crumbs li"), crumbLast: style(".bbm-ct-crumbs strong"), crumbText: root.querySelector(".bbm-ct-crumbs")?.textContent.replace(/\s+/g, " ").trim(),
    titleRow: box(".bbm-ct-title-row"), title: { ...box(".bbm-ct-title"), ...style(".bbm-ct-title"), text: root.querySelector(".bbm-ct-title")?.textContent.replace(/\s+/g, " ").trim() },
    save: { ...box(".bbm-ct-save"), ...style(".bbm-ct-save"), gapFromTitle: Math.round(root.querySelector(".bbm-ct-save").getBoundingClientRect().left - root.querySelector(".bbm-ct-title").getBoundingClientRect().right) },
    chipRow: box(".bbm-ct-chip-row"), filterChip: { ...box(".bbm-filter-button"), ...style(".bbm-filter-button") },
    chip: { ...box(".bbm-ct-chip-track button.filter-chip"), ...style(".bbm-ct-chip-track button.filter-chip") },
    chipGap: chips.length > 1 ? Math.round(chips[1].left - chips[0].right) : null,
    applied: root.querySelector(".bbm-ct-chip-track .filter-chip.is-active") ? { ...style(".bbm-ct-chip-track .filter-chip.is-active"), clear: { ...box(".filter-chip.is-active .filter-chip-clear"), bg: getComputedStyle(root.querySelector(".filter-chip.is-active .filter-chip-clear")).backgroundColor } } : null,
    reset: root.querySelector(".bbm-ct-reset") ? { ...box(".bbm-ct-reset"), ...style(".bbm-ct-reset"), rightGap: Math.round(cr.right - root.querySelector(".bbm-ct-reset").getBoundingClientRect().right) } : null,
    arrows: [...root.querySelectorAll(".bbm-ct-chip-arrow")].map((arrow) => arrow.className.replace("bbm-ct-chip-arrow ", "")),
    slot: box(".bbm-quick-slot"), cell: box(".bbm-category-menu__button"), cellPitch: (() => { const cells = [...root.querySelectorAll(".bbm-category-menu__button")].map((c) => c.getBoundingClientRect().left); return cells.length > 1 ? Math.round(cells[1] - cells[0]) : null; })(),
    icon: box(".bbm-category-menu__icon-box"), label: { ...box(".bbm-category-menu__label"), ...style(".bbm-category-menu__label") },
    rail: box(".depth-rail") ?? box("[class*=depth-rail]"),
  };
}, card);

// 1440 · 1280 · 1100 수치
for (const width of [1440, 1280, 1100]) {
  const { context, page, errors } = await open(width);
  const m = await measure(page);
  summary.numbers[width] = { ...m, consoleErrors: errors.length };
  await page.locator(card).screenshot({ path: join(outDir, `${width}-top.png`) });
  await context.close();
}
const n = summary.numbers;
const n1440 = n[1440];
check("카드 1440 x 120 · 폭 1200 · 모서리 12 · 안쪽 16/20 · 흰 배경 · 헤더 아래 16", n1440.card.x === 120 && n1440.card.w === 1200 && n1440.card.radius === "12px" && n1440.card.padding === "16px 20px" && n1440.card.bg === "rgb(255, 255, 255)" && n1440.card.y === 117 + 16, JSON.stringify(n1440.card));
check("카드 높이 263(초톳 실측)", n1440.card.h === 263, `${n1440.card.h}`);
check("줄 위치: 경로 16 · 제목 줄 45 · 칩 줄 85(칩 95) · 유형 칸 145", n1440.crumbs?.y === 16 && n1440.titleRow?.y === 45 && n1440.chipRow?.y === 85 && n1440.chip?.y === 95 && n1440.cell?.y === 145, `경로 ${n1440.crumbs?.y} · 제목 줄 ${n1440.titleRow?.y} · 칩 줄 ${n1440.chipRow?.y}(칩 ${n1440.chip?.y}) · 칸 ${n1440.cell?.y}`);
check("경로 12/18 400 #8C8C8C · 마지막 700 #222 · 사이 /", n1440.crumbItem?.font === "12px/18px 400" && n1440.crumbItem?.color === "rgb(140, 140, 140)" && n1440.crumbLast?.font.endsWith(" 700") && n1440.crumbLast?.color === "rgb(34, 34, 34)" && /\//.test(n1440.crumbText), `${n1440.crumbText}`);
check("제목 16/24 700 #222 · \"중고차 N대 · YYYY년 M월\"", n1440.title.font === "16px/24px 700" && n1440.title.color === "rgb(34, 34, 34)" && /^중고차 \d+대 · \d{4}년 \d{1,2}월$/.test(n1440.title.text), `${n1440.title.text}`);
check("검색저장: 제목 오른쪽 20 · 높이 32 · 알약 · 흰 배경 · 테두리 1 #DADADA · 14/20 700", n1440.save.gapFromTitle === 20 && n1440.save.h === 32 && n1440.save.radius === "9999px" && n1440.save.bg === "rgb(255, 255, 255)" && n1440.save.border === "1px solid rgb(218, 218, 218)" && n1440.save.font === "14px/20px 700", `간격 ${n1440.save.gapFromTitle} · ${n1440.save.h} · ${n1440.save.border}`);
check("칩: 높이 32 · 알약 · #F4F4F4 · 14/20 500 #222 · 안쪽 4/12 · 사이 8", n1440.chip.h === 32 && n1440.chip.radius === "9999px" && n1440.chip.bg === "rgb(244, 244, 244)" && n1440.chip.font === "14px/20px 500" && n1440.chip.color === "rgb(34, 34, 34)" && n1440.chip.padding === "4px 12px" && n1440.chipGap === 8, `${n1440.chip.font} ${n1440.chip.padding} 사이 ${n1440.chipGap}`);
check("필터 칩: 같은 모양 + 아이콘 20", n1440.filterChip.h === 32 && n1440.filterChip.bg === "rgb(244, 244, 244)" && n1440.filterChip.padding === "4px 12px", `${n1440.filterChip.padding}`);
check("유형 칸 84×102 · 피치 92 · 아이콘 40(칸 위 6) · 이름 14/21 400 #595959", n1440.cell.w === 84 && n1440.cell.h === 102 && n1440.cellPitch === 92 && n1440.icon.w === 40 && n1440.icon.h === 40 && n1440.icon.y - n1440.cell.y === 6 && n1440.label.font === "14px/21px 400" && n1440.label.color === "rgb(89, 89, 89)", `칸 ${n1440.cell.w}×${n1440.cell.h} 피치 ${n1440.cellPitch} 아이콘 ${n1440.icon.w} 위 ${n1440.icon.y - n1440.cell.y}`);
check("걸린 조건 없으면 필터 초기화 숨김", n1440.reset === null, `${JSON.stringify(n1440.reset)}`);
for (const width of [1280, 1100]) {
  const m = n[width];
  const x = width === 1280 ? 40 : 24;
  check(`${width} 같은 규칙(x ${x} · 폭 ${width === 1280 ? 1200 : width - 48} · 높이 263 · 줄 위치 같음)`, m.card.x === x && m.card.w === (width === 1280 ? 1200 : width - 48) && m.card.h === 263 && m.crumbs?.y === 16 && m.titleRow?.y === 45 && m.chipRow?.y === 85 && m.cell?.y === 145, JSON.stringify(m.card));
}
check("콘솔 오류 0(1440·1280·1100)", [1440, 1280, 1100].every((width) => n[width].consoleErrors === 0), [1440, 1280, 1100].map((width) => n[width].consoleErrors).join("/"));

// 동작 1: 칩 → 모달 · 좌측 필터 SUV + 칩 "연료 → 디젤" 두 개 적용 → 적용 칩 모양 · 필터 초기화 → 확인 창 → 초기화
{
  const { context, page } = await open(1440);
  await page.locator(".bbm-ct-chip-track .filter-chip").filter({ hasText: /^연식/ }).first().click(); await page.waitForTimeout(400);
  const modal = await page.locator(".bbmf-modal").count();
  check("칩(연식) → 모달 열림", modal > 0, `모달 ${modal}`);
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  const before = await page.locator(".bbm-summary strong").first().textContent();
  await page.locator(".bbm-filter-toggle").filter({ hasText: /^바디타입/ }).first().click(); await page.waitForTimeout(300);
  await page.locator(".bbm-filter-item").filter({ has: page.locator(".bbm-filter-toggle", { hasText: /^바디타입/ }) }).locator(".bbmf-check").filter({ hasText: /^SUV/ }).first().click(); await page.waitForTimeout(400);
  await page.locator(".bbm-filter-toggle").filter({ hasText: /^연료/ }).first().click(); await page.waitForTimeout(500);
  await page.locator(".bbmf-modal").last().locator(".bbmf-check").filter({ hasText: /^디젤/ }).first().click();
  await page.locator(".bbmf-modal .bbmf-confirm").last().click(); await page.waitForTimeout(500);
  await page.mouse.move(0, 0);
  const m = await measure(page);
  await page.locator(card).screenshot({ path: join(outDir, "1440-two-applied.png") });
  const applied = await page.evaluate(() => [...document.querySelectorAll(".bbm-ct-chip-track .filter-chip.is-active")].map((chip) => chip.textContent.trim()));
  check("적용 칩 2개(SUV·디젤): #222 · 흰 글자 · × 14 회색 원", applied.includes("SUV") && applied.includes("디젤") && m.applied?.bg === "rgb(34, 34, 34)" && m.applied?.color === "rgb(255, 255, 255)" && m.applied?.clear.w === 14 && m.applied?.clear.bg === "rgb(140, 140, 140)", `${applied.join(",")} · × ${m.applied?.clear.w} ${m.applied?.clear.bg}`);
  check("필터 초기화: 줄 오른쪽 끝 · 14/20 700 #222 · 배경 없음", m.reset && m.reset.rightGap === 20 && m.reset.font === "14px/20px 700" && m.reset.color === "rgb(34, 34, 34)" && m.reset.bg === "rgba(0, 0, 0, 0)", JSON.stringify(m.reset));
  await page.locator(".bbm-ct-reset").click(); await page.waitForTimeout(400);
  const confirm = await page.evaluate(() => [...document.querySelectorAll(".bbmf-modal")].map((modal) => modal.textContent.replace(/\s+/g, " ").trim()).pop() ?? "");
  await page.locator(".bbmf-modal").last().locator("button").filter({ hasText: /^초기화$/ }).last().click(); await page.waitForTimeout(500);
  const after = await page.locator(".bbm-summary strong").first().textContent();
  const left = await page.evaluate(() => document.querySelectorAll(".bbm-ct-chip-track .filter-chip.is-active").length);
  const resetGone = !(await page.locator(".bbm-ct-reset").count());
  check("필터 초기화 → 좌측 필터와 같은 확인 창 → 초기화", /필터 초기화/.test(confirm) && after === before && resetGone, `창 "${confirm.slice(0, 28)}" · ${before} → ${after} · 남은 적용 칩 ${left} · 버튼 숨김 ${resetGone}`);
  await context.close();
}

// 동작 2: 유형 줄 "중고차" → 퀵필터 레일(제조사), 카드 높이 그대로 · 좌측 제조사 현대 → 경로·제목 · 경로 "전체차량" 누르면 현대 해제
{
  const { context, page } = await open(1440);
  const h0 = (await measure(page)).card.h;
  await page.locator(".bbm-category-menu__button").filter({ hasText: /^중고차/ }).first().click(); await page.waitForTimeout(600);
  const m1 = await measure(page);
  check("유형 \"중고차\" → 퀵필터 레일 전환, 카드 높이 그대로", Boolean(await page.locator(".bbm-quick-slot .depth-card").count()) && m1.card.h === h0, `레일 카드 ${await page.locator(".bbm-quick-slot .depth-card").count()} · 높이 ${h0} → ${m1.card.h}`);
  await page.locator(".bbm-catalog-row").filter({ hasText: /^현대/ }).first().click(); await page.waitForTimeout(600);
  const m2 = await measure(page);
  check("제조사 현대 → 경로 \"… / 현대\" · 제목 \"현대 중고차 N대 · …\"", /현대$/.test(m2.crumbText) && /^현대 중고차 \d+대/.test(m2.title.text), `${m2.crumbText} · ${m2.title.text}`);
  await page.locator(".bbm-ct-crumbs button").filter({ hasText: /^전체차량$/ }).first().click(); await page.waitForTimeout(600);
  const m3 = await measure(page);
  check("경로 \"전체차량\" 누르면 그 단계로(현대 해제)", !/현대/.test(m3.crumbText) && /^중고차 \d+대/.test(m3.title.text), `${m3.crumbText} · ${m3.title.text}`);
  await context.close();
}

// 동작 3: 1100 에서 칩이 넘치면 오른쪽 화살표 → 누르면 스크롤
{
  const { context, page } = await open(1100);
  // 펼침판에서 바디타입 5개를 걸어 적용 칩을 늘린다
  await page.locator(".bbm-filter-button").click(); await page.waitForTimeout(300);
  if (!(await page.locator(".bbm-drawer .bbm-filter-item.is-open .bbmf-check").filter({ hasText: /^SUV/ }).count())) await page.locator(".bbm-drawer .bbm-filter-toggle").filter({ hasText: /^바디타입/ }).first().click();
  for (const option of ["승용", "SUV", "RV", "쿠페", "승합"]) { await page.locator(".bbm-drawer .bbmf-check").filter({ hasText: new RegExp(`^${option}`) }).first().click(); await page.waitForTimeout(150); }
  await page.locator(".bbm-drawer .bbmf-confirm").click(); await page.waitForTimeout(400);
  await page.setViewportSize({ width: 1024, height: 900 }); await page.waitForTimeout(400);
  const m = await measure(page);
  const scrolled = m.arrows.includes("is-next") ? await (async () => { await page.locator(".bbm-ct-chip-arrow.is-next").click(); await page.waitForTimeout(700); return page.evaluate(() => document.querySelector(".bbm-ct-chip-track-wrap").scrollLeft); })() : 0;
  check("칩이 넘치면 오른쪽 화살표 · 누르면 스크롤", m.arrows.includes("is-next") && scrolled > 0, `화살표 ${m.arrows.join(",") || "없음"} · scrollLeft ${Math.round(scrolled)}`);
  await context.close();
}

writeFileSync(join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
await browser.close();
const failed = summary.checks.filter((item) => !item.ok).length;
console.log(`결과: ${join(outDir, "summary.json")} · 통과 ${summary.checks.length - failed}/${summary.checks.length}`);
