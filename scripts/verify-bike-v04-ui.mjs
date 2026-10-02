#!/usr/bin/env node
import { chromium } from "@playwright/test";

const baseUrl = process.env.BIKE_V04_URL ?? "http://127.0.0.1:5175/";
const url = `${baseUrl}?qf=guazi&category=${encodeURIComponent("바이크")}`;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
const runtimeErrors = [];
page.on("pageerror", (error) => runtimeErrors.push(error.message));

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  try {
    await page.locator(".bbm-result-card").first().waitFor({ state: "visible", timeout: 30_000 });
  } catch (error) {
    const body = (await page.locator("body").innerText()).slice(0, 2_000);
    throw new Error(`${error.message}\nRuntime errors: ${runtimeErrors.join(" | ")}\nBody: ${body}`);
  }
  const cards = page.locator(".bbm-result-card");
  const initialCards = await cards.count();
  if (initialCards !== 20) throw new Error(`Expected 20 cards on page 1, got: ${initialCards}`);
  const images = page.locator(".bbm-card-photo > img");
  const imageCount = await images.count();
  if (imageCount !== 20) throw new Error(`Bike listing images were not rendered for every visible card: images=${imageCount}, first=${(await cards.first().innerHTML()).slice(0, 800)}`);
  const firstImage = images.first();
  await firstImage.waitFor({ state: "visible" });
  const imageOk = await firstImage.evaluate((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0);
  if (!imageOk) throw new Error("The first bike listing image failed to load.");

  await page.locator(".filter-fixed").first().tap();
  await page.locator(".bbmf-full-item").filter({ hasText: /^장르/ }).first().tap();
  const sheet = page.locator(".bbmf-sheet").last();
  await sheet.waitFor({ state: "visible" });
  await sheet.locator(".bbmf-check").filter({ hasText: /^스포츠/ }).first().tap();
  const sheetConfirm = sheet.locator(".bbmf-confirm");
  const sheetConfirmText = await sheetConfirm.textContent();
  if (!sheetConfirmText?.includes("10대 보기")) throw new Error(`Expected sheet confirm for 10 listings, got: ${sheetConfirmText}`);
  await sheetConfirm.tap();
  const fullConfirm = page.locator(".bbmf-full .bbmf-confirm").last();
  const fullConfirmText = await fullConfirm.textContent();
  if (!fullConfirmText?.includes("10대 보기")) throw new Error(`Expected full confirm for 10 listings, got: ${fullConfirmText}`);
  await fullConfirm.tap();
  await cards.first().waitFor({ state: "visible" });

  const filteredCards = await cards.count();
  if (filteredCards !== 10) throw new Error(`Expected 10 sports cards, got: ${filteredCards}`);
  const nonSports = await page.locator(".bbm-card-title").evaluateAll((nodes) => nodes.map((node) => node.textContent ?? "").filter((text) => !/하야부사|파니갈레|CBR|YZF|닌자/.test(text)));
  if (nonSports.length) throw new Error(`Non-sports rows remained: ${nonSports.join(", ")}`);

  await cards.first().tap();
  const detail = page.locator('main[aria-label="바이크 상세"]');
  await detail.waitFor({ state: "visible" });
  const detailText = await detail.innerText();
  if (!detailText.includes("bike-030") || !detailText.includes("개인 판매자 라이더030 (가상)") || !detailText.includes("1,340cc")) {
    throw new Error(`Bike detail did not preserve the selected v04 row: ${detailText.slice(0, 1_000)}`);
  }
  const detailImage = detail.locator('img[src*="bike_listing_030_v01.webp"]');
  if ((await detailImage.count()) !== 1) throw new Error("Bike detail image did not match scenario bike-030.");

  console.log(JSON.stringify({ initial: 30, pageCards: initialCards, genre: "스포츠", filtered: filteredCards, sheetConfirmClicked: true, fullConfirmClicked: true, detailScenario: "bike-030" }));
} finally {
  await browser.close();
}
