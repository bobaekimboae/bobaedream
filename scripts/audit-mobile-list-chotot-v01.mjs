#!/usr/bin/env node
import { chromium, devices } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join("reports", "chotot-mobile-list-v01");
const rawDir = join(outDir, "raw");
mkdirSync(rawDir, { recursive: true });

const viewport = { width: 412, height: 915 };
const deviceScaleFactor = 2.625;
const localTruckUrl = "http://127.0.0.1:4173/?qf=guazi&category=%ED%8A%B8%EB%9F%AD+%C2%B7+%ED%8A%B9%EC%9E%A5";
const localCarUrl = "http://127.0.0.1:4173/?qf=guazi&category=%EC%A4%91%EA%B3%A0%EC%B0%A8";
const chototTruckUrl = "https://xe.chotot.com/mua-ban-xe-tai-xe-ben";

function collectLocal() {
  const round = (value) => Math.round(value * 100) / 100;
  const styleAndRect = (element) => {
    if (!element) return null;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      rect: [round(rect.x), round(rect.y), round(rect.width), round(rect.height)],
      fontSize: style.fontSize, fontWeight: style.fontWeight, lineHeight: style.lineHeight,
      color: style.color, backgroundColor: style.backgroundColor, borderRadius: style.borderRadius,
      border: style.border, padding: style.padding, gap: style.gap, textShadow: style.textShadow,
    };
  };
  const one = (selector) => document.querySelector(selector);
  const card = one(".bbm-result-card.is-mobile");
  const cardStyle = card ? getComputedStyle(card) : null;
  const toolbar = one(".bbm-m-options");
  const mobileFooter = one(".bbm-card-mobile-footer");
  return {
    environment: {
      viewport: [window.innerWidth, window.innerHeight],
      dpr: window.devicePixelRatio,
      url: location.href,
    },
    regionLabel: styleAndRect(one(".region-bar.is-bbm .region-label")),
    regionValue: styleAndRect(one(".region-bar.is-bbm strong")),
    reset: styleAndRect(one(".region-bar.is-bbm .reset-button")),
    filterChip: styleAndRect(one(".filter-shell.is-bbm .filter-chip:not(.is-active)")),
    selectedChip: styleAndRect(one(".filter-shell.is-bbm .filter-chip.is-active")),
    selectedChipClear: styleAndRect(one(".filter-shell.is-bbm .filter-chip-clear")),
    quickFilterLabel: styleAndRect(one(".depth-rail .depth-card-label")),
    sort: styleAndRect(one(".bbm-m-sort")),
    toolbarToggle: styleAndRect(one(".bbm-m-filter-tab")),
    viewButton: styleAndRect(one(".bbm-m-view")),
    viewIcon: styleAndRect(one(".bbm-m-view img")),
    thumbnail: styleAndRect(one(".bbm-card-photo")),
    title: styleAndRect(one(".bbm-card-title")),
    meta: styleAndRect(one(".bbm-card-spec")),
    price: styleAndRect(one(".bbm-card-price")),
    priceUnit: styleAndRect(one(".bbm-card-price-unit")),
    badge: styleAndRect(one(".bbm-card-badges span")),
    location: styleAndRect(one(".bbm-card-location")),
    seller: styleAndRect(one(".bbm-card-seller-text")),
    time: styleAndRect(one(".bbm-card-time")),
    photoCount: styleAndRect(one(".bbm-card-count")),
    bottomLabel: styleAndRect(one(".bbm-bottom-gnb__label")),
    activeBottomLabel: styleAndRect(one(".bbm-bottom-gnb__item.is-active .bbm-bottom-gnb__label")),
    chatButton: styleAndRect(one(".bbm-card-chat")),
    wishButton: styleAndRect(one(".bbm-card-wish")),
    mobileFooter: styleAndRect(mobileFooter),
    card: card ? {
      ...styleAndRect(card),
      borderBottomColor: cardStyle.borderBottomColor,
      borderBottomWidth: cardStyle.borderBottomWidth,
    } : null,
    structure: {
      regionPinPresent: Boolean(one(".region-bar.is-bbm .ui-icon[src*='region-location']")),
      regionTriangle: one(".region-chevron-icon img")?.getAttribute("src") ?? null,
      chipTriangle: one(".filter-chip:not(.is-active) img")?.getAttribute("src") ?? null,
      quickFilterLeadingLabelPresent: Boolean(one(".depth-rail-label")),
      toolbarText: toolbar ? [...toolbar.children].map((element) => element.textContent.trim()).filter(Boolean) : [],
      mediaGradient: getComputedStyle(one(".bbm-card-media-footer")).backgroundImage,
      specParts: [...document.querySelectorAll(".bbm-card-spec > span")].slice(0, 4).map((element) => element.textContent),
      sellerFooterAfterMain: Boolean(card && mobileFooter && card.querySelector(":scope > .bbm-card-mobile-footer") === mobileFooter),
      viewIcon: one(".bbm-m-view img")?.getAttribute("src") ?? null,
    },
  };
}

