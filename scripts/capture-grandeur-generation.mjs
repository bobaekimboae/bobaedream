import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const base = process.env.PREVIEW_BASE_URL || "http://127.0.0.1:4192";
const output = new URL("../reports/screenshots/", import.meta.url);
await fs.mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const preview = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
  await preview.goto(`${base}/grandeur-generation-preview-v01.html`, { waitUntil: "networkidle" });
  await preview.screenshot({ path: new URL("grandeur-generation-preview-v01.png", output).pathname.slice(1), fullPage: true });

  const bodyType = await browser.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 1 });
  await bodyType.goto(`${base}/maker-model-skeleton-v01.html`, { waitUntil: "networkidle" });
  await bodyType.locator('[data-select-maker]').filter({ hasText: /^현대/ }).click();
  await bodyType.locator('[data-model-tab="body"]').click();
  await bodyType.locator(".phone").screenshot({ path: new URL("maker-model-bodytype-chips-384-v01.png", output).pathname.slice(1) });

  const generation = await browser.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 1 });
  await generation.goto(`${base}/maker-model-skeleton-v01.html`, { waitUntil: "networkidle" });
  await generation.locator('[data-select-maker]').filter({ hasText: /^현대/ }).click();
  await generation.locator('.model-list [data-select-model]').filter({ hasText: /^그랜저/ }).click();
  await generation.locator('.generation-list .generated-vehicle-image').first().waitFor();
  await generation.locator(".phone").screenshot({ path: new URL("grandeur-generation-384-v01.png", output).pathname.slice(1) });

  await generation.locator('.generation-list [data-select-generation]').first().click();
  await generation.locator('.grade-list .fake-checkbox').first().waitFor();
  await generation.locator(".phone").screenshot({ path: new URL("maker-model-checkbox-384-v01.png", output).pathname.slice(1) });
} finally {
  await browser.close();
}
