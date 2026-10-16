import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = process.env.REVIEW_BASE_URL ?? "http://127.0.0.1:4311/";
const root = fileURLToPath(new URL("../../", import.meta.url));
const outputDirUrl = new URL("../../artifacts/community-review-conditions-1017/", import.meta.url);
const outputDir = fileURLToPath(outputDirUrl);
await mkdir(outputDir, { recursive: true });

const sourcePath = join(root, "src/prototype/dealer-page/vehicle-review-data.ts");
const source = await readFile(sourcePath, "utf8");
const ratingCategories = {};
const categoryPattern = /^\s+(\w+): category\("[^"]+", "([^"]+)", "([^"]+)", \[(.*?)\], \[(.*?)\]\),$/gm;
for (const match of source.matchAll(categoryPattern)) {
  ratingCategories[match[1]] = {
    id: match[1],
    label: match[2],
    originalLabel: match[3],
    comments: JSON.parse(`[${match[4]}]`),
    originalComments: JSON.parse(`[${match[5]}]`),
  };
}
// Native Dongchedi uses paired half-star bands:
// 0.5/1.0, 1.5/2.0, 2.5/3.0, 3.5/4.0, 4.5/5.0.
const scoreBucket = (score) => Math.max(0, Math.min(4, Math.ceil(score) - 1));
const ratingComment = (categoryId, score) => {
  const item = ratingCategories[categoryId];
  const bucket = scoreBucket(score);
  return { korean: item.comments[bucket], original: item.originalComments[bucket] };
};

const checks = [];
const consoleErrors = [];
const scenarioRows = [];
const check = (name, condition, actual = "") => checks.push({ name, result: condition ? "PASS" : "FAIL", actual });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("pageerror", (error) => consoleErrors.push(error.message));

const writerUrl = `${baseUrl}?community=reviews&review=write&from=community&v=conditions1017`;
const communityUrl = `${baseUrl}community/naver-cafe-list.html?board=vehicle-review&v=conditions1017`;

async function openWriter() {
  await page.goto(writerUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".vr-write").waitFor();
}

async function selectModel(text) {
  await page.locator(".vr-selected-model").click();
  const option = page.locator(".vr-model-options button").filter({ hasText: text }).first();
  await option.waitFor();
  await option.click();
}

async function visibleRatingLabels() {
  return page.locator(".vr-rating-row b").allTextContents().then((items) => items.map((item) => item.replace("*", "").replace("선택", "").trim()));
}

const profileScenarios = [
  { powertrain: "ev", label: "전기차", model: "현대 아이오닉 6", required: ["exterior", "interior", "space", "features", "driving", "range"], optional: ["adas", "cockpit"], ownerMetric: { label: "실주행거리", unit: "km" } },
  { powertrain: "phev", label: "플러그인 하이브리드", model: "볼보 XC60", required: ["exterior", "interior", "space", "features", "driving", "range"], optional: ["adas", "cockpit"], ownerMetric: { label: "순수 전기 주행거리", unit: "km" } },
  { powertrain: "erev", label: "주행거리 연장형", model: "AITO M7", required: ["exterior", "interior", "space", "features", "driving", "range"], optional: ["adas", "cockpit"], ownerMetric: { label: "실주행거리", unit: "km" } },
  { powertrain: "hybrid", label: "하이브리드", model: "토요타 캠리", required: ["exterior", "interior", "space", "features", "power", "fuel"], optional: [], ownerMetric: { label: "실연비", unit: "km/L" } },
  { powertrain: "ice", label: "내연기관", model: "BMW M3", required: ["exterior", "interior", "space", "features", "power", "fuel"], optional: [], ownerMetric: { label: "실연비", unit: "km/L" } },
];

