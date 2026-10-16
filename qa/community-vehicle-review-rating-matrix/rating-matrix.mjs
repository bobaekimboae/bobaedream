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
const minimumAssertions = 57_000;
const viewports = [
  { name: "초소형 320×568", width: 320, height: 568 },
  { name: "초소형 320×658", width: 320, height: 658 },
  { name: "Galaxy Fold 344×882", width: 344, height: 882 },
  { name: "소형 360×640", width: 360, height: 640 },
  { name: "소형 360×740", width: 360, height: 740 },
  { name: "소형 360×780", width: 360, height: 780 },
  { name: "소형 360×800", width: 360, height: 800 },
  { name: "iPhone SE 375×667", width: 375, height: 667 },
  { name: "iPhone X 375×812", width: 375, height: 812 },
  { name: "Android 384×824", width: 384, height: 824 },
  { name: "원본 기기 384×853", width: 384, height: 853 },
  { name: "기준 390×844", width: 390, height: 844 },
  { name: "Android 390×860", width: 390, height: 860 },
  { name: "Pixel 393×852", width: 393, height: 852 },
  { name: "Android 400×800", width: 400, height: 800 },
  { name: "Pixel 412×869", width: 412, height: 869 },
  { name: "대형 모바일 412×915", width: 412, height: 915 },
  { name: "iPhone Plus 414×896", width: 414, height: 896 },
  { name: "iPhone Pro Max 428×926", width: 428, height: 926 },
  { name: "소형 태블릿 600×960", width: 600, height: 960 },
  { name: "태블릿 768×1024", width: 768, height: 1024 },
  { name: "대형 태블릿 820×1180", width: 820, height: 1180 },
  { name: "가로 태블릿 1024×768", width: 1024, height: 768 },
  { name: "노트북 1280×720", width: 1280, height: 720 },
  { name: "PC 1440×900", width: 1440, height: 900 },
  { name: "FHD 1920×1080", width: 1920, height: 1080 },
];
const rows = [];
const runtimeErrors = [];
const check = (section, name, ok, expected = "", actual = "") => rows.push({ section, name, result: ok ? "PASS" : "FAIL", expected: String(expected), actual: String(actual) });
const near = (actual, expected, tolerance = 0.6) => Math.abs(actual - expected) <= tolerance;

const browser = await chromium.launch({ headless: true });
const createContext = async (viewport) => {
  const next = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  next.on("page", (page) => {
    page.on("console", (message) => { if (message.type() === "error") runtimeErrors.push(`${viewport.width}x${viewport.height} console: ${message.text()}`); });
    page.on("pageerror", (error) => runtimeErrors.push(`${viewport.width}x${viewport.height} pageerror: ${error.message}`));
  });
  return next;
};
let context = await createContext({ width: 390, height: 844 });

async function writerPage() {
  const page = await context.newPage();
  await page.goto(`${base}?community=reviews&review=write&from=community&v=rating-matrix`, { waitUntil: "commit", timeout: 60_000 });
  await page.locator(".vr-write").waitFor({ timeout: 60_000 });
  return page;
}

async function selectModel(page, text) {
  await page.locator(".vr-selected-model").click();
  await page.locator(".vr-model-options button", { hasText: text }).first().click();
}

