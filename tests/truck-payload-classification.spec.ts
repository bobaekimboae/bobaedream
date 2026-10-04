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
    await expect(activeChip(page, "경형")).toHaveAttribute("aria-pressed", "true");
    await expect(activeChip(page, "0.5톤")).toHaveAttribute("aria-pressed", "true");
    await expectOnlyListing(page, /한국GM 라보 .*경형/, /현대 포터2/);

    await page.goto(truckUrl("1톤 트럭", "1톤", mode.pc));
    await expect(activeChip(page, "소형")).toHaveAttribute("aria-pressed", "true");
    await expect(activeChip(page, "1톤")).toHaveAttribute("aria-pressed", "true");
    await expectOnlyListing(page, /현대 포터2 .*소형/, /한국GM 라보/);
  });
}

test("이전 경형 1톤 링크는 1톤 트럭으로 호환한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(truckUrl("경형 트럭 (1톤)", "1톤"));

  await expect(activeChip(page, "소형")).toHaveAttribute("aria-pressed", "true");
  await expectOnlyListing(page, /현대 포터2 .*소형/, /한국GM 라보/);
});

for (const mode of [
  { name: "mobile", viewport: { width: 390, height: 844 }, pc: false, width: 76, height: 84, media: [64, 40] },
  { name: "PC", viewport: { width: 1280, height: 900 }, pc: true, width: 96, height: 98, media: [80, 50] },
]) {
  test(`${mode.name}: 1뎁스 실사 카드와 2뎁스 텍스트 칩을 분리한다`, async ({ page }) => {
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
        mediaWidth: media.getBoundingClientRect().width,
        mediaHeight: media.getBoundingClientRect().height,
      };
    });

    expect(base.width).toBeCloseTo(mode.width, 0);
    expect(base.height).toBeCloseTo(mode.height, 0);
    expect(base.background).toBe("rgba(0, 0, 0, 0)");
    expect(base.radius).toBe("0px");
    expect(base.labelTop).toBeGreaterThan(base.mediaTop);
    expect(base.mediaWidth).toBeCloseTo(mode.media[0], 0);
    expect(base.mediaHeight).toBeCloseTo(mode.media[1], 0);

    await card.click();
    const secondDepth = page.getByRole("region", { name: "카고(화물)트럭 세부 형식 빠른 선택" });
    await expect(secondDepth).toBeVisible();
    const band = secondDepth.getByRole("button", { name: "준중형, 2.5~3.5톤", exact: true });
    const bandMetrics = await band.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { width: rect.width, height: rect.height, background: style.backgroundColor, radius: style.borderRadius };
    });
    expect(bandMetrics.width).toBeCloseTo(88, 0);
    expect(bandMetrics.height).toBeCloseTo(52, 0);
    expect(bandMetrics.background).toBe("rgb(243, 243, 245)");
    expect(bandMetrics.radius).toBe("12px");

    await band.click();
    const payloadRail = page.getByRole("region", { name: "준중형 적재용량 및 규격 빠른 선택" });
    await expect(payloadRail).toBeVisible();
    await expect(payloadRail.getByRole("button")).toHaveText(["2.5톤", "3톤", "3.5톤"]);
  });
}