for (const scenario of profileScenarios) {
  const profile = scenario;
  await openWriter();
  await selectModel(scenario.model);
  const firstEditable = await page.locator("input, textarea, select").first().getAttribute("placeholder");
  check(`${profile.label}: 제목이 첫 입력 항목`, firstEditable === "차량 경험이 잘 드러나는 제목을 입력해 주세요", firstEditable ?? "");

  const initialLabels = await visibleRatingLabels();
  const requiredLabels = profile.required.map((id) => ratingCategories[id].label);
  check(`${profile.label}: 필수 평가 항목`, JSON.stringify(initialLabels) === JSON.stringify(requiredLabels), initialLabels.join(" | "));

  const ownerCopy = await page.locator(".vr-owner-fields-card").innerText();
  check(`${profile.label}: 소유자 전용 수치`, ownerCopy.includes(profile.ownerMetric.label) && ownerCopy.includes(profile.ownerMetric.unit), ownerCopy.replace(/\s+/g, " "));

  if (profile.optional.length) {
    check(`${profile.label}: 선택 평가 접힘`, await page.locator(".vr-more-ratings").count() === 1 && initialLabels.length === profile.required.length);
    await page.locator(".vr-more-ratings").click();
    const expandedLabels = await visibleRatingLabels();
    check(`${profile.label}: 선택 평가 펼침`, expandedLabels.length === profile.required.length + profile.optional.length, expandedLabels.join(" | "));
  } else {
    check(`${profile.label}: 불필요한 선택 평가 없음`, await page.locator(".vr-more-ratings").count() === 0);
  }

  const firstRow = page.locator(".vr-rating-row").first();
  await firstRow.getByRole("radio", { name: "0.5점", exact: true }).click();
  const lowComment = (await firstRow.locator("small").innerText()).trim();
  await firstRow.getByRole("radio", { name: "5점", exact: true }).click();
  const highComment = (await firstRow.locator("small").innerText()).trim();
  check(`${profile.label}: 0.5점 문구`, lowComment === ratingComment(profile.required[0], 0.5).korean, lowComment);
  check(`${profile.label}: 5.0점 문구`, highComment === ratingComment(profile.required[0], 5).korean, highComment);

  await page.locator(".vr-owner-switch").click();
  check(`${profile.label}: 비오너 구매 정보 숨김`, await page.locator(".vr-owner-fields-card").count() === 0);
  check(`${profile.label}: 비오너 평가 항목 유지`, (await visibleRatingLabels()).length === profile.required.length + profile.optional.length);

  scenarioRows.push({
    powertrain: profile.label,
    model: scenario.model,
    required: requiredLabels.join(", "),
    optional: profile.optional.map((id) => ratingCategories[id].label).join(", ") || "없음",
    ownerMetric: `${profile.ownerMetric.label} (${profile.ownerMetric.unit})`,
    nonOwner: "구매정보 숨김 · 시승 리뷰 저장",
  });
  await page.screenshot({ path: join(outputDir, `writer-${scenario.powertrain}-390x844.png`), fullPage: false });
}

// 모든 평가 항목의 0.5~5.0 한국어 문구가 원문 버킷과 같은 경계에서 바뀌는지 UI로 확인한다.
const categoryModels = {
  exterior: "현대 아이오닉 6", interior: "현대 아이오닉 6", space: "현대 아이오닉 6", features: "현대 아이오닉 6",
  driving: "현대 아이오닉 6", range: "현대 아이오닉 6", adas: "현대 아이오닉 6", cockpit: "현대 아이오닉 6",
  power: "BMW M3", fuel: "BMW M3",
};
let activeModel = "";
for (const [categoryId, modelText] of Object.entries(categoryModels)) {
  if (activeModel !== modelText) {
    await openWriter();
    await selectModel(modelText);
    if (modelText.includes("아이오닉")) await page.locator(".vr-more-ratings").click();
    activeModel = modelText;
  }
  const label = ratingCategories[categoryId].label;
  const row = page.locator(".vr-rating-row").filter({ hasText: label }).first();
  for (let half = 1; half <= 10; half += 1) {
    const score = half / 2;
    await row.getByRole("radio", { name: `${score}점`, exact: true }).click();
    const shown = (await row.locator("small").innerText()).trim();
    const expected = ratingComment(categoryId, score);
    check(`${label} ${score.toFixed(1)}점 한국어 문구`, shown === expected.korean, `${shown} / ${expected.korean}`);
  }
}

