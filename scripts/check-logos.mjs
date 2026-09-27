#!/usr/bin/env node
// QF-096: 과쯔 제조사 로고 점검 — 퀵필터 제조사 줄(PC 1440·1280 · 모바일 393), 좌측 필터(PC), 제조사 칩 모달·시트(PC·모바일)의
// 모든 로고 표시 크기가 규칙과 같은지, 로고 칸 가운데인지, 404·콘솔 오류가 없는지. 캡처는 reports/qf-096/ 에 저장한다.
// 규칙(비율 = manifest 의 잘라낸 로고 폭÷높이, 시안 v1 규격 — QF-096 보완 3에서 복원): 퀵필터 칸 48×28(카드 위 8 · 가로 가운데) — 1.25 이하 폭 min(44, 28×비율)·높이 min(28, 폭÷비율) · 1.25 초과 폭 min(44, 28√비율)·높이 폭÷비율 / 목록 칸 24×24 — 비율 유지로 칸 안(contain). 모든 로고가 칸 안(칸 밖 0개)
// 사용: npm run check:logos [-- --base=<주소>] (기본 vite preview 127.0.0.1:4173)
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv.find((arg) => arg.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const outDir = join("reports", "qf-096");
mkdirSync(outDir, { recursive: true });
const manifest = JSON.parse(readFileSync(join("public", "assets", "brand", "kr", "manifest.json"), "utf8"));
const railSize = (r) => { if (r <= 1.25) { const w = Math.min(44, 28 * r); return { w, h: Math.min(28, w / r) }; } const w = Math.min(44, 28 * Math.sqrt(r)); return { w, h: w / r }; };
const listSize = (r) => (r >= 1 ? { w: 24, h: 24 / r } : { w: 24 * r, h: 24 });
let outsideTotal = 0; const outsideList = [];

const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const summary = { base, measuredAt: new Date().toISOString(), places: {}, checks: [] };
const check = (name, ok, detail) => { summary.checks.push({ name, ok, detail }); console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };

const open = async (device) => {
  const context = await browser.newContext(device === "m" ? { viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true } : { viewport: { width: device, height: 900 } });
  const page = await context.newPage();
  const errors = []; const missing = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) missing.push(`${response.status()} ${response.url()}`); });
  await page.goto(`${base}?qf=guazi${device === "m" ? "" : "&pc=1"}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
  return { context, page, errors, missing };
};
// 로고 칸 안 로고 크기·가운데 측정
const measureLogos = (page, scope) => page.evaluate((scope) => [...document.querySelectorAll(`${scope} .kr-brand-logo`)].map((box) => {
  const b = box.getBoundingClientRect(); const img = box.querySelector("img"); const i = img?.getBoundingClientRect();
  const card = box.closest(".depth-card")?.getBoundingClientRect();
  return { name: box.dataset.brand, kind: box.classList.contains("is-rail") ? "rail" : "list", box: [b.width, b.height], img: i ? [i.width, i.height] : null,
    outside: i ? Math.max(b.left - i.left, i.right - b.right, b.top - i.top, i.bottom - b.bottom) : 0,
    inCard: card ? { top: b.top - card.top, dx: (b.left + b.width / 2) - (card.left + card.width / 2) } : null, loaded: img ? img.complete && img.naturalWidth > 0 : null, dx: i ? (i.left + i.width / 2) - (b.left + b.width / 2) : 0, dy: i ? (i.top + i.height / 2) - (b.top + b.height / 2) : 0 };
}), scope);
const verify = (place, logos) => {
  let bad = [];
  for (const logo of logos) {
    const entry = manifest.brands[logo.name];
    const expectBox = logo.kind === "rail" ? [48, 28] : [24, 24];
    if (logo.outside > 0.5) { outsideTotal += 1; outsideList.push(`${place} ${logo.name} ${logo.outside.toFixed(1)}`); bad.push(`${logo.name} 칸 밖 ${logo.outside.toFixed(1)}`); }
    if (logo.inCard && (Math.abs(logo.inCard.top - 8) > 0.6 || Math.abs(logo.inCard.dx) > 0.6)) bad.push(`${logo.name} 칸 위치(카드 위 ${logo.inCard.top.toFixed(1)} · 가로 ${logo.inCard.dx.toFixed(1)})`);
    if (Math.abs(logo.box[0] - expectBox[0]) > 0.5 || Math.abs(logo.box[1] - expectBox[1]) > 0.5) bad.push(`${logo.name} 칸 ${logo.box.join("×")}`);
    if (!entry?.file) { if (logo.img) bad.push(`${logo.name} 로고 없음인데 이미지 있음`); continue; }
    if (!logo.img || !logo.loaded) { bad.push(`${logo.name} 이미지 안 뜸`); continue; }
    const want = logo.kind === "rail" ? railSize(entry.ratio) : listSize(entry.ratio);
    if (Math.abs(logo.img[0] - want.w) > 0.6 || Math.abs(logo.img[1] - want.h) > 0.6) bad.push(`${logo.name} ${logo.img.map((v) => v.toFixed(1)).join("×")} ≠ ${want.w.toFixed(1)}×${want.h.toFixed(1)}`);
    if (Math.abs(logo.dx) > 0.6 || Math.abs(logo.dy) > 0.6) bad.push(`${logo.name} 가운데 어긋남 ${logo.dx.toFixed(1)},${logo.dy.toFixed(1)}`);
  }
  const withLogo = logos.filter((logo) => logo.img).length;
  summary.places[place] = { total: logos.length, withLogo, empty: logos.length - withLogo, bad };
  check(`${place}: 로고 크기 규칙 · 칸 가운데`, logos.length > 0 && bad.length === 0, `로고 ${withLogo} · 빈칸 ${logos.length - withLogo}${bad.length ? ` · 어긋남 ${bad.slice(0, 4).join(" / ")}` : ""}`);
};
const scrollRail = async (page, file) => {
  // 레일 전체를 차례로 보이게 캡처(국산·구분선·수입)
  await page.locator(".is-kr-maker").first().screenshot({ path: join(outDir, file) });
};

// PC 1440 · 1280: 퀵필터 줄 · 좌측 필터 · 칩 모달
for (const width of [1440, 1280]) {
  const { context, page, errors, missing } = await open(width);
  await page.locator(".bbm-category-menu__button").filter({ hasText: /^중고차/ }).first().click(); await page.waitForTimeout(600);
  const rail = await measureLogos(page, ".is-kr-maker");
  verify(`PC ${width} 퀵필터 제조사 줄`, rail);
  const order = await page.evaluate(() => [...document.querySelectorAll(".is-kr-maker .depth-rail-track > *")].map((e) => e.classList.contains("kr-maker-divider") ? "|" : e.textContent.trim()));
  const divider = await page.evaluate(() => { const d = document.querySelector(".kr-maker-divider"); if (!d) return null; const r = d.getBoundingClientRect(); const s = getComputedStyle(d); return { w: r.width, h: r.height, bg: s.backgroundColor, margin: s.margin }; });
  if (width === 1440) {
    summary.railOrder = order;
    check("퀵필터 순서: 국산 → 구분선 → 수입차 인기 → 이름순 나머지, 0대·기타 제외", order[0] === "현대" && order.includes("|") && order[order.indexOf("|") + 1] === "벤츠" && !order.some((name) => name.startsWith("기타")) && !order.includes("BYD"), `${order.slice(0, 10).join(" ")} … (카드 ${order.filter((x) => x !== "|").length})`);
    // QF-096 보완: 카드에만 짧은 이름(쉐보레·르노코리아·KGM, 괄호 앞까지), 80 칸에서 잘리는 이름 목록
    const labels = await page.evaluate(() => [...document.querySelectorAll(".is-kr-maker .depth-card-label")].map((label) => ({ text: label.textContent, cut: label.scrollWidth > label.clientWidth + 0.5 })));
    summary.truncatedRailLabels = labels.filter((label) => label.cut).map((label) => label.text);
    check("카드 짧은 이름: 쉐보레 · 르노코리아 · KGM, 괄호 없음", ["쉐보레", "르노코리아", "KGM"].every((name) => labels.some((label) => label.text === name)) && !labels.some((label) => label.text.includes("(")), labels.slice(0, 8).map((label) => label.text).join(" "));
    check("80 칸에서 잘리는 카드 이름", true, summary.truncatedRailLabels.length ? summary.truncatedRailLabels.join(", ") : "없음");
    check("구분선 폭 1 · 높이 44 · #E4E7EC · 좌우 4", divider?.w === 1 && divider?.h === 44 && divider?.bg === "rgb(228, 231, 236)" && divider?.margin === "0px 4px", JSON.stringify(divider));
    const spacing = await page.evaluate(() => { const card = document.querySelector(".bbm-content-head").getBoundingClientRect(); const chip = document.querySelector(".bbm-filter-button").getBoundingClientRect(); const cards = [...document.querySelectorAll(".is-kr-maker .depth-card")].map((c) => c.getBoundingClientRect()); return { gap: Math.round(cards[0].top - chip.bottom), firstX: cards[0].left, chipX: chip.left, cardGap: Math.round(cards[1].left - cards[0].right), size: `${cards[0].width}×${cards[0].height}` }; });
    check("PC 칩 줄 → 카드 줄 18 · 카드 사이 8 · 첫 카드 왼쪽 선 = 첫 칩 왼쪽 선 · 카드 80×72", spacing.gap === 18 && spacing.cardGap === 8 && spacing.firstX === spacing.chipX && spacing.size === "80×72", JSON.stringify(spacing));
    await page.locator(".bbm-hybrid-top").screenshot({ path: join(outDir, "pc-1440-rail.png") });
    await page.evaluate(() => { const track = document.querySelector(".is-kr-maker .brand-carousel"); track.scrollLeft = document.querySelector(".kr-maker-divider").offsetLeft - 400; }); await page.waitForTimeout(300);
    await page.locator(".bbm-hybrid-top").screenshot({ path: join(outDir, "pc-1440-rail-divider.png") });
    const side = await measureLogos(page, "aside.bbm-filter");
    verify("PC 1440 좌측 필터 제조사 목록", side);
    const rowHeight = await page.evaluate(() => Math.round([...document.querySelectorAll("aside.bbm-filter .bbm-catalog-row")][0].getBoundingClientRect().height * 10) / 10);
    const nameGap = await page.evaluate(() => { const row = document.querySelector("aside.bbm-filter .bbm-catalog-name"); const logo = row.querySelector(".kr-brand-logo").getBoundingClientRect(); const text = row.querySelector("span:last-child").getBoundingClientRect(); return Math.round(text.left - logo.right); });
    check("좌측 필터 행 높이 원본 그대로(39.6) · 로고와 이름 사이 8", rowHeight === 39.6 && nameGap === 8, `행 ${rowHeight} · 사이 ${nameGap}`);
    await page.locator("aside.bbm-filter .bbm-catalog").screenshot({ path: join(outDir, "pc-1440-side-domestic.png") });
    await page.evaluate(() => { const c = document.querySelector("aside.bbm-filter .bbm-catalog"); c.scrollTop = [...c.querySelectorAll(".bbm-catalog-section")][2].offsetTop - 20; }); await page.waitForTimeout(300);
    await page.locator("aside.bbm-filter .bbm-catalog").screenshot({ path: join(outDir, "pc-1440-side-imported.png") });
    await page.locator(".bbm-ct-chip-track .filter-chip").filter({ hasText: /^제조사/ }).first().click(); await page.waitForTimeout(500);
    verify("PC 1440 제조사 칩 모달", await measureLogos(page, ".bbmf-modal"));
    await page.keyboard.press("Escape");
  } else {
    await page.locator(".bbm-hybrid-top").screenshot({ path: join(outDir, "pc-1280-rail.png") });
  }
  check(`PC ${width} 로고 404 0 · 콘솔 오류 0`, missing.length === 0 && errors.length === 0, `404 ${missing.length} · 오류 ${errors.length}${missing.length ? ` ${missing[0]}` : ""}`);
  await context.close();
}

// 모바일 393: 퀵필터 줄 · 제조사 칩 시트(필터 서랍)
{
  const { context, page, errors, missing } = await open("m");
  await page.locator(".bbm-category-menu__button").filter({ hasText: /^중고차/ }).first().tap(); await page.waitForTimeout(600);
  verify("모바일 393 퀵필터 제조사 줄", await measureLogos(page, ".is-kr-maker"));
  const spacing = await page.evaluate(() => { const chip = document.querySelector(".filter-shell.is-bbm .filter-fixed").getBoundingClientRect(); const first = document.querySelector(".is-kr-maker .depth-card").getBoundingClientRect(); return { gap: Math.round(first.top - chip.bottom), firstX: first.left, chipX: chip.left }; });
  check("모바일 칩 줄 → 카드 줄 16 · 첫 카드 왼쪽 선 = 첫 칩 왼쪽 선", spacing.gap === 16 && spacing.firstX === spacing.chipX, JSON.stringify(spacing));
  await page.screenshot({ path: join(outDir, "m-393-rail.png"), clip: { x: 0, y: 0, width: 393, height: 330 } });
  await page.locator(".filter-track .filter-chip").filter({ hasText: /^제조사/ }).first().tap(); await page.waitForTimeout(600);
  verify("모바일 393 제조사 시트(필터 서랍)", await measureLogos(page, ".bbmf-sheet"));
  await page.screenshot({ path: join(outDir, "m-393-sheet.png") });
  // QF-096 보완: 전체 필터 "제조사 · 모델" 차종 시트(과쯔만 로고 24×24, 이름 앞, 사이 8)
  await page.locator(".bbmf-sheet .bbmf-close, .bbmf-sheet [aria-label=닫기]").first().tap().catch(() => page.keyboard.press("Escape"));
  await page.waitForTimeout(500);
  await page.locator(".filter-fixed").first().tap(); await page.waitForTimeout(800);
  await page.locator(".bbmf-full-item").filter({ hasText: /^제조사 · 모델/ }).first().tap(); await page.waitForTimeout(900);
  verify("모바일 393 차종 시트(제조사 · 모델)", await measureLogos(page, ".vehicle-picker-grid.is-makers"));
  const pickerGap = await page.evaluate(() => { const button = document.querySelector(".vehicle-picker-grid.is-makers.has-kr-logo button"); const logo = button.querySelector(".kr-brand-logo").getBoundingClientRect(); const text = button.querySelector("span:last-child").getBoundingClientRect(); return Math.round(text.left - logo.right); });
  check("차종 시트 로고와 이름 사이 8", pickerGap === 8, `${pickerGap}`);
  await page.screenshot({ path: join(outDir, "m-393-vehicle-sheet.png") });
  check("모바일 로고 404 0 · 콘솔 오류 0", missing.length === 0 && errors.length === 0, `404 ${missing.length} · 오류 ${errors.length}`);
  // 접근성: 로고 이미지 alt="" · 카드·행 버튼 접근 이름 = 브랜드명
  const a11y = await page.evaluate(() => ({ altNonEmpty: [...document.querySelectorAll(".kr-brand-logo img")].filter((img) => img.getAttribute("alt") !== "").length, rowNames: [...document.querySelectorAll(".vehicle-picker-grid.is-makers button")].slice(0, 3).map((button) => button.textContent.trim()) }));
  check("로고 alt=\"\" · 버튼 이름 = 브랜드명", a11y.altNonEmpty === 0, `alt 있는 로고 ${a11y.altNonEmpty} · 예 ${a11y.rowNames.join(",")}`);
  await context.close();
}

const files = Object.values(manifest.brands).filter((b) => b.file);
check("로고 파일 고유 slug 73 · 받기 실패 0", new Set(files.map((b) => b.slug)).size === 73 && Object.values(manifest.brands).every((b) => !b.error), `slug ${new Set(files.map((b) => b.slug)).size}`);
check("모든 로고가 칸 안(칸 밖 0개)", outsideTotal === 0, outsideTotal ? outsideList.slice(0, 6).join(" / ") : "0개");
writeFileSync(join("reports", "diff", "logos-summary.json"), JSON.stringify(summary, null, 2));
await browser.close();
const failed = summary.checks.filter((item) => !item.ok).length;
console.log(`결과: reports/diff/logos-summary.json · 통과 ${summary.checks.length - failed}/${summary.checks.length}`);
