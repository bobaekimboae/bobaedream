import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://127.0.0.1:5173/";
const out = "reports/job3-change6/captures";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const width of [1280, 1024, 768]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(`${base}?qf=guazi&pc=1`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/PC-L01_list_${width}.png`, fullPage: true });
  if (width !== 768) {
    await page.locator(".bbm-result-card").first().click();
    await page.waitForTimeout(500);
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `${out}/PC-D01_detail_${width}.png`, fullPage: true });
  }
  await page.close();
}

const mobile = await browser.newPage({ viewport: { width: 384, height: 900 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
await mobile.goto(`${base}?qf=guazi`, { waitUntil: "networkidle", timeout: 60_000 });
await mobile.locator(".bbm-result-card.is-mobile").first().tap();
await mobile.waitForTimeout(500);
await mobile.screenshot({ path: `${out}/D01_mobile_replacement.png`, fullPage: true });
await mobile.close();
await browser.close();
console.log(`캡처 완료: ${out} (목록 1280·1024·768 / 상세 1280·1024 / D01 모바일)`);
