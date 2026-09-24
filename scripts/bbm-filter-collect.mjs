#!/usr/bin/env node
// QF-076: 보배드림 개발 시안(dev.bbmuseum.co.kr/car/list) 필터 전수 수집
// 원본을 직접 열어 모든 필터를 펼치고 눌러서 구조·문구·수치를 모은다(원본 코드·이미지는 복사하지 않음).
// 사용: node scripts/bbm-filter-collect.mjs
// 출력: docs/bbm-filter-spec.json, reports/shots/bbm-original/*.png(커밋하지 않음)
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ORIGIN = "https://dev.bbmuseum.co.kr/car/list";
const shotDir = join("reports", "shots", "bbm-original");
mkdirSync(shotDir, { recursive: true });
const slug = (text) => text.replace(/[\s·/]+/g, "-").replace(/[^\w가-힣-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");

// 브라우저 안: 보이는 요소의 글자·치수·글꼴·색을 모은다(좌표는 기준 요소 왼쪽 위 기준)
function describe(root) {
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && Number(s.opacity) > 0; };
  const base = root.getBoundingClientRect();
  const round = (n) => Math.round(n * 10) / 10;
  const box = (e) => { const r = e.getBoundingClientRect(); return [round(r.left - base.left), round(r.top - base.top), round(r.width), round(r.height)]; };
  const style = (e) => { const s = getComputedStyle(e); return { font: `${s.fontSize}/${s.lineHeight} ${s.fontWeight}`, color: s.color, bg: s.backgroundColor, radius: s.borderRadius, border: s.borderTopWidth !== "0px" ? `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}` : null, padding: s.padding, gap: s.gap }; };
  const leaves = [];
  const walk = (e) => {
    for (const c of e.children) {
      if (!vis(c)) continue;
      const interactive = ["INPUT", "BUTTON", "SELECT", "TEXTAREA", "LABEL"].includes(c.tagName);
      const text = c.children.length ? [...c.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim() : c.textContent.trim();
      if (text || interactive || c.tagName === "IMG" || c.tagName === "svg" || c.tagName === "I") {
        leaves.push({ tag: c.tagName.toLowerCase(), cls: [...c.classList].join(" ").slice(0, 80), text: text.slice(0, 60), box: box(c), ...style(c), placeholder: c.placeholder || undefined, type: c.type || undefined, disabled: c.disabled || c.getAttribute("aria-disabled") === "true" || undefined, checked: c.checked || c.getAttribute("aria-checked") === "true" || c.getAttribute("aria-pressed") === "true" || c.classList.contains("is-checked") || c.classList.contains("is-selected") || undefined, role: c.getAttribute("role") || undefined });
      }
      walk(c);
    }
  };
  walk(root);
  return { box: [round(base.left), round(base.top), round(base.width), round(base.height)], style: style(root), leaves: leaves.slice(0, 600) };
}

// 지금 화면 맨 위에 떠 있는 대화상자(모달·바텀시트·전체 화면)를 찾는다
function topDialog() {
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 150 && r.height > 80 && s.visibility !== "hidden" && Number(s.opacity) > 0.5; };
  const cands = [...document.querySelectorAll("[role=dialog], [aria-modal=true], [class*=sheet], [class*=modal]:not([class*=modal__]), [class*=full-filter], [class*=filter-mobile]")].filter(vis);
  const top = cands.filter((e) => { const r = e.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 60)); return hit && e.contains(hit); });
  // role=dialog(모달·시트 본체)를 먼저, 그다음 큰 순서. 딤 영역(overlay)보다 본체 치수를 잡기 위해
  const isDialog = (e) => e.getAttribute("role") === "dialog" || e.getAttribute("aria-modal") === "true";
  top.sort((a, b) => (Number(isDialog(b)) - Number(isDialog(a))) || (b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height));
  const el = top[0];
  if (!el) return null;
  el.setAttribute("data-collect-dialog", "1");
  return el.className.toString().slice(0, 120);
}

async function captureDialog(page, name) {
  const cls = await page.evaluate(topDialog);
  if (!cls) return null;
  const dialog = page.locator("[data-collect-dialog]").first();
  const overlay = await page.evaluate(() => { const d = document.querySelector("[data-collect-dialog]"); let o = d.parentElement; while (o && getComputedStyle(o).position !== "fixed") o = o.parentElement; return o ? getComputedStyle(o).backgroundColor : null; });
  const info = await dialog.evaluate(describe);
  // 탭이 있으면 탭마다 선택지를 모은다(옵션 등)
  const tabs = await dialog.evaluate((d) => [...d.querySelectorAll("[role=tab], .ui-tabs__item")].filter((t) => t.getBoundingClientRect().width > 0).map((t) => t.textContent.trim()).filter(Boolean));
  const tabContents = {};
  for (const tab of [...new Set(tabs)]) {
    const btn = dialog.locator("[role=tab], .ui-tabs__item", { hasText: tab }).first();
    if (!(await btn.count())) continue;
    await btn.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(400);
    tabContents[tab] = await dialog.evaluate((d) => [...d.querySelectorAll("label, [class*=check] span, [class*=option], [class*=item]")].filter((e) => e.getBoundingClientRect().width > 0 && e.children.length === 0).map((e) => e.textContent.trim()).filter(Boolean));
  }
  await dialog.screenshot({ path: join(shotDir, `${name}.png`) }).catch(() => {});
  await page.evaluate(() => document.querySelector("[data-collect-dialog]")?.removeAttribute("data-collect-dialog"));
  return { dialogClass: cls, overlay, ...info, tabs: [...new Set(tabs)], tabContents };
}

