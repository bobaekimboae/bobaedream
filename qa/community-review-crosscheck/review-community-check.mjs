import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.REVIEW_BASE_URL ?? "http://127.0.0.1:4313/";
const outputDir = new URL("../../artifacts/community-review-audit-1016/", import.meta.url);
await mkdir(outputDir, { recursive: true });
const outputPath = fileURLToPath(outputDir);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const checks = [];
const errors = [];
const ratingStates = [];
const typographySurfaces = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
const check = (name, condition, actual = "") => {
  checks.push({ name, result: condition ? "PASS" : "FAIL", actual });
  if (!condition) throw new Error(`${name} 실패${actual ? `: ${actual}` : ""}`);
};

async function measureType(surface, selectors) {
  for (const [name, selector] of Object.entries(selectors)) {
    const locator = page.locator(selector).first();
    if (!await locator.count()) continue;
    const value = await locator.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return { text: element.textContent?.trim().replace(/\s+/g, " ") ?? "", fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight, color: style.color, width: Number(rect.width.toFixed(2)), height: Number(rect.height.toFixed(2)) };
    });
    typographySurfaces.push({ surface, name, selector, ...value });
  }
}

const communityUrl = `${baseUrl}community/naver-cafe-list.html?board=vehicle-review&v=black-table-audit`;
const writerUrl = `${baseUrl}?community=reviews&review=write&from=community&v=black-table-audit`;

async function openWriter() {
  await page.goto(writerUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".vr-write").waitFor();
}

async function selectModel(text) {
  await page.locator(".vr-selected-model").click();
  await page.locator(".vr-model-options button", { hasText: text }).click();
}

async function auditRows(profile) {
  const rows = page.locator(".vr-rating-row");
  const total = await rows.count();
  for (let rowIndex = 0; rowIndex < total; rowIndex += 1) {
    const row = rows.nth(rowIndex);
    const label = (await row.locator("b").first().innerText()).replace("*", "").replace("선택", "").trim();
    for (let half = 1; half <= 10; half += 1) {
      const score = half / 2;
      await row.getByRole("radio", { name: `${score}점`, exact: true }).click();
      const comment = row.locator("small");
      await comment.waitFor({ state: "visible" });
      const measured = await comment.evaluate((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          text: element.textContent?.trim() ?? "",
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          color: style.color,
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          width: Number(rect.width.toFixed(2)),
          height: Number(rect.height.toFixed(2)),
          clipped: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1,
        };
      });
      ratingStates.push({ profile, label, score, ...measured });
      check(`${profile}/${label}/${score.toFixed(1)} 문구 노출`, Boolean(measured.text) && measured.visibility === "visible" && measured.opacity !== "0", JSON.stringify(measured));
      check(`${profile}/${label}/${score.toFixed(1)} 문구 무잘림`, !measured.clipped, JSON.stringify(measured));
    }
  }
}

await page.goto(`${baseUrl}community/naver-cafe-list.html?view=compact&menu=all&boardGrid=4`, { waitUntil: "domcontentloaded" });
await page.locator(".boardChannelTab", { hasText: "차량리뷰" }).waitFor();
check("커뮤니티 상단 차량리뷰 탭", await page.locator(".boardChannelTab", { hasText: "차량리뷰" }).isVisible());

