import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const DEV_LIST = "https://dev.bbmuseum.co.kr/car/list";
const OURS_LIST = process.argv[2] ?? "http://127.0.0.1:5173/?qf=guazi&pc=1";

const L = [
  ["헤더", ".app-shell__header", ".bbm-header", ["h", "bg"]],
  ["헤더 로고", ".app-header-logo", ".bbm-logo", ["x", "y", "w", "h"]],
  ["GNB", ".app-gnb", ".bbm-gnb", ["x", "y", "w", "h", "gap"]],
  ["GNB 첫 메뉴", ".app-gnb__item", ".bbm-gnb button", ["x", "y", "w", "h", "fs", "fw"]],
  ["목록 본문", ".car-list-renewal", ".bbm-page", ["x", "w"]],
  ["상단 개요", ".car-list-overview", ".bbm-hybrid-top", ["x", "y", "w", "h"]],
  ["경로", ".car-list-catalog-breadcrumb", ".bbm-hybrid-top > .bbm-ct-crumbs strong", ["x", "y", "h", "fs", "lh", "fw"]],
  ["검색 조건", ".car-list-content-filter", ".usedcar-pc-filter-panel", ["x", "y", "w", "h", "bg", "br"]],
  ["매물 수", ".car-list-quick-filter-summary", ".bbm-ct-title-row", ["x", "y", "h"]],
  ["필터 칩 줄", ".car-list-mobile-filter__tabs", ".bbm-ct-chip-row", ["x", "y", "h"]],
  ["필터 칩", ".car-list-mobile-filter__button--filter .car-list-mobile-filter__button", ".bbm-filter-button", ["h", "fs", "lh", "fw", "br"]],
  ["차종 줄", ".car-list-category-menu", ".bbm-category-menu", ["x", "y", "w", "h"]],
  ["차종 라벨", ".car-list-category-menu__label", ".bbm-category-menu__label", ["fs", "lh", "fw", "color"]],
  ["좌측 필터", ".car-list-filter", ".bbm-filter", ["x", "y", "w"]],
  ["필터 요약", ".car-list-filter-summary", ".bbm-filter-summary", ["x", "y", "w", "h", "bg"]],
  ["필터 제목", ".car-list-filter-summary__title", ".bbm-filter-title strong", ["fs", "fw", "color"]],
  ["초기화", ".car-list-filter-summary__reset", ".bbm-filter-reset", ["fs", "lh", "fw", "color"]],
  ["제조사 항목", ".car-list-filter-menu__item", ".bbm-filter-item.is-maker-grade", ["x", "y", "w"]],
  ["제조사 머리", ".car-list-filter-menu__header", ".bbm-filter-item.is-maker-grade > .bbm-filter-toggle", ["y", "w", "h", "fs", "lh", "fw"]],
  ["제조사 카탈로그", ".car-list-filter-catalog", ".bbm-filter-item.is-maker-grade .bbm-catalog", ["x", "y", "w", "h"]],
  ["제조사 구역명", ".car-list-filter-catalog__section-title", ".bbm-catalog-title", ["fs", "lh", "fw", "color"]],
  ["제조사 행", ".car-list-filter-catalog__row", ".bbm-catalog-row", ["h"]],
  ["목록 본체", ".car-list-main", ".bbm-content", ["x", "y", "w"]],
  ["목록 툴바", ".car-list-content-toolbar", ".bbm-toolbar", ["x", "y", "w", "h", "bg"]],
  ["판매자 탭", ".car-list-content-toolbar__seller-tab", ".bbm-seller-tabs button", ["h", "fs", "lh", "fw", "color"]],
  ["영상 매물", ".car-list-content-toolbar__video-filter", ".bbm-video-filter", ["h", "fs", "lh", "fw", "color"]],
  ["보기 방식", ".car-list-content-toolbar__view", ".bbm-view", ["h", "fs", "lh", "fw", "color"]],
  ["매물 카드", ".car-list-result-card", ".bbm-result-card", ["x", "y", "w", "h", "bg"]],
  ["카드 안쪽", ".car-list-result-card__main", ".bbm-card-main", ["x", "y", "w", "h"]],
  ["카드 사진", ".car-list-result-card__image", ".bbm-card-photo", ["x", "y", "w", "h", "br"]],
  ["카드 제목", ".car-list-result-card__title", ".bbm-card-title", ["fs", "lh", "fw", "color"]],
  ["카드 사양", ".car-list-result-card__spec", ".bbm-card-spec", ["fs", "lh", "fw", "color"]],
  ["카드 가격", ".car-list-result-card__price", ".bbm-card-price", ["fs", "fw", "color"]],
];