// 오류/정상 등록/삭제 흐름. 테스트 레코드는 UI에서 삭제해 로컬 저장소를 원상 복구한다.
await openWriter();
await page.locator(".vr-submit").click();
check("빈 폼: 제목 우선 오류", (await page.locator(".vr-error").innerText()).includes("리뷰 제목을 5자 이상"));
await page.locator(".vr-title-field input").fill("M3 장거리 주행 테스트");
await page.locator(".vr-submit").click();
check("제목 입력 후: 별점 오류", (await page.locator(".vr-error").innerText()).includes("항목의 별점을 선택"));
await openWriter();
await selectModel("BMW M3");
await page.locator(".vr-title-field input").fill("M3 장거리 주행 테스트");
await page.locator(".vr-owner-switch").click();
for (const row of await page.locator(".vr-rating-row").all()) await row.getByRole("radio", { name: "4점", exact: true }).click();
await page.locator(".vr-body textarea").fill("짧은 글");
await page.locator(".vr-submit").click();
check("30자 미만 본문 오류", (await page.locator(".vr-error").innerText()).includes("30자 이상"));
await page.locator(".vr-body textarea").fill("실제 등록과 상세 이동을 확인하기 위한 테스트 리뷰입니다. 조향 반응과 고속 안정성을 확인했습니다.");
await page.locator(".vr-submit").click();
await page.locator(".vrb-detail").waitFor();
const createdId = new URL(page.url()).searchParams.get("review") ?? "";
check("정상 등록: 상세 이동", createdId.startsWith("local-"), page.url());
check("정상 등록: 커뮤니티 독립 상세 이동", new URL(page.url()).pathname.endsWith("/community/naver-cafe-list.html"), page.url());
check("정상 등록: 제목 유지", (await page.locator(".vrb-detail-title h1").innerText()).trim() === "M3 장거리 주행 테스트");
await page.goto(`${baseUrl}?profile=dealer&shop=450554&emp=1&qf=guazi&tab=reviews&review=${encodeURIComponent(createdId)}&v=conditions1017-cleanup`, { waitUntil: "domcontentloaded" });
await page.locator(".vr-detail").waitFor();
page.once("dialog", (dialog) => dialog.accept());
await page.locator(".vr-delete").click();
await page.locator(".vr-list").waitFor();
check("테스트 리뷰 삭제", !JSON.parse(await page.evaluate(() => localStorage.getItem("bobae-vehicle-reviews-v1") || "[]")).some((item) => item.id === createdId));

// 출시 예정 모델은 체험 사진을 요구한다.
await openWriter();
await selectModel("기아 EV4");
await page.locator(".vr-title-field input").fill("EV4 사전 체험 리뷰");
for (const row of await page.locator(".vr-rating-row").all()) await row.getByRole("radio", { name: "4점", exact: true }).click();
await page.locator(".vr-body textarea").fill("출시 전 사전 체험 행사에서 실내 공간과 주행 보조 기능을 충분히 확인한 리뷰입니다.");
await page.locator(".vr-submit").click();
check("출시 예정 차량: 체험 사진 필수", (await page.locator(".vr-error").innerText()).includes("사진을 추가"));

