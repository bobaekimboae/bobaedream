import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = process.env.PREVIEW_BASE_URL || "http://127.0.0.1:4202";
const output = path.join(root, "reports", "screenshots");
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const consoleErrors = [];
const pageErrors = [];
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("pageerror", (error) => pageErrors.push(error.message));
try {
  await page.goto(`${base}/maker-model-skeleton-v01.html?v=hyundai-rebuild-empty`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /현대 48,489/ }).first().click();
  const modelRows = page.locator(".model-list [data-select-model]");
  const uniqueModelKeys = await modelRows.evaluateAll((rows) => [...new Set(rows.map((row) => row.dataset.selectModel))]);
  if (uniqueModelKeys.length !== 41) throw new Error(`현대 신규 모델 수 오류: ${uniqueModelKeys.length}/41`);
  await modelRows.filter({ hasText: /^그랜저/ }).first().click();
  const generationRows = page.locator(".generation-list [data-select-generation]");
  if (await generationRows.count() !== 16) throw new Error(`그랜저 신규 세대 행 수 오류: ${await generationRows.count()}/16`);
  if (await page.locator(".generation-list .generated-vehicle-image").count() !== 0) throw new Error("현대 기존 이미지가 남아 있습니다.");
  if (consoleErrors.length || pageErrors.length) throw new Error(`화면 오류: console=${consoleErrors.length}, page=${pageErrors.length}`);
  await page.locator(".phone").screenshot({ path: path.join(output, "hyundai-rebuild-empty-390-v01.png") });
  console.log(JSON.stringify({ models: 41, grandeurRows: 16, images: 0, consoleErrors: 0, pageErrors: 0 }, null, 2));
} finally {
  await browser.close();
}
