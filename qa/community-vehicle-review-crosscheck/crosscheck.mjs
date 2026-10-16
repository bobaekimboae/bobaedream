import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const base = process.env.REVIEW_BASE_URL ?? "http://127.0.0.1:4311/";
const outUrl = new URL("../../artifacts/dongchedi-review-crosscheck-1017/site/", import.meta.url);
await mkdir(outUrl, { recursive: true });
const out = fileURLToPath(outUrl);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const rows = [];
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));
const check = (name, ok, actual = "") => rows.push({ name, result: ok ? "PASS" : "FAIL", actual });

await page.goto(`${base}community/naver-cafe-list.html?board=vehicle-review&v=crosscheck-local`, { waitUntil: "networkidle" });
await page.locator(".vrb-card").first().waitFor();
check("독립 테이블 50개", await page.locator(".vrb-card").count() === 50, String(await page.locator(".vrb-card").count()));
check("카드 프사 44px", await page.locator(".vrb-card .vrb-avatar").first().evaluate((el) => getComputedStyle(el).width === "44px"));
check("카드 반경 10px", await page.locator(".vrb-card").first().evaluate((el) => getComputedStyle(el).borderRadius === "10px"));
check("사진 높이 112px", await page.locator(".vrb-card-gallery img").first().evaluate((el) => getComputedStyle(el).height === "112px"));
check("반점수 레이어 별", await page.locator(".vrb-card .vrb-star > i").count() >= 5);
check("깨진 이미지 0", await page.locator("img").evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)));
await page.screenshot({ path: join(out, "01-list-390x844.png"), fullPage: false });

const reviewId = await page.locator(".vrb-card").first().getAttribute("data-review-id");
await page.goto(`${base}community/naver-cafe-list.html?board=vehicle-review&review=${reviewId}&v=crosscheck-local`, { waitUntil: "networkidle" });
await page.locator(".vrb-detail").waitFor();
check("상세 독립 URL", new URL(page.url()).pathname.endsWith("/community/naver-cafe-list.html"), page.url());
check("상세 어두운 헤더", await page.locator(".vrb-detail-head").evaluate((el) => getComputedStyle(el).backgroundColor === "rgb(85, 91, 104)"));
check("상세 숫자 평가표 3열", await page.locator(".vrb-detail-ratings").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length === 3));
check("상세 진행막대 제거", await page.locator(".vrb-score-row > i").first().evaluate((el) => getComputedStyle(el).display === "none"));
check("점수별 코멘트", await page.locator(".vrb-score-row small").evaluateAll((items) => items.every((item) => item.textContent?.trim())));
check("상세 댓글", await page.locator(".vrb-comment").count() >= 4, String(await page.locator(".vrb-comment").count()));
await page.screenshot({ path: join(out, "02-detail-390x844.png"), fullPage: false });

await page.goto(`${base}?community=reviews&review=write&from=community&v=crosscheck-local`, { waitUntil: "networkidle" });
await page.locator(".vr-write").waitFor();
await page.getByRole("radiogroup", { name: "외관 별점" }).getByRole("radio", { name: "2.5점", exact: true }).click();
const exterior = await page.getByRole("radiogroup", { name: "외관 별점" }).locator("xpath=..").innerText();
check("2.5점 한국어 코멘트", exterior.includes("겨우 볼 만해요"), exterior);
check("선택 코멘트 11px", await page.locator(".vr-rating-row small").first().evaluate((el) => getComputedStyle(el).fontSize === "11px"));
await page.screenshot({ path: join(out, "03-writer-rating-390x844.png"), fullPage: false });

await page.goto(`${base}?community=reviews&review=write&from=community&v=crosscheck-model`, { waitUntil: "networkidle" });
await page.locator(".vr-write").waitFor();
await page.locator(".vr-selected-model").click();
await page.locator(".vr-model-options button", { hasText: "XC60" }).click();
check("PHEV 순수 전기 주행거리", (await page.locator(".vr-owner-fields-card").innerText()).includes("순수 전기 주행거리"));
await page.locator(".vr-owner-switch input").uncheck({ force: true });
check("비오너 구매정보 숨김", await page.locator(".vr-owner-fields-card").count() === 0);

check("콘솔 오류 0", errors.length === 0, errors.join(" | "));
await writeFile(join(out, "results.json"), JSON.stringify({ base, rows, errors }, null, 2));
await browser.close();
const failed = rows.filter((row) => row.result === "FAIL");
console.log(`PASS ${rows.length - failed.length} / FAIL ${failed.length}`);
for (const row of failed) console.log(`FAIL ${row.name}: ${row.actual}`);
if (failed.length) process.exit(1);