// 50개 피드, 150개 사진, 필터와 모든 상세 경로를 검사한다.
await page.goto(communityUrl, { waitUntil: "domcontentloaded" });
await page.locator(".vrb-card").first().waitFor();
const cardCount = await page.locator(".vrb-card").count();
check("독립 리뷰 테이블 50개", cardCount === 50, String(cardCount));
check("제목 50개", await page.locator(".vrb-card h3").count() === 50);
check("사진 갤러리 50개", await page.locator(".vrb-card-gallery").count() === 50);
check("실제 차량 사진 150개", await page.locator(".vrb-card-gallery img").count() === 150);
const avatarSources = await page.locator(".vrb-avatar img").evaluateAll((items) => items.map((item) => item.getAttribute("src") || ""));
check("브랜드 로고 프사 50개", avatarSources.length === 50, String(avatarSources.length));
check("기존 랭크 프사 미사용", avatarSources.every((src) => !src.includes("rank-avatars")), avatarSources.filter((src) => src.includes("rank-avatars")).join(" | "));
check("브랜드 로고 9종 노출", new Set(avatarSources).size === 9, String(new Set(avatarSources).size));
const brokenListImages = await page.locator("img").evaluateAll((items) => items.filter((item) => !item.complete || item.naturalWidth === 0).map((item) => item.getAttribute("src")));
check("목록 깨진 이미지 0", brokenListImages.length === 0, brokenListImages.join(" | "));
const ids = await page.locator(".vrb-card").evaluateAll((items) => items.map((item) => item.getAttribute("data-review-id")));
await page.screenshot({ path: join(outputDir, "list-50-mobile-390x844.png"), fullPage: false });

const expectedFilterCounts = { all: 50, ev: 3, phev: 0, erev: 0, hybrid: 2, ice: 45 };
for (const [powertrain, expected] of Object.entries(expectedFilterCounts)) {
  await page.locator(`[data-powertrain="${powertrain}"]`).click();
  check(`목록 ${powertrain} 필터`, await page.locator(".vrb-card").count() === expected, String(await page.locator(".vrb-card").count()));
}

const detailFailures = [];
let detailPage = await context.newPage();
detailPage.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
detailPage.on("pageerror", (error) => consoleErrors.push(error.message));
for (let detailIndex = 0; detailIndex < ids.length; detailIndex += 1) {
  if (detailIndex > 0 && detailIndex % 10 === 0) {
    await detailPage.close();
    detailPage = await context.newPage();
    detailPage.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    detailPage.on("pageerror", (error) => consoleErrors.push(error.message));
  }
  const id = ids[detailIndex];
  await detailPage.goto(`${communityUrl}&review=${encodeURIComponent(id)}`, { waitUntil: "domcontentloaded" });
  try {
    await detailPage.locator(".vrb-detail").waitFor({ timeout: 3000 });
    const title = (await detailPage.locator(".vrb-detail-title h1").innerText()).trim();
    const scoreVisible = await detailPage.locator(".vrb-detail-score").isVisible();
    if (detailIndex === 0) {
      const scoreColor = await detailPage.locator(".vrb-detail-score strong").evaluate((item) => getComputedStyle(item).color);
      check("상세 종합 평점 숫자 황금색 대비", scoreColor === "rgb(255, 201, 40)", scoreColor);
      await detailPage.screenshot({ path: join(outputDir, "detail-score-contrast-390x844.png"), fullPage: false });
    }
    const images = detailPage.locator(".vrb-detail-gallery img");
    const imageOk = await images.count() > 0 && await images.evaluateAll((items) => items.every((item) => item.complete && item.naturalWidth > 0));
    if (!title || !scoreVisible || !imageOk) detailFailures.push({ id, title, scoreVisible, imageOk });
  } catch (error) {
    detailFailures.push({ id, error: String(error) });
  }
}
await detailPage.close();
check("50개 상세 경로·제목·평점·사진", detailFailures.length === 0, JSON.stringify(detailFailures));

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(communityUrl, { waitUntil: "domcontentloaded" });
check("PC 1440 반응형 목록", await page.locator(".vrb-shell").isVisible());
await page.screenshot({ path: join(outputDir, "list-50-pc-1440x900.png"), fullPage: false });
check("콘솔 오류 0", consoleErrors.length === 0, consoleErrors.join(" | "));