await page.goto(communityUrl, { waitUntil: "domcontentloaded" });
await page.locator(".vehicleReviewBoardMode").waitFor();
check("커뮤니티 독립 차량리뷰 테이블 등록", await page.evaluate(() => Boolean(window.BBM_BOARD_TABLE?.has("vehicle-review"))));
check("커뮤니티 차량리뷰 목록 진입", await page.locator(".vrb-shell").isVisible());
check("목록 시드 리뷰 5개", await page.locator(".vrb-card").count() === 5, String(await page.locator(".vrb-card").count()));
check("일반 게시글과 분리", await page.locator("#list > .item").count() === 0, String(await page.locator("#list > .item").count()));
check("실제 SVG 별 아이콘 사용", await page.locator('.vrb-stars img[src*="chotot-common-review-star"]').count() >= 5);
check("Airbnb 블랙 활성 칩", await page.locator('.vrb-filter button[aria-selected="true"]').evaluate((element) => getComputedStyle(element).backgroundColor === "rgb(34, 34, 34)"));
await measureType("목록", { heroTitle: ".vrb-intro h2", heroBody: ".vrb-intro p", summaryScore: ".vrb-summary > strong", cardTitle: ".vrb-card h3", cardBody: ".vrb-card p", cardMeta: ".vrb-metrics" });
await page.screenshot({ path: join(outputPath, "01-community-list-390x844.png"), fullPage: false });
await page.locator('[data-powertrain="ev"]').click();
check("전기차 필터 1건", await page.locator(".vrb-card").count() === 1, String(await page.locator(".vrb-card").count()));
await page.locator('[data-powertrain="all"]').click();
const subscribe = page.locator(".vrb-subscribe").first();
await subscribe.click();
check("구독 토글", await subscribe.getAttribute("aria-pressed") === "true" && await subscribe.innerText() === "구독 중");

await page.locator(".vrb-write").click();
await page.locator(".vr-write").waitFor();
check("커뮤니티 목록→등록 이동", new URL(page.url()).searchParams.get("review") === "write", page.url());
await measureType("등록", { headerTitle: ".vr-write-head strong", exposureTitle: ".vr-exposure b", exposureMeta: ".vr-exposure small", modelTitle: ".vr-selected-model b", modelTrim: ".vr-selected-model small", ratingTitle: ".vr-rating-title h2", bodyTitle: ".vr-body b", bodyInput: ".vr-body textarea", submit: ".vr-submit" });
await page.screenshot({ path: join(outputPath, "02-writer-top-390x844.png"), fullPage: false });

await page.locator(".vr-more-ratings").click();
await auditRows("전기·PHEV·증거리형 공통");
check("전기계열 8개 항목×10단계", ratingStates.length === 80, String(ratingStates.length));
await page.locator(".vr-rating-row").first().getByRole("radio", { name: "2.5점", exact: true }).click();
await page.locator(".vr-rating-row").first().scrollIntoViewIfNeeded();
await page.screenshot({ path: join(outputPath, "03-rating-comment-2_5-390x844.png"), fullPage: false });

await openWriter();
await selectModel("M3");
const iceRows = page.locator(".vr-rating-row");
for (let rowIndex = 4; rowIndex < await iceRows.count(); rowIndex += 1) {
  const row = iceRows.nth(rowIndex);
  const label = (await row.locator("b").first().innerText()).replace("*", "").trim();
  for (let half = 1; half <= 10; half += 1) {
    const score = half / 2;
    await row.getByRole("radio", { name: `${score}점`, exact: true }).click();
    const comment = row.locator("small");
    const measured = await comment.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return { text: element.textContent?.trim() ?? "", fontSize: style.fontSize, lineHeight: style.lineHeight, color: style.color, visibility: style.visibility, opacity: style.opacity, width: Number(rect.width.toFixed(2)), height: Number(rect.height.toFixed(2)), clipped: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1 };
    });
    ratingStates.push({ profile: "내연기관·하이브리드 전용", label, score, ...measured });
    check(`내연기관/${label}/${score.toFixed(1)} 문구 노출`, Boolean(measured.text) && measured.visibility === "visible" && measured.opacity !== "0", JSON.stringify(measured));
    check(`내연기관/${label}/${score.toFixed(1)} 문구 무잘림`, !measured.clipped, JSON.stringify(measured));
  }
}
check("고유 평가 10개×10단계 전수", ratingStates.length === 100, String(ratingStates.length));

await page.locator(".vr-rating-row").first().getByRole("radio", { name: "3점", exact: true }).click();

