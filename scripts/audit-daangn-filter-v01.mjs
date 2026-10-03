#!/usr/bin/env node
import { chromium, devices } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const base = (process.argv.find((arg) => arg.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const outDir = join(process.cwd(), "reports", "daangn-filter-v01");
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const context = await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const source = await context.newPage();
const implementation = await context.newPage();
const errors = [];
implementation.on("pageerror", (error) => errors.push(String(error)));
implementation.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });

try {
  await source.goto("https://www.daangn.com/kr/search/cars/", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await source.getByRole("button", { name: "필터", exact: true }).click();
  await source.waitForTimeout(400);
  await source.screenshot({ path: join(outDir, "source-daangn.png") });

  await implementation.goto(`${base}?qf=guazi`, { waitUntil: "networkidle", timeout: 60_000 });
  await implementation.locator("button.filter-fixed").evaluate((element) => element.click());
  await implementation.locator(".bbmf-full.is-daangn").waitFor({ state: "visible", timeout: 10_000 });
  await implementation.waitForTimeout(200);
  const defaultState = await implementation.evaluate(() => {
    const sheet = document.querySelector(".bbmf-full.is-daangn");
    const rect = sheet?.getBoundingClientRect();
    return {
      text: sheet?.innerText ?? "",
      rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom } : null,
      overflowX: document.scrollingElement.scrollWidth > innerWidth,
    };
  });
  await implementation.screenshot({ path: join(outDir, "implementation-default.png") });

  await implementation.getByRole("button", { name: "필터 더보기", exact: true }).evaluate((element) => element.click());
  const expandedText = await implementation.locator(".bbmf-full.is-daangn").innerText();
  await implementation.screenshot({ path: join(outDir, "implementation-expanded.png") });

  const cards = await Promise.all([
    ["source-daangn.png", "당근 원본"],
    ["implementation-default.png", "보배드림 적용"],
  ].map(async ([name, label]) => ({ label, src: `data:image/png;base64,${(await readFile(join(outDir, name))).toString("base64")}` })));
  const compare = await context.newPage();
  await compare.setViewportSize({ width: 820, height: 920 });
  await compare.setContent(`<style>body{margin:0;padding:12px;background:#eef0f3;font-family:Arial,sans-serif}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card{overflow:hidden;border-radius:12px;background:#fff;box-shadow:0 2px 10px #0002}.label{padding:10px 12px;font-size:14px;font-weight:700}.card img{display:block;width:390px;height:844px;object-fit:cover;object-position:top}</style><div class="grid">${cards.map(({ label, src }) => `<div class="card"><div class="label">${label}</div><img src="${src}"></div>`).join("")}</div>`);
  await compare.screenshot({ path: join(outDir, "comparison.png"), fullPage: true });
  await compare.close();

  const expectedDefault = ["상태", "거래 가능만 보기", "브랜드", "차종", "연료", "가격", "연식", "주행거리", "변속기", "판매 방식", "필터 더보기"];
  const checks = {
    defaultItems: expectedDefault.every((label) => defaultState.text.includes(label)),
    extrasHidden: !defaultState.text.includes("외부색상") && !defaultState.text.includes("매매단지"),
    extrasRestored: expandedText.includes("외부색상") && expandedText.includes("매매단지") && expandedText.includes("카테고리"),
    bottomSheetGeometry: defaultState.rect?.y === 64 && defaultState.rect?.height === 780 && defaultState.rect?.bottom === 844,
    noHorizontalOverflow: !defaultState.overflowX,
    noConsoleErrors: errors.length === 0,
  };
  const report = { viewport: { width: 390, height: 844, deviceScaleFactor: 1 }, defaultState, expandedText, checks, errors };
  await writeFile(join(outDir, "metrics.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
  if (Object.values(checks).some((value) => !value)) process.exitCode = 1;
} finally {
  await browser.close();
}
