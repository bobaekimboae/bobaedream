#!/usr/bin/env node
// QF-108 제조사 줄 초톳 대조: 배율 4 캡처로 로고 그림 경계(흰 바탕이 아닌 픽셀 범위 ÷ 4)를 재서 초톳(xe.chotot.com/mua-ban-oto)과 우리를 나란히 표로
// 재는 것: 칸 수 · 칸 크기 · 피치 · 로고 상자 · 로고 그림 폭×높이(상자 대비 %) · 이름 글자 상자 폭 · 한 줄(가로 넘침)
// 사용: node scripts/brand-rail-compare.mjs [--base=<우리 주소>] → reports/qf-108/brand-compare.json · .md · 나란히 캡처 reports/qf-108/compare-*.png
import { chromium, devices } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv.find((a) => a.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const OUT = join("reports", "qf-108"); mkdirSync(OUT, { recursive: true });
const SCALE = 4;
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });

// 칸 목록을 받아 각 로고 상자를 배율 4로 찍고, 흰 바탕이 아닌 픽셀 범위를 잰다
async function paintedBounds(page, boxes) {
  const out = [];
  for (let index = 0; index < boxes.length; index += 1) {
    // 표시해 둔 로고 상자(data-qf108)를 화면 안으로 옮긴 뒤 찍는다(가로 스크롤 줄)
    const clip = await page.evaluate((index) => { const el = document.querySelector(`[data-qf108="${index}"]`); if (!el) return null; el.scrollIntoView({ block: "nearest", inline: "center" }); const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; }, index);
    await page.waitForTimeout(150);
    if (!clip || clip.x < 0 || clip.x + clip.width > page.viewportSize().width) { out.push(null); continue; }
    const shot = await page.screenshot({ clip });
    const b = await page.evaluate(async ([b64, scale]) => {
      const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
      const c = new OffscreenCanvas(bitmap.width, bitmap.height); const ctx = c.getContext("2d", { willReadFrequently: true }); ctx.drawImage(bitmap, 0, 0);
      const { data } = ctx.getImageData(0, 0, c.width, c.height);
      let minX = c.width; let minY = c.height; let maxX = -1; let maxY = -1;
      for (let y = 0; y < c.height; y += 1) for (let x = 0; x < c.width; x += 1) { const i = (y * c.width + x) * 4; if (Math.min(data[i], data[i + 1], data[i + 2]) < 240) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; } }
      return maxX < 0 ? null : { w: Math.round(((maxX - minX + 1) / scale) * 10) / 10, h: Math.round(((maxY - minY + 1) / scale) * 10) / 10 };
    }, [shot.toString("base64"), SCALE]);
    out.push(b);
  }
  return out;
}

async function chotot(device) {
  const ctx = device === "pc" ? await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: SCALE }) : await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 393, height: 852 }, deviceScaleFactor: SCALE });
  const page = await ctx.newPage();
  await page.goto("https://xe.chotot.com/mua-ban-oto", { waitUntil: "domcontentloaded", timeout: 60000 }); await page.waitForTimeout(6000);
  // 브랜드 줄: 로고 img(가로·세로 30~44) 아래에 이름 글자가 있는 칸들이 한 줄로 놓인 곳
  const cells = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")].filter((img) => { const r = img.getBoundingClientRect(); return r.width >= 28 && r.width <= 44 && r.height >= 28 && r.height <= 44 && r.top > 100 && r.top < 700; });
    const rows = new Map();
    for (const img of imgs) { const top = Math.round(img.getBoundingClientRect().top); rows.set(top, [...(rows.get(top) ?? []), img]); }
    // 같은 칸에 그림이 두 장(빈 자리표시 + 실제 로고) → 왼쪽 위치마다 alt 가 있는 것 하나
    const byLeft = new Map();
    for (const img of [...rows.values()].sort((a, b) => b.length - a.length)[0] ?? []) { const left = Math.round(img.getBoundingClientRect().left); if (!byLeft.has(left) || img.alt) byLeft.set(left, img); }
    const row = [...byLeft.values()].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    row.forEach((img, index) => { img.dataset.qf108 = String(index); });
    return row.map((img) => {
      let cell = img.parentElement; while (cell && cell.getBoundingClientRect().height < 60) cell = cell.parentElement;
      const c = cell.getBoundingClientRect(); const i = img.getBoundingClientRect();
      const name = cell.innerText.trim().split("\n")[0];
      const text = [...cell.querySelectorAll("span,p,div")].find((e) => e.children.length === 0 && e.textContent.trim() === name);
      const t = text?.getBoundingClientRect();
      return { name, cell: [Math.round(c.width), Math.round(c.height)], left: c.left, logo: { x: i.left, y: i.top, width: i.width, height: i.height }, nameBox: t ? Math.round(t.width * 10) / 10 : null };
    });
  });
  await page.screenshot({ path: join(OUT, `chotot-${device}.png`), clip: device === "pc" ? { x: 100, y: cells[0] ? cells[0].logo.y - 20 : 200, width: 1240, height: 130 } : { x: 0, y: cells[0] ? cells[0].logo.y - 10 : 200, width: 393, height: 100 } });
  const painted = await paintedBounds(page, cells);
  await ctx.close();
  return cells.map((cell, i) => ({ ...cell, painted: painted[i] }));
}