const typography = await page.locator(".vr-rating-row").first().evaluate((row) => {
  const label = row.querySelector("b");
  const comment = row.querySelector("small");
  const stars = row.querySelector(".vr-star-input");
  const rs = getComputedStyle(row);
  const ls = label ? getComputedStyle(label) : null;
  const cs = comment ? getComputedStyle(comment) : null;
  return {
    rowHeight: Number(row.getBoundingClientRect().height.toFixed(2)),
    rowPadding: `${rs.paddingTop} ${rs.paddingRight} ${rs.paddingBottom} ${rs.paddingLeft}`,
    labelFont: ls?.fontSize,
    labelLineHeight: ls?.lineHeight,
    labelWeight: ls?.fontWeight,
    commentFont: cs?.fontSize,
    commentLineHeight: cs?.lineHeight,
    commentColor: cs?.color,
    starsWidth: stars ? Number(stars.getBoundingClientRect().width.toFixed(2)) : 0,
    starsHeight: stars ? Number(stars.getBoundingClientRect().height.toFixed(2)) : 0,
  };
});
check("평가 라벨 13px/18px", typography.labelFont === "13px" && typography.labelLineHeight === "18px", JSON.stringify(typography));
check("평가 문구 10px/14px", typography.commentFont === "10px" && typography.commentLineHeight === "14px", JSON.stringify(typography));
check("별점 터치영역 130×30", typography.starsWidth === 130 && typography.starsHeight === 30, JSON.stringify(typography));

await page.locator(".vr-owner-switch").click();
check("비오너 구매정보 숨김", await page.locator(".vr-owner-fields-card").count() === 0);
await page.screenshot({ path: join(outputPath, "04-ice-nonowner-390x844.png"), fullPage: false });

await page.goto(communityUrl, { waitUntil: "domcontentloaded" });
await page.locator(".vrb-card-main").first().click();
await page.locator(".vr-detail").waitFor();
check("목록→상세 이동", new URL(page.url()).searchParams.get("review") === "sample-bmw-m3", page.url());
check("상세 평점 카드", await page.locator(".vr-detail-score").isVisible());
await measureType("상세", { headerTitle: ".vr-detail-head strong", author: ".vr-detail-author b", modelTitle: ".vr-detail-score h2", bodyTitle: ".vr-detail-body h3", bodyCopy: ".vr-detail-body p", action: ".vr-detail-actions button" });
await page.screenshot({ path: join(outputPath, "05-detail-390x844.png"), fullPage: false });

await openWriter();
await selectModel("M3");
await page.locator(".vr-owner-switch").click();
for (const row of await page.locator(".vr-rating-row").all()) await row.getByRole("radio", { name: "4점", exact: true }).click();
await page.locator(".vr-body textarea").fill("실제 등록과 삭제 흐름을 확인하기 위한 차량 리뷰 테스트 문장입니다. 주행감과 조향 반응이 안정적이었습니다.");
await page.locator(".vr-submit").click();
await page.locator(".vr-detail").waitFor();
const createdId = new URL(page.url()).searchParams.get("review") ?? "";
check("리뷰 등록→상세 이동", createdId.startsWith("local-"), page.url());
check("테스트 리뷰 삭제 버튼", await page.locator(".vr-delete").isVisible());
page.once("dialog", (dialog) => dialog.accept());
await page.locator(".vr-delete").click();
await page.waitForURL(/community\/naver-cafe-list\.html\?board=vehicle-review/);
check("테스트 리뷰 삭제 후 목록 복귀", await page.locator(".vrb-card").count() === 5, String(await page.locator(".vrb-card").count()));
check("테스트 데이터 완전 삭제", await page.evaluate((id) => !JSON.parse(localStorage.getItem("bobae-vehicle-reviews-v1") || "[]").some((item) => item.id === id), createdId));

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(communityUrl, { waitUntil: "domcontentloaded" });
check("PC 1440 목록", await page.locator(".vrb-shell").isVisible());
const brokenImages = await page.locator("img").evaluateAll((items) => items.filter((item) => !item.complete || item.naturalWidth === 0).map((item) => item.getAttribute("src") ?? ""));
check("깨진 이미지 0건", brokenImages.length === 0, brokenImages.join(" | "));
await page.screenshot({ path: join(outputPath, "06-community-list-1440x900.png"), fullPage: false });
check("콘솔 오류 0건", errors.length === 0, errors.join(" | "));

await writeFile(new URL("results.json", outputDir), JSON.stringify({ baseUrl, checks, errors, typography, typographySurfaces, ratingStates }, null, 2));
await browser.close();
console.log(`PASS ${checks.length} / FAIL 0 · rating states ${ratingStates.length}`);
