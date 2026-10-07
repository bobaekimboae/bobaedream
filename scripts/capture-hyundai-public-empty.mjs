import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = process.env.PREVIEW_BASE_URL || "http://127.0.0.1:4202";
const output = path.join(root, "reports", "screenshots");
await fs.mkdir(output, { recursive: true });

const raw = JSON.parse(await fs.readFile(path.join(root, "public/data/encar-car-depth-1005/catalog.json"), "utf8"));
const hyundai = raw.manufacturers.find((maker) => maker.key === "make_car_encar_d1b2f212631585870640");
if (!hyundai) throw new Error("원본 현대 제조사를 찾을 수 없습니다.");
const rawGenerationCount = hyundai.modelGroups.flatMap((model) => model.generations || []).filter((generation) => generation.isVisible !== false).length;
if (hyundai.modelGroups.length !== 40 || rawGenerationCount !== 138 || hyundai.listingCount !== 48489) {
  throw new Error(`원본 현대 데이터 변경 감지: ${hyundai.modelGroups.length}/40, ${rawGenerationCount}/138, ${hyundai.listingCount}/48489`);
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
    await page.goto(`${base}/maker-model-skeleton-v01.html?v=hyundai-empty-public`, { waitUntil: "networkidle" });

    const makerRows = page.locator(".maker-list [data-select-maker]");
    const makerCount = await makerRows.count();
    const kiaRowsBefore = await makerRows.filter({ hasText: /^기아/ }).count();
    await makerRows.filter({ hasText: /^현대/ }).first().click();
    const hyundaiModels = await page.locator(".model-list [data-select-model]").count();
    const hyundaiImages = await page.locator(".generated-vehicle-image").count();
    if (hyundaiModels !== 0 || hyundaiImages !== 0) throw new Error(`${width}px 현대 빈 상태 실패: models=${hyundaiModels}, images=${hyundaiImages}`);
    if (makerCount < 60 || kiaRowsBefore !== 1) throw new Error(`${width}px 다른 제조사 목록 영향 감지: makers=${makerCount}, kia=${kiaRowsBefore}`);
    if (errors.length) throw new Error(`${width}px 화면 오류:\n${errors.join("\n")}`);

    if (width === 390) await page.locator(".phone").screenshot({ path: path.join(output, "hyundai-public-empty-390-v01.png") });
    checks.push({ width, makers: makerCount, hyundaiModels, hyundaiImages, kiaRows: kiaRowsBefore, errors: 0 });
    await page.close();
  }
  console.log(JSON.stringify({ raw: { models: 40, generations: 138, listingCount: 48489 }, checks }, null, 2));
} finally {
  await browser.close();
}
