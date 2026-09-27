#!/usr/bin/env node
// QF-097 점검(PR #88 보완 포함): 과쯔 모드 모델·세부 모델(카탈로그 9개 제조사). PC 1440·1280 · 모바일 393
// ① 퀵필터 모델 줄 순서 = 숫자(현행) → 영문 → 가나다 → 숫자(구형, "~현재" 없음) → 기타(벤츠 A클래스 = A-클래스). PC 는 좌측 필터 모델 목록(0대 포함 전체)도 같은 순서·같은 개수
// ② 전수 점검: 모든 모델 카드 · 세부 모델 카드 · 트림 칩을 눌러도 목록이 비지 않음(제목 "0대" 없음, 빈 목록 문구 없음)
// ③ 단계별 칩: 벤츠 → C클래스 → W206 에서 [벤츠 ×][C클래스 ×][W206 ×], 세부 모델 × / 모델 × / 제조사 × 각각의 칩·줄·경로·제목·목록 수
// ④ 이미지 칸 56×28 안(폭 56 또는 높이 28, 아래 정렬) · 빈 칸 점선 · 카드 80×72 · 404 0 · 콘솔 오류 0 · 줄 이름표 "세부모델"
// 캡처: reports/qf-097/  요약: reports/diff/models-summary[-크기].json
// 사용: npm run check:models [-- --base=<주소>] [-- --only=pc-1440|pc-1280|m-393] (메모리가 모자라면 화면 크기별로 나눠 돌린다)
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
// 순서: 숫자로 시작하는 현행 모델 → 영문 → 가나다 → 숫자로 시작하는 구형 모델(세부 모델에 "~현재" 없음) → 기타
const oldNumeric = new Set(catalog.flatMap((entry) => entry.models.filter((model) => /^\d/.test(cut(model.label)) && !model.models.some((sub) => /현재/.test(sub.relYear ?? ""))).map((model) => cut(model.label))));
const bucket = (name) => name === "기타" ? 9 : /^\d/.test(name) ? (oldNumeric.has(name) ? 3 : 0) : /^[A-Za-z]/.test(name) ? 1 : /^[가-힣]/.test(name) ? 2 : 4;
const latinKey = (name) => name.replace(/^([A-Za-z]+)-?클래스/, "$1-클래스").toUpperCase();
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const compare = (a, b) => (bucket(a) - bucket(b)) || (bucket(a) === 0 || bucket(a) === 3 ? (parseInt(a, 10) - parseInt(b, 10)) || cmp(latinKey(a), latinKey(b)) : bucket(a) === 1 ? cmp(latinKey(a), latinKey(b)) : a.localeCompare(b, "ko"));
const esc = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const summary = { base, measuredAt: new Date().toISOString(), makers: {}, order: {}, chips: {}, exhaustive: {}, checks: [] };
const check = (name, ok, detail) => { summary.checks.push({ name, ok, detail }); console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });

const railState = (page) => page.evaluate(() => {
  const rail = [...document.querySelectorAll("section.depth-rail")].find((section) => /모델 빠른 선택|세부모델 빠른 선택|트림 빠른 선택/.test(section.getAttribute("aria-label") ?? ""));
  if (!rail) return null;
  const aria = rail.getAttribute("aria-label");
  const kind = /세부모델/.test(aria) ? "sub" : /트림/.test(aria) ? "trim" : "model";
  return {
    kind, railLabel: rail.querySelector(".depth-rail-label")?.textContent ?? "",
    chips: [...rail.querySelectorAll(".trim-chip")].map((chip) => ({ label: chip.textContent.trim(), disabled: chip.disabled })),
    cards: [...rail.querySelectorAll(".depth-card")].map((card) => {
      const media = card.querySelector(".depth-card-media"); const img = media?.querySelector("img"); const empty = media?.querySelector(".kr-model-empty");
      const c = card.getBoundingClientRect(); const m = media.getBoundingClientRect(); const i = img?.getBoundingClientRect();
      return {
        label: card.querySelector(".depth-card-label")?.textContent ?? "", sub: card.querySelector(".depth-card-sub")?.textContent ?? "", disabled: card.disabled,
        card: [Math.round(c.width), Math.round(c.height)], selected: card.classList.contains("is-selected"), media: [Math.round(m.width), Math.round(m.height)],
        img: img ? { w: Math.round(i.width * 10) / 10, h: Math.round(i.height * 10) / 10, bottomGap: Math.round((m.bottom - i.bottom) * 10) / 10, loaded: img.complete && img.naturalWidth > 0 } : null,
        empty: empty ? (() => { const e = empty.getBoundingClientRect(); return [Math.round(e.width), Math.round(e.height), getComputedStyle(empty).borderStyle]; })() : null,
      };
    }),
  };
});
// 칩 줄 · 경로 · 제목 · 목록(모바일은 제목이 없어 빈 목록 문구로 본다)
const topState = (page) => page.evaluate(() => {
  // 보이는 칩 줄(PC 는 상단 영역, 모바일은 칩 줄)
  const chips = [...document.querySelectorAll(".filter-chip")].filter((chip) => chip.getClientRects().length && chip.getBoundingClientRect().width > 0).map((chip) => ({ label: chip.textContent.trim(), active: chip.classList.contains("is-active") }));
  const top = document.querySelector(".bbm-hybrid-top");
  const crumbs = top?.querySelector(".bbm-breadcrumb, [aria-label='현재 위치']")?.textContent.replace(/\s+/g, " ").trim() ?? "";
  const titleMatch = top?.textContent.match(/([^\n]*?)중고차\s*([\d,]+)대/);
  const empty = /조건에 맞는 차량이 없어요/.test(document.body.textContent);
  return { chips, crumbs, title: titleMatch ? `중고차 ${titleMatch[2]}대` : null, count: titleMatch ? Number(titleMatch[2].replace(/,/g, "")) : null, empty };
});

