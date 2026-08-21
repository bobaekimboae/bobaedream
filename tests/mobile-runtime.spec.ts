import { expect, test, type Locator, type Page } from "@playwright/test";

async function drag(page: Page, locator: Locator, deltaX: number, deltaY: number, steps = 8) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("Drag target has no bounding box");
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let step = 1; step <= steps; step += 1) {
    await page.mouse.move(
      startX + (deltaX * step) / steps,
      startY + (deltaY * step) / steps,
    );
    await page.waitForTimeout(8);
  }
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/runtime-fixture.html");
});

test("horizontal intent stays in Carousel and cannot create parent momentum", async ({ page }) => {
  const carousel = page.locator(".fixture-carousel");
  const card = page.locator(".carousel-card").nth(1);
  const parent = page.getByTestId("mobile-scroll");

  await expect(carousel).not.toHaveAttribute("data-scroll-drag", "ignore");
  await drag(page, card, -130, 14, 5);

  const afterRelease = await carousel.evaluate((element) => element.scrollLeft);
  expect(afterRelease).toBeGreaterThan(40);
  expect(await parent.evaluate((element) => element.scrollTop)).toBe(0);

  await page.waitForTimeout(250);
  expect(await parent.evaluate((element) => element.scrollTop)).toBe(0);
  expect(await page.getByTestId("tap-count").textContent()).toBe("0");
});

test("vertical intent over a carousel is handed to MobileScroll in both directions", async ({ page }) => {
  const card = page.locator(".carousel-card").nth(1);
  const carousel = page.locator(".fixture-carousel");
  const parent = page.getByTestId("mobile-scroll");

  await drag(page, card, 4, -150);
  expect(await parent.evaluate((element) => element.scrollTop)).toBeGreaterThan(60);
  expect(await carousel.evaluate((element) => element.scrollLeft)).toBe(0);

  await parent.evaluate((element) => {
    element.scrollTop = 80;
  });
  await drag(page, card, -3, 110);
  expect(await parent.evaluate((element) => element.scrollTop)).toBeLessThan(80);
});

test("tap activates a card but a completed drag does not", async ({ page }) => {
  const firstCard = page.locator(".carousel-card").first();
  await firstCard.click();
  await expect(page.getByTestId("tap-count")).toHaveText("1");

  await drag(page, firstCard, -100, 6);
  await expect(page.getByTestId("tap-count")).toHaveText("1");
});

test("Carousel preserves momentum and edge rubber-banding", async ({ page }) => {
  const carousel = page.locator(".fixture-carousel");
  const card = page.locator(".carousel-card").nth(1);

  await drag(page, card, -100, 5, 3);
  const releasedOffset = await carousel.evaluate((element) => element.scrollLeft);
  await page.waitForTimeout(120);
  expect(await carousel.evaluate((element) => element.scrollLeft)).toBeGreaterThan(releasedOffset);

  await carousel.evaluate((element) => {
    element.scrollLeft = 0;
  });
  const box = await card.boundingBox();
  if (!box) throw new Error("Card has no bounding box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2, { steps: 4 });
  expect(Number(await carousel.getAttribute("data-overscroll"))).toBeGreaterThan(0);
  await page.mouse.up();
  await page.waitForTimeout(900);
  expect(Math.abs(Number(await carousel.getAttribute("data-overscroll")))).toBeLessThan(1);
});

test("BottomSheet remains mounted while its default exit animation plays", async ({ page }) => {
  await page.locator(".sheet-trigger").click();
  await expect(page.getByTestId("bottom-sheet")).toBeVisible();

  await page.getByTestId("sheet-overlay").click({ position: { x: 8, y: 8 } });
  await expect(page.getByTestId("bottom-sheet")).toHaveCount(1);
  await page.waitForTimeout(500);
  await expect(page.getByTestId("bottom-sheet")).toHaveCount(0);
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`mobile web fills the ${viewport.width}x${viewport.height} browser viewport without device chrome`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const frame = page.getByTestId("phone-frame");
    const screen = page.getByTestId("device-screen");
    await expect(frame).toHaveAttribute("data-runtime", "mobile-web");

    const [frameBox, screenBox] = await Promise.all([frame.boundingBox(), screen.boundingBox()]);
    expect(frameBox).not.toBeNull();
    expect(screenBox).not.toBeNull();
    expect(frameBox!.x).toBeCloseTo(0, 0);
    expect(frameBox!.y).toBeCloseTo(0, 0);
    expect(frameBox!.width).toBeCloseTo(viewport.width, 0);
    expect(frameBox!.height).toBeCloseTo(viewport.height, 0);
    expect(screenBox).toEqual(frameBox);

    await expect(page.locator(".phone-bezel")).toHaveCount(0);
    await expect(page.getByTestId("device-picker")).toHaveCount(0);
    await expect(page.getByTestId("status-time")).toHaveCount(0);
    await expect(page.getByTestId("home-indicator")).toHaveCount(0);
    await expect(page.getByTestId("keyboard-dock")).toHaveCount(0);

    const overflow = await screen.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });
}

