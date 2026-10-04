import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const categories = [
  ["전체차량", ["전체차량", "가격", "상태", "판매자"]],
  ["중고차", ["중고차", "가격", "연식", "제조사", "연료", "변속기", "상태", "판매자"]],
  ["트럭·특장", ["트럭·특장", "가격", "연식", "트럭 유형", "톤수", "연료", "판매자"]],
  ["바이크", ["바이크", "가격", "연식", "제조사", "배기량", "판매자"]],
  ["캠핑카", ["캠핑카", "가격", "연식", "제조사", "연료", "변속기", "상태", "판매자"]],
  ["건설기계", ["건설기계", "가격", "연식", "장비 유형", "제조사", "가동시간", "판매자"]],
  ["자재운반장비", ["자재운반장비", "가격", "연식", "장비 유형", "제조사", "가동시간", "판매자"]],
  ["부품·용품", ["부품·용품", "가격", "부품 유형", "브랜드", "상태", "판매자"]],
] as const;

async function openListing(page: Page, category: string, mobile = false) {
  await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1100 });
  const params = new URLSearchParams({ qf: "guazi", category });
  if (!mobile) params.set("pc", "1");
  await page.goto(`/?${params}`);
  await expect(page.locator(".bbm-result-card").first()).toBeVisible();
}

async function chipLabels(page: Page, mobile = false) {
  const selector = mobile ? ".filter-shell.is-bbm .filter-chip" : ".bbm-ct-chip-row .filter-chip";
  return page.locator(selector).allTextContents().then((items) => items.map((item) => item.trim()));
}

async function assertNoDuplicateCards(page: Page) {
  const ids = await page.locator(".bbm-result-card").evaluateAll((cards) => cards.map((card) => card.getAttribute("data-listing-id")));
  expect(new Set(ids).size).toBe(ids.length);
}

test.beforeAll(async () => {
  await mkdir("artifacts/category-audit", { recursive: true });
});

test("7개 카테고리와 전체차량의 URL·칩·지역·목록이 일치한다", async ({ page }) => {
  for (const [category, expectedChips] of categories) {
    await openListing(page, category);
    await expect(page).toHaveURL(new RegExp(`category=${encodeURIComponent(category)}`));
    expect(await chipLabels(page)).toEqual(expectedChips);
    const regions = await page.locator(".bbm-ct-region-row .stable-pill").allTextContents();
    expect(regions.map((label) => label.trim())).toEqual(["서울", "경기", "인천", "부산", "대구", "내 주변"]);
    await expect(page.locator("body")).not.toContainText(/\(가상\)|가상 매물 전시장|UI 검증용 가상 매물|가상시 테스트구|해당 없음/);
    await assertNoDuplicateCards(page);
  }
});

test("카테고리 안 검색과 관련순·업데이트순 전환", async ({ page }) => {
  const cases = [
    ["전체차량", "그랜저"], ["전체차량", "포터"], ["전체차량", "혼다"], ["전체차량", "굴착기"],
    ["트럭·특장", "포터"], ["바이크", "혼다"],
  ] as const;
  for (const [category, query] of cases) {
    await openListing(page, category, true);
    const search = page.getByLabel(`${category} 검색`);
    await expect(search).toHaveAttribute("placeholder", `${category} 검색`);
    await search.fill(query);
    await search.press("Enter");
    await expect(page).toHaveURL(new RegExp(`category=${encodeURIComponent(category)}`));
    await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(query)}`));
    await expect(page.locator(".bbm-result-card").first()).toBeVisible();
    await expect(page.locator(".bbm-m-sort").first()).toContainText("관련순");
    await assertNoDuplicateCards(page);
    await search.fill("");
    await expect(page.locator(".bbm-m-sort").first()).toContainText("업데이트순");
  }
});

test("카테고리 해제와 지역 빠른 칩 — PC·모바일 캡처", async ({ page }) => {
  await openListing(page, "중고차");
  await page.getByRole("button", { name: "중고차 필터 해제" }).click();
  await expect(page).toHaveURL(/category=%EC%A0%84%EC%B2%B4%EC%B0%A8%EB%9F%89/);
  await page.locator(".bbm-ct-region-row .stable-pill").filter({ hasText: /^서울$/ }).click();
  await expect(page.locator(".bbm-ct-region-row")).toContainText("서울 전체");
  await page.screenshot({ path: "artifacts/category-audit/pc-category-clear-region.png", fullPage: true });

  await openListing(page, "바이크", true);
  expect(await chipLabels(page, true)).toEqual(["바이크", "가격", "연식", "제조사", "배기량", "판매자"]);
  await expect(page.locator(".bbm-ct-region-row")).toContainText("서울");
  await page.screenshot({ path: "artifacts/category-audit/mobile-bike-filter-region.png", fullPage: true });
});
