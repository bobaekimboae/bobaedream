import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseUrl = process.env.TRUCK_QA_URL ?? "http://127.0.0.1:4342/";
const expectedFormats = [
  "카고(화물)트럭", "윙바디/탑", "버스", "덤프/건설/중기", "크레인 형태", "탱크로리",
  "캠핑카/캠핑 트레일러", "폐기/음식물수송", "활어차", "차량견인/운송", "트렉터", "트레일러", "기타",
];
const expectedHyundaiBusModels = [
  "e에어로타운", "e카운티", "글로벌 900 (그린시티)", "뉴 카운티", "슈퍼에어로시티",
  "에어로타운", "유니버스", "유니시티", "카운티",
];

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const cssNumber = (value) => Number.parseFloat(value ?? "0");

await mkdir("artifacts/qa", { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROME ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("pageerror", (error) => consoleErrors.push(error.message));

const common = "?qf=guazi&pc=1&filterLayout=compact&category=%ED%8A%B8%EB%9F%AD+%C2%B7+%ED%8A%B9%EC%9E%A5";
await page.goto(`${baseUrl}${common}&v=qa-all-formats`, { waitUntil: "networkidle" });
const formatLabels = await page.locator(".bbm-filter.is-truck-reference .bbm-truck-format .bbm-catalog-row .bbm-truck-option-name").allTextContents();
assert(JSON.stringify(formatLabels.map((label) => label.trim())) === JSON.stringify(expectedFormats), `13개 형식 불일치: ${JSON.stringify(formatLabels)}`);

await page.goto(`${baseUrl}${common}&v=qa-bus&truckFormat=%EB%B2%84%EC%8A%A4&truckSubtype=%EB%B2%84%EC%8A%A4&maker=%ED%98%84%EB%8C%80`, { waitUntil: "networkidle" });
const sidebar = page.locator(".bbm-page > .bbm-filter.is-truck-reference");
const openItems = sidebar.locator(".bbm-filter-item.is-open");
assert(await openItems.count() >= 2, "형식과 제조사 섹션이 동시에 열리지 않음");

const selectedDepth = (await sidebar.locator(".bbm-truck-format .bbm-encar-selected-row > span:first-child").allTextContents()).map((text) => text.trim());
assert(JSON.stringify(selectedDepth) === JSON.stringify(["버스", "버스"]), `완료 뎁스가 반복/누락됨: ${JSON.stringify(selectedDepth)}`);
assert(await sidebar.getByText("세부형식", { exact: true }).count() === 0, "완료 뒤 세부형식 목록이 다시 노출됨");
assert(await sidebar.getByText("모델", { exact: true }).count() === 1, "제조사 선택 뒤 모델 제목이 노출되지 않음");

const modelLabels = (await sidebar.locator(".bbm-filter-item.is-maker-grade .bbm-catalog-row > span:first-child").allTextContents()).map((text) => text.trim());
assert(JSON.stringify(modelLabels) === JSON.stringify(expectedHyundaiBusModels), `버스 현대 모델 뎁스 불일치: ${JSON.stringify(modelLabels)}`);

const quickModelCards = page.locator('section[aria-label="현대 모델 빠른 선택"] .depth-card');
const quickModelImageMetrics = await quickModelCards.evaluateAll((cards) => cards.map((card) => {
  const media = card.querySelector(".depth-card-media");
  const image = media?.querySelector("img");
  const label = card.querySelector(".depth-card-label");
  const mediaRect = media?.getBoundingClientRect();
  const labelRect = label?.getBoundingClientRect();
  return {
    mediaWidth: mediaRect?.width ?? 0,
    mediaHeight: mediaRect?.height ?? 0,
    mediaTop: mediaRect?.top ?? 0,
    labelTop: labelRect?.top ?? 0,
    naturalWidth: image?.naturalWidth ?? 0,
    naturalHeight: image?.naturalHeight ?? 0,
  };
}));
assert(quickModelImageMetrics.length === expectedHyundaiBusModels.length, `상단 버스 모델 카드 수 오류: ${quickModelImageMetrics.length}`);
assert(quickModelImageMetrics.every((metric) => metric.naturalWidth > 0 && metric.naturalHeight > 0), `상단 버스 모델 이미지 누락: ${JSON.stringify(quickModelImageMetrics)}`);
assert(quickModelImageMetrics.every((metric) => Math.abs(metric.mediaWidth - 76) <= 1 && Math.abs(metric.mediaHeight - 40) <= 1), `상단 버스 이미지 슬롯 크기 오류: ${JSON.stringify(quickModelImageMetrics)}`);
assert(Math.max(...quickModelImageMetrics.map((metric) => metric.mediaTop)) - Math.min(...quickModelImageMetrics.map((metric) => metric.mediaTop)) <= 1, "상단 버스 이미지 기준선이 서로 다름");
assert(Math.max(...quickModelImageMetrics.map((metric) => metric.labelTop)) - Math.min(...quickModelImageMetrics.map((metric) => metric.labelTop)) <= 1, "상단 버스 모델명 기준선이 서로 다름");

const metrics = await page.evaluate(() => {
  const side = document.querySelector(".bbm-page > .bbm-filter.is-truck-reference");
  const header = document.querySelector(".bbm-filter.is-truck-reference .bbm-filter-item.is-open .bbm-filter-toggle");
  const catalog = document.querySelector(".bbm-filter.is-truck-reference .bbm-filter-item.is-open .bbm-catalog");
  const row = document.querySelector(".bbm-filter.is-truck-reference .bbm-filter-item.is-maker-grade .bbm-catalog-row");
  return {
    sidebarWidth: side?.getBoundingClientRect().width ?? 0,
    headerHeight: header?.getBoundingClientRect().height ?? 0,
    catalogHeight: catalog?.getBoundingClientRect().height ?? 0,
    rowHeight: row?.getBoundingClientRect().height ?? 0,
    rowCssHeight: row ? getComputedStyle(row).height : "0",
    rowMinHeight: row ? getComputedStyle(row).minHeight : "0",
    rowPadding: row ? `${getComputedStyle(row).paddingTop}/${getComputedStyle(row).paddingBottom}` : "0",
    rowFontSize: row ? getComputedStyle(row).fontSize : "0",
    rowLineHeight: row ? getComputedStyle(row).lineHeight : "0",
  };
});
console.log("truck-filter-metrics", metrics);
assert(Math.abs(metrics.sidebarWidth - 228) <= 1, `사이드바 폭 오류: ${metrics.sidebarWidth}`);
assert(Math.abs(metrics.headerHeight - 55) <= 1, `섹션 제목 높이 오류: ${metrics.headerHeight}`);
assert(Math.abs(metrics.catalogHeight - 400) <= 1, `카탈로그 높이 오류: ${metrics.catalogHeight}`);
assert(Math.abs(metrics.rowHeight - 34) <= 1, `목록 행 높이 오류: ${metrics.rowHeight}`);
assert(cssNumber(metrics.rowFontSize) === 14 && cssNumber(metrics.rowLineHeight) === 22, `행 타이포 오류: ${metrics.rowFontSize}/${metrics.rowLineHeight}`);

await page.screenshot({ path: "artifacts/qa/truck-encar-regression.png", fullPage: true });
const actionableConsoleErrors = consoleErrors.filter((message) => !message.startsWith("Failed to load resource: the server responded with a status of 403"));
assert(actionableConsoleErrors.length === 0, `브라우저 오류: ${actionableConsoleErrors.join(" | ")}`);
console.log(JSON.stringify({ ok: true, formatCount: formatLabels.length, selectedDepth, modelCount: modelLabels.length, quickModelImageCount: quickModelImageMetrics.length, metrics, ignoredExternalAsset403: consoleErrors.length - actionableConsoleErrors.length, screenshot: "artifacts/qa/truck-encar-regression.png" }, null, 2));
await browser.close();
