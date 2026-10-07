import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const oursUrl = process.argv[2] ?? "http://127.0.0.1:5173/?qf=guazi";
const pairs = [
  ["헤더", "header.car-list-mobile-page-header", "header.top-bar"], ["검색창", ".car-list-mobile-page-header__search", ".top-bar .search-field"],
  ["지역 줄", ".car-list-mobile-region-tools", ".region-bar"], ["지역 값", ".car-list-mobile-region-tools__value", ".region-bar strong"], ["초기화", ".car-list-mobile-region-tools__reset", ".region-bar .reset-button"],
  ["칩 줄", ".car-list-mobile-filter__tabs", ".filter-shell"], ["필터 칩", ".car-list-mobile-filter__button--static", ".filter-fixed"], ["선택 칩", ".car-list-mobile-filter__button--selected", ".filter-chip.is-active"],
  ["카테고리 줄", ".car-list-category-menu__list", ".bbm-category-menu__list"], ["카테고리 원", ".car-list-category-menu__icon-box", ".bbm-category-menu__icon-box"], ["카테고리 라벨", ".car-list-category-menu__label", ".bbm-category-menu__label"],
  ["정렬 줄", ".car-list-content-toolbar", ".bbm-m-options"], ["정렬 글자", ".car-list-content-toolbar__sort span", ".bbm-m-sort span"], ["판매자 탭", ".car-list-content-toolbar__seller-tab", ".bbm-m-filter-tab"],
  ["카드", ".car-list-result-card", ".bbm-result-card"], ["사진", ".car-list-result-card__image", ".bbm-card-photo"], ["사진 시간", ".car-list-result-card__media-footer-time", ".bbm-card-time"],
  ["제목", ".car-list-result-card__title", ".bbm-card-title"], ["사양", ".car-list-card-spec--mobile", ".bbm-card-spec"], ["가격 숫자", ".car-list-result-card__price span", ".bbm-card-price span"],
  ["만원", ".car-list-result-card__price-unit", ".bbm-card-price-unit"], ["배지", ".car-list-result-card__badge", ".bbm-card-badges span"], ["위치", ".car-list-card-location__address-text", ".bbm-card-location-text span"],
  ["판매자명", ".car-list-result-card__seller-name--mobile", ".bbm-card-seller-text strong"], ["하단 라벨", ".mobile-bottom-gnb__label", ".bbm-bottom-gnb__label"], ["등록 원", ".mobile-bottom-gnb__register-button", ".bbm-bottom-gnb__register-button"],
];

const read = (selector) => {
  const element = [...document.querySelectorAll(selector)].find((candidate) => candidate.getBoundingClientRect().width > 0);
  if (!element) return null;
  const rect = element.getBoundingClientRect(); const style = getComputedStyle(element);
  return { w: Math.round(rect.width), h: Math.round(rect.height), fs: style.fontSize, lh: style.lineHeight, fw: style.fontWeight, color: style.color, bg: style.backgroundColor, br: style.borderRadius, pad: style.padding, gap: style.gap };
};

async function grab(browser, url, side) {
  const page = await browser.newPage({ viewport: { width: 384, height: 900 }, deviceScaleFactor: 2, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1", isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 }); await page.waitForTimeout(1_000);
  const values = []; for (const pair of pairs) values.push(await page.evaluate(read, pair[side === "dev" ? 1 : 2]));
  await page.close(); return values;
}

const browser = await chromium.launch();
const [dev, ours] = await Promise.all([grab(browser, "https://dev.bbmuseum.co.kr/car/list", "dev"), grab(browser, oursUrl, "ours")]);
await browser.close();
const rows = pairs.map(([name, devSelector, oursSelector], index) => {
  const differences = [];
  if (!dev[index] || !ours[index]) differences.push("선택자 없음");
  else for (const key of ["w", "h", "fs", "lh", "fw", "color", "bg", "br", "pad", "gap"]) {
    const sameSize = ["w", "h"].includes(key) && Math.abs(dev[index][key] - ours[index][key]) <= 1;
    const sameGap = key === "gap" && [dev[index][key], ours[index][key]].every((value) => value === "normal" || value === "0px");
    if (!sameSize && !sameGap && dev[index][key] !== ours[index][key]) differences.push(`${key} ${dev[index][key]}→${ours[index][key]}`);
  }
  return { name, devSelector, oursSelector, status: differences.length ? "다름" : "일치", differences };
});
mkdirSync("reports/job3-change6", { recursive: true });
writeFileSync("reports/job3-change6/compare_list_384.json", JSON.stringify(rows, null, 2));
for (const row of rows) console.log(`${row.name}: ${row.status}${row.differences.length ? ` · ${row.differences.join("; ")}` : ""}`);
const different = rows.filter((row) => row.status === "다름").length;
console.log(`모바일 384 대조: 전체 ${rows.length}건 · 일치 ${rows.length - different}건 · 다름 ${different}건`);
process.exitCode = different ? 1 : 0;
