import { expect, test, type Locator, type Page } from "@playwright/test";

const basePath = "/?qf=guazi";

const compact = (value: string | null) => (value ?? "").replace(/\s+/g, "").trim();

async function cardSnapshot(card: Locator) {
  const ariaLabel = await card.getAttribute("aria-label");
  const image = card.locator(".bbm-card-photo > img");
  const specParts = (await card.locator(".bbm-card-spec").innerText()).split(" · ");
  const registrationMatch = specParts[0]?.match(/(\d{2}|\d{4})년\s*(\d{1,2})월/);
  const registration = registrationMatch ? (() => {
    const shortYear = Number(registrationMatch[1]);
    const year = registrationMatch[1].length === 4 ? shortYear : shortYear >= 70 ? 1900 + shortYear : 2000 + shortYear;
    return `${year}년 ${Number(registrationMatch[2])}월`;
  })() : null;
  const fuel = specParts.find((spec) => /가솔린|디젤|LPG|전기|하이브리드|CNG|수소/.test(spec)) ?? null;
  return {
    title: (ariaLabel ?? "").replace(/ 상세 보기$/, ""),
    price: compact(await card.locator(".bbm-card-price").textContent()),
    image: await image.count() ? await image.getAttribute("src") : null,
    seller: await card.locator(".bbm-card-seller-text strong").innerText(),
    registration,
    fuel,
  };
}

async function expectDetailMatches(page: Page, expected: Awaited<ReturnType<typeof cardSnapshot>>) {
  await expect(page.locator(".vehicle-title-row h1")).toHaveText(expected.title);
  expect(compact(await page.locator(".detail-price-row").textContent())).toContain(expected.price);
  const detailImage = page.locator(".detail-media-track > img").first();
  expect(await detailImage.getAttribute("src")).toBe(expected.image);
  const seller = await page.locator(".seller-profile h2").first().evaluate((element) => element.childNodes[0]?.textContent?.trim() ?? "");
  expect(seller).toBe(expected.seller);
  const summarySpecs = await page.locator(".vehicle-spec-row > span").allTextContents();
  if (expected.registration) expect(summarySpecs).toContain(expected.registration);
  else expect(summarySpecs.some((spec) => /\d{4}년\s*\d{1,2}월/.test(spec))).toBe(false);
  if (expected.fuel) expect(summarySpecs).toContain(expected.fuel);
}

test("mobile list cards keep title, price, image, seller, registration and fuel through detail reload", async ({ browser }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({ viewport: { width: 384, height: 900 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await context.newPage();

  for (const [pageNumber, cardCount] of [[1, 20], [2, 3]] as const) {
    const listUrl = `${basePath}&page=${pageNumber}`;
    await page.goto(listUrl, { waitUntil: "networkidle" });
    const cards = page.locator(".bbm-result-card.is-mobile");
    await expect(cards).toHaveCount(20);

    for (let index = 0; index < cardCount; index += 1) {
      const card = cards.nth(index);
      const expected = await cardSnapshot(card);
      await card.tap();
      await expect(page).toHaveURL(/detail=\d+/);
      await expectDetailMatches(page, expected);

      const listingId = new URL(page.url()).searchParams.get("detail");
      expect(listingId).not.toBeNull();
      const stored = await page.evaluate((id) => window.sessionStorage.getItem(`bbm-detail-${id}`), listingId);
      expect(stored).not.toBeNull();

      await page.reload({ waitUntil: "networkidle" });
      await expectDetailMatches(page, expected);
      await page.goBack({ waitUntil: "networkidle" });
      await expect(page.locator(".bbm-result-card.is-mobile")).toHaveCount(20);
      await expect(page).toHaveURL(new RegExp(`page=${pageNumber}`));
    }
  }

  await context.close();
});