function collectChotot() {
  const round = (value) => Math.round(value * 100) / 100;
  const styleAndRect = (element) => {
    if (!element) return null;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      rect: [round(rect.x), round(rect.y), round(rect.width), round(rect.height)],
      fontSize: style.fontSize, fontWeight: style.fontWeight, lineHeight: style.lineHeight,
      color: style.color, backgroundColor: style.backgroundColor, borderRadius: style.borderRadius,
      border: style.border, padding: style.padding, gap: style.gap, textShadow: style.textShadow,
    };
  };
  const exactText = (text) => [...document.querySelectorAll("*")].find((element) => element.children.length === 0 && element.textContent.trim() === text);
  const regionLabel = exactText("Khu vực:");
  const regionValue = exactText("Toàn quốc");
  const reset = exactText("Xoá lọc");
  const sort = exactText("Tin mới nhất");
  const video = exactText("Có video");
  const firstCard = document.querySelector("li.aebeqpz");
  const title = firstCard?.querySelector("h2") ?? null;
  const price = firstCard ? [...firstCard.querySelectorAll("*")].find((element) => /đ$/.test(element.textContent.trim()) && element.children.length === 0) : null;
  const image = firstCard?.querySelector("img") ?? null;
  const bottomHome = exactText("Trang chủ");
  return {
    environment: {
      viewport: [window.innerWidth, window.innerHeight],
      dpr: window.devicePixelRatio,
      url: location.href,
    },
    regionLabel: styleAndRect(regionLabel),
    regionValue: styleAndRect(regionValue),
    reset: styleAndRect(reset),
    sort: styleAndRect(sort),
    toolbarToggle: styleAndRect(video),
    title: styleAndRect(title),
    price: styleAndRect(price),
    thumbnail: styleAndRect(image?.parentElement ?? image),
    firstCard: styleAndRect(firstCard),
    bottomLabel: styleAndRect(bottomHome),
  };
}

async function openPage(context, url) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);
  return page;
}

async function captureClip(page, path, clip) {
  await page.screenshot({ path, clip: { x: 0, width: viewport.width, ...clip }, animations: "disabled" });
}

