import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const base = process.argv[2] || "http://127.0.0.1:4299/maker-model-skeleton-v01.html?catalog=bike";
const output = new URL("../artifacts/bike-filter-1006/", import.meta.url);
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1 });
const consoleErrors = [];
const pageErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));
const sourcePage = await browser.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1 });
await sourcePage.goto(base.replace("catalog=bike", "catalog=car") + "&source=1", { waitUntil: "networkidle" });
await sourcePage.getByRole("button", { name: /현대 48,489/ }).waitFor();
await sourcePage.screenshot({ path: fileURLToPath(new URL("00-source-car-makers-360.png", output)) });
await sourcePage.getByRole("button", { name: /현대 48,489/ }).click();
await sourcePage.getByRole("button", { name: /그랜저/ }).first().waitFor();
await sourcePage.screenshot({ path: fileURLToPath(new URL("00-source-car-models-360.png", output)) });
await sourcePage.close();
await page.goto(`${base}&capture=1`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /혼다 3,850/ }).waitFor();
await page.screenshot({ path: fileURLToPath(new URL("01-makers-360.png", output)) });
const makerMetrics = await page.evaluate(() => {
  const row = document.querySelector(".maker-row")?.getBoundingClientRect();
  const logo = document.querySelector(".maker-logo")?.getBoundingClientRect();
  const name = document.querySelector(".maker-name")?.getBoundingClientRect();
  return { rowHeight: row?.height, logoWidth: logo?.width, logoHeight: logo?.height, nameX: name?.x };
});

await page.getByRole("button", { name: /혼다 3,850/ }).click();
await page.getByRole("button", { name: "PCX", exact: true }).waitFor();
await page.screenshot({ path: fileURLToPath(new URL("02-honda-groups-360.png", output)) });

await page.getByRole("button", { name: "PCX", exact: true }).click();
await page.getByRole("button", { name: /PCX 125/ }).waitFor();
await page.screenshot({ path: fileURLToPath(new URL("03-honda-pcx-models-360.png", output)) });

await page.goto(`${base}&capture=2`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /AJS 15/ }).click();
await page.locator(".bike-model-row").first().waitFor();
await page.screenshot({ path: fileURLToPath(new URL("04-direct-maker-models-360.png", output)) });

const metrics = await page.evaluate(() => {
  const modelRow = document.querySelector(".bike-model-row");
  const image = document.querySelector(".bike-image");
  const modelName = document.querySelector(".model-copy strong");
  const modelRect = modelRow?.getBoundingClientRect();
  const imageRect = image?.getBoundingClientRect();
  const modelNameRect = modelName?.getBoundingClientRect();
  const divider = modelRow ? getComputedStyle(modelRow, "::after") : null;
  const nameStyle = modelName ? getComputedStyle(modelName) : null;
  return {
    rowHeight: modelRect?.height,
    imageX: imageRect?.x,
    imageWidth: imageRect?.width,
    imageHeight: imageRect?.height,
    nameX: modelNameRect?.x,
    nameSize: nameStyle?.fontSize,
    nameWeight: nameStyle?.fontWeight,
    dividerLeft: divider?.left,
    dividerColor: divider?.backgroundColor,
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
  };
});
await writeFile(new URL("metrics.json", output), `${JSON.stringify({
  maker: makerMetrics,
  model: metrics,
  consoleErrors,
  pageErrors,
}, null, 2)}\n`);
await browser.close();
