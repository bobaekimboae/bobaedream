import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 384, height: 900 }, deviceScaleFactor: 1 });
await page.goto(process.env.MAKER_MODEL_URL || "http://127.0.0.1:4201/maker-model-skeleton-v01.html?spec=new&logo=m", { waitUntil: "networkidle" });
await page.locator('[data-select-maker]').filter({ hasText: "현대" }).first().click();
await page.locator('[data-select-model]').filter({ hasText: "그랜저" }).first().click();
await page.locator('[data-select-generation]:not([data-select-generation="all"])').first().click();
await page.getByText("연료·구동").first().waitFor();
await page.screenshot({ path: "reports/screenshots/maker-model-selection-spacing-384.png", fullPage: true });
const metrics = await page.evaluate(() => {
  const strip = document.querySelector(".selection-strip");
  const chips = [...document.querySelectorAll(".selection-chip")];
  const footer = document.querySelector(".sheet-footer");
  const actions = document.querySelector(".footer-actions");
  const note = document.querySelector(".placeholder-note");
  const css = (element) => getComputedStyle(element);
  return {
    chipGap: css(strip).gap,
    chipHeight: chips.map((chip) => chip.getBoundingClientRect().height),
    footerPadding: css(footer).padding,
    selectionBottomPadding: css(strip).paddingBottom,
    noteMargin: css(note).margin,
    actionMarginTop: css(actions).marginTop,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
});
console.log(JSON.stringify(metrics, null, 2));
await browser.close();
