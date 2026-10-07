import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = process.env.PREVIEW_BASE_URL || "http://127.0.0.1:4202";
const output = path.join(root, "reports", "screenshots");
await fs.mkdir(output, { recursive: true });

const manifest = JSON.parse(await fs.readFile(path.join(root, "public/data/hyundai-catalog-v2/image-manifest.json"), "utf8"));
const availableMap = JSON.parse(await fs.readFile(path.join(root, "public/data/hyundai-catalog-v2/generation-images-available.json"), "utf8"));
const generated = manifest.assets.filter((asset) => asset.status === "generated");
if (generated.length !== 12 || Object.keys(availableMap).length !== 12) {
  throw new Error(`현대 배포 이미지 수 불일치: assets=${generated.length}, map=${Object.keys(availableMap).length}`);
}
for (const asset of generated) {
  await fs.access(path.join(root, "public/assets/maker-model/generations/hyundai-v2", asset.fileName));
}

const browser = await chromium.launch({ headless: true });
const checks = [];
try {
  for (const width of [360, 390, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(`console:${message.text()}`); });
    page.on("pageerror", (error) => errors.push(`page:${error.message}`));
    page.on("response", (response) => { if (response.status() >= 400) errors.push(`http:${response.status()}:${response.url()}`); });
    await page.goto(`${base}/maker-model-skeleton-v01.html?v=hyundai-deploy-12`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /현대 48,489/ }).first().click();
    const modelRows = page.locator(".model-list [data-select-model]");
    const modelKeys = await modelRows.evaluateAll((rows) => [...new Set(rows.map((row) => row.dataset.selectModel))]);
    if (modelKeys.length !== 41) throw new Error(`${width}px 현대 모델 수 오류: ${modelKeys.length}/41`);

    for (const expected of [
      { name: /^i30/, images: 5 },
      { name: /^i40/, images: 4 },
      { name: /^ST1/, images: 1 },
      { name: /^갤로퍼/, images: 2 },
    ]) {
      await page.locator(".model-list [data-select-model]").filter({ hasText: expected.name }).first().click();
      const imageCount = await page.locator(".generation-list .generated-vehicle-image").count();
      if (imageCount !== expected.images) throw new Error(`${width}px ${expected.name} 이미지 수 오류: ${imageCount}/${expected.images}`);
      await page.getByRole("button", { name: "이전 화면" }).click();
    }
    if (errors.length) throw new Error(`${width}px 화면 오류:\n${errors.join("\n")}`);

    await page.locator(".model-list [data-select-model]").filter({ hasText: /^i30/ }).first().click();
    if (width === 390) await page.locator(".phone").screenshot({ path: path.join(output, "hyundai-deploy-12-390-v01.png") });
    checks.push({ width, models: 41, connectedImages: 12, errors: 0 });
    await page.close();
  }
  console.log(JSON.stringify(checks, null, 2));
} finally {
  await browser.close();
}
