import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.argv[2] ?? "http://127.0.0.1:5174";
const out = "artifacts/price-filter-v01";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

async function verify(name, viewport, url, trigger) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(`${base}/${url}`, { waitUntil: "networkidle" });
  await trigger(page);
  const dialog = page.locator(".pf-sheet");
  await dialog.waitFor({ state: "visible" });
  await page.waitForTimeout(220);
  const box = await dialog.boundingBox();
  const tabs = await dialog.locator(".pf-tabs button").allTextContents();
  const chips = await dialog.locator(".pf-chips button").allTextContents();
  await dialog.getByRole("textbox", { name: "최저 가격" }).fill("5000");
  await dialog.getByRole("textbox", { name: "최고 가격" }).fill("2000");
  const invalidBlocked = await dialog.locator(".mf-confirm").isDisabled();
  await dialog.getByRole("button", { name: "닫기" }).click();
  await dialog.waitFor({ state: "detached" });
  await trigger(page);
  await dialog.waitFor({ state: "visible" });
  await page.waitForTimeout(220);
  const discarded = await dialog.getByRole("textbox", { name: "최저 가격" }).inputValue() === "" && await dialog.getByRole("textbox", { name: "최고 가격" }).inputValue() === "";
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: false });
  await dialog.getByRole("button", { name: "3천만원", exact: true }).click();
  const countLabel = await dialog.locator(".mf-confirm").textContent();
  await dialog.locator(".mf-confirm").click();
  await dialog.waitFor({ state: "detached" });
  const applied = await page.locator(".filter-chip.is-applied, .filter-chip.is-price").allTextContents();
  results.push({ name, viewport, box, tabs, chips, invalidBlocked, discarded, countLabel, applied });
  await page.close();
}

await verify("desktop-price-modal", { width: 1440, height: 1000 }, "?qf=guazi&pc=1", async (page) => {
  await page.locator(".bbm-filter .bbm-filter-toggle").filter({ hasText: "가격" }).first().click();
});
await verify("mobile-price-sheet", { width: 393, height: 852 }, "?qf=guazi", async (page) => {
  await page.locator(".filter-chip.is-price").first().click();
});

writeFileSync(`${out}/result.json`, JSON.stringify(results, null, 2));
await browser.close();
console.log(JSON.stringify(results, null, 2));