async function auditCategory(page, label, viewportName) {
  const group = page.getByRole("radiogroup", { name: `${label} 별점` });
  const row = group.locator("..");
  let previousComment = "";
  for (const score of scores) {
    const radio = group.getByRole("radio", { name: `${score}점`, exact: true });
    await radio.click();
    const comment = (await row.locator("div > small").textContent())?.trim() ?? "";
    const value = (await row.locator(".vr-rating-value").textContent())?.trim() ?? "";
    const popover = (await row.locator(".vr-star-popover").textContent())?.trim() ?? "";
    const expectedComment = matrix[label].ko[bucket(score)];
    const prefix = `${viewportName} ${label} ${score.toFixed(1)}`;
    const checkedRadios = group.locator('[role="radio"][aria-checked="true"]');
    const checkedLabels = await checkedRadios.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")));
    const geometry = await group.evaluate((node) => {
      const visual = node.querySelector(".vr-star-visual");
      const hit = node.querySelector(".vr-star-hit");
      const rowNode = node.closest(".vr-rating-row");
      const buttons = [...node.querySelectorAll('.vr-star-hit [role="radio"]')];
      const fills = [...node.querySelectorAll(".vr-star-visual > span > i")];
      const empty = node.querySelector(".vr-star-visual > span > img");
      const filled = node.querySelector(".vr-star-visual > span > i img");
      const visualRect = visual?.getBoundingClientRect();
      const hitRect = hit?.getBoundingClientRect();
      return {
        visualWidth: visualRect?.width ?? 0,
        visualHeight: visualRect?.height ?? 0,
        hitWidth: hitRect?.width ?? 0,
        hitHeight: hitRect?.height ?? 0,
        buttonWidths: buttons.map((button) => button.getBoundingClientRect().width),
        fillWidths: fills.map((fill) => fill.getBoundingClientRect().width),
        emptySrc: empty?.getAttribute("src") ?? "",
        filledSrc: filled?.getAttribute("src") ?? "",
        rowBackground: rowNode ? getComputedStyle(rowNode).backgroundColor : "",
        rowClientWidth: rowNode?.clientWidth ?? 0,
        rowScrollWidth: rowNode?.scrollWidth ?? 0,
      };
    });
    check("10배 UI 상태", `${prefix} 문구`, comment === expectedComment, expectedComment, comment);
    check("10배 UI 상태", `${prefix} 숫자`, value === `${score.toFixed(1)}점`, `${score.toFixed(1)}점`, value);
    check("10배 UI 상태", `${prefix} 선택 상태`, await radio.getAttribute("aria-checked") === "true", "true", await radio.getAttribute("aria-checked"));
    check("10배 UI 상태", `${prefix} 단일 선택`, checkedLabels.length === 1, "1", checkedLabels.length);
    check("10배 UI 상태", `${prefix} 선택 라벨`, checkedLabels[0] === `${score}점`, `${score}점`, checkedLabels[0] ?? "없음");
    check("10배 UI 상태", `${prefix} 즉시 피드백`, popover === `${score.toFixed(1)}점`, `${score.toFixed(1)}점`, popover);
    geometry.fillWidths.forEach((width, index) => {
      const expectedWidth = 22 * Math.max(0, Math.min(1, score - index));
      check("10배 별 채움", `${prefix} 별 ${index + 1} 채움`, near(width, expectedWidth), `${expectedWidth}px`, `${width.toFixed(2)}px`);
    });
    check("10배 아이콘", `${prefix} 빈 별 자산`, geometry.emptySrc.includes("chotot-common-review-star-button.svg"), "초톳 빈 별 SVG", geometry.emptySrc);
    check("10배 아이콘", `${prefix} 황금 별 자산`, geometry.filledSrc.includes("chotot-common-review-star-selected.svg"), "초톳 선택 별 SVG", geometry.filledSrc);
    check("10배 기하", `${prefix} 별 시각 폭`, near(geometry.visualWidth, 142), "142px", `${geometry.visualWidth.toFixed(2)}px`);
    check("10배 기하", `${prefix} 별 시각 높이`, near(geometry.visualHeight, 22), "22px", `${geometry.visualHeight.toFixed(2)}px`);
    check("10배 기하", `${prefix} 입력 폭`, near(geometry.hitWidth, 142), "142px", `${geometry.hitWidth.toFixed(2)}px`);
    check("10배 기하", `${prefix} 입력 높이`, near(geometry.hitHeight, 30), "30px", `${geometry.hitHeight.toFixed(2)}px`);
    check("10배 기하", `${prefix} 반점 10구간`, geometry.buttonWidths.length === 10, "10", geometry.buttonWidths.length);
    check("10배 기하", `${prefix} 반점 균등 폭`, geometry.buttonWidths.every((width) => near(width, 14.2, 0.8)), "각 14.2px±0.8", geometry.buttonWidths.map((width) => width.toFixed(2)).join(","));
    check("10배 시각", `${prefix} 선택 행 배경`, geometry.rowBackground === "rgb(250, 251, 252)", "rgb(250, 251, 252)", geometry.rowBackground);
    check("10배 시각", `${prefix} 가로 넘침 없음`, geometry.rowScrollWidth <= geometry.rowClientWidth + 1, `≤${geometry.rowClientWidth + 1}`, geometry.rowScrollWidth);
    if (score > 0.5) {
      const shouldChange = bucket(score) !== bucket(score - 0.5);
      check("10배 경계 전이", `${prefix} 직전 반점 경계`, shouldChange ? comment !== previousComment : comment === previousComment, shouldChange ? "문구 변경" : "문구 유지", `${previousComment} → ${comment}`);
    }
    previousComment = comment;
  }
}

