#!/usr/bin/env node
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = process.env.QF_URL ?? "http://127.0.0.1:5174";
const out = join("reports", "truck-chotot-slot-v01");
mkdirSync(out, { recursive: true });

const params = new URLSearchParams({
  qf: "guazi",
  category: "트럭 · 특장",
  truckFormat: "카고(화물)트럭",
  truckSubtype: "경형 트럭 (1톤 미만)",
  truckSpec: "0.5톤",
});

const browser = await chromium.launch();
const report = {};

for (const mode of [
  { name: "mobile", viewport: { width: 390, height: 844 }, pc: false, brandExpected: { cell: [76, 102], media: [40, 40] }, typeExpected: { cell: [80, 108], media: [64, 64] }, spacingExpected: { slotMarginTop: "8px", brandMediaMarginTop: "4px", brandLabelMarginTop: "8px", typeLabelMarginTop: "7px", typeLabelFontSize: "14px" } },
  { name: "pc", viewport: { width: 1440, height: 1000 }, pc: true, brandExpected: { cell: [84, 102], media: [40, 40] }, typeExpected: { cell: [132, 144], media: [88, 88] }, spacingExpected: { slotMarginTop: "8px", brandMediaMarginTop: "4px", brandLabelMarginTop: "8px", typeLabelMarginTop: "9px", typeLabelFontSize: "14px" } },
]) {
  const page = await browser.newPage({ viewport: mode.viewport, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (entry) => { if (entry.type() === "error") errors.push(entry.text()); });
  const query = new URLSearchParams(params);
  if (mode.pc) query.set("pc", "1");
  await page.goto(`${base}/?${query}`, { waitUntil: "networkidle" });
  const rail = page.locator(".depth-rail.is-kr-maker");
  await rail.waitFor({ state: "visible" });
  const metrics = await rail.evaluate((root) => [...root.querySelectorAll(".depth-card")].map((card) => {
    const media = card.querySelector(".depth-card-media");
    const label = card.querySelector(".depth-card-label");
    const image = card.querySelector("img");
    const box = card.getBoundingClientRect();
    const mediaBox = media?.getBoundingClientRect();
    const imageBox = image?.getBoundingClientRect();
    return {
      name: card.textContent?.trim(),
      cell: [Math.round(box.width), Math.round(box.height)],
      media: mediaBox ? [Math.round(mediaBox.width), Math.round(mediaBox.height)] : null,
      image: imageBox ? [Math.round(imageBox.width), Math.round(imageBox.height)] : null,
      source: card.querySelector(".kr-brand-logo")?.getAttribute("data-logo-source") ?? null,
      mediaMarginTop: media ? getComputedStyle(media).marginTop : null,
      labelMarginTop: label ? getComputedStyle(label).marginTop : null,
      background: getComputedStyle(card).backgroundColor,
      borderRadius: getComputedStyle(card).borderRadius,
    };
  }));
  const brandSlotMarginTop = await rail.evaluate((root) => root.parentElement ? getComputedStyle(root.parentElement).marginTop : null);
  await page.screenshot({ path: join(out, `implementation-${mode.name}-brand.png`), fullPage: false });
  await rail.screenshot({ path: join(out, `implementation-${mode.name}-brand-row.png`) });
  const first = metrics[0];
  const typeQuery = new URLSearchParams({ qf: "guazi", category: "트럭 · 특장" });
  if (mode.pc) typeQuery.set("pc", "1");
  await page.goto(`${base}/?${typeQuery}`, { waitUntil: "networkidle" });
  const typeRail = page.locator(".depth-rail.is-truck-image-row");
  await typeRail.waitFor({ state: "visible" });
  const typeMetrics = await typeRail.locator(".depth-card.is-truck-depth").first().evaluate((card) => {
    const media = card.querySelector(".depth-card-media");
    const label = card.querySelector(".depth-card-label");
    const box = card.getBoundingClientRect();
    const mediaBox = media?.getBoundingClientRect();
    return {
      name: card.textContent?.trim(),
      cell: [Math.round(box.width), Math.round(box.height)],
      media: mediaBox ? [Math.round(mediaBox.width), Math.round(mediaBox.height)] : null,
      slotMarginTop: card.closest(".depth-rail")?.parentElement ? getComputedStyle(card.closest(".depth-rail").parentElement).marginTop : null,
      labelMarginTop: label ? getComputedStyle(label).marginTop : null,
      labelFontSize: label ? getComputedStyle(label).fontSize : null,
      background: getComputedStyle(card).backgroundColor,
      borderRadius: getComputedStyle(card).borderRadius,
    };
  });
  await typeRail.screenshot({ path: join(out, `implementation-${mode.name}-type-row.png`) });
  report[mode.name] = {
    viewport: mode.viewport,
    brandExpected: mode.brandExpected,
    typeExpected: mode.typeExpected,
    spacingExpected: mode.spacingExpected,
    brandSlotMarginTop,
    count: metrics.length - 1,
    firstBrand: first,
    firstType: typeMetrics,
    names: metrics.map((item) => item.name),
    sources: metrics.map((item) => item.source).filter(Boolean),
    consoleErrors: errors,
    passed: first?.cell?.[0] === mode.brandExpected.cell[0]
      && first?.cell?.[1] === mode.brandExpected.cell[1]
      && first?.media?.[0] === mode.brandExpected.media[0]
      && first?.media?.[1] === mode.brandExpected.media[1]
      && typeMetrics?.cell?.[0] === mode.typeExpected.cell[0]
      && typeMetrics?.cell?.[1] === mode.typeExpected.cell[1]
      && typeMetrics?.media?.[0] === mode.typeExpected.media[0]
      && typeMetrics?.media?.[1] === mode.typeExpected.media[1]
      && brandSlotMarginTop === mode.spacingExpected.slotMarginTop
      && first?.mediaMarginTop === mode.spacingExpected.brandMediaMarginTop
      && first?.labelMarginTop === mode.spacingExpected.brandLabelMarginTop
      && typeMetrics?.slotMarginTop === mode.spacingExpected.slotMarginTop
      && typeMetrics?.labelMarginTop === mode.spacingExpected.typeLabelMarginTop
      && typeMetrics?.labelFontSize === mode.spacingExpected.typeLabelFontSize
      && errors.length === 0,
  };
  await page.close();
}

await browser.close();
writeFileSync(join(out, "metrics.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.mobile.passed || !report.pc.passed) process.exitCode = 1;

