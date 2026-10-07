import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = path.join(root, "public");
const base = process.env.PREVIEW_BASE_URL || "http://127.0.0.1:4202";
const output = path.join(root, "reports", "screenshots");
await fs.mkdir(output, { recursive: true });

const readJson = async (relativePath) => JSON.parse(await fs.readFile(path.join(publicRoot, relativePath), "utf8"));
const catalog = await readJson("data/encar-car-depth-1005/catalog.json");
const imageMap = await readJson("data/encar-car-depth-1005/generation-images/audi.json");
const maker = catalog.manufacturers.find((item) => item.displayName === "아우디");
if (!maker) throw new Error("아우디 제조사를 찾지 못했습니다.");

const visible = (items = []) => items.filter((item) => item.isVisible !== false);
const generationKeys = new Set(maker.modelGroups.flatMap((model) => visible(model.generations).map((generation) => generation.key)));
const imageAudit = [];
for (const [key, relativePath] of Object.entries(imageMap)) {
  if (!generationKeys.has(key)) throw new Error(`아우디 연결표에 없는 세대 key: ${key}`);
  const file = path.join(publicRoot, "assets/maker-model/generations", relativePath);
  const buffer = await fs.readFile(file);
  const png = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const width = png ? buffer.readUInt32BE(16) : 0;
  const height = png ? buffer.readUInt32BE(20) : 0;
  if (!png || width !== 960 || height !== 600) throw new Error(`이미지 규격 오류: ${relativePath} (${width}x${height})`);
  imageAudit.push({ key, relativePath, width, height, bytes: buffer.length });
}
if (imageAudit.length !== generationKeys.size) throw new Error(`아우디 이미지 수 오류: ${imageAudit.length}/${generationKeys.size}`);

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
    await page.goto(`${base}/maker-model-skeleton-v01.html?v=audi-complete-${width}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /아우디 4,297/ }).first().click();
    await page.getByRole("button", { name: /^A6/ }).first().click();
    await page.locator(".generation-list .option-row").first().waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll(".generation-list .generated-vehicle-image")]
      .every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 15_000 });
    const rows = await page.locator(".generation-list .option-row").evaluateAll((elements) => elements.map((element) => {
      const image = element.querySelector(".generated-vehicle-image");
      return {
        label: element.textContent?.replace(/\s+/g, " ").trim(),
        imageLoaded: image ? image.complete && image.naturalWidth > 0 : null,
        rowWidth: element.getBoundingClientRect().width,
      };
    }));
    if (rows.some((row) => row.imageLoaded === false)) throw new Error(`${width}px: 이미지 로딩 실패`);
    if (consoleErrors.length || pageErrors.length) throw new Error(`${width}px: 콘솔 ${consoleErrors.length}, 페이지 ${pageErrors.length}`);
    await page.screenshot({
      path: path.join(output, `audi-a6-generation-complete-${width}-v01.png`),
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
  generationCount: maker.modelGroups.flatMap((model) => visible(model.generations)).length,
  imageCount: imageAudit.length,
  imageAudit,
  viewports,
};
await fs.writeFile(path.join(output, "audi-generation-complete-metrics.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  models: result.modelCount,
  generations: result.generationCount,
  images: result.imageCount,
  viewportErrors: result.viewports.reduce((sum, item) => sum + item.consoleErrors.length + item.pageErrors.length, 0),
}, null, 2));
