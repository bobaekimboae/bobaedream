import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.MAKER_MODEL_URL || "http://127.0.0.1:4197/maker-model-skeleton-v01.html?spec=new&logo=m";
const outputDir = path.resolve("reports/screenshots/maker-model-fix-1005");
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 384, height: 900 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

const openFresh = async () => {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator(".maker-list .maker-row").first().waitFor();
};

const capture = async (name) => {
  await page.screenshot({ path: path.join(outputDir, name), fullPage: true });
};

const metrics = async () => page.evaluate(() => {
  const phone = document.querySelector(".phone");
  const screen = document.querySelector("#sheet-title")?.textContent?.trim();
  const row = screen === "제조사"
    ? document.querySelector(".maker-row")
    : screen === "모델"
      ? document.querySelector('.model-row:not([data-select-model="all"])')
      : screen === "세부모델"
        ? document.querySelector('[data-select-generation]:not([data-select-generation="all"])')
        : document.querySelector(".grade-row");
  const visual = row?.querySelector(".maker-logo, .vehicle-silhouette, .fake-checkbox");
  const copy = row?.querySelector(".maker-name, .model-copy, .generation-copy, .grade-name");
  const rect = (element) => element ? element.getBoundingClientRect() : null;
  const phoneRect = rect(phone);
  const rowRect = rect(row);
  const visualRect = rect(visual);
  const copyRect = rect(copy);
  return {
    screen,
    viewport: `${innerWidth}x${innerHeight}`,
    rowHeight: rowRect ? Math.round(rowRect.height * 10) / 10 : null,
    slot: visualRect ? `${Math.round(visualRect.width)}x${Math.round(visualRect.height)}` : null,
    textStartX: copyRect && phoneRect ? Math.round((copyRect.left - phoneRect.left) * 10) / 10 : null,
    rowPaddingLeft: rowRect && phoneRect ? Math.round((rowRect.left - phoneRect.left) * 10) / 10 : null,
    font: copy ? getComputedStyle(copy).fontFamily : null,
    nameSize: copy ? getComputedStyle(copy).fontSize : null,
    countSize: row?.querySelector(".option-count") ? getComputedStyle(row.querySelector(".option-count")).fontSize : null,
  };
});

const results = [];

await openFresh();
await capture("01-maker-384.png");
results.push(await metrics());

await page.locator('[data-select-maker]').filter({ hasText: "현대" }).first().click();
await page.getByRole("heading", { name: "인기 모델" }).waitFor();
await capture("02-hyundai-model-384.png");
results.push(await metrics());

await page.locator('[data-select-model]').filter({ hasText: "그랜저" }).first().click();
await page.getByRole("heading", { name: "최신순" }).waitFor();
await capture("03-grandeur-generation-384.png");
results.push(await metrics());

await page.locator('[data-select-generation]:not([data-select-generation="all"])').first().click();
await page.getByText("연료·구동").first().waitFor();
await capture("04-grade-384.png");
results.push(await metrics());

await openFresh();
await page.locator('[data-select-maker]').filter({ hasText: "BMW" }).first().click();
await page.getByRole("heading", { name: "인기 모델" }).waitFor();
await capture("05-bmw-model-384.png");
results.push(await metrics());

const bmwChips = await page.locator(".body-type-rail button").evaluateAll((buttons) => buttons.map((button) => ({
  text: button.textContent.trim(),
  disabled: button.disabled,
})));

const overflow = [];
for (const width of [360, 384, 412]) {
  await page.setViewportSize({ width, height: 900 });
  await openFresh();
  const result = await page.evaluate(() => ({
    width: innerWidth,
    documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    phoneOverflow: document.querySelector(".phone").scrollWidth - document.querySelector(".phone").clientWidth,
  }));
  overflow.push(result);
}

const logoPresets = {};
for (const preset of ["s", "m", "l", "xl"]) {
  await page.goto(`${baseUrl.replace(/([?&])logo=[^&]*/, "$1logo=" + preset)}`, { waitUntil: "networkidle" });
  await page.locator(".maker-logo img").first().waitFor();
  logoPresets[preset] = await page.locator(".maker-logo img").first().evaluate((image) => {
    const rect = image.getBoundingClientRect();
    return `${Math.round(rect.width * 10) / 10}x${Math.round(rect.height * 10) / 10}`;
  });
}

await fs.writeFile(
  path.resolve("reports/maker-model-fix-1005-metrics.json"),
  `${JSON.stringify({ baseUrl, results, bmwChips, overflow, logoPresets, consoleErrors }, null, 2)}\n`,
  "utf8",
);

await browser.close();

if (consoleErrors.length) {
  console.error(consoleErrors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ results, bmwChips, overflow, logoPresets, screenshots: outputDir }, null, 2));
}
