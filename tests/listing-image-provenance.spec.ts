import { test, expect } from "@playwright/test";

const dealer = "/?profile=dealer&shop=450554&emp=1&tab=ads";

test("site images do not count as listing photos; all existing sheet photo sets are preserved", async ({ page }) => {
  await page.goto(dealer);
  const result = await page.evaluate(async () => {
    const dataPath = "/src/prototype/data/index.tsx";
    const rowsPath = "/src/prototype/data/seoul-autogallery-v01.ts";
    const { seoulAutoGalleryCars } = await import(dataPath);
    const { seoulAutoGalleryRows } = await import(rowsPath);
    const site = seoulAutoGalleryCars.filter((car: { id: number }) => car.id >= 14000);
    const sheet = seoulAutoGalleryRows.map((row: { number: number; photoSet?: { dir: string; prefix: string; count: number } }) => {
      const car = seoulAutoGalleryCars.find((item: { id: number }) => item.id === 13000 + row.number);
      const expected = row.number === 1
        ? Array.from({ length: 20 }, (_, i) => `cars/seoul-autogallery-v01/m3-original/m3-${i + 1}.webp`)
        : row.photoSet
          ? Array.from({ length: row.photoSet.count }, (_, i) => `cars/seoul-autogallery-v01/${row.photoSet!.dir}/${row.photoSet!.prefix}-${String(i + 1).padStart(2, "0")}.jpg`)
          : [1, 2, 3, 4, 5].map(n => `cars/seoul-autogallery-v01/sag-${String(row.number).padStart(2, "0")}-${n}.webp`);
      return { id: car.id, actual: car.photoList, expected, count: car.photos, image: car.image, kind: car.imageKind ?? null };
    });
    return {
      site: site.map((car: { imageKind?: string; photoList?: string[]; photos: number }) => ({ kind: car.imageKind, count: car.photos, photos: car.photoList })),
      sheet,
    };
  });
  expect(result.site).toHaveLength(81);
  expect(result.site.filter((car: { kind?: string }) => car.kind === "catalog")).toHaveLength(66);
  expect(result.site.filter((car: { kind?: string }) => car.kind === "reference")).toHaveLength(15);
  for (const car of result.site) { expect(car.count).toBe(0); expect(car.photos).toEqual([]); }
  expect(result.sheet.length).toBeGreaterThan(0);
  for (const car of result.sheet) {
    expect(car.actual, `photo order for ${car.id}`).toEqual(car.expected);
    expect(car.count).toBe(car.expected.length);
    expect(car.image).toBe(car.expected[0]);
    expect(car.kind).toBeNull();
  }
});

