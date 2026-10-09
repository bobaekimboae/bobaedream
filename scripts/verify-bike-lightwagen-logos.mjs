import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:4198/?qf=guazi&category=%EB%B0%94%EC%9D%B4%ED%81%AC&bikelogo=lightwagen";
const outDir = path.resolve("reports/bike-lightwagen-logos-1009");
await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { url: baseUrl, viewports: {}, errors: [] };

for (const viewport of [{ name: "mobile", width: 384, height: 900 }, { name: "pc", width: 1440, height: 1000 }]) {
  const page = await browser.newPage({ viewport });
  page.on("console", (message) => { if (message.type() === "error") report.errors.push(`${viewport.name}: ${message.text()}`); });
  page.on("pageerror", (error) => report.errors.push(`${viewport.name}: ${error.message}`));
  const viewportUrl = new URL(baseUrl);
  if (viewport.name === "pc") viewportUrl.searchParams.set("pc", "1");
  await page.goto(viewportUrl.toString(), { waitUntil: "networkidle" });
  const rail = page.locator(".depth-rail.is-kr-maker").first();
  await rail.waitFor({ state: "visible" });
  const items = await rail.locator(".depth-card").evaluateAll((cards) => cards.slice(0, 10).map((card) => {
    const logo = card.querySelector(".kr-brand-logo.is-bike");
    const image = logo?.querySelector("img");
    const label = card.querySelector(".depth-card-label")?.textContent?.trim() ?? "";
    const logoRect = logo?.getBoundingClientRect();
    const imageRect = image?.getBoundingClientRect();
    return {
      label,
      logoSet: logo?.getAttribute("data-logo-set") ?? null,
      logoSource: logo?.getAttribute("data-logo-source") ?? null,
      src: image?.getAttribute("src") ?? null,
      naturalWidth: image?.naturalWidth ?? 0,
      naturalHeight: image?.naturalHeight ?? 0,
      slot: logoRect ? { width: logoRect.width, height: logoRect.height } : null,
      image: imageRect ? { width: imageRect.width, height: imageRect.height } : null,
      centerOffset: logoRect && imageRect ? {
        x: Math.round(((imageRect.left + imageRect.width / 2) - (logoRect.left + logoRect.width / 2)) * 10) / 10,
        y: Math.round(((imageRect.top + imageRect.height / 2) - (logoRect.top + logoRect.height / 2)) * 10) / 10,
      } : null,
    };
  }));
  report.viewports[viewport.name] = items;
  await page.screenshot({ path: path.join(outDir, `${viewport.name}-${viewport.width}.png`), fullPage: true });
  await page.close();
}

const makerPage = await browser.newPage({ viewport: { width: 384, height: 900 } });
makerPage.on("console", (message) => { if (message.type() === "error") report.errors.push(`maker-sheet: ${message.text()}`); });
await makerPage.goto(baseUrl, { waitUntil: "networkidle" });
await makerPage.getByRole("button", { name: "전체 브랜드" }).click();
await makerPage.waitForTimeout(300);
report.makerSheet = await makerPage.locator(".catalog-logo").evaluateAll((logos) => ({
  total: logos.length,
  lightwagen: logos.filter((logo) => logo.getAttribute("data-logo-standard") === "lightwagen-bike").length,
  broken: logos.map((logo) => logo.querySelector("img")).filter((image) => image && (!image.complete || !image.naturalWidth)).length,
}));
await makerPage.screenshot({ path: path.join(outDir, "maker-sheet-384.png"), fullPage: true });
await makerPage.close();
await browser.close();
await fs.writeFile(path.join(outDir, "metrics.json"), `${JSON.stringify(report, null, 2)}\n`);

const failures = [];
const mobile = report.viewports.mobile;
if (mobile.length !== 10) failures.push(`상위 10개 중 ${mobile.length}개만 확인됨`);
for (const item of mobile) {
  if (item.logoSet !== "lightwagen-bike") failures.push(`${item.label}: 라이트바겐 세트 아님`);
  if (!item.src?.includes("/bike/logos/lightwagen-trim/")) failures.push(`${item.label}: 잘못된 경로 ${item.src}`);
  if (!item.naturalWidth || !item.naturalHeight) failures.push(`${item.label}: 이미지 로드 실패`);
  if (Math.abs(item.centerOffset?.x ?? 99) > 0.5 || Math.abs(item.centerOffset?.y ?? 99) > 0.5) failures.push(`${item.label}: 중심 오차`);
  if ((item.slot?.width ?? 0) !== 52 || (item.slot?.height ?? 0) !== 40) failures.push(`${item.label}: 퀵필터 슬롯 52×40 아님`);
  if ((item.image?.width ?? 99) > 47.6 || (item.image?.height ?? 99) > 32.6) failures.push(`${item.label}: 확대 규격 초과`);
}
failures.push(...report.errors);
if (report.makerSheet.lightwagen < 10) failures.push(`제조사 시트 라이트바겐 로고가 ${report.makerSheet.lightwagen}개뿐임`);
if (report.makerSheet.broken) failures.push(`제조사 시트 깨진 로고 ${report.makerSheet.broken}개`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(JSON.stringify({ mobile, makerSheet: report.makerSheet, errors: report.errors }, null, 2));
