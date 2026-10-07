import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = process.env.PREVIEW_BASE_URL || "http://127.0.0.1:4202";
const output = path.join(root, "reports", "screenshots");
await fs.mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [360, 390, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(`console:${message.text()}`); });
    page.on("pageerror", (error) => errors.push(`page:${error.message}`));
    page.on("response", (response) => { if (response.status() >= 400) errors.push(`http:${response.status()}:${response.url()}`); });

    await page.goto(`${base}/maker-model-skeleton-v01.html?v=hyundai-first-batch`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /현대 48,489/ }).first().click();
    const modelRows = page.locator(".model-list [data-select-model]");
    const modelKeys = await modelRows.evaluateAll((rows) => [...new Set(rows.map((row) => row.dataset.selectModel))]);
    if (modelKeys.length !== 41) throw new Error(`${width}px 현대 모델 수 오류: ${modelKeys.length}/41`);
    await modelRows.filter({ hasText: /^i30/ }).first().click();

    const generations = page.locator(".generation-list [data-select-generation]");
    const imageCount = await page.locator(".generation-list .generated-vehicle-image").count();
    const placeholderCount = await page.locator(".generation-list .is-placeholder").count();
    if (await generations.count() !== 5) throw new Error(`${width}px i30 세대 수 오류: ${await generations.count()}/5`);
    if (imageCount !== 4) throw new Error(`${width}px 1차 이미지 수 오류: ${imageCount}/4`);
    if (errors.length) throw new Error(`${width}px 화면 오류:\n${errors.join("\n")}`);

    if (width === 390) {
      await page.locator(".phone").screenshot({ path: path.join(output, "hyundai-rebuild-first-batch-390-v01.png") });
    }
    results.push({ width, models: modelKeys.length, i30Generations: 5, images: imageCount, placeholders: placeholderCount, errors: 0 });
    await page.close();
  }
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
