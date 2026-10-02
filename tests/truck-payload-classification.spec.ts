import { expect, test, type Page } from "@playwright/test";

const category = "트럭 · 특장";
const format = "카고(화물)트럭";

const truckUrl = (subtype: string, spec: string, pc = false) => {
  const params = new URLSearchParams({
    qf: "guazi",
    category,
    truckFormat: format,
    truckSubtype: subtype,
    truckSpec: spec,
  });
  if (pc) params.set("pc", "1");
  return `/?${params.toString()}`;
};

async function expectOnlyListing(page: Page, expected: RegExp, excluded: RegExp) {
  await expect(page.getByRole("link", { name: expected })).toHaveCount(1);
  await expect(page.getByRole("link", { name: excluded })).toHaveCount(0);
}

const activeChip = (page: Page, name: string) => page
  .getByRole("region", { name: /^(검색 조건|중고차 필터)$/ })
  .getByRole("button", { name, exact: true });

const truckFormatCard = (page: Page) => page
  .getByRole("region", { name: "트럭 형식 빠른 선택" })
  .getByRole("button", { name: format, exact: true });

for (const mode of [
  { name: "mobile", viewport: { width: 390, height: 844 }, pc: false },
  { name: "PC", viewport: { width: 1280, height: 900 }, pc: true },
]) {
  test(`${mode.name}: 경형 라보급과 1톤 포터급을 분리한다`, async ({ page }) => {
    await page.setViewportSize(mode.viewport);

    await page.goto(truckUrl("경형 트럭 (1톤 미만)", "0.5톤", mode.pc));
    await expect(activeChip(page, "경형 트럭 (1톤 미만)")).toHaveAttribute("aria-pressed", "true");
    await expect(activeChip(page, "0.5톤")).toHaveAttribute("aria-pressed", "true");
    if (mode.pc) await expect(page.getByLabel("경형 트럭 (1톤 미만) 적재중량")).toBeVisible();
    await expectOnlyListing(page, /한국GM 라보 .*경형 트럭/, /현대 포터2/);

    await page.goto(truckUrl("1톤 트럭", "1톤", mode.pc));
    await expect(activeChip(page, "1톤 트럭")).toHaveAttribute("aria-pressed", "true");
    await expect(activeChip(page, "1톤")).toHaveAttribute("aria-pressed", "true");
    if (mode.pc) await expect(page.getByLabel("1톤 트럭 적재중량")).toBeVisible();
    await expectOnlyListing(page, /현대 포터2 .*1톤 트럭/, /한국GM 라보/);
  });
}

test("이전 경형 1톤 링크는 1톤 트럭으로 호환한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(truckUrl("경형 트럭 (1톤)", "1톤"));

  await expect(activeChip(page, "1톤 트럭")).toHaveAttribute("aria-pressed", "true");
  await expectOnlyListing(page, /현대 포터2 .*1톤 트럭/, /한국GM 라보/);
});

for (const mode of [
  { name: "mobile", viewport: { width: 390, height: 844 }, pc: false, width: 88, height: 96 },
  { name: "PC", viewport: { width: 1280, height: 900 }, pc: true, width: 112, height: 108 },
]) {
  test(`${mode.name}: FINN형 카드와 Airbnb형 선택 상태를 유지한다`, async ({ page }) => {
    await page.setViewportSize(mode.viewport);
    const params = new URLSearchParams({ qf: "guazi", category });
    if (mode.pc) params.set("pc", "1");
    await page.goto(`/?${params.toString()}`);

    const card = truckFormatCard(page);
    await expect(card).toBeVisible();
    const base = await card.evaluate((element) => {
      const cardElement = element as HTMLElement;
      const label = cardElement.querySelector<HTMLElement>(".depth-card-label")!;
      const media = cardElement.querySelector<HTMLElement>(".depth-card-media")!;
      const rect = cardElement.getBoundingClientRect();
      const baseStyle = getComputedStyle(cardElement);
      return {
        width: rect.width,
        height: rect.height,
        background: baseStyle.backgroundColor,
        radius: baseStyle.borderRadius,
        labelTop: label.getBoundingClientRect().top,
        mediaTop: media.getBoundingClientRect().top,
      };
    });

    await card.evaluate((element) => element.classList.add("is-selected"));
    await page.waitForTimeout(180);
    const selected = await card.evaluate((element) => {
      const selectedStyle = getComputedStyle(element);
      return {
        background: selectedStyle.backgroundColor,
        color: selectedStyle.color,
        shadow: selectedStyle.boxShadow,
      };
    });

    expect(base.width).toBeCloseTo(mode.width, 0);
    expect(base.height).toBeCloseTo(mode.height, 0);
    expect(base.background).toBe("rgb(241, 241, 243)");
    expect(base.radius).toBe("18px");
    expect(base.labelTop).toBeGreaterThan(base.mediaTop);
    expect(selected.background).toBe("rgb(255, 255, 255)");
    expect(selected.color).toBe("rgb(34, 34, 34)");
    expect(selected.shadow).toContain("rgb(34, 34, 34)");
  });
}
