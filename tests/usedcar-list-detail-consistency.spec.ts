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
  // 23개 카드 각각 상세 진입·새로고침·목록 복귀를 검증하므로 느린 CI에서도
  // 기능 실패와 실행 시간 초과를 구분할 수 있게 충분한 상한을 둔다.
  test.setTimeout(300_000);
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

      await page.reload({ waitUntil: "domcontentloaded" });
      await expectDetailMatches(page, expected);
      await page.goBack({ waitUntil: "domcontentloaded" });
      await expect(page.locator(".bbm-result-card.is-mobile")).toHaveCount(20);
      await expect(page).toHaveURL(new RegExp(`page=${pageNumber}`));
    }
  }

  await context.close();
});

test("desktop parity keeps live filter, header and detail metadata structure", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  await page.goto(`${basePath}&pc=1`, { waitUntil: "networkidle" });
  await expect(page.locator(".bbm-filter-item.is-maker-grade .bbm-filter-label-text")).toHaveText("제조사 · 모델");
  await expect(page.locator(".bbm-filter-collapse")).toHaveCount(0);
  await expect(page.locator(".bbm-filter-item.is-maker-grade .kr-brand-logo")).toHaveCount(0);
  await expect(page.locator(".bbm-gnb-more img")).toHaveCount(1);

  const nav = page.locator(".bbm-gnb");
  const firstNav = nav.getByRole("button").first();
  await expect(firstNav).toHaveCSS("font-size", "16px");
  await expect(firstNav).toHaveCSS("font-weight", "600");
  expect(Math.round((await nav.boundingBox())?.x ?? -1)).toBe(56);

  const card = page.locator(".bbm-result-card").first();
  const expected = await cardSnapshot(card);
  await card.click();
  await expect(page.locator(".pc-detail.is-usedcar-pc")).toBeVisible();
  await expect(page.locator(".pc-overview h1")).toHaveText(expected.title);
  expect(compact(await page.locator(".pc-price-row strong").textContent())).toContain(expected.price);
  const overviewSpecs = await page.locator(".pc-overview-specs > span").allTextContents();
  if (expected.registration) expect(overviewSpecs).toContain(expected.registration);
  if (expected.fuel) expect(overviewSpecs).toContain(expected.fuel);

  const infoLabels = await page.locator(".pc-info dt").allTextContents();
  expect(infoLabels).toEqual(expect.arrayContaining(["최초등록", "차종", "압류/저당", "수입구분"]));
  await expect(page.locator(".pc-info dd", { hasText: "미확인" })).toHaveCount(0);
  await expect(page.locator(".pc-photo-counter")).toHaveCount(0);
  await expect(page.getByText("가격 변동", { exact: true })).toHaveCount(0);
  await expect(page.locator(".pc-overview-like")).toHaveCount(1);
  await expect(page.locator(".pc-overview-stats")).toContainText("4주 전");
  await expect(page.locator(".bbm-header.is-detail .bbm-gnb .is-active")).toHaveCount(0);

  await context.close();
});