async function ours(device) {
  const ctx = device === "pc" ? await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: SCALE }) : await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 393, height: 852 }, deviceScaleFactor: SCALE });
  const page = await ctx.newPage();
  await page.goto(`${base}?qf=guazi${device === "pc" ? "&pc=1" : ""}`, { waitUntil: "networkidle" }); await page.waitForTimeout(600);
  const btn = page.locator(".bbm-category-menu__button").filter({ hasText: /^중고차/ }).first(); await (device === "pc" ? btn.click() : btn.tap()); await page.waitForTimeout(900);
  const cells = await page.evaluate(() => {
    const rail = document.querySelector(".depth-rail.is-kr-maker"); const track = rail.querySelector(".depth-rail-track");
    [...rail.querySelectorAll(".depth-card .depth-card-media")].forEach((media, index) => { media.dataset.qf108 = String(index); });
    return { overflow: track.scrollWidth - track.clientWidth, cells: [...rail.querySelectorAll(".depth-card")].map((card) => {
      const c = card.getBoundingClientRect(); const media = card.querySelector(".depth-card-media").getBoundingClientRect(); const label = card.querySelector(".depth-card-label").getBoundingClientRect();
      const ratio = Number(card.querySelector(".kr-brand-logo")?.dataset.ratio ?? 0) || null;
      return { name: card.textContent.trim(), cell: [Math.round(c.width), Math.round(c.height)], left: c.left, ratio, logo: { x: media.left, y: media.top, width: media.width, height: media.height }, nameBox: Math.round(label.width * 10) / 10 };
    }) };
  });
  await page.evaluate(() => { const t = document.querySelector(".depth-rail.is-kr-maker .depth-rail-track"); if (t) t.scrollLeft = 0; });
  await page.screenshot({ path: join(OUT, `ours-${device}.png`), clip: device === "pc" ? { x: 100, y: cells.cells[0].logo.y - 20, width: 1240, height: 130 } : { x: 0, y: cells.cells[0].logo.y - 10, width: 393, height: 100 } });
  const painted = await paintedBounds(page, cells.cells);
  await ctx.close();
  return { overflow: cells.overflow, count: cells.cells.length, cells: cells.cells.map((cell, i) => ({ ...cell, painted: painted[i] ?? null })) };
}

const result = { measuredAt: new Date().toISOString(), scale: SCALE };
for (const device of ["pc", "m"]) {
  let ch = []; try { ch = await chotot(device); } catch (error) { console.log(`초톳 ${device} 실패: ${error.message.split("\n")[0]}`); }
  const us = await ours(device);
  const boxSize = device === "pc" ? 40 : 36;
  const pct = (p) => (p ? `${Math.round((p.w / boxSize) * 1000) / 10}%×${Math.round((p.h / boxSize) * 1000) / 10}%` : "-");
  const tier = (r) => (!r ? "-" : r <= 1.25 ? "≤1.25" : r < 1.6 ? "1.25~1.6" : "≥1.6");
  result[device] = { chotot: ch, ours: us };
  console.log(`\n[${device === "pc" ? "PC 1440" : "모바일 393"}] 초톳 칸 ${ch.length} · 우리 칸 ${us.count} · 우리 가로 넘침 ${us.overflow}`);
  const rows = Math.max(ch.length, us.cells.length);
  const md = [`| # | 초톳 이름 | 초톳 칸 | 초톳 로고 그림(상자 대비) | 초톳 비율 | 우리 이름 | 우리 칸 | 우리 로고 그림(상자 대비) | 우리 비율(단계) | 우리 이름 상자 폭 |`, "|---:|---|---|---|---:|---|---|---|---|---:|"];
  for (let i = 0; i < rows; i += 1) {
    const a = ch[i]; const b = us.cells[i];
    const ar = a?.painted ? Math.round((a.painted.w / a.painted.h) * 100) / 100 : null;
    md.push(`| ${i + 1} | ${a?.name ?? "-"} | ${a ? a.cell.join("×") : "-"} | ${a?.painted ? `${a.painted.w}×${a.painted.h} (${pct(a.painted)})` : "-"} | ${ar ? `${ar} ${tier(ar)}` : "-"} | ${b?.name ?? "-"} | ${b ? b.cell.join("×") : "-"} | ${b?.painted ? `${b.painted.w}×${b.painted.h} (${pct(b.painted)})` : "-"} | ${b?.ratio ? `${b.ratio} ${tier(b.ratio)}` : "-"} | ${b?.nameBox ?? "-"} |`);
  }
  result[device].table = md.join("\n");
  console.log(md.join("\n"));
}
writeFileSync(join(OUT, "brand-compare.json"), JSON.stringify(result, null, 1));
writeFileSync(join(OUT, "brand-compare.md"), `# QF-108 제조사 줄 초톳 대조(배율 ${SCALE})\n\n측정 ${result.measuredAt}\n\n## PC 1440\n\n${result.pc.table}\n\n## 모바일 393\n\n${result.m.table}\n`);
await browser.close();
