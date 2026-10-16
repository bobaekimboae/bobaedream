import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const base = process.env.REVIEW_BASE_URL ?? "http://127.0.0.1:4322/";
const outUrl = new URL("../../artifacts/dongchedi-review-rating-audit-1017/site/", import.meta.url);
await mkdir(outUrl, { recursive: true });
const out = fileURLToPath(outUrl);
const corpusPath = fileURLToPath(new URL("../../artifacts/community-review-conditions-1017/rating-original-corpus.md", import.meta.url));
const corpus = await readFile(corpusPath, "utf8");

const matrix = {
  "외관": { originalLabel: "外观", ko: ["호불호가 커요", "겨우 볼 만해요", "무난한 디자인", "시선 끄는 디자인", "디자인 완성도 최고"], zh: ["奇丑无比", "勉强接受", "平淡无奇", "颜值担当", "颜值巅峰"] },
  "실내": { originalLabel: "内饰", ko: ["받아들이기 어려움", "실내 구성이 아쉬움", "소박하고 무난해요", "보기 좋고 편안해요", "설계와 마감 훌륭"], zh: ["不能接受", "勉强接受", "朴素无华", "赏心悦目", "设计完美"] },
  "공간": { originalLabel: "空间", ko: ["좁고 답답해요", "공간이 부족해요", "딱 필요한 만큼", "공간이 여유로워요", "아주 넉넉해요"], zh: ["狭窄憋屈", "空间有限", "刚好够用", "比较宽裕", "十分充裕"] },
  "편의·안전 사양": { originalLabel: "配置", ko: ["기본 사양 부족", "필수 사양만 있음", "일상에는 충분", "편의 사양 만족", "사양 매우 풍부"], zh: ["如同毛坯", "轻量简装", "日常够用", "舒适享受", "非常丰富"] },
  "주행감": { originalLabel: "驾驶感受", ko: ["견디기 어려워요", "주행감이 아쉬워요", "무난한 주행감", "편안하고 안정적", "주행 완성도 최고"], zh: ["难以忍受", "或有欠缺", "中规中矩", "驾乘舒适", "极致体验"] },
  "주행거리·전비": { originalLabel: "续航能耗", ko: ["주행거리 부족", "거리 불안이 있어요", "출퇴근에는 충분", "거리·효율 우수", "장거리도 든든"], zh: ["衰减严重", "有些焦虑", "通勤满足", "续航优秀", "扎实持久"] },
  "주행 보조": { originalLabel: "辅助驾驶", ko: ["실용성이 없어요", "가끔만 쓸 만해요", "기본 기능은 무난", "똑똑하고 안정적", "믿고 쓸 수 있어요"], zh: ["毫不实用", "间或可用", "马马虎虎", "聪明可靠", "完全信赖"] },
  "인포테인먼트": { originalLabel: "智能座舱", ko: ["사용성이 나빠요", "다소 불편해요", "기본 사용엔 충분", "기능 풍부하고 편함", "빠르고 스마트함"], zh: ["智商为零", "不太好用", "满足使用", "丰富好用", "高度智能"] },
  "동력·핸들링": { originalLabel: "动力操控", ko: ["동력·조향 불편", "힘과 핸들링 아쉬움", "무난한 동력 성능", "쉽고 안정적인 운전", "차와 하나 된 느낌"], zh: ["难以忍受", "有所欠缺", "中规中矩", "驾驶信心", "人车合一"] },
  "연비": { originalLabel: "油耗", ko: ["연료비 부담 큼", "연료 소비 많음", "평균적인 연비", "연비가 우수해요", "효율 매우 뛰어남"], zh: ["吞油黑洞", "烧油大户", "正常水平", "油耗优秀", "节油高效"] },
};
const scores = Array.from({ length: 10 }, (_, index) => (index + 1) / 2);
const bucket = (score) => Math.ceil(score) - 1;
const rows = [];
const runtimeErrors = [];
const check = (section, name, ok, expected = "", actual = "") => rows.push({ section, name, result: ok ? "PASS" : "FAIL", expected: String(expected), actual: String(actual) });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
context.on("page", (page) => {
  page.on("console", (message) => { if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`); });
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
});

async function writerPage() {
  const page = await context.newPage();
  await page.goto(`${base}?community=reviews&review=write&from=community&v=rating-matrix`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.locator(".vr-write").waitFor();
  return page;
}

async function selectModel(page, text) {
  await page.locator(".vr-selected-model").click();
  await page.locator(".vr-model-options button", { hasText: text }).first().click();
}

async function auditCategory(page, label) {
  const group = page.getByRole("radiogroup", { name: `${label} 별점` });
  const row = group.locator("..");
  for (const score of scores) {
    const radio = group.getByRole("radio", { name: `${score}점`, exact: true });
    await radio.click();
    const comment = (await row.locator("div > small").textContent())?.trim() ?? "";
    const value = (await row.locator(".vr-rating-value").textContent())?.trim() ?? "";
    const popover = (await row.locator(".vr-star-popover").textContent())?.trim() ?? "";
    const expectedComment = matrix[label].ko[bucket(score)];
    check("작성 UI 100상태", `${label} ${score.toFixed(1)} 문구`, comment === expectedComment, expectedComment, comment);
    check("작성 UI 100상태", `${label} ${score.toFixed(1)} 숫자`, value === `${score.toFixed(1)}점`, `${score.toFixed(1)}점`, value);
    check("작성 UI 100상태", `${label} ${score.toFixed(1)} 선택 상태`, await radio.getAttribute("aria-checked") === "true", "true", await radio.getAttribute("aria-checked"));
    check("작성 UI 100상태", `${label} ${score.toFixed(1)} 피드백`, popover.includes(`${score.toFixed(1)}점`), `${score.toFixed(1)}점`, popover);
  }
}

// 8 EV/PHEV categories × 10 half-star positions.
{
  const page = await writerPage();
  await page.locator(".vr-more-ratings").click();
  for (const label of ["외관", "실내", "공간", "편의·안전 사양", "주행감", "주행거리·전비", "주행 보조", "인포테인먼트"]) await auditCategory(page, label);
  await page.close();
}

// Two ICE-only categories × 10 half-star positions.
{
  const page = await writerPage();
  await selectModel(page, "BMW M3");
  for (const label of ["동력·핸들링", "연비"]) await auditCategory(page, label);
  await page.close();
}

// The preserved source corpus must contain each of the 100 exact KO/ZH rows.
for (const [label, values] of Object.entries(matrix)) {
  for (const score of scores) {
    const expected = `| ${label} | ${values.originalLabel} | ${score.toFixed(1)} | ${values.ko[bucket(score)]} | ${values.zh[bucket(score)]} |`;
    check("원문 사전 100행", `${label} ${score.toFixed(1)} 원문`, corpus.includes(expected), expected, corpus.includes(expected) ? expected : "없음");
  }
}

// Distinct scores catch averaging/rounding mistakes that uniform-score tests miss.
{
  const page = await writerPage();
  const required = ["외관", "실내", "공간", "편의·안전 사양", "주행감", "주행거리·전비"];
  const values = [0.5, 1.5, 2.5, 3.5, 4.5, 5.0];
  for (let index = 0; index < required.length; index += 1) {
    await page.getByRole("radiogroup", { name: `${required[index]} 별점` }).getByRole("radio", { name: `${values[index]}점`, exact: true }).click();
  }
  const overall = (await page.locator(".vr-rating-title h2").textContent())?.trim() ?? "";
  check("계산", "서로 다른 6개 점수의 평균", overall.includes("2.92점"), "2.92점", overall);
  await page.close();
}

const profiles = [
  { model: null, name: "전기차", required: ["외관", "실내", "공간", "편의·안전 사양", "주행감", "주행거리·전비"], optional: true, metric: "실주행거리", owner: true },
  { model: "XC60", name: "플러그인 하이브리드", required: ["외관", "실내", "공간", "편의·안전 사양", "주행감", "주행거리·전비"], optional: true, metric: "순수 전기 주행거리", owner: true },
  { model: "AITO M7", name: "주행거리 연장형", required: ["외관", "실내", "공간", "편의·안전 사양", "주행감", "주행거리·전비"], optional: true, metric: "실주행거리", owner: true },
  { model: "토요타 캠리", name: "하이브리드", required: ["외관", "실내", "공간", "편의·안전 사양", "동력·핸들링", "연비"], optional: false, metric: "실연비", owner: true },
  { model: "BMW M3", name: "내연기관", required: ["외관", "실내", "공간", "편의·안전 사양", "동력·핸들링", "연비"], optional: false, metric: "실연비", owner: true },
  { model: "기아 EV4", name: "출시 예정 전기차", required: ["외관", "실내", "공간", "편의·안전 사양", "주행감", "주행거리·전비"], optional: true, metric: "", owner: false },
];
for (const profile of profiles) {
  const page = await writerPage();
  if (profile.model) await selectModel(page, profile.model);
  const labels = (await page.locator(".vr-rating-row > div > b").allTextContents()).map((label) => label.replace(/\*$/, "").trim());
  check("동력방식 가변", `${profile.name} 필수 항목`, JSON.stringify(labels) === JSON.stringify(profile.required), profile.required.join(" | "), labels.join(" | "));
  check("동력방식 가변", `${profile.name} 선택 항목 버튼`, (await page.locator(".vr-more-ratings").count() > 0) === profile.optional, String(profile.optional), String(await page.locator(".vr-more-ratings").count() > 0));
  const ownerSwitchCount = await page.locator(".vr-owner-switch").count();
  check("소유 가변", `${profile.name} 소유자 스위치`, (ownerSwitchCount > 0) === profile.owner, String(profile.owner), String(ownerSwitchCount > 0));
  if (profile.owner) {
    const fields = await page.locator(".vr-owner-fields-card").innerText();
    check("소유 가변", `${profile.name} 실사용 항목`, fields.includes(profile.metric), profile.metric, fields);
    await page.locator(".vr-owner-switch input").uncheck({ force: true });
    check("소유 가변", `${profile.name} 비오너 구매정보 숨김`, await page.locator(".vr-owner-fields-card").count() === 0, "0", await page.locator(".vr-owner-fields-card").count());
  } else {
    check("소유 가변", `${profile.name} 체험 사진 안내`, await page.locator(".vr-preview-note").count() === 1, "1", await page.locator(".vr-preview-note").count());
  }
  await page.close();
}

// Validation order: title -> required ratings -> owner fields -> body. Optional ratings are never required.
{
  const page = await writerPage();
  const submit = page.locator(".vr-submit");
  await submit.click();
  check("오류 흐름", "빈 제목", (await page.getByRole("alert").textContent())?.includes("제목을 5자 이상") === true, "제목을 5자 이상", await page.getByRole("alert").textContent());
  await page.locator(".vr-title-field input").fill("아이오닉 6 장거리 후기");
  await submit.click();
  check("오류 흐름", "필수 별점 미선택", (await page.getByRole("alert").textContent())?.includes("항목의 별점을 선택") === true, "항목의 별점을 선택", await page.getByRole("alert").textContent());
  for (const label of profiles[0].required) await page.getByRole("radiogroup", { name: `${label} 별점` }).getByRole("radio", { name: "3점", exact: true }).click();
  await submit.click();
  check("오류 흐름", "소유자 필수 정보", (await page.getByRole("alert").textContent())?.includes("실소유자 정보의 필수 항목") === true, "실소유자 정보의 필수 항목", await page.getByRole("alert").textContent());
  await page.locator(".vr-owner-switch input").uncheck({ force: true });
  await submit.click();
  check("오류 흐름", "본문 30자", (await page.getByRole("alert").textContent())?.includes("30자 이상") === true, "30자 이상", await page.getByRole("alert").textContent());
  check("오류 흐름", "선택 평가 미입력 허용", !(await page.getByRole("alert").textContent())?.includes("주행 보조"), "선택 항목 오류 없음", await page.getByRole("alert").textContent());
  await page.close();
}

// Independent community detail must translate saved ID keys and use the same boundaries.
{
  const page = await context.newPage();
  const stored = [
    { id: "audit-ev", modelId: "ev-a06", title: "평점 경계 검수 전기차", ratings: { exterior: 0.5, interior: 1.5, space: 2.5, features: 3.5, driving: 4.5, range: 1.0, adas: 2.0, cockpit: 3.0 }, body: "평점 표시 경계를 검수하기 위한 충분히 긴 테스트 리뷰 본문입니다.", owner: false, createdAt: "2026-10-17" },
    { id: "audit-ice", modelId: "ice-m3", title: "평점 경계 검수 내연기관", ratings: { exterior: 1.0, interior: 2.0, space: 3.0, features: 4.0, power: 4.5, fuel: 5.0 }, body: "내연기관 평가 항목과 원문 대응을 검수하기 위한 테스트 리뷰 본문입니다.", owner: false, createdAt: "2026-10-17" },
  ];
  await page.goto(`${base}community/naver-cafe-list.html?board=vehicle-review&v=rating-matrix`, { waitUntil: "domcontentloaded" });
  await page.evaluate((value) => localStorage.setItem("bobae-vehicle-reviews-v1", JSON.stringify(value)), stored);
  for (const review of stored) {
    await page.goto(`${base}community/naver-cafe-list.html?board=vehicle-review&review=${review.id}&v=rating-matrix`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.locator(".vrb-detail-ratings").waitFor();
    const detailRows = await page.locator(".vrb-score-row").evaluateAll((nodes) => nodes.map((node) => ({ label: node.querySelector("b")?.textContent?.trim(), comment: node.querySelector("small")?.textContent?.trim(), score: node.querySelector("strong")?.textContent?.trim() })));
    for (const [id, score] of Object.entries(review.ratings)) {
      const idToLabel = { exterior: "외관", interior: "실내", space: "공간", features: "편의·안전 사양", driving: "주행감", range: "주행거리·전비", adas: "주행 보조", cockpit: "인포테인먼트", power: "동력·핸들링", fuel: "연비" };
      const label = idToLabel[id];
      const found = detailRows.find((row) => row.label === label);
      check("커뮤니티 상세", `${review.id} ${label} 이름`, Boolean(found), label, found?.label ?? "없음");
      check("커뮤니티 상세", `${review.id} ${label} 문구`, found?.comment === matrix[label].ko[bucket(score)], matrix[label].ko[bucket(score)], found?.comment ?? "없음");
      check("커뮤니티 상세", `${review.id} ${label} 숫자`, found?.score === Number(score).toFixed(1), Number(score).toFixed(1), found?.score ?? "없음");
    }
  }
  await page.evaluate(() => localStorage.removeItem("bobae-vehicle-reviews-v1"));
  await page.close();
}

check("런타임", "콘솔·페이지 오류 0", runtimeErrors.length === 0, "0", runtimeErrors.join(" | "));
await browser.close();

const failed = rows.filter((row) => row.result === "FAIL");
const bySection = Object.fromEntries([...new Set(rows.map((row) => row.section))].map((section) => {
  const sectionRows = rows.filter((row) => row.section === section);
  return [section, { pass: sectionRows.filter((row) => row.result === "PASS").length, fail: sectionRows.filter((row) => row.result === "FAIL").length }];
}));
const result = { generatedAt: new Date().toISOString(), base, total: rows.length, pass: rows.length - failed.length, fail: failed.length, bySection, runtimeErrors, rows };
await writeFile(join(out, "rating-matrix-results.json"), JSON.stringify(result, null, 2));
await writeFile(join(out, "rating-matrix-results.tsv"), ["section\tname\tresult\texpected\tactual", ...rows.map((row) => [row.section, row.name, row.result, row.expected, row.actual].map((value) => String(value).replaceAll("\t", " ").replaceAll("\n", " ")).join("\t"))].join("\n"));
await writeFile(join(out, "rating-matrix-summary.md"), `# 차량 리뷰 강화 평점 검수\n\n- 기준 URL: ${base}\n- 전체: ${rows.length}\n- PASS: ${rows.length - failed.length}\n- FAIL: ${failed.length}\n\n${Object.entries(bySection).map(([section, value]) => `- ${section}: PASS ${value.pass} / FAIL ${value.fail}`).join("\n")}\n\n${failed.length ? `## 실패\n\n${failed.map((row) => `- ${row.name}: 기대 ${row.expected} / 실제 ${row.actual}`).join("\n")}` : "모든 강화 검수 항목을 통과했다."}\n`);
console.log(`PASS ${rows.length - failed.length} / FAIL ${failed.length}`);
for (const [section, value] of Object.entries(bySection)) console.log(`${section}: PASS ${value.pass} / FAIL ${value.fail}`);
for (const row of failed) console.log(`FAIL ${row.section} > ${row.name}: expected=${row.expected} actual=${row.actual}`);
if (failed.length) process.exit(1);