for (const pc of [false, true]) {
  const mode = pc ? "PC" : "mobile";
  test.describe(mode, () => {
    test.use({ viewport: { width: pc ? 1440 : 390, height: 1000 } });
    const pcParam = pc ? "&pc=1" : "";
    for (const [emp, label] of [["1", "차종 대표 이미지"], ["3", "실차 참고 이미지"]]) {
      for (const view of ["list", "feed"]) {
        test(`${label}: dealer ${view} labels image and omits photo count and carousel`, async ({ page }) => {
          await page.goto(`/?profile=dealer&shop=450560&emp=${emp}&tab=ads&view=${view}${pcParam}`);
          const card = page.locator(".dp-listings-shell .bbm-result-card").filter({ has: page.locator(".vehicle-image-label", { hasText: label }) }).first();
          await expect(card).toBeVisible();
          await expect(card.locator(".vehicle-image-label")).toHaveText(label);
          await expect(card.locator(".bbm-card-count, .bbm-feed-carousel, .bbm-feed-count")).toHaveCount(0);
          await expect(card.locator(".bbm-card-photo")).not.toHaveClass(/is-carousel/);
          await expect(card.locator(".bbm-card-photo > img").first()).toHaveAttribute("alt", /실매물 사진 아님/);
          const inside = await card.locator(".vehicle-image-label").evaluate(el => {
            const label = el.getBoundingClientRect(), photo = el.parentElement!.getBoundingClientRect();
            return label.left >= photo.left && label.right <= photo.right && label.top >= photo.top && label.bottom <= photo.bottom;
          });
          expect(inside).toBe(true);
        });
      }
    }

    test("existing real listing keeps its list count and feed gallery", async ({ page }) => {
      await page.goto(`${dealer}&view=list${pcParam}`);
      const first = page.locator(".dp-listings-shell .bbm-result-card").first();
      await expect(first.locator(".bbm-card-count")).toHaveText("17");
      await expect(first.locator(".vehicle-image-label")).toHaveCount(0);
      await page.goto(`${dealer}&view=feed${pcParam}`);
      await expect(first.locator(".bbm-card-photo")).toHaveClass(/is-carousel/);
      await expect(first.locator(".bbm-feed-count")).toHaveAttribute("aria-label", "사진 17장 중 1번째");
    });

    for (const [id, label, disclosure] of [[14000, "차종 대표 이미지", "실제 판매 차량의 사진이 아닙니다"], [14025, "실차 참고 이미지", "동일한 차량인지 확인되지 않은"]] as const) {
      test(`${label}: detail shows disclosure and zero actual photos`, async ({ page }) => {
        await page.goto(`${dealer}&listing=${id}&thumbs=on${pcParam}`);
        const figure = page.locator(".detail-reference-media");
        await expect(figure.locator("strong")).toHaveText(label);
        await expect(figure).toContainText(disclosure);
        await expect(figure).toContainText("실매물 사진 0장");
        await expect(page.locator(".detail-photo-count, .pc-photo-counter, .detail-thumbs, .pc-thumbnails, .detail-media-carousel, .pc-photo-next")).toHaveCount(0);
        await expect(figure.locator("img")).toHaveAttribute("alt", /실매물 사진 아님/);
        // The caption must be inside the visible hero, not clipped by its old fixed height.
        expect(await figure.evaluate(el => {
          const hero = el.closest(".detail-hero, .pc-gallery")!.getBoundingClientRect();
          return el.querySelector("figcaption")!.getBoundingClientRect().bottom <= hero.bottom + 1;
        })).toBe(true);
      });
    }

    test("missing site image shows empty state without unrelated demo photos", async ({ page }) => {
      await page.route("**/src/prototype/data/seoul-autogallery-site-v01.ts*", async route => {
        const response = await route.fetch();
        await route.fulfill({ response, body: (await response.text()).replace("models/kr/22/1322.png", "") });
      });
      await page.goto(`${dealer}&listing=14000&thumbs=on${pcParam}`);
      await expect(page.locator(".detail-reference-media")).toContainText("차량 사진 없음");
      await expect(page.locator(".detail-reference-media")).toContainText("실매물 사진 0장");
      await expect(page.locator(".detail-reference-media img, .detail-photo-count, .pc-photo-counter, .detail-thumbs, .pc-thumbnails")).toHaveCount(0);
    });

    for (const [id, count] of [[13001, 20], [13024, 17]]) {
      test(`real listing ${id} preserves ${count} photos and thumbnail navigation`, async ({ page }) => {
        await page.goto(`${dealer}&listing=${id}&thumbs=on${pcParam}`);
        const thumbs = page.locator(pc ? ".pc-thumbnails button" : ".detail-thumbs button");
        const counter = page.locator(pc ? ".pc-photo-counter" : ".detail-photo-count");
        await expect(thumbs).toHaveCount(count);
        await expect(counter).toHaveText(new RegExp(`1\\s*/\\s*${count}`));
        await expect(page.locator(".detail-reference-media, .vehicle-image-label")).toHaveCount(0);
        await thumbs.nth(1).click();
        await expect(counter).toHaveText(new RegExp(`2\\s*/\\s*${count}`));
        await expect(thumbs.nth(1)).toHaveAttribute("aria-pressed", "true");
        if (pc) {
          await page.getByRole("button", { name: "다음 사진", exact: true }).click();
          await expect(counter).toHaveText(new RegExp(`3\\s*/\\s*${count}`));
        } else {
          await thumbs.nth(1).press("End");
          await expect(counter).toHaveText(new RegExp(`${count}\\s*/\\s*${count}`));
        }
      });
    }

    test("marketplace feed opens catalog without adding other listing slides", async ({ page }) => {
      await page.goto(`/?qf=guazi&category=${encodeURIComponent("서울오토갤러리")}&maker=${encodeURIComponent("벤틀리")}&view=feed&thumbs=on${pcParam}`);
      const card = page.locator(".bbm-result-card").filter({ has: page.locator(".vehicle-image-label", { hasText: "차종 대표 이미지" }) }).first();
      await expect(card).toBeVisible();
      await expect(card.locator(".bbm-card-count")).toHaveCount(0);
      await card.click();
      await expect(page.locator(".detail-reference-media strong")).toHaveText("차종 대표 이미지");
      await expect(page.locator(".detail-thumbs, .pc-thumbnails, .detail-photo-count, .pc-photo-counter")).toHaveCount(0);
    });
  });
}