// 닫기 버튼 → Esc → 딤 영역 클릭 순서로, 대화상자가 사라질 때까지 시도
async function closeDialog(page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const still = await page.evaluate(topDialog);
    await page.evaluate(() => document.querySelector("[data-collect-dialog]")?.removeAttribute("data-collect-dialog"));
    if (!still) return true;
    if (attempt === 0) {
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].filter((b) => b.getBoundingClientRect().width > 0).find((b) => /닫기|close/i.test(b.getAttribute("aria-label") ?? "") || /close/.test(b.className));
        btn?.click();
      });
    } else if (attempt === 1) {
      await page.keyboard.press("Escape");
    } else {
      await page.mouse.click(4, 4);
    }
    await page.waitForTimeout(600);
  }
  return !(await page.evaluate(topDialog));
}
var save = () => writeFileSync(join("docs", "bbm-filter-spec.json"), JSON.stringify(spec, null, 1));

const browser = await chromium.launch();
const ONLY_MOBILE_FROM = Number(process.env.BBM_MOBILE_FROM ?? 0); // 모바일 전체 필터 k번째부터만 다시 수집(기존 json 에 덧붙임)
var spec = ONLY_MOBILE_FROM ? JSON.parse((await import("node:fs")).readFileSync(join("docs", "bbm-filter-spec.json"), "utf8")) : { source: ORIGIN, collectedAt: new Date().toISOString(), pc: { viewport: "1440x900@1x", sidebar: [], chips: [] }, mobile: { viewport: "393x852@3x", chips: [], fullFilter: null, fullFilterItems: [] } };

// ── PC 1440: 사이드바 28개(27개 필터 + 제조사·모델 제외하기)
if (!ONLY_MOBILE_FROM) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(ORIGIN, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  spec.pc.summary = await page.locator(".car-list-filter-summary").first().evaluate(describe);
  const count = await page.locator(".car-list-filter-menu__item").count();
  for (let i = 0; i < count; i += 1) {
    const item = page.locator(".car-list-filter-menu__item").nth(i);
    const label = (await item.locator(".car-list-filter-menu__label, .car-list-filter-menu__action-button, button").first().innerText()).trim().split("\n")[0];
    const cls = await item.getAttribute("class");
    const entry = { index: i + 1, label, itemClass: cls };
    const wasOpen = /is-open/.test(cls ?? "");
    entry.closed = await item.evaluate(describe);
    const header = item.locator(".car-list-filter-menu__header, .car-list-filter-menu__toggle, .car-list-filter-menu__action-button").first();
    if (!wasOpen && (await header.count())) {
      await header.scrollIntoViewIfNeeded();
      await header.click();
      if (label.includes("외부색상")) await page.waitForTimeout(6000);
      await page.waitForTimeout(900);
    }
    const dialog = await captureDialog(page, `pc-${String(i + 1).padStart(2, "0")}-${slug(label)}`);
    if (dialog) {
      entry.mode = "modal";
      entry.modal = dialog;
      await closeDialog(page);
    } else {
      entry.mode = /--action/.test(cls ?? "") ? "action" : "expand";
      entry.open = await item.evaluate(describe);
      await item.screenshot({ path: join(shotDir, `pc-${String(i + 1).padStart(2, "0")}-${slug(label)}.png`) }).catch(() => {});
      if (!wasOpen && entry.mode === "expand") await header.click().catch(() => {});
    }
    await page.waitForTimeout(300);
    spec.pc.sidebar.push(entry);
    console.log(`PC 사이드바 ${i + 1}/${count} ${label} → ${entry.mode}`);
  }
  // PC 상단 칩
  const chips = page.locator(".car-list-mobile-filter__tabs .car-list-mobile-filter__button");
  const chipCount = await chips.count();
  for (let i = 0; i < chipCount; i += 1) {
    const chip = chips.nth(i);
    const label = (await chip.innerText()).trim().replace(/\s+/g, " ");
    const entry = { index: i + 1, label, chip: await chip.evaluate((e) => ({ disabled: e.disabled || e.getAttribute("aria-disabled") === "true", cls: e.className, html: e.outerHTML.slice(0, 300) })) };
    if (!entry.chip.disabled) {
      await chip.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(900);
      entry.modal = await captureDialog(page, `pc-chip-${i + 1}-${slug(label)}`);
      if (entry.modal) await closeDialog(page);
    }
    spec.pc.chips.push(entry);
    console.log(`PC 칩 ${label} → ${entry.modal ? "모달" : entry.chip.disabled ? "비활성" : "변화 없음"}`);
  }
  await page.close();
  save();
}