for (const [tag, device, viewport] of [["pc-1440", "pc", { width: 1440, height: 900 }], ["pc-1280", "pc", { width: 1280, height: 720 }], ["m-393", "m", null]].filter(([tag]) => !only || tag === only)) {
  const context = device === "m" ? await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 }) : await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = []; const missing = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400 && /\/assets\//.test(response.url())) missing.push(`${response.status()} ${response.url()}`); });
  const click = async (locator) => { await locator.scrollIntoViewIfNeeded({ timeout: 5000 }); await (device === "m" ? locator.tap() : locator.click()); await page.waitForTimeout(300); };
  const cardByLabel = (label) => page.locator("section.depth-rail .depth-card").filter({ has: page.locator(".depth-card-label", { hasText: new RegExp(`^${esc(label)}$`) }) }).first();
  const stepChips = () => page.locator(".filter-chip.is-step:visible");
  const chipClear = (label) => stepChips().filter({ hasText: new RegExp(`^${esc(label)}$`) }).locator(".filter-chip-clear").first();
  const settle = () => page.waitForFunction(() => [...document.querySelectorAll(".depth-rail img")].every((img) => img.complete), null, { timeout: 15000 }).catch(() => {});
  const openMaker = async (maker) => {
    await page.goto(`${base}?qf=guazi${device === "m" ? "" : "&pc=1"}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(300);
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}" });
    await click(page.locator(".bbm-category-menu__button").filter({ hasText: /^중고차/ }).first());
    if (!(await cardByLabel(maker).count())) return false;
    await click(cardByLabel(maker)); await settle();
    return true;
  };
  const notZero = (state) => !state.empty && (state.count === null || state.count > 0);

  const makerResults = {}; const exhaustive = {};
  for (const { maker } of catalog) {
    if (!(await openMaker(maker))) { makerResults[maker] = { error: "제조사 카드 없음" }; continue; }
    const state = await railState(page);
    const cards = state?.kind === "model" ? state.cards : [];
    const labels = cards.map((card) => card.label);
    makerResults[maker] = {
      cards: labels.length, labels, orderOk: labels.join("|") === [...labels].sort(compare).join("|"),
      withImage: cards.filter((card) => card.img).length, empty: cards.filter((card) => card.empty).length,
      imgBad: cards.filter((card) => card.img && (!card.img.loaded || card.img.w > 56.5 || card.img.h > 28.5 || (Math.abs(card.img.w - 56) > 0.6 && Math.abs(card.img.h - 28) > 0.6) || Math.abs(card.img.bottomGap) > 0.6)).map((card) => card.label),
      emptyBad: cards.filter((card) => !card.img && !(card.empty && card.empty[0] === 56 && card.empty[1] === 28 && card.empty[2] === "dashed")).map((card) => card.label),
      specBad: cards.filter((card) => card.card[0] !== 80 || card.card[1] !== 72 || card.media[0] !== 56 || card.media[1] !== 28).map((card) => card.label),
      disabled: cards.filter((card) => card.disabled).map((card) => card.label),
    };
    // PC: 좌측 필터 모델 목록(0대 포함 전체, 같은 순서) — 제조사 선택으로 모델 단계가 열려 있다
    if (device === "pc") {
      const rows = await page.evaluate(() => [...document.querySelectorAll("aside.bbm-filter .bbm-catalog-row")].map((row) => ({ label: row.querySelector("span")?.textContent ?? "", count: Number((row.querySelector("em")?.textContent ?? "0").replace(/,/g, "")) })));
      const expected = [...new Set(catalog.find((entry) => entry.maker === maker).models.map((model) => cut(model.label)))];
      makerResults[maker].side = { rows: rows.length, expected: expected.length, zero: rows.filter((row) => row.count === 0).length, orderOk: rows.map((row) => row.label).join("|") === rows.map((row) => row.label).sort(compare).join("|"), first10: rows.slice(0, 10).map((row) => `${row.label}(${row.count})`), railMatchesNonZero: rows.filter((row) => row.count > 0).map((row) => row.label).join("|") === labels.join("|") };
    }
    // 전수 점검: 모델 카드 → 세부 모델 카드 → 트림 칩, 눌러도 0대 없음
    const results = [];
    for (const modelLabel of labels) {
      try {
      await openMaker(maker);
      await click(cardByLabel(modelLabel)); await settle();
      let top = await topState(page);
      results.push({ path: modelLabel, count: top.count, ok: notZero(top) });
      const sub = await railState(page);
      if (sub?.kind !== "sub") continue;
      for (let index = 0; index < sub.cards.length; index += 1) {
        const subCard = sub.cards[index];
        if (!subCard.selected) { await click(page.locator("section.depth-rail .depth-card").nth(index)); await settle(); }
        top = await topState(page);
        results.push({ path: `${modelLabel} > ${subCard.label}(${subCard.sub})`, count: top.count, ok: notZero(top) });
        const trim = await railState(page);
        if (trim?.kind === "trim") {
          for (const [chipIndex, chip] of trim.chips.entries()) {
            if (chip.disabled) { results.push({ path: `${modelLabel} > ${subCard.label} > ${chip.label}`, count: 0, ok: true, disabled: true }); continue; }
            await click(page.locator("section.depth-rail .trim-chip").nth(chipIndex));
            top = await topState(page);
            results.push({ path: `${modelLabel} > ${subCard.label} > ${chip.label}`, count: top.count, ok: notZero(top) });
            await click(page.locator("section.depth-rail .trim-chip").nth(chipIndex));
          }
        }
        // 세부 모델 × 로 세부 모델 줄로(칩 세 번째)
        if (await stepChips().count() >= 3) { await click(stepChips().nth(2).locator(".filter-chip-clear")); await settle(); }
      }
      } catch (error) {
        const now = await railState(page).catch(() => null);
        results.push({ path: `${modelLabel} (점검 중단: ${String(error.message).split(String.fromCharCode(10))[0].slice(0, 80)} · 지금 줄 ${now?.kind} ${now?.cards.map((card) => card.label).join(",")} · 칩 ${(await topState(page)).chips.filter((chip) => chip.active).map((chip) => chip.label).join(" ")})`, ok: false });
      }
    }
    exhaustive[maker] = { total: results.length, zero: results.filter((item) => !item.ok).map((item) => item.path), disabledTrims: results.filter((item) => item.disabled).length, paths: results.map((item) => `${item.path} ${item.disabled ? "비활성" : `${item.count ?? "-"}대`}`) };
  }
  summary.makers[tag] = makerResults; summary.exhaustive[tag] = exhaustive;
  const all = Object.entries(makerResults);
  check(`${tag} 퀵필터 모델 순서 숫자(현행) → 영문 → 가나다 → 숫자(구형) → 기타`, all.every(([, r]) => r.orderOk), all.filter(([, r]) => !r.orderOk).map(([m]) => m).join(", ") || all.map(([m, r]) => `${m} ${r.cards}`).join(" · "));
  check(`${tag} 퀵필터 모델 카드는 샘플 매물 1대 이상만(비활성 카드 없음)`, all.every(([, r]) => !r.disabled?.length && r.cards > 0), all.filter(([, r]) => r.disabled?.length).map(([m, r]) => `${m}: ${r.disabled.join(",")}`).join(" / ") || "모두 맞음");
  check(`${tag} 전수 점검: 모델·세부 모델·트림을 눌러도 0대 없음`, Object.values(exhaustive).every((r) => !r.zero.length), Object.entries(exhaustive).map(([m, r]) => `${m} ${r.total}번${r.zero.length ? ` 0대 ${r.zero.join(",")}` : ""}`).join(" · "));
  check(`${tag} 모델 이미지 칸 56×28 안 · 폭 56 또는 높이 28 · 아래 정렬`, all.every(([, r]) => !r.imgBad?.length), all.filter(([, r]) => r.imgBad?.length).map(([m, r]) => `${m}: ${r.imgBad.join(",")}`).join(" / ") || "모두 맞음");
  check(`${tag} 이미지 없는 카드는 점선 56×28 · 카드 80×72`, all.every(([, r]) => !r.emptyBad?.length && !r.specBad?.length), all.filter(([, r]) => r.emptyBad?.length || r.specBad?.length).map(([m]) => m).join(", ") || "모두 맞음");
  if (device === "pc") {
    check(`${tag} 좌측 필터 모델 목록 = 카탈로그 전체(0대 포함) · 같은 순서`, all.every(([, r]) => r.side && r.side.rows === r.side.expected && r.side.orderOk), all.map(([m, r]) => `${m} ${r.side?.rows}/${r.side?.expected}(0대 ${r.side?.zero})`).join(" · "));
    check(`${tag} 좌측 필터 1대 이상 모델 = 퀵필터 모델 카드(수 기준 하나)`, all.every(([, r]) => r.side?.railMatchesNonZero), all.filter(([, r]) => !r.side?.railMatchesNonZero).map(([m]) => m).join(", ") || "모두 같음");
    summary.order[tag] = Object.fromEntries(all.map(([m, r]) => [m, r.side?.first10]));
  }

  // 단계별 칩: 벤츠 → C클래스 → W206 (E클래스는 샘플 매물 이름에 세부 모델 코드가 없어 세부 모델 카드가 없다)
  const shot = async (name) => device === "m"
    ? page.screenshot({ path: join(outDir, `${tag}-${name}.png`), clip: { x: 0, y: 0, width: 393, height: 240 } })
    : page.locator(".bbm-hybrid-top").first().screenshot({ path: join(outDir, `${tag}-${name}.png`) });
  const steps = [];
  const record = async (step) => { const top = await topState(page); const rail = await railState(page); steps.push({ step, chips: top.chips.filter((chip) => chip.active).map((chip) => chip.label), emptyChips: top.chips.filter((chip) => !chip.active).map((chip) => chip.label), rail: rail ? `${rail.railLabel || rail.kind} ${rail.cards.length || rail.chips.length}개` : "없음", crumbs: top.crumbs, title: top.title, count: top.count, empty: top.empty }); };
  await openMaker("벤츠"); await shot("benz-models");
  await record("벤츠");
  await click(cardByLabel("C클래스")); await settle();
  const railAfterModel = await railState(page);
  await shot("benz-c-sub"); await record("벤츠 → C클래스");
  await click(cardByLabel("W206")); await settle();
  await record("벤츠 → C클래스 → W206"); await shot("chips-3");
  await click(chipClear("W206")); await settle(); await record("세부모델 ×");
  await click(cardByLabel("W206")); await settle();
  await click(chipClear("C클래스")); await settle(); await record("모델 ×");
  await click(cardByLabel("C클래스")); await settle(); await click(cardByLabel("W206")); await settle();
  await click(chipClear("벤츠")); await settle(); await record("제조사 ×");
  summary.chips[tag] = steps;
  const at = (name) => steps.find((step) => step.step === name);
  const s0 = at("벤츠 → C클래스 → W206"); const s1 = at("세부모델 ×"); const s2 = at("모델 ×"); const s3 = at("제조사 ×");
  check(`${tag} 칩 3개 [벤츠 ×][C클래스 ×][W206 ×] · 빈 "제조사/모델" 칩 없음`, ["벤츠", "C클래스", "W206"].every((label) => s0.chips.includes(label)) && !s0.emptyChips.some((label) => /^(제조사|모델)$/.test(label)), `적용 ${s0.chips.join(" ")} · 빈 칩 ${s0.emptyChips.join(" ")} · 경로 ${s0.crumbs || "-"} · ${s0.title ?? "-"}`);
  check(`${tag} 세부모델 × → 세부모델 줄 · [벤츠][C클래스] 유지`, s1.chips.includes("벤츠") && s1.chips.includes("C클래스") && !s1.chips.includes("W206") && /세부모델/.test(s1.rail), `${s1.chips.join(" ")} · 줄 ${s1.rail} · ${s1.title ?? "-"}`);
  check(`${tag} 모델 × → 모델 줄 · [벤츠] 유지`, s2.chips.includes("벤츠") && !s2.chips.includes("C클래스") && /^모델/.test(s2.rail), `${s2.chips.join(" ")} · 줄 ${s2.rail} · ${s2.title ?? "-"}`);
  check(`${tag} 제조사 × → 제조사 줄`, !s3.chips.includes("벤츠") && !s3.chips.includes("C클래스") && s3.emptyChips.includes("제조사"), `${s3.chips.join(" ")} · 빈 칩 ${s3.emptyChips.join(" ")} · ${s3.title ?? "-"}`);
  check(`${tag} 칩 단계마다 목록 0대 없음`, steps.every((step) => !step.empty && (step.count === null || step.count > 0)), steps.map((step) => `${step.step} ${step.count ?? "-"}대`).join(" · "));
  check(`${tag} 줄 이름표 "세부모델"`, railAfterModel?.railLabel === "세부모델", railAfterModel?.railLabel ?? "없음");

  // 캡처: 포르쉐 모델 줄 → 718(911 은 샘플 매물이 없어 카드 없음) · 현대 → 그랜저
  await openMaker("포르쉐"); await shot("porsche-models");
  await click(cardByLabel("718")); await settle(); await shot("porsche-718");
  await openMaker("현대"); await click(cardByLabel("그랜저")); await settle(); await shot("hyundai-grandeur");
  check(`${tag} 이미지·에셋 404 없음`, missing.length === 0, missing.slice(0, 5).join(" / ") || "0");
  check(`${tag} 콘솔 오류 0`, errors.length === 0, errors.slice(0, 3).join(" / ") || "0");
  await context.close();
}
writeFileSync(join("reports", "diff", `models-summary${only ? `-${only}` : ""}.json`), JSON.stringify(summary, null, 2));
await browser.close();
const failed = summary.checks.filter((item) => !item.ok).length;
console.log(`결과: reports/diff/models-summary${only ? `-${only}` : ""}.json · 통과 ${summary.checks.length - failed}/${summary.checks.length}`);
process.exitCode = failed ? 1 : 0;
