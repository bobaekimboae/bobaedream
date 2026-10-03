import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.HEAVY_AUDIT_BASE_URL || "http://127.0.0.1:5173/";
const pcUrl = new URL("?qf=guazi&pc=1&category=%EA%B1%B4%EC%84%A4%EA%B8%B0%EA%B3%84", baseUrl).toString();
const mobileUrl = new URL("?qf=guazi&category=%EA%B1%B4%EC%84%A4%EA%B8%B0%EA%B3%84", baseUrl).toString();
const outputDir = path.resolve("reports/heavy-logo-v08");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function audit(name, viewport, url) {
  const mobile = name === "mobile";
  const context = await browser.newContext({ viewport, screen: viewport, deviceScaleFactor: mobile ? 3 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const cards = page.locator(".heavy-qf-card.is-logo");
  await cards.first().waitFor({ state: "visible" });
  const cardResults = await cards.evaluateAll((items) => items.map((item) => {
    const image = item.querySelector("img");
    const label = item.querySelector("strong");
    const cardRect = item.getBoundingClientRect();
    const imageRect = image?.getBoundingClientRect();
    const labelRect = label?.getBoundingClientRect();
    const style = getComputedStyle(item);
    return {
      code: item.getAttribute("data-manufacturer-code"),
      label: label?.textContent?.trim(),
      card: `${Math.round(cardRect.width)}x${Math.round(cardRect.height)}`,
      image: imageRect ? `${Math.round(imageRect.width)}x${Math.round(imageRect.height)}` : null,
      natural: image ? `${image.naturalWidth}x${image.naturalHeight}` : null,
      labelBox: labelRect ? Math.round(labelRect.width) : null,
      border: style.borderTopWidth,
      background: style.backgroundColor,
      loaded: Boolean(image?.complete && image.naturalWidth > 0),
    };
  }));
  const heading = await page.locator(".heavy-qf-heading strong").evaluate((item) => {
    const rect = item.getBoundingClientRect();
    const style = getComputedStyle(item);
    return {
      text: item.textContent?.trim(),
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      color: style.color,
    };
  });
  await page.screenshot({ path: path.join(outputDir, `heavy-logo-${name}-v08.png`), fullPage: true });
  await context.close();
  return { cards: cardResults, heading };
}

const pc = await audit("pc", { width: 1440, height: 1100 }, pcUrl);
const mobile = await audit("mobile", { width: 390, height: 844 }, mobileUrl);
const report = { pc, mobile };
console.log(JSON.stringify(report, null, 2));
await writeFile(path.join(outputDir, "heavy-logo-audit-v08.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (pc.cards.length !== 10 || mobile.cards.length !== 10) throw new Error("Expected 10 manufacturer cards");
if (pc.cards[0]?.label !== "HD건설기계" || mobile.cards[0]?.label !== "HD건설기계") throw new Error("HD construction label was not applied");
if ([...pc.cards, ...mobile.cards].some((item) => !item.loaded || item.natural !== "120x120" || item.border !== "0px" || item.background !== "rgba(0, 0, 0, 0)")) throw new Error("A logo failed the ChoTot slot rule");
if (pc.cards.some((item) => item.card !== "84x102" || item.image !== "40x40" || item.labelBox !== 76)) throw new Error("PC ChoTot slot dimensions changed");
if (mobile.cards.some((item) => item.card !== "64x74" || item.image !== "36x36" || item.labelBox !== 56)) throw new Error("Mobile ChoTot slot dimensions changed");
if (mobile.heading.text !== "제조사" || mobile.heading.x !== 16 || mobile.heading.fontSize !== "14px" || mobile.heading.fontWeight !== "400" || mobile.heading.lineHeight !== "20px" || mobile.heading.color !== "rgb(102, 102, 102)") throw new Error("Mobile manufacturer label does not match the ChoTot typography rule");

await browser.close();