test("wide screens center a bezel-free 430px mobile web column", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto("/");

  const frameBox = await page.getByTestId("phone-frame").boundingBox();
  expect(frameBox).not.toBeNull();
  expect(frameBox!.width).toBeCloseTo(430, 0);
  expect(frameBox!.x).toBeCloseTo((1100 - 430) / 2, 0);
  expect(frameBox!.height).toBeCloseTo(900, 0);
});

test("native text entry does not reserve or render a simulated keyboard", async ({ page }) => {
  await page.goto("/tests/runtime-fixture.html?fixture=keyboard");
  const input = page.getByLabel("Message");
  await input.click();

  await expect(input).toBeFocused();
  await expect(page.getByTestId("keyboard-dock")).toHaveCount(0);
  await expect(page.getByTestId("mobile-app-viewport")).toHaveAttribute("data-keyboard-visible", "false");

  const layout = await page.evaluate(() => {
    const screen = document.querySelector<HTMLElement>('[data-testid="device-screen"]')!;
    const viewport = document.querySelector<HTMLElement>('[data-testid="mobile-app-viewport"]')!;
    return {
      screenBottom: screen.getBoundingClientRect().bottom,
      viewportBottom: viewport.getBoundingClientRect().bottom,
    };
  });
  expect(layout.viewportBottom).toBeCloseTo(layout.screenBottom, 0);
});

test("FlowStack pushes and pops screens without a device status-bar offset", async ({ page }) => {
  await page.goto("/tests/runtime-fixture.html?fixture=flow");
  const input = page.getByLabel("Flow message");
  await input.click();

  await page.getByRole("button", { name: "Push level 2" }).click();
  await expect(page.getByRole("heading", { name: "Screen stacking works" })).toBeVisible();
  await expect(input).not.toBeFocused();

  const headerPlacement = await page.evaluate(() => {
    const screen = document.querySelector<HTMLElement>('[data-testid="device-screen"]')!;
    const toolbar = document.querySelector<HTMLElement>(".flow-fixture-header")!;
    return toolbar.getBoundingClientRect().top - screen.getBoundingClientRect().top;
  });
  expect(Math.abs(headerPlacement)).toBeLessThanOrEqual(1);

  await page.getByRole("button", { name: "Push level 3" }).click();
  await expect(page.getByRole("heading", { name: "Nested view level 3" })).toBeVisible();
  await page.getByRole("button", { name: "Push level 4" }).click();
  await expect(page.getByRole("heading", { name: "Nested view level 4" })).toBeVisible();

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("heading", { name: "Nested view level 3" })).toBeVisible();
  await page.getByRole("button", { name: "‹ Back" }).click();
  await expect(page.getByRole("heading", { name: "Screen stacking works" })).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("heading", { name: "Flow root" })).toBeVisible();
});
