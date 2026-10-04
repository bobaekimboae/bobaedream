import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { chromium } from "@playwright/test";

const baseUrl = process.env.CATALOG_BASE_URL ?? "http://127.0.0.1:5173";
const reportDir = new URL("../reports/vehicle-catalog/screenshots/", import.meta.url);
await mkdir(reportDir, { recursive: true });

const localChromium = process.env.USERPROFILE ? path.join(process.env.USERPROFILE, "AppData", "Local", "ms-playwright", "chromium-1228", "chrome-win64", "chrome.exe") : null;
const browser = await chromium.launch({ headless: true, ...(localChromium && existsSync(localChromium) ? { executablePath: localChromium } : {}) });
const results = [];
const assert = (condition, name, detail = "") => {
  if (!condition) throw new Error(`${name}${detail ? `: ${detail}` : ""}`);
  results.push({ name, status: "PASS", detail });
};
const pickerClick = async (picker, text) => {
  const button = picker.locator(".catalog-picker-list>button").filter({ hasText: text }).first();
  await button.waitFor({ state: "visible" });
  await button.click();
};
const pageWithErrors = async (context) => {
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  return { page, errors };
};

try {
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const { page: desktop, errors: desktopErrors } = await pageWithErrors(desktopContext);
  const desktopUrl = `${baseUrl}/?qf=guazi&category=${encodeURIComponent("중고차")}&pc=1`;
  await desktop.goto(desktopUrl, { waitUntil: "networkidle" });
  const initialCatalogResources = await desktop.evaluate(() => performance.getEntriesByType("resource").filter((entry) => entry.name.includes("/data/vehicle-catalog/")).map((entry) => entry.name));
  assert(initialCatalogResources.some((name) => name.endsWith("cars-index-v1.json")), "PC 최초 진입 1차 색인 로드");
  assert(!initialCatalogResources.some((name) => name.endsWith("cars-search-v1.json")), "PC 검색 전 2차 색인 미로드");

  const desktopSearch = desktop.getByRole("textbox", { name: "중고차 검색" });
  await desktopSearch.fill("520i m스포츠");
  const desktopResults = desktop.locator("[data-testid=catalog-search-results]");
  await desktopResults.locator("button").first().waitFor({ state: "visible" });
  const desktopFirst = (await desktopResults.locator("button").first().innerText()).replace(/\s+/g, " ");
  assert(desktopFirst.includes("BMW › 5시리즈 › 5시리즈 (G60) › 가솔린 2WD › 520i M 스포츠"), "PC 검색 첫 결과", desktopFirst);
  const searchedResources = await desktop.evaluate(() => performance.getEntriesByType("resource").filter((entry) => entry.name.includes("/data/vehicle-catalog/")).map((entry) => entry.name));
  assert(searchedResources.some((name) => name.endsWith("cars-search-v1.json")), "PC 검색 시 2차 색인 지연 로드");
  await desktop.screenshot({ path: fileURLToPath(new URL("pc-search.png", reportDir)), fullPage: false });
  await desktopResults.locator("button").first().click();
  await desktop.locator("[data-testid=catalog-picker]").waitFor({ state: "visible" });
  const chipText = (await desktop.locator(".bbm-chips").first().innerText()).replace(/\s+/g, " ");
  assert(chipText.includes("BMW") && chipText.includes("5시리즈") && chipText.includes("520i M 스포츠"), "PC 결과 선택 후 단계 칩 설정", chipText);

  await desktop.goto(desktopUrl, { waitUntil: "networkidle" });
  await desktop.getByRole("button", { name: "제조사", exact: true }).click();
  const picker = desktop.locator("[data-testid=catalog-picker]");
  await picker.waitFor({ state: "visible" });
  for (const text of ["BMW", "5시리즈", "5시리즈 (G30)", "가솔린 2WD", "520i M 스포츠"]) await pickerClick(picker, text);
  const drilledText = (await desktop.locator(".bbm-chips").first().innerText()).replace(/\s+/g, " ");
  assert(drilledText.includes("BMW") && drilledText.includes("5시리즈") && drilledText.includes("520i M 스포츠"), "PC BMW 6단계 드릴인", drilledText);
  assert(desktopErrors.length === 0, "PC 콘솔·런타임 오류 없음", desktopErrors.join(" | "));
  await desktopContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const { page: mobile, errors: mobileErrors } = await pageWithErrors(mobileContext);
  await mobile.goto(`${baseUrl}/?qf=guazi&category=${encodeURIComponent("중고차")}`, { waitUntil: "networkidle" });
  await mobile.getByRole("textbox", { name: "중고차 검색" }).fill("G60");
  const mobileResults = mobile.locator("[data-testid=catalog-search-results]");
  await mobileResults.locator("button").first().waitFor({ state: "visible" });
  const mobileFirst = (await mobileResults.locator("button").first().innerText()).replace(/\s+/g, " ");
  assert(mobileFirst.includes("BMW › 5시리즈 › 5시리즈 (G60)"), "모바일 검색 첫 결과", mobileFirst);
  await mobile.screenshot({ path: fileURLToPath(new URL("mobile-search.png", reportDir)), fullPage: false });
  await mobileResults.locator("button").first().tap();
  await mobile.locator("[data-testid=catalog-picker]").waitFor({ state: "visible" });
  const mobilePickerText = (await mobile.locator("[data-testid=catalog-picker]").innerText()).replace(/\s+/g, " ");
  assert(mobilePickerText.includes("BMW › 5시리즈 › 5시리즈 (G60)"), "모바일 결과 선택 후 해당 위치에서 시트 열림", mobilePickerText);
  assert(mobileErrors.length === 0, "모바일 콘솔·런타임 오류 없음", mobileErrors.join(" | "));
  await mobileContext.close();

  const bikeContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const { page: bike, errors: bikeErrors } = await pageWithErrors(bikeContext);
  await bike.goto(`${baseUrl}/?qf=guazi&category=${encodeURIComponent("바이크")}`, { waitUntil: "networkidle" });
  await bike.getByRole("textbox", { name: "바이크 검색" }).fill("pcx");
  const bikeResults = bike.locator("[data-testid=catalog-search-results]");
  await bikeResults.locator("button").first().waitFor({ state: "visible" });
  const bikeFirst = (await bikeResults.locator("button").first().innerText()).replace(/\s+/g, " ");
  assert(/PCX/i.test(bikeFirst), "바이크 PCX 검색", bikeFirst);
  await bikeResults.locator("button").first().tap();
  await bike.locator("[data-testid=catalog-picker]").waitFor({ state: "visible" });
  assert((await bike.locator("[data-testid=catalog-picker]").innerText()).includes("모델"), "바이크 3단계 바텀시트 연결");
  assert(bikeErrors.length === 0, "바이크 콘솔·런타임 오류 없음", bikeErrors.join(" | "));
  await bikeContext.close();

  console.log(JSON.stringify({ baseUrl, passed: results.length, results }, null, 2));
} finally {
  await browser.close();
}