const D = [
  ["상세 헤더 로고", ".app-header-logo", ".bbm-header.is-detail .bbm-logo", ["x", "y", "w", "h"]],
  ["상세 GNB", ".app-gnb", ".bbm-header.is-detail .bbm-gnb", ["x", "y", "w", "h", "gap"]],
  ["상세 GNB 첫 메뉴", ".app-gnb__item", ".bbm-header.is-detail .bbm-gnb button", ["x", "y", "w", "h", "fs", "fw"]],
  ["상세 본문", ".car-detail-page", ".pc-detail-columns", ["y", "w"]],
  ["상세 열", ".car-detail-content-layout__columns", ".pc-detail-columns", ["y", "w", "gap"]],
  ["상세 왼쪽", ".car-detail-content-layout__main", ".pc-detail-left", ["y", "w"]],
  ["갤러리", ".car-detail-gallery", ".pc-gallery", ["y", "w", "h"]],
  ["대표 사진", ".car-detail-gallery__main", ".pc-hero", ["y", "w", "h", "br"]],
  ["대표 이미지", ".car-detail-gallery__image", ".pc-hero-photo", ["w", "h"]],
  ["사진 상단 버튼", ".car-detail-gallery__top-action", ".pc-hero-tools button", ["w", "h", "br", "bg"]],
  ["썸네일 줄", ".car-detail-gallery__thumbs", ".pc-thumbnail-region", ["y", "w", "h"]],
  ["썸네일", ".car-detail-gallery__thumb", ".pc-thumbnail-track button", ["w", "h", "br"]],
  ["요약 카드", ".car-detail-section", ".pc-overview", ["y", "w", "h", "bg", "br", "pad"]],
  ["요약 제목", ".car-detail-overview__title", ".pc-overview-copy h1", ["y", "fs", "lh", "fw"]],
  ["요약 설명", ".car-detail-overview__lead", ".pc-overview-copy > p", ["fs", "lh", "fw", "color"]],
  ["요약 사양", ".car-detail-overview__spec", ".pc-overview-specs", ["fs", "lh", "fw"]],
  ["요약 통계", ".car-detail-overview__stats", ".pc-overview-stats", ["fs", "lh", "color"]],
  ["오른쪽 패널", ".car-detail-content-layout__aside", ".pc-sidebar", ["y", "w"]],
  ["가격 카드", ".car-detail-floating-card__price-panel", ".pc-summary", ["w", "bg", "br", "pad"]],
  ["가격", ".car-detail-floating-card__price", ".pc-price-row strong", ["fs", "lh", "fw", "color"]],
  ["보험이력 행", ".car-detail-floating-card__quick-link", ".pc-summary-links button", ["h", "fs"]],
  ["비용 버튼", ".car-detail-floating-card__actions button", ".pc-calculators button", ["h", "br", "fs", "fw"]],
  ["판매자 카드", ".car-detail-floating-card__seller-panel", ".pc-seller", ["w", "bg", "br", "pad"]],
  ["판매자 이름", ".car-detail-floating-card__seller-name-row strong", ".pc-seller h2", ["fs", "lh", "fw"]],
  ["상담 버튼", ".car-detail-floating-card__chat", ".pc-seller-contact button", ["h", "br", "fs", "fw", "bg"]],
];

const read = (selector) => {
  const element = [...document.querySelectorAll(selector)].find((candidate) => candidate.getBoundingClientRect().width > 0);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height), fs: style.fontSize, lh: style.lineHeight, fw: style.fontWeight, color: style.color, bg: style.backgroundColor, br: style.borderRadius, pad: style.padding, gap: style.gap };
};

async function grab(browser, side, pairs, detail = false) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(side === "dev" ? DEV_LIST : OURS_LIST, { waitUntil: "networkidle", timeout: 60_000 });
  if (detail) {
    const card = page.locator(side === "dev" ? ".car-list-result-card" : ".bbm-result-card").first();
    await card.waitFor({ state: "visible", timeout: 30_000 });
    // React/Vue 하이드레이션이 끝나기 전에 클릭하면 상세 라우팅이 빠지는 경우가 있다.
    await page.waitForTimeout(1_200);
    await card.click();
    await page.locator(side === "dev" ? ".car-detail-page" : ".pc-detail-container").waitFor({ state: "visible", timeout: 30_000 });
    await page.waitForTimeout(500);
  } else await page.waitForTimeout(500);
  const values = [];
  for (const pair of pairs) values.push(await page.evaluate(read, pair[side === "dev" ? 1 : 2]));
  await page.close();
  return values;
}

function same(prop, a, b) {
  if (["x", "y", "w", "h"].includes(prop)) return Math.abs(a - b) <= 1;
  if (prop === "gap" && new Set([a, b]).size <= 2 && [a, b].every((v) => v === "normal" || v === "0px")) return true;
  return a === b;
}

function compare(pairs, dev, ours, screen) {
  return pairs.map((pair, index) => {
    const [name, devSelector, oursSelector, props] = pair;
    const differences = [];
    if (!dev[index] || !ours[index]) differences.push("선택자 없음");
    else for (const prop of props) if (!same(prop, dev[index][prop], ours[index][prop])) differences.push(`${prop} ${dev[index][prop]}→${ours[index][prop]}`);
    return { screen, name, devSelector, oursSelector, status: differences.length ? "다름" : "일치", differences };
  });
}

const browser = await chromium.launch();
const [devList, ourList] = await Promise.all([grab(browser, "dev", L), grab(browser, "ours", L)]);
const [devDetail, ourDetail] = await Promise.all([grab(browser, "dev", D, true), grab(browser, "ours", D, true)]);
await browser.close();
const rows = [...compare(L, devList, ourList, "목록"), ...compare(D, devDetail, ourDetail, "상세")];
mkdirSync("reports/job3-change6", { recursive: true });
writeFileSync("reports/job3-change6/compare_pc_1280.json", JSON.stringify(rows, null, 2));
for (const row of rows) console.log(`[${row.screen}] ${row.name}: ${row.status}${row.differences.length ? ` · ${row.differences.join("; ")}` : ""}`);
const different = rows.filter((row) => row.status === "다름").length;
console.log(`PC 1280 대조: 전체 ${rows.length}건 · 일치 ${rows.length - different}건 · 다름 ${different}건`);
process.exitCode = different ? 1 : 0;
