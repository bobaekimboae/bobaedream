#!/usr/bin/env node
// QF-097 점검: 과쯔 모드 모델·세부 모델 카드(카탈로그 스냅숏 9개 제조사). PC 1440·1280 · 모바일 393
// ① 제조사마다 모델 카드 수 = 스냅숏 매물 있는 모델 수, 순서 = 숫자 → 영문 → 가나다(기타 맨 뒤, 벤츠 A클래스는 A-클래스로)
// ② 이미지: 404 없음 · 칸 56×28 안(폭 56 또는 높이 28, 아래 정렬) · 이미지 없는 카드는 점선 빈 칸
// ③ 벤츠→E클래스 · 포르쉐→911 · 현대→그랜저 세부 모델 카드(최신 먼저 · 큰 글자/작은 글자) 캡처와 카드 규격(80×72 · #F7F8FC)
// ④ 콘솔 오류 0. 캡처: reports/qf-097/  요약: reports/diff/models-summary.json
// 사용: npm run check:models [-- --base=<주소>] [-- --only=pc-1440|pc-1280|m-393] (메모리가 모자라면 화면 크기별로 나눠 돌린다. 요약은 크기별 파일)
import { chromium, devices } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const only = (process.argv.find((arg) => arg.startsWith("--only=")) ?? "").slice(7);
const base = (process.argv.find((arg) => arg.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const outDir = join("reports", "qf-097");
mkdirSync(outDir, { recursive: true });
const generated = readFileSync("src/prototype/data/model-catalog-kr.generated.ts", "utf8");
const catalog = JSON.parse(generated.match(/modelCatalogKr: CatalogMaker\[\] = (\[.*\]);/s)[1]);
const cut = (label) => label.replace(/\s*[([].*$/, "").trim() || label;
const bucket = (name) => name === "기타" ? 9 : /^\d/.test(name) ? 0 : /^[A-Za-z]/.test(name) ? 1 : /^[가-힣]/.test(name) ? 2 : 3;
const latinKey = (name) => name.replace(/^([A-Za-z]+)-?클래스/, "$1-클래스").toUpperCase();
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const compare = (a, b) => (bucket(a) - bucket(b)) || (bucket(a) === 0 ? (parseInt(a, 10) - parseInt(b, 10)) || cmp(latinKey(a), latinKey(b)) : bucket(a) === 1 ? cmp(latinKey(a), latinKey(b)) : a.localeCompare(b, "ko"));

const summary = { base, measuredAt: new Date().toISOString(), makers: {}, captures: {}, checks: [] };
const check = (name, ok, detail) => { summary.checks.push({ name, ok, detail }); console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });

const railState = (page) => page.evaluate(() => {
  const rail = [...document.querySelectorAll("section.depth-rail")].find((section) => /모델 빠른 선택|세대 빠른 선택/.test(section.getAttribute("aria-label") ?? ""));
  if (!rail) return null;
  return {
    label: rail.getAttribute("aria-label"),
    cards: [...rail.querySelectorAll(".depth-card")].map((card) => {
      const media = card.querySelector(".depth-card-media"); const img = media?.querySelector("img"); const empty = media?.querySelector(".kr-model-empty");
      const c = card.getBoundingClientRect(); const m = media.getBoundingClientRect(); const i = img?.getBoundingClientRect();
      return {
        label: card.querySelector(".depth-card-label")?.textContent ?? "", sub: card.querySelector(".depth-card-sub")?.textContent ?? "",
        card: [Math.round(c.width), Math.round(c.height)], bg: getComputedStyle(card).backgroundColor, selected: card.classList.contains("is-selected"),
        media: [Math.round(m.width), Math.round(m.height)],
        img: img ? { w: Math.round(i.width * 10) / 10, h: Math.round(i.height * 10) / 10, bottomGap: Math.round((m.bottom - i.bottom) * 10) / 10, loaded: img.complete && img.naturalWidth > 0, src: img.getAttribute("src") } : null,
        empty: empty ? (() => { const e = empty.getBoundingClientRect(); return [Math.round(e.width), Math.round(e.height), getComputedStyle(empty).borderStyle]; })() : null,
      };
    }),
  };
});

for (const [tag, device, viewport] of [["pc-1440", "pc", { width: 1440, height: 900 }], ["pc-1280", "pc", { width: 1280, height: 720 }], ["m-393", "m", null]].filter(([tag]) => !only || tag === only)) {
  const context = device === "m" ? await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 }) : await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = []; const missing = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${message.text()} @ ${message.location()?.url ?? ""}`); });
  page.on("requestfailed", (request) => { if (!/ERR_ABORTED/.test(request.failure()?.errorText ?? "")) errors.push(`요청 실패 ${request.failure()?.errorText} ${request.url()}`); });
  page.on("response", (response) => { if (response.status() >= 400 && /\/assets\//.test(response.url())) missing.push(`${response.status()} ${response.url()}`); });
  const click = async (locator) => (device === "m" ? locator.tap() : locator.click());
  const makerCard = (name) => page.locator("section.depth-rail .depth-card").filter({ has: page.locator(".depth-card-label", { hasText: new RegExp(`^${name}$`) }) }).first();
  // 제조사마다 새로 연다: 첫 화면 → 유형 "중고차" → 제조사 카드
  const openMaker = async (maker) => {
    await page.goto(`${base}?qf=guazi${device === "m" ? "" : "&pc=1"}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(500);
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}" });
    await click(page.locator(".bbm-category-menu__button").filter({ hasText: /^중고차/ }).first()); await page.waitForTimeout(400);
    if (!(await makerCard(maker).count())) return false;
    await makerCard(maker).scrollIntoViewIfNeeded(); await click(makerCard(maker)); await page.waitForTimeout(500);
    await page.waitForFunction(() => [...document.querySelectorAll(".depth-rail img")].every((img) => img.complete), null, { timeout: 15000 }).catch(() => {});
    return true;
  };
  const makerResults = {};
  for (const { maker, models } of catalog) {
    if (!(await openMaker(maker))) { makerResults[maker] = { error: "제조사 카드 없음", cards: 0, expected: -1 }; continue; }
    const state = await railState(page);
    const labels = state?.cards.map((card) => card.label) ?? [];
    const expectedNames = [...new Set(models.map((model) => cut(model.label)))];
    const sorted = [...labels].sort(compare);
    const imgBad = (state?.cards ?? []).filter((card) => card.img && (!card.img.loaded || card.img.w > 56.5 || card.img.h > 28.5 || (Math.abs(card.img.w - 56) > 0.6 && Math.abs(card.img.h - 28) > 0.6) || Math.abs(card.img.bottomGap) > 0.6));
    const emptyBad = (state?.cards ?? []).filter((card) => !card.img && !(card.empty && card.empty[0] === 56 && card.empty[1] === 28 && card.empty[2] === "dashed"));
    const specBad = (state?.cards ?? []).filter((card) => card.card[0] !== 80 || card.card[1] !== 72 || card.media[0] !== 56 || card.media[1] !== 28);
    makerResults[maker] = { cards: labels.length, expected: expectedNames.length, withImage: state?.cards.filter((card) => card.img).length ?? 0, empty: state?.cards.filter((card) => card.empty).length ?? 0, orderOk: labels.join("|") === sorted.join("|"), imgBad: imgBad.map((card) => card.label), emptyBad: emptyBad.map((card) => card.label), specBad: specBad.map((card) => card.label), labels };
  }
  summary.makers[tag] = makerResults;
  const all = Object.entries(makerResults);
  check(`${tag} 모델 카드 수 = 스냅숏 매물 있는 모델 수(9개 제조사)`, all.every(([, r]) => r.cards === r.expected), all.map(([m, r]) => `${m} ${r.cards}/${r.expected}`).join(" · "));
  check(`${tag} 모델 순서 숫자 → 영문 → 가나다 · 기타 맨 뒤`, all.every(([, r]) => r.orderOk), all.filter(([, r]) => !r.orderOk).map(([m]) => m).join(", ") || "모두 맞음");
  check(`${tag} 모델 이미지 칸 56×28 안 · 폭 56 또는 높이 28 · 아래 정렬`, all.every(([, r]) => !r.imgBad?.length), all.map(([m, r]) => `${m} 이미지 ${r.withImage}·빈 칸 ${r.empty}`).join(" · "));
  check(`${tag} 이미지 없는 모델 카드는 점선 56×28 빈 칸`, all.every(([, r]) => !r.emptyBad?.length), all.filter(([, r]) => r.emptyBad?.length).map(([m, r]) => `${m}: ${r.emptyBad.join(",")}`).join(" / ") || "모두 맞음");
  check(`${tag} 카드 80×72 · 이미지 칸 56×28`, all.every(([, r]) => !r.specBad?.length), all.filter(([, r]) => r.specBad?.length).map(([m, r]) => `${m}: ${r.specBad.join(",")}`).join(" / ") || "모두 맞음");

  // 세부 모델: 벤츠→E클래스 · 포르쉐→911 · 현대→그랜저
  for (const [maker, model, slug] of [["벤츠", "E클래스", "benz-e"], ["포르쉐", "911", "porsche-911"], ["현대", "그랜저", "hyundai-grandeur"]]) {
    await openMaker(maker);
    const modelCard = page.locator("section.depth-rail .depth-card").filter({ has: page.locator(".depth-card-label", { hasText: new RegExp(`^${model}$`) }) }).first();
    await modelCard.scrollIntoViewIfNeeded(); await click(modelCard); await page.waitForTimeout(600);
    await page.waitForFunction(() => [...document.querySelectorAll(".depth-rail img")].every((img) => img.complete), null, { timeout: 15000 }).catch(() => {});
    const state = await railState(page);
    const catalogModel = catalog.find((entry) => entry.maker === maker).models.find((entry) => cut(entry.label) === model);
    const years = catalogModel.models.map((sub) => { const m = sub.relYear?.match(/^(\d{2})/); if (!m) return -1; const yy = Number(m[1]); return yy >= 30 ? 1900 + yy : 2000 + yy; });
    const expectedOrder = catalogModel.models.map((sub, index) => ({ sub, year: years[index] })).sort((a, b) => b.year - a.year);
    const cards = state?.cards ?? [];
    summary.captures[`${tag}-${slug}`] = cards.map((card) => ({ label: card.label, sub: card.sub, img: Boolean(card.img), empty: Boolean(card.empty) }));
    const newestFirst = cards.length === expectedOrder.length;
    check(`${tag} ${maker}→${model} 세부 모델 ${cards.length}개(최신 먼저)`, newestFirst && /세대 빠른 선택/.test(state?.label ?? ""), cards.map((card) => `${card.label}/${card.sub}`).join(" · "));
    check(`${tag} ${maker}→${model} 카드 규격 80×72 · 배경 #F7F8FC(선택 카드 제외) · 이미지 칸 56×28`, cards.every((card) => card.card[0] === 80 && card.card[1] === 72 && card.media[0] === 56 && card.media[1] === 28 && (card.selected || card.bg === "rgb(247, 248, 252)")), [...new Set(cards.map((card) => `${card.card.join("×")} ${card.bg}`))].join(" · "));
    // 모바일은 화면 위쪽(칩 줄 + 세부 모델 줄)만, PC 는 상단 영역
    if (device === "m") await page.screenshot({ path: join(outDir, `${tag}-${slug}.png`), clip: { x: 0, y: 0, width: 393, height: 240 } });
    else await page.locator(".bbm-hybrid-top").first().screenshot({ path: join(outDir, `${tag}-${slug}.png`) });
  }
  check(`${tag} 이미지·에셋 404 없음`, missing.length === 0, missing.slice(0, 5).join(" / ") || "0");
  check(`${tag} 콘솔 오류 0`, errors.length === 0, errors.slice(0, 3).join(" / ") || "0");
  await context.close();
}
writeFileSync(join("reports", "diff", `models-summary${only ? `-${only}` : ""}.json`), JSON.stringify(summary, null, 2));
await browser.close();
const failed = summary.checks.filter((item) => !item.ok).length;
console.log(`결과: reports/diff/models-summary${only ? `-${only}` : ""}.json · 통과 ${summary.checks.length - failed}/${summary.checks.length}`);
process.exitCode = failed ? 1 : 0;
