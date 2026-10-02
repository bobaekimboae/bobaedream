#!/usr/bin/env node
import { chromium } from "@playwright/test";

const baseUrl = process.env.BIKE_V07_URL ?? "http://127.0.0.1:5173/";
const url = `${baseUrl}?qf=guazi&category=${encodeURIComponent("바이크")}`;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
const runtimeErrors = [];
page.on("pageerror", (error) => runtimeErrors.push(error.message));

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  const cards = page.locator(".bbm-result-card");
  await cards.first().waitFor({ state: "visible", timeout: 30_000 });
  const initialCards = await cards.count();
  if (initialCards !== 20) throw new Error(`Expected 20 cards on page 1, got: ${initialCards}`);

  const images = page.locator(".bbm-card-photo > img");
  const imageCount = await images.count();
  if (imageCount !== 20) throw new Error(`Expected 20 listing images, got: ${imageCount}`);
  const brokenImages = await images.evaluateAll((nodes) => nodes.filter((node) => !(node instanceof HTMLImageElement) || !node.complete || node.naturalWidth === 0).length);
  if (brokenImages) throw new Error(`Broken bike listing images: ${brokenImages}`);

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

  await cards.first().tap();
  const detail = page.locator('main[aria-label="바이크 상세"]');
  await detail.waitFor({ state: "visible" });
  const detailText = await detail.innerText();
  if (!detailText.includes("bike-030") || !detailText.includes("개인 판매자 하야부사라이더30 (가상)") || !detailText.includes("1,340cc")) {
    throw new Error(`Bike detail did not preserve bike-030: ${detailText.slice(0, 1_000)}`);
  }
  const detailImage = detail.locator('img[src*="bike_listing_030_v01.webp"]');
  if ((await detailImage.count()) !== 1) throw new Error("Bike detail image did not match scenario bike-030.");
  if (runtimeErrors.length) throw new Error(`Runtime errors: ${runtimeErrors.join(" | ")}`);

  console.log(JSON.stringify({ scenario: "v07", initial: 30, pageCards: initialCards, visibleImages: imageCount, brokenImages, genre: "스포츠", filtered: filteredCards, detailScenario: "bike-030" }));
} finally {
  await browser.close();
}
