import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 384, height: 844 }, deviceScaleFactor: 1 });
await page.goto(process.argv[2] ?? "http://127.0.0.1:5176/?qf=guazi&imageguide=body", { waitUntil: "networkidle" });
if (process.argv[4] === "sheet") {
  await page.getByRole("button", { name: "카테고리", exact: true }).first().click();
  await page.waitForTimeout(250);
}
const menus = page.locator(".bbm-category-menu.is-image-guide");
const report = await menus.last().evaluate((menu) => {
  const rect = menu.getBoundingClientRect();
  const items = [...menu.querySelectorAll("button")].map((button) => {
    const image = button.querySelector("img");
    const label = button.querySelector(".bbm-category-menu__label");
    const imageRect = image?.getBoundingClientRect();
    const labelRect = label?.getBoundingClientRect();
    return {
      text: label?.textContent,
      imageSrc: image?.getAttribute("src"),
      imageComplete: image?.complete,
      natural: image ? `${image.naturalWidth}x${image.naturalHeight}` : null,
      imageRect: imageRect ? [imageRect.x, imageRect.y, imageRect.width, imageRect.height] : null,
      labelRect: labelRect ? [labelRect.x, labelRect.y, labelRect.width, labelRect.height] : null,
      buttonDisplay: getComputedStyle(button).display,
      buttonVisibility: getComputedStyle(button).visibility,
      buttonOpacity: getComputedStyle(button).opacity,
    };
  });
  return { menuRect: [rect.x, rect.y, rect.width, rect.height], items };
});
console.log(JSON.stringify(report, null, 2));
await page.screenshot({ path: process.argv[3] ?? "outputs/imageguide-mobile.png", fullPage: false });
await browser.close();