// ── 모바일 393: 칩별 바텀시트 + "필터" 전체 화면
{
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.goto(ORIGIN, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(shotDir, "m-00-list.png") });
  const chips = page.locator(".car-list-mobile-filter__tabs .car-list-mobile-filter__button");
  const chipCount = await chips.count();
  let fullIndex = -1;
  for (let i = 0; i < chipCount; i += 1) {
    const chip = chips.nth(i);
    const label = (await chip.innerText()).trim().replace(/\s+/g, " ");
    if (/필터/.test(label)) { fullIndex = i; continue; }
    await chip.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(900);
    const sheet = await captureDialog(page, `m-chip-${i + 1}-${slug(label)}`);
    spec.mobile.chips.push({ index: i + 1, label, sheet });
    if (sheet) await closeDialog(page);
    console.log(`모바일 칩 ${label} → ${sheet ? "시트" : "변화 없음"}`);
  }
  if (fullIndex >= 0) {
    await chips.nth(fullIndex).click();
    await page.waitForTimeout(1200);
    if (!ONLY_MOBILE_FROM) spec.mobile.fullFilter = await captureDialog(page, "m-full-filter");
    else spec.mobile.fullFilterItems = spec.mobile.fullFilterItems.filter((entry) => entry.index < ONLY_MOBILE_FROM);
    const fullClass = spec.mobile.fullFilter?.dialogClass ?? "";
    await page.screenshot({ path: join(shotDir, "m-full-filter-screen.png"), fullPage: false });
    // 전체 화면 안 항목들을 하나씩 눌러 펼침/하위 화면을 기록
    const labels = await page.evaluate(() => [...document.querySelectorAll(".car-list-filter-menu__label")].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.textContent.trim()));
    spec.mobile.fullFilterLabels = labels;
    const fullOpen = () => page.evaluate(() => Boolean(document.querySelector(".car-list-filter--mobile-open")));
    for (const [k, label] of labels.entries()) {
      if (k + 1 < ONLY_MOBILE_FROM) continue;
      // 하위 시트를 닫다가 전체 화면까지 닫혔으면 다시 연다
      if (!(await fullOpen())) { await chips.nth(fullIndex).click().catch(() => {}); await page.waitForTimeout(1200); }
      const header = page.locator(".car-list-filter-menu__label", { hasText: label }).first();
      if (!(await header.isVisible().catch(() => false))) { await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(300); await chips.nth(fullIndex).click().catch(() => {}); await page.waitForTimeout(1200); }
      if (!(await header.isVisible().catch(() => false))) { console.log(`모바일 전체 필터 ${k + 1} ${label} 건너뜀(항목이 안 보임)`); continue; }
      await header.scrollIntoViewIfNeeded().catch(() => {});
      await header.click({ timeout: 3000 }).catch(() => {});
      if (label.includes("외부색상")) await page.waitForTimeout(6000);
      await page.waitForTimeout(800);
      const topNow = await page.evaluate(topDialog);
      await page.evaluate(() => document.querySelector("[data-collect-dialog]")?.removeAttribute("data-collect-dialog"));
      const sub = topNow && topNow !== fullClass ? await captureDialog(page, `m-full-${String(k + 1).padStart(2, "0")}-${slug(label)}`) : null;
      const item = page.locator(".car-list-filter-menu__item", { has: page.locator(".car-list-filter-menu__label", { hasText: label }) }).first();
      const open = sub ? null : await item.evaluate(describe).catch(() => null);
      if (!sub) await item.screenshot({ path: join(shotDir, `m-full-${String(k + 1).padStart(2, "0")}-${slug(label)}.png`) }).catch(() => {});
      spec.mobile.fullFilterItems.push({ index: k + 1, label, mode: sub ? "modal" : "expand", sub, open });
      if (sub) { await page.keyboard.press("Escape"); await page.waitForTimeout(400); const back = await page.evaluate(topDialog); await page.evaluate(() => document.querySelector("[data-collect-dialog]")?.removeAttribute("data-collect-dialog")); if (back !== fullClass) { await page.evaluate(() => { const b = [...document.querySelectorAll("button")].filter((x) => x.getBoundingClientRect().width > 0).reverse().find((x) => /닫기|close|뒤로/i.test(x.getAttribute("aria-label") ?? "") || /close|back/.test(x.className)); b?.click(); }); await page.waitForTimeout(500); } }
      else await header.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(300);
      console.log(`모바일 전체 필터 ${k + 1}/${labels.length} ${label}`);
    }
  }
  await context.close();
}

await browser.close();
save();
console.log("저장: docs/bbm-filter-spec.json, reports/shots/bbm-original/");