async function combine(browser, leftPath, rightPath, outputPath, labels) {
  const left = readFileSync(leftPath).toString("base64");
  const right = readFileSync(rightPath).toString("base64");
  const context = await browser.newContext({ viewport: { width: 856, height: 1600 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.setContent(`<!doctype html><html><style>
    *{box-sizing:border-box} body{margin:0;padding:12px;background:#e8e8e8;font-family:Arial,sans-serif}
    main{display:grid;grid-template-columns:412px 412px;gap:8px;align-items:start}
    figure{margin:0;background:#fff} figcaption{height:32px;padding:7px 10px;background:#222;color:#fff;font-size:14px;font-weight:700}
    img{display:block;width:412px;height:auto}
  </style><main>
    <figure><figcaption>${labels[0]}</figcaption><img src="data:image/png;base64,${left}"></figure>
    <figure><figcaption>${labels[1]}</figcaption><img src="data:image/png;base64,${right}"></figure>
  </main></html>`);
  const height = await page.locator("main").evaluate((element) => Math.ceil(element.getBoundingClientRect().height + 24));
  await page.setViewportSize({ width: 856, height });
  await page.screenshot({ path: outputPath, fullPage: true });
  await context.close();
}

async function stackCards(browser, imagePaths, outputPath, horizontalPadding = 0) {
  const images = imagePaths.map((path) => readFileSync(path).toString("base64"));
  const context = await browser.newContext({ viewport: { width: 412, height: 1000 }, deviceScaleFactor });
  const page = await context.newPage();
  await page.setContent(`<!doctype html><html><style>
    *{box-sizing:border-box} html,body{margin:0;width:412px;background:#fff} main{width:412px}
    img{display:block;width:${412 - horizontalPadding * 2}px;height:auto;margin:0 ${horizontalPadding}px}
  </style><main>${images.map((source) => `<img src="data:image/png;base64,${source}">`).join("")}</main></html>`);
  const height = await page.locator("main").evaluate((element) => Math.ceil(element.getBoundingClientRect().height));
  await page.setViewportSize({ width: 412, height });
  await page.screenshot({ path: outputPath, fullPage: true });
  await context.close();
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ...devices["Pixel 7"],
  viewport,
  deviceScaleFactor,
  locale: "ko-KR",
});

try {
  const [local, chotot, usedCar] = await Promise.all([
    openPage(context, localTruckUrl),
    openPage(context, chototTruckUrl),
    openPage(context, localCarUrl),
  ]);

  const measurements = {
    measuredAt: new Date().toISOString(),
    protocol: `Chrome/Chromium device emulation ${viewport.width}px @ DPR ${deviceScaleFactor}`,
    local: await local.evaluate(collectLocal),
    chotot: await chotot.evaluate(collectChotot),
  };
  writeFileSync(join(outDir, "measurements.json"), `${JSON.stringify(measurements, null, 2)}\n`);
  const sourceIcons = await chotot.evaluate(() => {
    const exactText = (text) => [...document.querySelectorAll("*")].find((element) => element.children.length === 0 && element.textContent.trim() === text);
    return {
      back: document.querySelector('button[aria-label="Back Button"] svg')?.outerHTML ?? null,
      home: exactText("Trang chủ")?.closest("a")?.querySelector("svg")?.outerHTML ?? null,
      my: exactText("Tài khoản")?.closest("div")?.querySelector("svg")?.outerHTML ?? null,
    };
  });
  const sourceIconDir = join(outDir, "source-icons");
  mkdirSync(sourceIconDir, { recursive: true });
  for (const [name, svg] of Object.entries(sourceIcons)) {
    if (svg) writeFileSync(join(sourceIconDir, `chotot-${name}-unapplied.svg`), `${svg}\n`);
  }

  const localTopBox = await local.locator(".region-bar.is-bbm").evaluate((element) => {
    const top = element.getBoundingClientRect().top + scrollY;
    const bottom = document.querySelector(".bbm-m-options").getBoundingClientRect().bottom + scrollY;
    return { y: top, height: bottom - top };
  });
  const chototTopBox = await chotot.evaluate(() => {
    const label = [...document.querySelectorAll("*")].find((element) => element.children.length === 0 && element.textContent.trim() === "Khu vực:");
    const top = label.closest("[class*='dynamicFilterWrapperMobile']").getBoundingClientRect().top + scrollY;
    const sort = [...document.querySelectorAll("*")].find((element) => element.children.length === 0 && element.textContent.trim() === "Tin mới nhất");
    const bottom = sort.closest("[class*='orderFilter']").getBoundingClientRect().bottom + scrollY;
    return { y: top, height: bottom - top };
  });
  let localCardsBox = await local.locator(".bbm-result-card.is-mobile").evaluateAll((elements) => {
    const boxes = elements.slice(0, 2).map((element) => element.getBoundingClientRect());
    const y = boxes[0].top + scrollY;
    return { y, height: boxes[1].bottom - boxes[0].top };
  });
  let chototCardsBox = await chotot.locator("li.aebeqpz").evaluateAll((elements) => {
    const boxes = elements.slice(0, 2).map((element) => element.getBoundingClientRect());
    const y = boxes[0].top + scrollY;
    return { y, height: boxes[1].bottom - boxes[0].top };
  });

  const raw = {
    localTop: join(rawDir, "local-top.png"), chototTop: join(rawDir, "chotot-top.png"),
    localCards: join(rawDir, "local-cards.png"), chototCards: join(rawDir, "chotot-cards.png"),
    localBottom: join(rawDir, "local-bottom.png"), chototBottom: join(rawDir, "chotot-bottom.png"),
  };
  await captureClip(local, raw.localTop, localTopBox);
  await captureClip(chotot, raw.chototTop, chototTopBox);
  await local.locator(".bbm-result-card.is-mobile").first().scrollIntoViewIfNeeded();
  await chotot.locator("li.aebeqpz").first().scrollIntoViewIfNeeded();
  await Promise.all([local.waitForTimeout(500), chotot.waitForTimeout(500)]);
  localCardsBox = await local.locator(".bbm-result-card.is-mobile").evaluateAll((elements) => {
    const boxes = elements.slice(0, 2).map((element) => element.getBoundingClientRect());
    const y = boxes[0].top + scrollY;
    return { y, height: boxes[1].bottom - boxes[0].top };
  });
  chototCardsBox = await chotot.locator("li.aebeqpz").evaluateAll((elements) => {
    const boxes = elements.slice(0, 2).map((element) => element.getBoundingClientRect());
    const y = boxes[0].top + scrollY;
    return { y, height: boxes[1].bottom - boxes[0].top };
  });
  const localCardParts = [join(rawDir, "local-card-1.png"), join(rawDir, "local-card-2.png")];
  const chototCardParts = [join(rawDir, "chotot-card-1.png"), join(rawDir, "chotot-card-2.png")];
  await local.locator(".bbm-result-card.is-mobile").nth(0).screenshot({ path: localCardParts[0], animations: "disabled" });
  await local.locator(".bbm-result-card.is-mobile").nth(1).screenshot({ path: localCardParts[1], animations: "disabled" });
  await chotot.locator("li.aebeqpz").nth(0).screenshot({ path: chototCardParts[0], animations: "disabled" });
  await chotot.locator("li.aebeqpz").nth(1).screenshot({ path: chototCardParts[1], animations: "disabled" });
  await stackCards(browser, localCardParts, raw.localCards, 16);
  await stackCards(browser, chototCardParts, raw.chototCards);
  await Promise.all([
    local.evaluate(() => scrollTo(0, 0)),
    chotot.evaluate(() => scrollTo(0, 0)),
  ]);
  await Promise.all([local.waitForTimeout(300), chotot.waitForTimeout(300)]);
  await captureClip(local, raw.localBottom, { y: viewport.height - 96, height: 96 });
  await captureClip(chotot, raw.chototBottom, { y: viewport.height - 96, height: 96 });
  await usedCar.screenshot({ path: join(outDir, "used-car-common-component.png"), animations: "disabled" });

  await combine(browser, raw.chototTop, raw.localTop, join(outDir, "compare-top.png"), ["초톳 트럭 목록", "보배 변경 후"]);
  await combine(browser, raw.chototCards, raw.localCards, join(outDir, "compare-cards-2.png"), ["초톳 카드 2개", "보배 카드 2개"]);
  await combine(browser, raw.chototBottom, raw.localBottom, join(outDir, "compare-bottom-nav.png"), ["초톳 하단 탭", "보배 하단 탭"]);
} finally {
  await context.close();
  await browser.close();
}

console.log(`완료: ${outDir}`);
