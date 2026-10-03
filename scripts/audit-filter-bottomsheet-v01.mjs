import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outDir = join(process.cwd(), "reports", "filter-bottomsheet-v01");
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const source = await context.newPage();
const implementation = await context.newPage();

const metrics = {};

try {
  await source.goto("https://xe.chotot.com/mua-ban-oto", { waitUntil: "domcontentloaded", timeout: 45_000 });
  await source.getByText("Ô tô", { exact: true }).click();
  await source.waitForTimeout(400);
  await source.screenshot({ path: join(outDir, "source-category.png") });
  metrics.sourceCategory = await source.evaluate(() => {
    const title = [...document.querySelectorAll("*")].find((element) => element.textContent?.trim() === "Tất cả danh mục");
    const header = title?.parentElement;
    const sheet = header?.parentElement?.parentElement;
    const selected = sheet?.querySelector("a.active");
    const rect = sheet?.getBoundingClientRect();
    const selectedRect = selected?.getBoundingClientRect();
    return { viewport: [innerWidth, innerHeight], sheet: rect ? { y: rect.y, height: rect.height, width: rect.width } : null, selected: selectedRect ? { height: selectedRect.height, radius: getComputedStyle(selected).borderRadius, background: getComputedStyle(selected).backgroundColor, fontSize: getComputedStyle(selected).fontSize } : null };
  });
  await source.getByText("Tất cả danh mục", { exact: true }).locator("..").locator("svg").click();
  const sourceSearch = source.getByRole("textbox", { name: "Tìm xe cộ..." });
  await sourceSearch.click();
  await sourceSearch.fill("Toyota");
  await source.waitForTimeout(600);
  await source.screenshot({ path: join(outDir, "source-search.png") });

  await implementation.goto("http://127.0.0.1:4173/bobaedream/?qf=guazi", { waitUntil: "networkidle", timeout: 45_000 });
  await implementation.getByText("카테고리", { exact: true }).click();
  await implementation.screenshot({ path: join(outDir, "implementation-category.png") });
  metrics.implementationCategory = await implementation.evaluate(() => {
    const sheet = document.querySelector(".bbmf-sheet.is-category");
    const selected = document.querySelector(".bbm-category-picker__pills .is-selected");
    const rect = sheet?.getBoundingClientRect();
    const selectedRect = selected?.getBoundingClientRect();
    return { viewport: [innerWidth, innerHeight], sheet: rect ? { y: rect.y, height: rect.height, width: rect.width } : null, selected: selectedRect ? { height: selectedRect.height, radius: getComputedStyle(selected).borderRadius, background: getComputedStyle(selected).backgroundColor, fontSize: getComputedStyle(selected).fontSize } : null };
  });
  await implementation.getByRole("button", { name: "닫기" }).click();
  const implementationSearch = implementation.getByRole("textbox", { name: "중고차 검색" });
  await implementationSearch.click();
  await implementationSearch.fill("벤츠");
  await implementation.screenshot({ path: join(outDir, "implementation-search.png") });

  const cards = [
    ["source-category.png", "초톳 카테고리"],
    ["implementation-category.png", "보배드림 카테고리"],
    ["source-search.png", "초톳 검색"],
    ["implementation-search.png", "보배드림 검색"],
  ];
  const images = await Promise.all(cards.map(async ([name, label]) => ({ label, src: `data:image/png;base64,${(await readFile(join(outDir, name))).toString("base64")}` })));
  const compare = await context.newPage();
  await compare.setViewportSize({ width: 820, height: 1810 });
  await compare.setContent(`<style>body{margin:0;padding:16px;background:#eef0f3;font-family:Arial,sans-serif}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.card{overflow:hidden;border-radius:12px;background:#fff;box-shadow:0 2px 10px #0002}.label{padding:10px 12px;font-size:14px;font-weight:700}.card img{display:block;width:390px;height:844px;object-fit:cover;object-position:top}</style><div class="grid">${images.map(({ label, src }) => `<div class="card"><div class="label">${label}</div><img src="${src}"></div>`).join("")}</div>`);
  await compare.screenshot({ path: join(outDir, "comparison.png"), fullPage: true });
  await compare.close();
  await writeFile(join(outDir, "metrics.json"), `${JSON.stringify(metrics, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await browser.close();
}
