import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = path.join(root, "public");
const base = process.env.PREVIEW_BASE_URL || "http://127.0.0.1:4201";
const output = fileURLToPath(new URL("../reports/screenshots/", import.meta.url));
await fs.mkdir(output, { recursive: true });

const readJson = async (relativePath) => JSON.parse(await fs.readFile(path.join(publicRoot, relativePath), "utf8"));
const catalog = await readJson("data/encar-car-depth-1005/catalog.json");
const imageMap = await readJson("data/encar-car-depth-1005/generation-images/bmw.json");
const identities = await readJson("data/encar-car-depth-1005/generation-display-identities/bmw.json");
const maker = catalog.manufacturers.find((item) => item.displayName === "BMW");
if (!maker) throw new Error("BMW 제조사를 찾지 못했습니다.");

const visible = (items = []) => items.filter((item) => item.isVisible !== false);
const generations = maker.modelGroups.flatMap((model) => visible(model.generations).map((generation) => ({ model, generation })));
const generationKeys = new Set(generations.map(({ generation }) => generation.key));
const unresolved = generations.filter(({ model, generation }) => {
  const identity = identities.models?.[model.key];
  return !identity?.byKey?.[generation.key] && !(generation.generationCode && identity?.byCode?.[generation.generationCode]);
});
if (unresolved.length) throw new Error(`세대 차수 미확인 ${unresolved.length}건`);

const imageAudit = [];
for (const [key, relativePath] of Object.entries(imageMap)) {
  if (!generationKeys.has(key)) throw new Error(`BMW 연결표에 없는 세대 key: ${key}`);
  const file = path.join(publicRoot, "assets/maker-model/generations", relativePath);
  const buffer = await fs.readFile(file);
  const png = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const width = png ? buffer.readUInt32BE(16) : 0;
  const height = png ? buffer.readUInt32BE(20) : 0;
  if (!png || width !== 960 || height !== 600) throw new Error(`이미지 규격 오류: ${relativePath} (${width}x${height})`);
  imageAudit.push({ key, relativePath, width, height, bytes: buffer.length });
}

const browser = await chromium.launch({ headless: true });
const viewports = [];
try {
  for (const width of [360, 390, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 1 });
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`${base}/maker-model-skeleton-v01.html?v=bmw-batch2-${width}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /BMW 17,426/ }).first().click();
    await page.getByRole("button", { name: /^5시리즈/ }).first().click();
    await page.locator(".generation-list .option-row").first().waitFor();
    const rows = await page.locator(".generation-list .option-row").evaluateAll((elements) => elements.map((element) => {
      const image = element.querySelector(".generated-vehicle-image");
      return {
        label: element.textContent?.replace(/\s+/g, " ").trim(),
        imageLoaded: image ? image.complete && image.naturalWidth > 0 : null,
        rowWidth: element.getBoundingClientRect().width,
      };
    }));
    if (!rows.some((row) => row.label?.includes("8세대 (G60)"))) throw new Error(`${width}px: G60 8세대 표기 누락`);
    if (!rows.some((row) => row.label?.includes("1~4세대 (E12·E28·E34·E39)"))) throw new Error(`${width}px: BMW 통합 세대 표기 누락`);
    if (rows.some((row) => row.imageLoaded === false)) throw new Error(`${width}px: 이미지 로딩 실패`);
    if (consoleErrors.length || pageErrors.length) throw new Error(`${width}px: 콘솔 ${consoleErrors.length}, 페이지 ${pageErrors.length}`);
    await page.screenshot({
      path: path.join(output, `bmw-5series-generation-batch2-${width}-v01.png`),
      fullPage: true,
    });
    viewports.push({ width, rows, consoleErrors, pageErrors });
    await page.close();
  }
} finally {
  await browser.close();
}

const result = {
  maker: maker.displayName,
  modelCount: maker.modelGroups.length,
  generationCount: generations.length,
  resolvedIdentityCount: generations.length - unresolved.length,
  imageCount: imageAudit.length,
  placeholderCount: generations.length - imageAudit.length,
  imageAudit,
  viewports,
};
await fs.writeFile(path.join(output, "bmw-generation-batch2-metrics.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  models: result.modelCount,
  generations: result.generationCount,
  identities: result.resolvedIdentityCount,
  images: result.imageCount,
  placeholders: result.placeholderCount,
  viewportErrors: result.viewports.reduce((sum, item) => sum + item.consoleErrors.length + item.pageErrors.length, 0),
}, null, 2));
