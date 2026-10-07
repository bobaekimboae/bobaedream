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
if (generated.length !== 17 || Object.keys(availableMap).length !== 19) {
  throw new Error(`현대 이미지 수 불일치: assets=${generated.length}/17, map=${Object.keys(availableMap).length}/19`);
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
    await page.goto(`${base}/maker-model-skeleton-v01.html?v=hyundai-popular-images`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /현대 48,489/ }).first().click();

    const popularRows = page.locator(".popular-model-list [data-select-model]");
    const popularNames = await popularRows.locator(".model-copy strong").allTextContents();
    const expectedNames = ["그랜저", "싼타페", "아반떼", "쏘나타", "팰리세이드"];
    if (JSON.stringify(popularNames) !== JSON.stringify(expectedNames)) {
      throw new Error(`${width}px 인기 모델 순서 오류: ${popularNames.join(", ")}`);
    }
    const popularImages = await popularRows.locator(".generated-vehicle-image").count();
    if (popularImages !== 5) throw new Error(`${width}px 인기 모델 이미지 오류: ${popularImages}/5`);
    if (errors.length) throw new Error(`${width}px 화면 오류:\n${errors.join("\n")}`);

    if (width === 390) {
      await page.locator(".phone").screenshot({ path: path.join(output, "hyundai-popular-images-390-v01.png") });
    }
    checks.push({ width, popularModels: popularNames, popularImages, errors: 0 });
    await page.close();
  }
  console.log(JSON.stringify(checks, null, 2));
} finally {
  await browser.close();
}