// Twenty-six real-world viewport classes × 10 categories × 10 half-star
// positions. This is more than five times the previous viewport matrix. Each
// state checks semantics, copy, geometry, exact fill, icon provenance and
// overflow instead of multiplying identical assertions at one resolution.
await context.close();
for (const viewport of viewports) {
  context = await createContext({ width: viewport.width, height: viewport.height });
  {
    const page = await writerPage();
    await page.locator(".vr-more-ratings").click();
    for (const label of ["외관", "실내", "공간", "편의·안전 사양", "주행감", "주행거리·전비", "주행 보조", "인포테인먼트"]) await auditCategory(page, label, viewport.name);
    await page.close();
  }
  {
    const page = await writerPage();
    await selectModel(page, "BMW M3");
    for (const label of ["동력·핸들링", "연비"]) await auditCategory(page, label, viewport.name);
    await page.close();
  }
  await context.close();
}
context = await createContext({ width: 390, height: 844 });

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

// Required six categories define the overall score. Optional ADAS/cockpit
// ratings must remain visible without changing list/detail averages.
{
  const page = await context.newPage();
  const review = {
    id: "local-10x-required-average",
    modelId: "ev-a06",
    title: "필수 항목 종합점수 역검증 리뷰",
    ratings: { exterior: 5, interior: 5, space: 5, features: 5, driving: 5, range: 5, adas: 0.5, cockpit: 0.5 },
    body: "선택 평가 두 항목이 낮아도 필수 여섯 항목의 종합점수는 바뀌지 않아야 하는 역검증 본문입니다.",
    owner: false,
    createdAt: "2026-10-17",
    likes: 0,
    comments: 0,
    author: "10배 검수 계정",
    ownershipLabel: "시승 리뷰",
  };
  await page.goto(`${base}?profile=dealer&shop=450554&emp=1&qf=guazi&tab=reviews&v=rating-required-average`, { waitUntil: "commit", timeout: 60_000 });
  await page.evaluate((value) => localStorage.setItem("bobae-vehicle-reviews-v1", JSON.stringify([value])), review);
  await page.reload({ waitUntil: "domcontentloaded" });
  const card = page.locator(".vr-card", { hasText: review.title }).first();
  await card.waitFor();
  const listScore = (await card.locator(".vr-card-rating strong").textContent())?.trim() ?? "";
  check("목록·상세 역검증", "선택 평가를 제외한 목록 종합점수", listScore === "5.0", "5.0", listScore);
  await card.locator(".vr-card-open").click();
  const detailScore = (await page.locator(".vr-detail-score strong").textContent())?.trim() ?? "";
  check("목록·상세 역검증", "선택 평가를 제외한 상세 종합점수", detailScore === "5.00", "5.00", detailScore);
  check("목록·상세 역검증", "선택 평가 포함 상세 행 8개", await page.locator(".vr-detail-ratings > div").count() === 8, "8", await page.locator(".vr-detail-ratings > div").count());
  const commentInput = page.getByRole("textbox", { name: "댓글 입력" });
  const commentSubmit = page.locator(".vr-comments form button[type=submit]");
  check("상세 동작", "빈 댓글 등록 비활성", await commentSubmit.isDisabled(), "true", await commentSubmit.isDisabled());
  await commentInput.fill("10배 강화 검수 댓글입니다.");
  check("상세 동작", "댓글 입력 후 등록 활성", await commentSubmit.isEnabled(), "true", await commentSubmit.isEnabled());
  await commentSubmit.click();
  check("상세 동작", "댓글 즉시 추가", await page.locator(".vr-comments article", { hasText: "10배 강화 검수 댓글입니다." }).count() === 1, "1", await page.locator(".vr-comments article", { hasText: "10배 강화 검수 댓글입니다." }).count());
  const save = page.locator('.vr-detail-actions [data-action="save"], .vr-detail-actions button').filter({ hasText: "저장" }).first();
  await save.click();
  check("상세 동작", "저장 토글", await save.getAttribute("aria-pressed") === "true", "true", await save.getAttribute("aria-pressed"));
  const helpful = page.locator(".vr-detail-actions button", { hasText: "도움돼요" });
  const unhelpful = page.locator(".vr-detail-actions button", { hasText: "별로예요" });
  await helpful.click();
  check("상세 동작", "도움돼요 토글", await helpful.getAttribute("aria-pressed") === "true", "true", await helpful.getAttribute("aria-pressed"));
  await unhelpful.click();
  check("상세 동작", "상호 배타 평가", await helpful.getAttribute("aria-pressed") === "false" && await unhelpful.getAttribute("aria-pressed") === "true", "도움 false / 별로 true", `${await helpful.getAttribute("aria-pressed")} / ${await unhelpful.getAttribute("aria-pressed")}`);
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator(".vr-delete").click();
  check("테스트 데이터 정리", "테스트 리뷰 삭제", await page.evaluate(() => JSON.parse(localStorage.getItem("bobae-vehicle-reviews-v1") ?? "[]").length) === 0, "0", await page.evaluate(() => JSON.parse(localStorage.getItem("bobae-vehicle-reviews-v1") ?? "[]").length));
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
const assertionCountBeforeFloor = rows.length;
check("게이트 자체", "최소 판정 수 57,000", assertionCountBeforeFloor >= minimumAssertions, `>=${minimumAssertions}`, assertionCountBeforeFloor);
await browser.close();

const failed = rows.filter((row) => row.result === "FAIL");
const bySection = Object.fromEntries([...new Set(rows.map((row) => row.section))].map((section) => {
  const sectionRows = rows.filter((row) => row.section === section);
  return [section, { pass: sectionRows.filter((row) => row.result === "PASS").length, fail: sectionRows.filter((row) => row.result === "FAIL").length }];
}));
const result = { generatedAt: new Date().toISOString(), base, total: rows.length, pass: rows.length - failed.length, fail: failed.length, bySection, runtimeErrors, rows };
await writeFile(join(out, "rating-matrix-results.json"), JSON.stringify(result, null, 2));
await writeFile(join(out, "rating-matrix-results.tsv"), ["section\tname\tresult\texpected\tactual", ...rows.map((row) => [row.section, row.name, row.result, row.expected, row.actual].map((value) => String(value).replaceAll("\t", " ").replaceAll("\n", " ") || "-").join("\t"))].join("\n"));
await writeFile(join(out, "rating-matrix-summary.md"), `# 차량 리뷰 강화 평점 검수\n\n- 기준 URL: ${base}\n- 전체: ${rows.length}\n- PASS: ${rows.length - failed.length}\n- FAIL: ${failed.length}\n\n${Object.entries(bySection).map(([section, value]) => `- ${section}: PASS ${value.pass} / FAIL ${value.fail}`).join("\n")}\n\n${failed.length ? `## 실패\n\n${failed.map((row) => `- ${row.name}: 기대 ${row.expected} / 실제 ${row.actual}`).join("\n")}` : "모든 강화 검수 항목을 통과했다."}\n`);
console.log(`PASS ${rows.length - failed.length} / FAIL ${failed.length}`);
for (const [section, value] of Object.entries(bySection)) console.log(`${section}: PASS ${value.pass} / FAIL ${value.fail}`);
for (const row of failed) console.log(`FAIL ${row.section} > ${row.name}: expected=${row.expected} actual=${row.actual}`);
if (failed.length) process.exit(1);
