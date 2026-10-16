import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.REVIEW_BASE_URL ?? "http://127.0.0.1:4311/";
const outputUrl = new URL("../../artifacts/dongchedi-model-review-1017/implementation/", import.meta.url);
await mkdir(outputUrl, { recursive: true });
const outputDir = fileURLToPath(outputUrl);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const failures = [];
const checks = [];
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));
const check = (name, condition, actual = "") => {
  const row = { name, result: condition ? "PASS" : "FAIL", actual };
  checks.push(row);
  if (!condition) failures.push(row);
};

const listUrl = `${baseUrl}?profile=dealer&shop=450554&emp=1&qf=guazi&tab=reviews&v=model-fidelity`;
const detailUrl = `${baseUrl}?profile=dealer&shop=450554&emp=1&qf=guazi&tab=reviews&review=review-sag-01-1&v=model-fidelity`;

await page.goto(listUrl, { waitUntil: "networkidle" });
await page.locator(".vr-list").waitFor();
check("모델별 리뷰 50개", await page.locator(".vr-card").count() === 50, String(await page.locator(".vr-card").count()));
check("브랜드 엠블럼", await page.locator(".vr-card .vr-logo img").count() > 0);
check("평점·평가어", await page.locator(".vr-card-rating").first().innerText().then((text) => /\d\.\d/.test(text) && /(만족|보통|아쉬움)/.test(text)));
check("리뷰 제목", await page.locator(".vr-card h3").first().isVisible());
check("3분할 실차 사진", await page.locator(".vr-card-gallery.is-3 img").count() >= 3, String(await page.locator(".vr-card-gallery.is-3 img").count()));
check("공유·댓글·도움 반응", await page.locator(".vr-card footer").first().innerText().then((text) => ["공유", "댓글", "도움돼요"].every((item) => text.includes(item))));
await page.locator(".vr-card").first().scrollIntoViewIfNeeded();
await page.screenshot({ path: join(outputDir, "01-list-390x844.png") });
await page.screenshot({ path: join(outputDir, "01-list-full-390.png"), fullPage: true });

await page.goto(detailUrl, { waitUntil: "networkidle" });
await page.locator(".vr-detail").waitFor();
check("상세 작성자·실소유자", await page.locator(".vr-detail-model").innerText().then((text) => text.includes("실소유자")));
check("상세 점수 숫자", await page.locator(".vr-detail-score strong").isVisible());
check("평점 항목 6개 이상", await page.locator(".vr-detail-ratings > div").count() >= 6, String(await page.locator(".vr-detail-ratings > div").count()));
check("구매정보 가변 항목", await page.locator(".vr-detail-owner").innerText().then((text) => ["구매 시기", "구매 지역", "차량 가격", "실연비"].every((item) => text.includes(item))));
check("상세 제목·본문", await page.locator(".vr-detail-body h1").isVisible() && await page.locator(".vr-detail-body p").isVisible());
check("상세 3분할 사진", await page.locator(".vr-detail-gallery.is-3 img").count() === 3, String(await page.locator(".vr-detail-gallery.is-3 img").count()));
await page.screenshot({ path: join(outputDir, "02-detail-top-390x844.png") });
await page.locator(".vr-comments").scrollIntoViewIfNeeded();
check("댓글 상시 노출", await page.locator(".vr-comments").isVisible());
check("댓글 프사·작성자·내용", await page.locator(".vr-comments article").count() >= 4, String(await page.locator(".vr-comments article").count()));
check("댓글 답글 기능", await page.locator(".vr-comments .vr-replies").count() >= 3, String(await page.locator(".vr-comments .vr-replies").count()));
check("댓글 찬성 버튼", await page.locator(".vr-comments article > button").count() >= 4);
await page.screenshot({ path: join(outputDir, "03-comments-390x844.png") });
await page.locator(".vr-comments input").fill("장거리 승차감 정보가 도움이 됐습니다.");
await page.locator(".vr-comments form button").click();
check("댓글 등록", await page.locator(".vr-comments article").first().innerText().then((text) => text.includes("도움이 됐습니다")));
check("댓글 수 증가", await page.locator(".vr-detail-actions button").filter({ hasText: "댓글 3" }).count() === 1);
await page.screenshot({ path: join(outputDir, "04-comment-added-390x844.png") });
check("콘솔 오류 0", errors.length === 0, errors.join(" | "));

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(listUrl, { waitUntil: "networkidle" });
check("PC 리뷰 목록", await page.locator(".vr-list").isVisible());
check("깨진 이미지 0", await page.locator("img").evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)));
await page.screenshot({ path: join(outputDir, "05-list-1440x900.png") });

await writeFile(join(outputDir, "results.json"), JSON.stringify({ baseUrl, checks, errors, failures }, null, 2));
await browser.close();
if (failures.length) {
  console.error(`PASS ${checks.length - failures.length} / FAIL ${failures.length}`);
  for (const item of failures) console.error(`FAIL ${item.name}: ${item.actual}`);
  process.exit(1);
}
console.log(`PASS ${checks.length} / FAIL 0`);
