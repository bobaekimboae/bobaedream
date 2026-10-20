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
const systemChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const executablePath = localChromium && existsSync(localChromium) ? localChromium : existsSync(systemChrome) ? systemChrome : undefined;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
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
  const catalogUrl = new URL("data/vehicle-catalog/cars-index-v1.json", `${baseUrl.replace(/\/$/, "")}/`);
  const catalogIndex = await fetch(catalogUrl).then((response) => {
    if (!response.ok) throw new Error(`차량 기준표를 불러오지 못했습니다 (${response.status})`);
    return response.json();
  });
  const modelCountByMake = new Map(catalogIndex.manufacturers.map((make) => [
    make.name,
    catalogIndex.modelGroups.filter((group) => group.makeId === make.id).length,
  ]));

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const { page: desktop, errors: desktopErrors } = await pageWithErrors(desktopContext);
  const desktopUrl = `${baseUrl}/?qf=guazi&category=${encodeURIComponent("중고차")}&pc=1`;
  await desktop.goto(desktopUrl, { waitUntil: "networkidle" });
  const desktopSearch = desktop.getByRole("textbox", { name: "중고차에서 검색" });
  await desktopSearch.fill("520i m스포츠");
  const desktopResults = desktop.locator("[data-testid=catalog-search-results]");
  await desktopResults.locator("button").first().waitFor({ state: "visible" });
  const desktopFirst = (await desktopResults.locator("button").first().innerText()).replace(/\s+/g, " ");
  assert(desktopFirst.includes("BMW › 5시리즈 › 5시리즈 (G60) › 가솔린 2WD › 520i M 스포츠"), "PC 검색 첫 결과", desktopFirst);
  await desktop.screenshot({ path: fileURLToPath(new URL("pc-search.png", reportDir)), fullPage: false });
  await desktopResults.locator("button").first().click();
  await desktop.locator("[data-testid=catalog-picker]").waitFor({ state: "visible" });
  const chipText = (await desktop.locator(".bbm-chips").first().innerText()).replace(/\s+/g, " ");
  assert(chipText.includes("BMW") && chipText.includes("5시리즈") && chipText.includes("520i M 스포츠"), "PC 결과 선택 후 단계 칩 설정", chipText);

  await desktop.goto(desktopUrl, { waitUntil: "networkidle" });
  await desktop.getByRole("button", { name: "제조사", exact: true }).click();
  const hierarchy = desktop.locator("[data-testid=maker-hierarchy]");
  await hierarchy.waitFor({ state: "visible" });
  assert(await hierarchy.locator(".maker-hierarchy-row.is-maker").count() === 62, "PC 전체 제조사 62개 노출");
  await hierarchy.locator(".maker-hierarchy-row.is-maker").filter({ hasText: "BMW" }).click();
  await hierarchy.getByText("5시리즈", { exact: true }).waitFor({ state: "visible" });
  await hierarchy.locator(".maker-hierarchy-row.is-vehicle").filter({ hasText: "5시리즈" }).first().click();
  await hierarchy.getByText("G60", { exact: true }).waitFor({ state: "visible" });
  await hierarchy.locator(".maker-hierarchy-row.is-vehicle").filter({ hasText: "G60" }).click();
  await desktop.screenshot({ path: fileURLToPath(new URL("pc-maker-hierarchy.png", reportDir)), fullPage: false });
  await desktop.locator(".maker-hierarchy-confirm").click();
  const drilledText = (await desktop.locator(".bbm-chips").first().innerText()).replace(/\s+/g, " ");
  assert(drilledText.includes("BMW") && drilledText.includes("5시리즈") && drilledText.includes("G60"), "PC 제조사·모델·세부모델 적용", drilledText);
  assert(new URL(desktop.url()).searchParams.get("generation") === "5시리즈 (G60)", "PC 세부모델 URL 반영");
  assert(desktopErrors.length === 0, "PC 콘솔·런타임 오류 없음", desktopErrors.join(" | "));
  await desktopContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const { page: mobile, errors: mobileErrors } = await pageWithErrors(mobileContext);
  await mobile.goto(`${baseUrl}/?qf=guazi&category=${encodeURIComponent("중고차")}`, { waitUntil: "networkidle" });
  await mobile.getByRole("button", { name: "제조사", exact: true }).tap();
  const mobileHierarchy = mobile.locator("[data-testid=maker-hierarchy]");
  await mobileHierarchy.waitFor({ state: "visible" });
  assert(await mobileHierarchy.locator(".maker-hierarchy-row.is-maker").count() === 62, "모바일 전체 제조사 62개 노출");
  const genesisRow = mobileHierarchy.locator('[data-maker="제네시스"]');
  const genesisRowBox = await genesisRow.boundingBox();
  const genesisLogoBox = await genesisRow.locator(".maker-hierarchy-logo").boundingBox();
  const genesisNameBox = await genesisRow.locator(".maker-hierarchy-copy").boundingBox();
  const genesisImageBox = await genesisRow.locator(".maker-hierarchy-logo img").boundingBox();
  assert(genesisRowBox?.height === 48, "모바일 제조사 행 높이 48px", `${genesisRowBox?.height}px`);
  assert(genesisLogoBox?.width === 38 && genesisLogoBox?.height === 26, "모바일 제조사 로고 슬롯 38×26px", `${genesisLogoBox?.width}×${genesisLogoBox?.height}px`);
  assert(genesisLogoBox?.x === 16 && genesisLogoBox.x + genesisLogoBox.width / 2 === 35, "모바일 제조사 로고 중심 x=35px", `${genesisLogoBox?.x}px`);
  assert(genesisNameBox?.x === 66, "모바일 제조사명 시작 x=66px", `${genesisNameBox?.x}px`);
  assert(Boolean(genesisImageBox && genesisImageBox.width <= 38 && genesisImageBox.height <= 26 && genesisImageBox.width > 24), "제네시스 로고 광학 크기 보정", `${genesisImageBox?.width}×${genesisImageBox?.height}px`);
  await mobile.screenshot({ path: fileURLToPath(new URL("mobile-maker-logos.png", reportDir)), fullPage: false });
  for (const make of catalogIndex.manufacturers) {
    await mobileHierarchy.locator(`[data-maker="${make.name}"]`).tap();
    const models = mobileHierarchy.locator("[data-model]");
    await models.first().waitFor({ state: "visible" });
    const expected = modelCountByMake.get(make.name) ?? 0;
    assert(await models.count() === expected, `모바일 ${make.name} 모델 연결`, `${expected}개`);
    await mobile.locator(".bbmf-sheet-back").tap();
    await mobileHierarchy.locator(`[data-maker="${make.name}"]`).waitFor({ state: "visible" });
  }
  await mobileHierarchy.locator(".maker-hierarchy-row.is-maker").filter({ hasText: "현대" }).first().tap();
  await mobileHierarchy.getByText("그랜저", { exact: true }).waitFor({ state: "visible" });
  await mobile.screenshot({ path: fileURLToPath(new URL("mobile-maker-hierarchy.png", reportDir)), fullPage: false });
  await mobile.getByRole("button", { name: "닫기" }).tap();
  await mobile.goto(`${baseUrl}/?qf=guazi&category=${encodeURIComponent("국산차")}`, { waitUntil: "networkidle" });
  await mobile.getByRole("button", { name: "제조사", exact: true }).tap();
  assert(await mobile.locator("[data-testid=maker-hierarchy] [data-maker]").count() === 7, "모바일 국산차 제조사 7개 제한");
  await mobile.getByRole("button", { name: "닫기" }).tap();
  await mobile.goto(`${baseUrl}/?qf=guazi&category=${encodeURIComponent("수입차")}`, { waitUntil: "networkidle" });
  await mobile.getByRole("button", { name: "제조사", exact: true }).tap();
  assert(await mobile.locator("[data-testid=maker-hierarchy] [data-maker]").count() === 55, "모바일 수입차 제조사 55개 제한");
  assert(mobileErrors.length === 0, "모바일 콘솔·런타임 오류 없음", mobileErrors.join(" | "));
  await mobileContext.close();

  const bikeContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const { page: bike, errors: bikeErrors } = await pageWithErrors(bikeContext);
  await bike.goto(`${baseUrl}/?qf=guazi&category=${encodeURIComponent("바이크")}`, { waitUntil: "networkidle" });
  await bike.getByRole("button", { name: "제조사", exact: true }).tap();
  const bikeHierarchy = bike.locator("[data-testid=maker-hierarchy]");
  await bikeHierarchy.waitFor({ state: "visible" });
  assert(await bikeHierarchy.locator(".maker-hierarchy-row.is-maker").count() === 63, "바이크 제조사 63개 노출");
  await bikeHierarchy.locator(".maker-hierarchy-row.is-maker").filter({ hasText: "혼다" }).first().tap();
  assert((await bikeHierarchy.innerText()).includes("PCX"), "바이크 제조사 선택 후 모델 연결");
  assert(bikeErrors.length === 0, "바이크 콘솔·런타임 오류 없음", bikeErrors.join(" | "));
  await bikeContext.close();

  console.log(JSON.stringify({ baseUrl, passed: results.length, results }, null, 2));
} finally {
  await browser.close();
}
