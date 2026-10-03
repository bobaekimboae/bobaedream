#!/usr/bin/env node
// 카테고리 바텀시트가 QF-117 주행거리 확정 시트의 외형 토큰을 그대로 쓰는지 비교한다.
import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const base = (process.argv.find((arg) => arg.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const outDir = join(process.cwd(), "reports", "filter-bottomsheet-v02");
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const context = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

const box = (element) => {
  const rect = element?.getBoundingClientRect();
  return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom } : null;
};

try {
  await page.goto(`${base}?qf=guazi`, { waitUntil: "networkidle", timeout: 45_000 });
  await page.locator(".filter-shell.is-bbm .filter-fixed").click();
  await page.locator(".bbmf-full button, .bbmf-full-item").filter({ hasText: /^주행거리/ }).first().click();
  await page.waitForTimeout(250);
  const reference = await page.evaluate(() => {
    const q = (selector) => document.querySelector(selector);
    const rect = (element) => { const value = element?.getBoundingClientRect(); return value ? { x: value.x, y: value.y, width: value.width, height: value.height, right: value.right, bottom: value.bottom } : null; };
    const title = q(".mf-title");
    const style = title ? getComputedStyle(title) : null;
    const body = q(".mf-body");
    return {
      sheet: rect(q(".mf-sheet")), header: rect(q(".mf-header")), title: rect(title), close: rect(q(".mf-close")), body: rect(body), bodyPadding: body ? getComputedStyle(body).padding : null, actions: rect(q(".mf-actions")), reset: rect(q(".mf-reset")),
      radius: q(".mf-sheet") ? getComputedStyle(q(".mf-sheet")).borderTopLeftRadius : null,
      titleStyle: style ? { fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight, letterSpacing: style.letterSpacing } : null,
    };
  });
  await page.screenshot({ path: join(outDir, "reference-mileage.png") });

  await page.goto(`${base}?qf=guazi`, { waitUntil: "networkidle", timeout: 45_000 });
  await page.getByText("카테고리", { exact: true }).first().click();
  await page.waitForTimeout(250);
  const category = await page.evaluate(() => {
    const q = (selector) => document.querySelector(selector);
    const rect = (element) => { const value = element?.getBoundingClientRect(); return value ? { x: value.x, y: value.y, width: value.width, height: value.height, right: value.right, bottom: value.bottom } : null; };
    const title = q(".bbmf-sheet.is-category h3");
    const style = title ? getComputedStyle(title) : null;
    const body = q(".bbmf-sheet.is-category .bbmf-sheet-body");
    return {
      sheet: rect(q(".bbmf-sheet.is-category")), header: rect(q(".bbmf-sheet.is-category .bbmf-sheet-header")), title: rect(title), close: rect(q(".bbmf-sheet.is-category .bbmf-close")), body: rect(body), bodyPadding: body ? getComputedStyle(body).padding : null, actions: rect(q(".bbmf-category-footer")), reset: rect(q(".bbmf-category-footer button")),
      radius: q(".bbmf-sheet.is-category") ? getComputedStyle(q(".bbmf-sheet.is-category")).borderTopLeftRadius : null,
      titleStyle: style ? { fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight, letterSpacing: style.letterSpacing } : null,
      overflowX: document.scrollingElement.scrollWidth > innerWidth,
    };
  });
  await page.screenshot({ path: join(outDir, "category-after.png") });

  const checks = {
    radius24: category.radius === "24px",
    header64: category.header?.height === 64,
    titleLeft24: category.title?.x === 24,
    titleTypography: category.titleStyle?.fontSize === "20px" && category.titleStyle?.lineHeight === "28px" && category.titleStyle?.fontWeight === "750" && category.titleStyle?.letterSpacing === "-0.35px",
    close44AndRight20: category.close?.width === 44 && category.close?.height === 44 && Math.abs(393 - category.close.right - 20) <= 0.5,
    bodyInsets: category.bodyPadding === "20px 16px 22px",
    actionBar80: category.actions?.height === 80,
    reset92x52: category.reset?.width === 92 && category.reset?.height === 52,
    noHorizontalOverflow: !category.overflowX,
    noConsoleErrors: errors.length === 0,
  };

  const images = await Promise.all([
    ["reference-mileage.png", "확정안 · 주행거리 필터"],
    ["category-after.png", "적용안 · 카테고리"],
  ].map(async ([name, label]) => ({ label, src: `data:image/png;base64,${(await readFile(join(outDir, name))).toString("base64")}` })));
  const compare = await context.newPage();
  await compare.setViewportSize({ width: 820, height: 920 });
  await compare.setContent(`<style>body{margin:0;padding:16px;background:#eef0f3;font-family:Arial,sans-serif}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.card{overflow:hidden;border-radius:12px;background:#fff;box-shadow:0 2px 10px #0002}.label{padding:10px 12px;font-size:14px;font-weight:700}.card img{display:block;width:393px;height:852px;object-fit:cover;object-position:top}</style><div class="grid">${images.map(({ label, src }) => `<div class="card"><div class="label">${label}</div><img src="${src}"></div>`).join("")}</div>`);
  await compare.screenshot({ path: join(outDir, "comparison.png"), fullPage: true });
  await compare.close();

  const report = { reference, category, checks, errors };
  await writeFile(join(outDir, "metrics.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  if (Object.values(checks).some((passed) => !passed)) process.exitCode = 1;
} finally {
  await browser.close();
}
