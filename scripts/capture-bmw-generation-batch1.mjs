import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const base = process.env.PREVIEW_BASE_URL || "http://127.0.0.1:4200";
const output = new URL("../reports/screenshots/", import.meta.url);
await fs.mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${base}/maker-model-skeleton-v01.html?v=bmw-batch1`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /BMW 17,426/ }).first().click();
  await page.getByRole("button", { name: /^5시리즈/ }).first().click();
  await page.locator('.generation-list .generated-vehicle-image').first().waitFor();
  await page.screenshot({
    path: fileURLToPath(new URL("bmw-5series-generation-batch1-360-v01.png", output)),
    fullPage: true,
  });

  const rows = await page.locator(".generation-list .option-row").evaluateAll((elements) =>
    elements.map((element) => {
      const image = element.querySelector(".generated-vehicle-image");
      const row = element.getBoundingClientRect();
      const imageRect = image?.getBoundingClientRect();
      return {
        label: element.textContent?.replace(/\s+/g, " ").trim(),
        rowHeight: row.height,
        imageWidth: imageRect?.width ?? null,
        imageHeight: imageRect?.height ?? null,
      };
    }),
  );
  await fs.writeFile(
    new URL("bmw-generation-batch1-metrics.json", output),
    `${JSON.stringify({ viewport: 360, rows, consoleErrors, pageErrors }, null, 2)}\n`,
  );
} finally {
  await browser.close();
}
