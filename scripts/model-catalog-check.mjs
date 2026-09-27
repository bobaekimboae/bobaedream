#!/usr/bin/env node
// QF-097 점검(PR #88 보완 포함): 과쯔 모드 모델·세부 모델(카탈로그 9개 제조사). PC 1440·1280 · 모바일 393
// ① 퀵필터 모델 줄 순서 = 숫자(현행) → 영문 → 가나다 → 숫자(구형, "~현재" 없음) → 기타(벤츠 A클래스 = A-클래스). PC 는 좌측 필터 모델 목록(0대 포함 전체)도 같은 순서·같은 개수
// ② 전수 점검: 모든 모델 카드 · 세부 모델 카드 · 트림 칩을 눌러도 목록이 비지 않음(제목 "0대" 없음, 빈 목록 문구 없음)
// ③ 단계별 칩: 벤츠 → C클래스 → W206 에서 [벤츠 ×][C클래스 ×][W206 ×], 세부 모델 × / 모델 × / 제조사 × 각각의 칩·줄·경로·제목·목록 수
// ⑤ QF-105 트림 줄: 상자 높이 · 알약 규격 · "전체" 없음 · 이름표 위치 · C200 누름/× 흐름
// ④ 이미지 칸 56×28 안(폭 56 또는 높이 28, 아래 정렬) · 빈 칸 점선 · 칸 폭 PC 84 · 모바일 64(QF-100 plain 기본, 이미지 칸 위 6 · 0, 이미지 → 이름 8) · 모델 보조 글자 = 차종(매물 수 아님) · 404 0 · 콘솔 오류 0 · 줄 이름표 "세부모델"
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
const oldNumeric = new Set(catalog.flatMap((entry) => entry.models.filter((model) => /^\d/.test(cut(model.label)) && !/^\d+시리즈$/.test(cut(model.label)) && !model.models.some((sub) => /현재/.test(sub.relYear ?? ""))).map((model) => cut(model.label))));
const bucket = (name) => name === "기타" ? 9 : /^\d/.test(name) ? (oldNumeric.has(name) ? 3 : 0) : /^[A-Za-z]/.test(name) ? 1 : /^[가-힣]/.test(name) ? 2 : 4;
const latinKey = (name) => name.replace(/^([A-Za-z]+)-?클래스/, "$1-클래스").toUpperCase();
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const compare = (a, b) => (bucket(a) - bucket(b)) || (bucket(a) === 0 || bucket(a) === 3 ? (parseInt(a, 10) - parseInt(b, 10)) || cmp(latinKey(a), latinKey(b)) : bucket(a) === 1 ? cmp(latinKey(a), latinKey(b)) : a.localeCompare(b, "ko"));
const esc = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const summary = { base, measuredAt: new Date().toISOString(), makers: {}, order: {}, chips: {}, exhaustive: {}, checks: [] };
const check = (name, ok, detail) => { summary.checks.push({ name, ok, detail }); console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });

const railState = (page) => page.evaluate(() => {
  const rail = [...document.querySelectorAll("section.depth-rail")].find((section) => /모델 빠른 선택|세부모델 빠른 선택|트림 빠른 선택|연식 빠른 선택/.test(section.getAttribute("aria-label") ?? ""));
  if (!rail) return null;
  const aria = rail.getAttribute("aria-label");
  const kind = /세부모델/.test(aria) ? "sub" : /트림/.test(aria) ? "trim" : /연식/.test(aria) ? "year" : "model";
  return {
    kind, railLabel: rail.querySelector(".depth-rail-label")?.textContent ?? "",
    chips: [...rail.querySelectorAll(".trim-chip, .stable-pill")].map((chip) => ({ label: chip.textContent.trim(), disabled: chip.disabled })),
    cards: [...rail.querySelectorAll(".depth-card")].map((card) => {
      const media = card.querySelector(".depth-card-media"); const img = media?.querySelector("img"); const empty = media?.querySelector(".kr-model-empty");
      const c = card.getBoundingClientRect(); const m = media.getBoundingClientRect(); const i = img?.getBoundingClientRect();
      return {
        label: card.querySelector(".depth-card-label")?.textContent ?? "", sub: card.querySelector(".depth-card-sub")?.textContent ?? "", disabled: card.disabled,
        mediaTop: m.top - c.top, labelGap: card.querySelector(".depth-card-label").getBoundingClientRect().top - m.bottom,
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
  const titleText = top?.querySelector(".bbm-ct-title")?.textContent.replace(/\s+/g, " ").trim() ?? "";
  // QF-106: 제목은 "중고차" 고정(대수 없음) → 0대 여부는 빈 목록 문구로 본다
  const titleMatch = titleText.match(/중고차\s*([\d,]+)대/);
  const empty = /조건에 맞는 차량이 없어요/.test(document.body.textContent);
  return { chips, crumbs, title: titleText || null, count: titleMatch ? Number(titleMatch[1].replace(/,/g, "")) : null, empty };
});

for (const [tag, device, viewport] of [["pc-1440", "pc", { width: 1440, height: 900 }], ["pc-1280", "pc", { width: 1280, height: 720 }], ["m-393", "m", null]].filter(([tag]) => !only || tag === only)) {
  const context = device === "m" ? await browser.newContext({ ...devices["iPhone 13"], viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 }) : await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const slot = device === "pc" ? [76, 40] : [56, 36];
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
    // QF-108: 제조사 줄은 상위 10 + "전체 브랜드" — 줄에 없는 제조사는 "전체 브랜드" 목록에서 고른다
    if (await cardByLabel(maker).count()) { await click(cardByLabel(maker)); await settle(); return true; }
    await click(page.locator("section.depth-rail .depth-card").filter({ hasText: "전체 브랜드" }).first());
    const row = page.locator(".bbm-maker-list .bbm-maker-row").filter({ has: page.locator(".bbm-maker-name", { hasText: new RegExp(`^${esc(maker)}$`) }) }).first();
    if (!(await row.count())) return false;
    await click(row); await settle();
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
      // QF-109: 이미지 영역 PC 76×40 · 모바일 56×36(코드 정렬 228×120 을 영역에 채움, 바닥 정렬)
      imgBad: cards.filter((card) => card.img && (!card.img.loaded || card.img.w !== slot[0] || card.img.h !== slot[1] || Math.abs(card.img.bottomGap) > 0.6)).map((card) => card.label),
      emptyBad: cards.filter((card) => !card.img && !(card.empty && card.empty[0] === slot[0] && card.empty[1] === slot[1] && card.empty[2] === "dashed")).map((card) => card.label),
      specBad: cards.filter((card) => card.card[0] !== (device === "pc" ? 84 : 64) || card.media[0] !== slot[0] || card.media[1] !== slot[1] || Math.abs(card.mediaTop - (device === "pc" ? 6 : 0)) > 0.6 || Math.abs(card.labelGap - (device === "pc" ? 14 : 2)) > 0.6).map((card) => card.label),
      subBad: cards.filter((card) => card.sub && !/^(세단|SUV|해치백|쿠페|컨버터블|왜건|MPV|밴|픽업)$/.test(card.sub)).map((card) => `${card.label}:${card.sub}`),
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
            // QF-105: 알약을 누르면 바로 적용되고 트림 줄은 닫힌다 → 칩 [트림 ×] 로 풀면 다시 열린다
            await click(page.locator("section.depth-rail .trim-chip").nth(chipIndex)); await settle();
            top = await topState(page);
            results.push({ path: `${modelLabel} > ${subCard.label} > ${chip.label}`, count: top.count, ok: notZero(top) });
            if (await stepChips().count() >= 4) { await click(stepChips().nth(3).locator(".filter-chip-clear")); await settle(); }
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
  check(`${tag} 모델 이미지 영역 ${slot.join("×")}(QF-109) · 이미지가 영역을 채움 · 아래 정렬`, all.every(([, r]) => !r.imgBad?.length), all.filter(([, r]) => r.imgBad?.length).map(([m, r]) => `${m}: ${r.imgBad.join(",")}`).join(" / ") || "모두 맞음");
  check(`${tag} 모델 카드 보조 글자 = 차종(매물 수 없음)`, all.every(([, r]) => !r.subBad?.length), all.filter(([, r]) => r.subBad?.length).map(([m, r]) => `${m}: ${r.subBad.join(",")}`).join(" / ") || all.map(([m, r]) => `${m} ${r.labels.length}`).join(" · "));
  check(`${tag} 이미지 없는 카드는 점선 ${slot.join("×")} · 칸 폭 ${device === "pc" ? 84 : 64} · 이미지 영역 위 ${device === "pc" ? 6 : 0} · 이미지 → 이름 ${device === "pc" ? 14 : 2}`, all.every(([, r]) => !r.emptyBad?.length && !r.specBad?.length), all.filter(([, r]) => r.emptyBad?.length || r.specBad?.length).map(([m]) => m).join(", ") || "모두 맞음");
  if (device === "pc") {
    const bmw = (makerResults.BMW?.side?.first10 ?? []).map((row) => row.replace(/\(\d+\)$/, ""));
    check(`${tag} BMW 모델 순서 1시리즈 → … → 8시리즈 → i3`, bmw.slice(0, 9).join(" ") === "1시리즈 2시리즈 3시리즈 4시리즈 5시리즈 6시리즈 7시리즈 8시리즈 i3", bmw.join(" → "));
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
  // QF-105 트림 줄: 상자 높이(PC 32 · 모바일 40 = 위 2 + 32 + 아래 6) · 알약 규격 · "전체" 없음 · 이름표 위치
  const trimRow = await page.evaluate(() => {
    const r = document.querySelector("section.depth-rail.is-trim-row"); if (!r) return null;
    const rr = r.getBoundingClientRect(); const pills = [...r.querySelectorAll(".trim-chip")]; const p0 = pills[0].getBoundingClientRect(); const cs = getComputedStyle(pills[0]);
    const l = r.querySelector(".depth-rail-label"); const range = document.createRange(); range.selectNodeContents(l); const t = range.getBoundingClientRect(); const lcs = getComputedStyle(l);
    const topCard = document.querySelector(".bbm-hybrid-top")?.getBoundingClientRect();
    return { box: Math.round(rr.height * 10) / 10, padTop: Math.round((p0.top - rr.top) * 10) / 10, padBottom: Math.round((rr.bottom - p0.bottom) * 10) / 10, pillToCardEnd: topCard ? Math.round((topCard.bottom - p0.bottom) * 10) / 10 : null,
      labels: pills.map((p) => p.textContent.trim()), selected: pills.filter((p) => p.classList.contains("is-selected") || p.getAttribute("aria-pressed") === "true").length,
      pill: { h: p0.height, radius: cs.borderTopLeftRadius, border: `${cs.borderTopWidth} ${cs.borderTopColor}`, bg: cs.backgroundColor, font: `${cs.fontSize} ${cs.fontWeight}`, color: cs.color, pad: cs.paddingLeft },
      gap: pills.length > 1 ? Math.round((pills[1].getBoundingClientRect().left - p0.right) * 10) / 10 : null,
      label: { text: l.textContent, x: Math.round(t.left * 10) / 10, toFirst: Math.round((p0.left - t.right) * 10) / 10, dy: Math.round(((t.top + t.height / 2) - (p0.top + p0.height / 2)) * 10) / 10, font: `${lcs.fontSize} ${lcs.fontWeight} ${lcs.color}` } };
  });
  const firstChipX = await page.evaluate(() => Math.min(...[...document.querySelectorAll(".bbm-filter-button, .filter-fixed, .filter-chip")].filter((e) => e.getBoundingClientRect().width).map((e) => e.getBoundingClientRect().left)));
  summary.trimRow = { ...(summary.trimRow ?? {}), [tag]: { ...trimRow, firstChipX } };
  check(`${tag} 트림 줄 상자 ${device === "pc" ? "32(알약 아래 → 상단 카드 끝 24, QF-106)" : "40(위 2 · 아래 6)"} · 빈 공간 0`, trimRow && (device === "pc" ? trimRow.box === 32 && trimRow.pillToCardEnd === 24 : trimRow.box === 40 && trimRow.padTop === 2 && trimRow.padBottom === 6), JSON.stringify(trimRow && { box: trimRow.box, padTop: trimRow.padTop, padBottom: trimRow.padBottom, pillToCardEnd: trimRow.pillToCardEnd }));
  check(`${tag} 트림 알약(QF-106 매뉴얼 §3): 흰 바탕 · 1px #DADADA · 32 · 완전 둥근 · 좌우 16 · 14px 500 #222 · 사이 8 · "전체" 칩·선택 표시 없음`, trimRow && trimRow.pill.h === 32 && trimRow.pill.border === "1px rgb(218, 218, 218)" && trimRow.pill.bg === "rgb(255, 255, 255)" && trimRow.pill.font === "14px 500" && trimRow.pill.color === "rgb(34, 34, 34)" && trimRow.pill.pad === "16px" && parseFloat(trimRow.pill.radius) >= 16 && trimRow.gap === 8 && !trimRow.labels.includes("전체") && trimRow.selected === 0, JSON.stringify(trimRow && { ...trimRow.pill, gap: trimRow.gap, labels: trimRow.labels.join(",") }));
  const labelX = device === "pc" ? firstChipX : firstChipX - 4;
  check(`${tag} 트림 이름표 "트림:" 14px 400 #595959 · 왼쪽 = ${device === "pc" ? "첫 칩" : "첫 칩 − 4"}(${labelX}) · 첫 알약까지 12 · 세로 가운데`, trimRow && trimRow.label.text === "트림:" && trimRow.label.font === "14px 400 rgb(89, 89, 89)" && Math.abs(trimRow.label.x - labelX) <= 0.6 && Math.abs(trimRow.label.toFirst - 12) <= 1 && Math.abs(trimRow.label.dy) <= 1, JSON.stringify(trimRow?.label));
  // 흐름: C200 누름 → 칩 [벤츠][C클래스][W206][C200] · 트림 줄 닫힘 · 제목·경로 → [C200 ×] → 트림 줄 다시 열림
  await click(page.locator("section.depth-rail.is-trim-row .trim-chip").filter({ hasText: /^C200$/ }).first()); await settle();
  await record("W206 → C200"); await shot("trim-c200");
  await click(chipClear("C200")); await settle(); await record("C200 ×"); await shot("trim-reopen");
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
  if (device === "pc") check(`${tag} 제목 "중고차" 고정(QF-106 · 모든 단계, 대수 없음)`, steps.every((step) => step.title === "중고차"), [...new Set(steps.map((step) => step.title ?? "-"))].join(" / "));
  const t1 = at("W206 → C200"); const t2 = at("C200 ×");
  check(`${tag} C200 누름 → 칩 [벤츠][C클래스][W206][C200] · ④ = 연식 줄(QF-106)${device === "pc" ? " · 경로에 C200" : ""}`, ["벤츠", "C클래스", "W206", "C200"].every((label) => t1.chips.includes(label)) && /^연식/.test(t1.rail) && (device !== "pc" || /C200$/.test(t1.crumbs)) && !t1.empty, `${t1.chips.join(" ")} · 줄 ${t1.rail} · ${t1.title ?? "-"} · ${t1.crumbs || "-"}`);
  check(`${tag} [C200 ×] → 트림만 풀림 · 트림 줄 다시 열림`, !t2.chips.includes("C200") && t2.chips.includes("W206") && /^트림/.test(t2.rail), `${t2.chips.join(" ")} · 줄 ${t2.rail}`);
  check(`${tag} 줄 이름표 "세부모델:"`, railAfterModel?.railLabel === "세부모델:", railAfterModel?.railLabel ?? "없음");

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
