import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 1000 } });

test("bike other-brand rail opens the searchable bike catalog and supports reopening", async ({ page }) => {
  await page.goto("/?pc=1&qf=guazi&category=바이크&qfbrandpill=chotot");
  await page.getByRole("button", { name: "스포츠", exact: true }).click();
  const otherBrands = page.getByRole("button", { name: "기타 브랜드", exact: true });
  await otherBrands.click();
  const picker = page.getByTestId("catalog-picker");
  await expect(picker.getByRole("button", { name: "혼다", exact: true })).toBeVisible();
  await expect(picker.getByRole("button", { name: "현대", exact: true })).toHaveCount(0);
  await picker.getByPlaceholder("제조사·모델·등급 검색").fill("혼다");
  const results = picker.getByTestId("catalog-search-results");
  await expect(results.getByRole("option").first()).toContainText("혼다");
  await page.keyboard.press("Escape");
  await expect(picker).toHaveCount(0);
  await otherBrands.click();
  await expect(picker.getByPlaceholder("제조사·모델·등급 검색")).toHaveValue("");
  await picker.getByRole("button", { name: "혼다", exact: true }).click();
  await expect(picker.locator("header")).toContainText("모델그룹");
  await picker.getByRole("button", { name: "이전 단계" }).click();
  await expect(picker.getByRole("button", { name: "혼다", exact: true })).toBeVisible();
});

for (const [category, maker] of [["바이크", "혼다"], ["수입차", "벤츠"]]) {
  test(`${category} standard manufacturer chip still opens its catalog`, async ({ page }) => {
    await page.goto(`/?pc=1&qf=guazi&category=${category}`);
    await page.locator(".filter-chip").filter({ hasText: /^제조사$/ }).first().click();
    await expect(page.getByTestId("catalog-picker").getByRole("button", { name: maker, exact: true })).toBeVisible();
  });
}

test("domestic manufacturer chip preserves the Hyundai demonstration", async ({ page }) => {
  await page.goto("/?pc=1&qf=guazi&category=국산차");
  await page.locator(".filter-chip").filter({ hasText: /^제조사$/ }).first().click();
  await expect(page.getByTestId("catalog-picker")).toHaveCount(0);
  await expect(page.getByRole("dialog").getByText("현대", { exact: true }).first()).toBeVisible();
});
