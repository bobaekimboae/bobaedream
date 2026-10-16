import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.REVIEW_BASE_URL ?? "http://127.0.0.1:4312/";
const outputDir = new URL("../../artifacts/dealer-review-crosscheck-1016/", import.meta.url);
await mkdir(outputDir, { recursive: true });
const outputPath = fileURLToPath(outputDir);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

const checks = [];
const check = (name, condition, actual = "") => {
  if (!condition) throw new Error(`${name} 실패${actual ? `: ${actual}` : ""}`);
  checks.push({ name, result: "PASS", actual });
};

const writerUrl = `${baseUrl}?profile=dealer&shop=450554&emp=1&qf=guazi&tab=reviews&review=write&v=e2e`;
const listUrl = `${baseUrl}?profile=dealer&shop=450554&emp=1&qf=guazi&tab=reviews&v=e2e`;

async function openWriter() {
  await page.goto(writerUrl, { waitUntil: "networkidle" });
  await page.locator(".vr-write").waitFor();
}

async function selectModel(text) {
  await page.locator(".vr-selected-model").click();
  await page.locator(".vr-model-options button", { hasText: text }).click();
}

await openWriter();
check("등록 화면 로드", await page.locator(".vr-write").isVisible());
check("초기 전기차 실주행거리", (await page.locator(".vr-owner-fields-card").innerText()).includes("실주행거리"));
await page.screenshot({ path: join(outputPath, "writer-top-390x844.png"), fullPage: false });
await page.locator('.vr-rating-row').first().getByRole('radio', { name: '2.5점' }).click();
check("반점 별점 2.5", (await page.locator('.vr-rating-row').first().innerText()).includes("2.5점"));
check("별점 코멘트 한국화", (await page.locator('.vr-rating-row').first().innerText()).includes("무난한 디자인이에요"));

await openWriter();
await selectModel("XC60");
check("PHEV 프로필", (await page.locator(".vr-selected-model").innerText()).includes("플러그인 하이브리드"));
check("PHEV 순수 전기 주행거리", (await page.locator(".vr-owner-fields-card").innerText()).includes("순수 전기 주행거리"));
await page.locator(".vr-owner-switch").click();
check("비오너 구매정보 숨김", (await page.locator(".vr-owner-fields-card").count()) === 0);

await openWriter();
await selectModel("M3");
const iceRating = await page.locator(".vr-rating-card").innerText();
check("내연기관 동력·핸들링", iceRating.includes("동력·핸들링"));
check("내연기관 연비", iceRating.includes("연비"));
check("내연기관 실연비", (await page.locator(".vr-owner-fields-card").innerText()).includes("실연비"));

await openWriter();
await selectModel("캠리");
check("하이브리드 실연비", (await page.locator(".vr-owner-fields-card").innerText()).includes("실연비"));

await openWriter();
await selectModel("M7");
const erevRating = await page.locator(".vr-rating-card").innerText();
check("증거리형 주행감", erevRating.includes("주행감"));
check("증거리형 주행거리", erevRating.includes("주행거리·전비"));
check("증거리형 선택 평가", erevRating.includes("주행 보조·인포테인먼트"));

await openWriter();
await selectModel("EV4");
check("출시 전 오너 토글 숨김", (await page.locator(".vr-owner-switch").count()) === 0);
check("출시 전 사진 안내", (await page.locator(".vr-preview-note").innerText()).includes("사진"));
for (const row of await page.locator(".vr-rating-row").all()) {
  await row.getByRole("radio", { name: "4점" }).click();
}
await page.locator(".vr-body textarea").fill("출시 전 사전 체험 차량의 승차감과 실내 구성을 직접 확인해 작성하는 테스트 리뷰입니다.");
await page.locator(".vr-submit").click();
check("출시 전 사진 필수 검증", (await page.locator(".vr-error").innerText()).includes("사진"));
await page.screenshot({ path: join(outputPath, "writer-390x844.png"), fullPage: false });

await openWriter();
await page.locator(".vr-submit").click();
check("필수 별점 검증", (await page.locator(".vr-error").innerText()).includes("별점을 선택"));

await page.goto(listUrl, { waitUntil: "networkidle" });
await page.locator(".vr-list").waitFor();
check("목록 5개 시드", (await page.locator(".vr-card").count()) === 5, String(await page.locator(".vr-card").count()));
check("목록 오너 필터", await page.locator(".vr-owner-only").isVisible());
await page.locator(".vr-owner-only").click();
check("오너 필터 결과 3개", (await page.locator(".vr-card").count()) === 3, String(await page.locator(".vr-card").count()));
await page.locator(".vr-owner-only").click();
await page.locator(".vr-card").first().scrollIntoViewIfNeeded();
await page.screenshot({ path: join(outputPath, "list-390x844.png"), fullPage: false });

await page.locator(".vr-card-open").first().click();
await page.locator(".vr-detail").waitFor();
check("상세 진입", new URL(page.url()).searchParams.get("review") === "sample-bmw-m3", page.url());
check("상세 평점 카드", await page.locator(".vr-detail-score").isVisible());
check("상세 소유자 정보", (await page.locator(".vr-detail-owner").innerText()).includes("소유자 인증"));
await page.locator(".vr-detail-actions button").filter({ hasText: "댓글" }).click();
check("상세 댓글 펼침", await page.locator(".vr-comments").isVisible());
await page.screenshot({ path: join(outputPath, "detail-390x844.png"), fullPage: false });

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(listUrl, { waitUntil: "networkidle" });
check("PC 목록 레이아웃", await page.locator(".vr-list").isVisible());
const iconSources = await page.locator(".vr-ui-icon").evaluateAll((items) => items.map((item) => item.getAttribute("src") ?? ""));
check("Reddit·ChoTot·AutoScout24 아이콘", iconSources.length > 0 && iconSources.every((src) => /reddit-ui|chotot|autoscout24/.test(src)), iconSources.join(" | "));
const brokenImages = await page.locator("img").evaluateAll((items) => items.filter((item) => !item.complete || item.naturalWidth === 0).map((item) => item.getAttribute("src") ?? ""));
check("깨진 이미지 0건", brokenImages.length === 0, brokenImages.join(" | "));
await page.screenshot({ path: join(outputPath, "list-1440x900.png"), fullPage: false });

check("콘솔 오류 0건", errors.length === 0, errors.join(" | "));
await writeFile(new URL("results.json", outputDir), JSON.stringify({ baseUrl, viewport: "390x844", checks, errors }, null, 2));
await browser.close();
console.log(`PASS ${checks.length} / FAIL 0`);
