import { expect, test } from "@playwright/test";

test("main search and luxury brand choices arrive in the listing state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByLabel("중고차 검색").fill("그랜저");
  await page.getByLabel("중고차 검색").press("Enter");
  await expect(page).toHaveURL(/qf=guazi/);
  await expect(page).toHaveURL(/q=%EA%B7%B8%EB%9E%9C%EC%A0%80/);
  await expect(page.locator(".search-field input")).toHaveValue("그랜저");

  await page.goto("/");
  await page.getByRole("button", { name: "포르쉐" }).click();
  await expect(page).toHaveURL(/maker=%ED%8F%AC%EB%A5%B4%EC%89%90/);
  await expect(page.locator(".filter-fixed")).toHaveAttribute("aria-label", /적용됨/);
});

test("a zero-result keyword does not erase the selected vehicle depth", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?qf=guazi&filtericon=notion&maker=%ED%98%84%EB%8C%80&q=%EC%A1%B4%EC%9E%AC%ED%95%98%EC%A7%80%EC%95%8A%EB%8A%94%EC%B0%A8%EB%9F%89");

  await expect(page.locator(".depth-rail")).toBeVisible();
  const clearEmptySearch = page.locator(".empty-state").getByRole("button", { name: "검색어 지우기" });
  await expect(clearEmptySearch).toBeVisible();
  await clearEmptySearch.click();
  await expect(page).toHaveURL(/maker=%ED%98%84%EB%8C%80/);
  await expect(page).not.toHaveURL(/[?&]q=/);
  await expect(page.locator(".filter-chip.is-active").filter({ hasText: "현대" }).first()).toBeVisible();
});

test("mobile full-filter cancels drafts, applies explicitly, and closes on browser back", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?qf=guazi&filtericon=notion");
  const trigger = page.locator(".filter-fixed");

  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "필터" });
  const availability = dialog.getByRole("switch", { name: "거래 가능만 보기" });
  await expect(dialog.getByRole("button", { name: "닫기" })).toBeFocused();
  await availability.click();
  await expect(availability).toHaveAttribute("aria-checked", "true");
  await dialog.getByRole("button", { name: "닫기" }).click();
  await expect(dialog).toHaveCount(0);

  await trigger.click();
  await expect(dialog.getByRole("switch", { name: "거래 가능만 보기" })).toHaveAttribute("aria-checked", "false");
  await dialog.getByRole("switch", { name: "거래 가능만 보기" }).click();
  await dialog.getByRole("button", { name: /대 보기$/ }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toHaveAttribute("aria-label", "필터 1개 적용됨");

  await trigger.click();
  await expect(dialog.getByRole("switch", { name: "거래 가능만 보기" })).toHaveAttribute("aria-checked", "true");
  await page.goBack();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("desktop filter modal owns focus and returns it to its trigger", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?qf=guazi&filtericon=notion&pc=1");
  const trigger = page.locator(".filter-chip").filter({ hasText: "제조사" }).first();
  await trigger.click();

  const dialog = page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: /제조사/ }) }).first();
  await expect(dialog.getByRole("button", { name: "닫기" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("compact PC keeps applied vehicle chips stable across breakpoints", async ({ page }) => {
  test.setTimeout(120_000);
  const url = "/?qf=guazi&pc=1&filterLayout=compact&category=%EB%B0%94%EC%9D%B4%ED%81%AC&maker=BMW&model=S+1000+RR";
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: "commit", timeout: 15_000 });
  await expect(page.locator(".bbm-content-head.is-chotot")).toBeVisible({ timeout: 60_000 });

  for (const width of [1280, 1024, 820]) {
    await page.setViewportSize({ width, height: 900 });

    const top = page.locator(".bbm-content-head.is-chotot");
    await expect(top.locator(".bbm-filter-button")).toHaveAttribute("aria-label", /2개 적용됨/);
    await expect(top.locator(".filter-chip.is-active").filter({ hasText: "바이크" })).toBeVisible();
    await expect(top.locator(".filter-chip.is-active").filter({ hasText: "BMW" })).toBeVisible();
    await expect(top.locator(".filter-chip.is-active").filter({ hasText: "S 1000 RR" })).toBeVisible();
    await expect.poll(() => top.locator(".filter-chip:not(.is-active)").evaluateAll((chips) => chips.filter((chip) => getComputedStyle(chip).display !== "none").length)).toBe(0);

    const activeHeights = await top.locator(".filter-chip.is-active").evaluateAll((chips) => chips.map((chip) => chip.getBoundingClientRect().height));
    expect(activeHeights.every((height) => height === 32)).toBe(true);
    const clearSizes = await top.locator(".filter-chip-clear").evaluateAll((buttons) => buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return [rect.width, rect.height];
    }));
    expect(clearSizes.every(([chipWidth, chipHeight]) => chipWidth >= 24 && chipHeight >= 24)).toBe(true);

    if (width < 1280) await expect(page.locator(".bbm-page > .bbm-filter")).toBeHidden();
  }
});