const corpusLines = [
  "# 동처띠 차량 리뷰 별점 원문 보존 사전",
  "",
  "생성일: 2026-10-17",
  "",
  "점수 버킷은 원본 조작 결과대로 `0.5·1.0 / 1.5·2.0 / 2.5·3.0 / 3.5·4.0 / 4.5·5.0`을 사용한다. 한국어는 화면 적용문이며 중국어는 수정하지 않은 원문이다.",
  "",
  "| 평가 항목 | 원문 항목 | 점수 | 한국어 적용문 | 중국어 원문 |",
  "|---|---|---:|---|---|",
];
for (const item of Object.values(ratingCategories)) {
  for (let half = 1; half <= 10; half += 1) {
    const score = half / 2;
    const comment = ratingComment(item.id, score);
    corpusLines.push(`| ${item.label} | ${item.originalLabel} | ${score.toFixed(1)} | ${comment.korean} | ${comment.original} |`);
  }
}
await writeFile(join(outputDir, "rating-original-corpus.md"), `${corpusLines.join("\n")}\n`, "utf8");

const scenarioLines = [
  "# 차량 리뷰 전체 시나리오·가변 규칙",
  "",
  "검사일: 2026-10-17",
  "",
  "## 연료 유형별 화면 규칙",
  "",
  "| 동력 방식 | 기준 모델 | 필수 평가 | 선택 평가 | 실소유자 수치 | 비오너 |",
  "|---|---|---|---|---|---|",
  ...scenarioRows.map((row) => `| ${row.powertrain} | ${row.model} | ${row.required} | ${row.optional} | ${row.ownerMetric} | ${row.nonOwner} |`),
  "",
  "## 전체 흐름",
  "",
  "1. 커뮤니티 상단 `차량리뷰` → 독립 피드형 테이블 진입.",
  "2. 리뷰 등록 → 제목이 첫 입력 필드로 표시되고 5자 미만이면 등록 중단.",
  "3. 차량 선택 → 동력 방식에 따라 평가 항목·실소유자 수치 단위가 즉시 교체.",
  "4. 실소유자 ON → 구매 시기·지역·가격·주행거리/연비 필수. OFF → 구매정보 숨김, 시승 리뷰로 저장.",
  "5. 별점은 0.5점 단위. 각 선택 즉시 한국어 코멘트를 표시하고 원문은 별도 사전에 보존.",
  "6. 전기차·PHEV·EREV는 주행 보조·인포테인먼트 선택 평가를 펼칠 수 있음.",
  "7. 제목 5자, 필수 별점, 실소유자 정보, 본문 30자 순으로 오류를 안내.",
  "8. 출시 예정 모델은 소유자 입력 대신 체험 사진을 필수 요구.",
  "9. 정상 등록 → 상세 이동 → 제목·종합평점·항목별 평점·본문·사진·반응 기능 표시.",
  "10. 삭제 확인 → 테스트 글 제거 → 독립 리뷰 목록으로 복귀.",
  "",
  "## 자동 검사 결과",
  "",
  `- PASS: ${checks.filter((item) => item.result === "PASS").length}`,
  `- FAIL: ${checks.filter((item) => item.result === "FAIL").length}`,
  "- 별점 상태: 10개 평가 항목 × 10단계 = 100개 UI 상태",
  "- 리뷰 데이터: 50개, 갤러리 50개, 사진 150개, 상세 경로 50개",
  `- 콘솔 오류: ${consoleErrors.length}개`,
  "",
  "세부 원본은 `results.json`, 별점 문구 원본은 `rating-original-corpus.md`를 참조한다.",
];
await writeFile(join(outputDir, "scenario-matrix.md"), `${scenarioLines.join("\n")}\n`, "utf8");
await writeFile(join(outputDir, "results.json"), JSON.stringify({ baseUrl, checks, consoleErrors, scenarioRows, detailFailures }, null, 2), "utf8");

await browser.close();
const failed = checks.filter((item) => item.result === "FAIL");
console.log(`PASS ${checks.length - failed.length} / FAIL ${failed.length}`);
if (failed.length) {
  console.error(failed.map((item) => `${item.name}: ${item.actual}`).join("\n"));
  process.exitCode = 1;
}
