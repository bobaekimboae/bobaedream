import { expect, test, type Page } from "@playwright/test";

const usedCarPath = "/?qf=guazi&category=%EC%A4%91%EA%B3%A0%EC%B0%A8";

async function openGuazi(page: Page, suffix = "") {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`${usedCarPath}${suffix}`);
}

test("Guazi Mercedes depth flow keeps measured rails and finishes with the vehicle header", async ({ page }) => {
  await openGuazi(page);

  const makerRail = page.getByRole("region", { name: "제조사 빠른 선택" });
  await expect(makerRail).toHaveCSS("height", "96px");
  await makerRail.getByRole("button", { name: /벤츠.*16,793대/ }).click();

  const modelRail = page.getByRole("region", { name: "벤츠 모델 빠른 선택" });
  await expect(modelRail).toHaveCSS("height", "96px");
  await expect(modelRail.getByRole("button", { name: /SLR.*0대/ })).toBeDisabled();
  await modelRail.getByRole("button", { name: /A클래스.*588대/ }).click();

  const generationRail = page.getByRole("region", { name: "A-클래스 세대 빠른 선택" });
  await expect(generationRail).toHaveCSS("height", "112px");
  await expect(generationRail.getByRole("button", { name: /4세대.*19 ~ 현재.*43대/ })).toHaveCSS("height", "88px");
  await generationRail.getByRole("button", { name: /4세대.*19 ~ 현재.*43대/ }).click();

  const trimRail = page.getByRole("region", { name: "A클래스 4세대 트림 빠른 선택" });
  await expect(trimRail).toHaveCSS("height", "96px");
  await expect(trimRail.getByRole("button", { name: /A180.*0대/ })).toBeDisabled();
  await trimRail.getByRole("button", { name: /A200d.*6대/ }).click();
  await trimRail.getByRole("button", { name: /A220.*18대/ }).click();

  const selectedTrim = trimRail.getByRole("button", { name: /A220.*18대/ });
  await expect(selectedTrim).toHaveCSS("background-color", "rgb(238, 244, 255)");
  await expect(selectedTrim).toHaveCSS("border-color", "rgb(27, 76, 140)");
  await trimRail.getByRole("button", { name: "적용 2 / 24대" }).click();

  const header = page.getByRole("region", { name: "선택 차종 요약" });
  await expect(header).toHaveCSS("height", "96px");
  await expect(header).toContainText("벤츠 A클래스 4세대");
  await expect(header).toContainText("19 ~ 현재 · 24대");
  await expect(page.getByRole("button", { name: /색상/ })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/W177|W176|W169|W168/);

  const viewport = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(viewport).toEqual({ width: 393, scrollWidth: 393 });
});

test("Guazi BMW 3-series shows image cards and generation numbers without code names", async ({ page }) => {
  await openGuazi(page, "&maker=BMW");

  const modelRail = page.getByRole("region", { name: "BMW 모델 빠른 선택" });
  await expect(modelRail.getByRole("button", { name: /3시리즈.*785대/ }).locator("img")).toBeVisible();
  await modelRail.getByRole("button", { name: /3시리즈.*785대/ }).click();

  const generationRail = page.getByRole("region", { name: "3시리즈 세대 빠른 선택" });
  await expect(generationRail).toContainText("7세대");
  await expect(generationRail).toContainText("6세대");
  await expect(generationRail).toContainText("5세대");
  await expect(page.locator("body")).not.toContainText(/G20|F30|E90/);
});

test("Guazi C-class generation selection exposes matching test inventory", async ({ page }) => {
  await openGuazi(page, "&maker=%EB%B2%A4%EC%B8%A0");

  await page.getByRole("region", { name: "벤츠 모델 빠른 선택" }).getByRole("button", { name: /C클래스.*1,285대/ }).click();
  await page.getByRole("region", { name: "C-클래스 세대 빠른 선택" }).getByRole("button", { name: /6세대.*21 ~ 현재.*50대/ }).click();

  await expect(page.getByRole("link", { name: /벤츠 C클래스 C 200 상세 보기/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /벤츠 C클래스 C 300 4MATIC 상세 보기/ })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/W206|W205|W204/);
});

for (const style of ["chotot", "dongchedi"] as const) {
  test(`${style} mode does not receive Guazi card classes`, async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    const styleParam = style === "chotot" ? "" : `qf=${style}&`;
    await page.goto(`/?${styleParam}category=%EC%A4%91%EA%B3%A0%EC%B0%A8&maker=BMW`);

    await expect(page.getByRole("region", { name: "BMW 모델 빠른 선택" })).not.toHaveClass(/is-guazi-card-mode/);
    await expect(page.locator(".guazi-model-card")).toHaveCount(0);
  });
}
