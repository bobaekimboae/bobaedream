#!/usr/bin/env node
// QF-106 상단 구조 안정성 자동 점검(docs/stable-top-manual.md v1.3 — 아래 기준 값은 매뉴얼 표와 같아야 한다). check:rail-vertical 을 합쳤다.
// QF-106b: PC 0층 경로는 카드 밖(상단 메뉴 아래 16 · 카드 왼쪽 선 · 경로 → 카드 12), 첫 화면(유형 줄)도 이미지 줄 높이로 점검
// QF-113: 처음 → C200 정렬 점검(첫 칸 x · 필터 다음 칩 x · 이미지 줄 위 끝·바닥선)
// QF-111: 끝에 지역 단계(PC 서울 → 강남구, 모바일 시트 서울 → 강남구)
// 흐름: 첫 화면(유형 줄) → 처음(유형 "중고차") → 벤츠 → C클래스 → W206 → C200 → 2023 → 연식 해제 → 필터 초기화 · 크기: PC 1440·1280 / 모바일 393·360 · 모양: plain(기본)·card
// 확인: ① 층 순서·개수 ② 층 간격(±0.5) ③ PC 카드 높이 = 허용 두 값 중 하나, 앞으로 가는 흐름(처음 → 2023) 높이 변화 1회
//       ④ 칸 넘침 0 · 가로 스크롤바 보임 0 · 줄바꿈 0 ⑤ 제목 고정, 숫자·"년"·"월" 0 ⑥ 이미지 로딩 전후 층 위치 차이 0 ⑦ 모바일 지역 칩 줄 없음 · 경로·제목이 회색 띠 아래
// 사용: npm run check:stability [-- --base=<주소>] [-- --mode=plain|card] [-- --only=pc-1440|pc-1280|m-393|m-360]
// 결과: reports/qf-106/stability-<모양>.json · 단계 × 크기 표(콘솔) · 실패 캡처 reports/qf-106/fail-*.png
import { chromium } from "@playwright/test";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const arg = (name) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? "").slice(name.length + 3);
const base = arg("base") || "http://127.0.0.1:4173/bobaedream/";
const modes = arg("mode") ? [arg("mode")] : ["plain", "card"];
const only = arg("only");
const outDir = join("reports", "qf-106");
mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(outDir)) if (/^fail-.*\.png$/.test(name)) rmSync(join(outDir, name)); // 지난 실패 캡처는 지운다

// ── 매뉴얼 v1.3 기준 값
const SPEC = {
  pc: {
    card: ".bbm-hybrid-top .bbm-content-head",
    crumbs: { sel: ".bbm-hybrid-top > .bbm-ct-crumbs", h: 18, fromHeader: 16, toCard: 12 },
    layers: [
      { id: "①", sel: ".bbm-ct-title-row", h: 32, gap: 16 },
      { id: "②", sel: ".bbm-ct-chip-row", h: 32, gap: 18 },
      { id: "③", sel: ".bbm-ct-region-row", h: 32, gap: 18 },
      { id: "④", sel: ".bbm-quick-slot", h: null, gap: 16 },
    ],
    endGap: { image: 16, pill: 24 },
    row: { plain: 102, card: 72, pill: 32 },
  },
  m: {
    layers: [
      { id: "①", sel: ".top-bar.is-bbm .search-field", h: 40, gap: 10 },
      { id: "②", sel: ".region-bar.is-bbm", h: 32, gap: 8 },
      { id: "③", sel: ".marketplace.is-bbm-m > .filter-shell.is-bbm", h: 32, gap: 10 },
      { id: "④", sel: ".bbm-m-quick-slot", h: null, gap: 14 },
      { id: "⑤", sel: ".bbm-m-head", h: null, gap: 0 },
    ],
    row: { plain: 2 + 74 + 6, card: 2 + 72 + 6, pill: 2 + 32 + 6 },
  },
};
const pcCardHeight = (row) => 16 + 32 + 18 + 32 + 18 + 32 + 16 + row + (row === 32 ? 24 : 16);
const TITLE = "중고차";

const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const all = {};
let failures = 0;

const measure = (page, device) => page.evaluate(([device, spec]) => {
  const r = (v) => Math.round(v * 10) / 10;
  const main = document.querySelector("main.marketplace");
  const mainTop = main.getBoundingClientRect().top;
  const card = device === "pc" ? document.querySelector(spec.pc.card) : null;
  const originTop = card ? card.getBoundingClientRect().top : mainTop;
  const layers = spec[device].layers.map((layer) => {
    const el = document.querySelector(layer.sel);
    if (!el) return { id: layer.id, missing: true };
    const b = el.getBoundingClientRect();
    return { id: layer.id, top: r(b.top - originTop), bottom: r(b.bottom - originTop), h: r(b.height) };
  });
  const cardH = card ? r(card.getBoundingClientRect().height) : null;
  const slot = document.querySelector(spec[device].layers.find((layer) => layer.id === "④").sel);
  const rail = slot?.firstElementChild;
  const pill = Boolean(rail && (rail.classList.contains("is-trim-row") || rail.classList.contains("is-year-row")));
  const railKind = !rail ? "없음" : rail.classList.contains("is-year-row") ? "연식" : rail.classList.contains("is-trim-row") ? "트림" : rail.classList.contains("bbm-category-menu") || rail.querySelector?.(".bbm-category-menu__list") ? "유형" : (rail.getAttribute("aria-label") ?? "").replace(" 빠른 선택", "");
  // 칸 넘침: ④ 안 칸·알약이 줄 상자 밖으로
  const railBox = rail?.getBoundingClientRect();
  const overflow = railBox ? [...rail.querySelectorAll(".depth-card, .trim-chip, .stable-pill, .bbm-category-menu__button")].map((cell) => cell.getBoundingClientRect()).filter((c) => c.width && (c.top < railBox.top - 0.5 || c.bottom > railBox.bottom + 0.5)).length : 0;
  // 가로 스크롤바 보임: 상단 영역 안 가로 스크롤 상자 중 스크롤바 높이 > 0
  const topArea = device === "pc" ? card : main;
  const scrollbars = [...topArea.querySelectorAll("*")].filter((el) => { const s = getComputedStyle(el); return ["auto", "scroll"].includes(s.overflowX) && el.scrollWidth > el.clientWidth + 1 && el.offsetHeight - el.clientHeight - parseFloat(s.borderTopWidth) - parseFloat(s.borderBottomWidth) > 0.5 && el.getBoundingClientRect().top < (slot?.getBoundingClientRect().bottom ?? 9999); }).length;
  // 줄바꿈: 칩·알약 높이 32 가 아닌 것, 모델·세부모델 이름 1줄 · 제조사 이름 2줄 넘김
  const pills = [...topArea.querySelectorAll(".filter-chip, .bbm-filter-button, .filter-fixed, .stable-pill, .trim-chip")].filter((el) => el.getBoundingClientRect().width && el.getBoundingClientRect().top < (slot?.getBoundingClientRect().bottom ?? 9999));
  const wrapPills = pills.filter((el) => Math.abs(el.getBoundingClientRect().height - 32) > 0.5).map((el) => el.textContent.trim());
  const wrapNames = rail ? [...rail.querySelectorAll(".depth-card")].map((cardEl) => { const label = cardEl.querySelector(".depth-card-label"); if (!label) return null; const lh = parseFloat(getComputedStyle(label).lineHeight); const lines = Math.round(label.getBoundingClientRect().height / lh); const maker = Boolean(cardEl.querySelector(".depth-card-media.is-brand")); return lines > (maker ? 2 : 1) ? label.textContent : null; }).filter(Boolean) : [];
  const cellH = rail ? [...new Set([...rail.querySelectorAll(".depth-card")].map((c) => r(c.getBoundingClientRect().height)))] : [];
  // 제목
  const titleEl = device === "pc" ? card.querySelector(".bbm-ct-title") : document.querySelector(".bbm-m-title");
  const title = titleEl?.textContent.trim() ?? null;
  // 모바일: 지역 칩 줄 없음 · 경로·제목이 ⑤(회색 띠 아래)
  const regionRow = Boolean(document.querySelector(".bbm-ct-region-row"));
  const head = document.querySelector(".bbm-m-head");
  const headOk = device === "m" ? Boolean(head && head.querySelector(".bbm-ct-crumbs") && head.querySelector(".bbm-m-title") && head.getBoundingClientRect().top >= (slot?.getBoundingClientRect().bottom ?? 0) - 0.5 && parseFloat(getComputedStyle(head).borderTopWidth) === 8) : null;
  // 모바일 ④ 왼쪽 제목 다음에 첫 칸이 바로 시작하는지 확인
  const firstChip = device === "m" ? document.querySelector(".filter-shell.is-bbm .filter-fixed")?.getBoundingClientRect().left : null;
  const labelEl = rail?.querySelector(".depth-rail-label, .bbm-quick-rail-title");
  const leadingRight = labelEl?.getBoundingClientRect().right ?? null;
  const firstInRail = rail?.querySelector(".depth-card, .bbm-category-menu__button")?.getBoundingClientRect().left ?? null;
  const chips = [...document.querySelectorAll(device === "pc" ? ".bbm-ct-chip-row .filter-chip" : ".filter-shell.is-bbm .filter-chip")].filter((el) => el.getBoundingClientRect().width).map((el) => `${el.textContent.trim()}${el.classList.contains("is-active") ? "×" : "▾"}`);
  const filterBtn = document.querySelector(device === "pc" ? ".bbm-filter-button" : ".filter-shell.is-bbm .filter-fixed");
  const filterBtnDark = filterBtn ? getComputedStyle(filterBtn).backgroundColor === "rgb(34, 34, 34)" : null;
  // PC 0층 경로(카드 밖): 상단 메뉴 아래 간격 · 경로 → 카드 위 · 왼쪽 선 · 높이, 카드 안 경로 없음
  const crumbs = device === "pc" ? (() => { const el = document.querySelector(spec.pc.crumbs.sel); const header = document.querySelector(".bbm-header"); if (!el || !card || !header) return { missing: true }; const b = el.getBoundingClientRect(); const c = card.getBoundingClientRect(); return { fromHeader: r(b.top - header.getBoundingClientRect().bottom), toCard: r(c.top - b.bottom), h: r(b.height), dx: r(b.left - c.left), inCard: Boolean(card.querySelector(".bbm-ct-crumbs")) }; })() : null;
  // QF-113 정렬: 이미지 줄 첫 칸 x · 칸 위 끝 · 이미지(로고) 영역 바닥 · "필터" 다음 칩 x · 첫 칩(필터) x
  const imageRail = rail && !pill && rail.querySelector(".depth-card") ? rail : null;
  const firstCard = imageRail?.querySelector(".depth-card"); const firstMedia = firstCard?.querySelector(".depth-card-media");
  const filterEl = document.querySelector(device === "pc" ? ".bbm-hybrid-top .bbm-filter-button" : ".filter-shell.is-bbm .filter-fixed");
  const nextChip = [...document.querySelectorAll(device === "pc" ? ".bbm-ct-chip-row .filter-chip" : ".filter-shell.is-bbm .filter-chip")].find((el) => el.getBoundingClientRect().width);
  const align = { firstCellX: firstCard ? r(firstCard.getBoundingClientRect().left) : null, labelRight: labelEl ? r(labelEl.getBoundingClientRect().right) : null, cellTop: firstCard ? r(firstCard.getBoundingClientRect().top - rail.getBoundingClientRect().top) : null, mediaBottom: firstMedia ? r(firstMedia.getBoundingClientRect().bottom - firstCard.getBoundingClientRect().top) : null, afterFilterX: nextChip ? r(nextChip.getBoundingClientRect().left) : null, filterX: filterEl ? r(filterEl.getBoundingClientRect().left) : null, filterText: filterEl?.textContent.trim() ?? null, hasLabel: Boolean(imageRail?.querySelector(".depth-rail-label")) };
  return { align, crumbs, layers, cardH, pill, railKind, overflow, scrollbars, wrapPills, wrapNames, cellH, title, regionRow, headOk, firstChip, leadingRight, firstInRail, chips, filterBtnDark, scrollTop: document.querySelector(".mobile-scroll")?.scrollTop ?? 0 };
}, [device, SPEC]);

const judge = (m, device, mode) => {
  const spec = SPEC[device];
  const problems = [];
  if (m.layers.some((layer) => layer.missing)) problems.push(`층 없음 ${m.layers.filter((layer) => layer.missing).map((layer) => layer.id).join(",")}`);
  const rowH = m.pill ? spec.row.pill : spec.row[mode];
  let prevBottom = 0;
  m.layers.forEach((layer, index) => {
    if (layer.missing) return;
    const want = spec.layers[index];
    const gap = Math.round((layer.top - prevBottom) * 10) / 10;
    if (Math.abs(gap - want.gap) > 0.5) problems.push(`${layer.id} 간격 ${gap} ≠ ${want.gap}`);
    const wantH = want.h ?? (want.id === "④" ? rowH : null);
    if (wantH !== null && Math.abs(layer.h - wantH) > 0.5) problems.push(`${layer.id} 높이 ${layer.h} ≠ ${wantH}`);
    if (index > 0 && layer.top < m.layers[index - 1].bottom - 0.5) problems.push(`${layer.id} 순서`);
    prevBottom = layer.bottom;
  });
  if (device === "pc") {
    const c = m.crumbs; const want = spec.crumbs;
    if (!c || c.missing) problems.push("0 경로 없음(카드 밖)");
    else {
      if (Math.abs(c.fromHeader - want.fromHeader) > 0.5) problems.push(`0 경로 ← 상단 메뉴 ${c.fromHeader} ≠ ${want.fromHeader}`);
      if (Math.abs(c.toCard - want.toCard) > 0.5) problems.push(`0 경로 → 카드 ${c.toCard} ≠ ${want.toCard}`);
      if (Math.abs(c.h - want.h) > 0.5) problems.push(`0 경로 높이 ${c.h} ≠ ${want.h}`);
      if (Math.abs(c.dx) > 0.5) problems.push(`0 경로 왼쪽 선 ${c.dx} ≠ 0`);
      if (c.inCard) problems.push("카드 안에 경로 있음");
    }
    const endGap = Math.round((m.cardH - m.layers.at(-1).bottom) * 10) / 10;
    const wantEnd = m.pill ? spec.endGap.pill : spec.endGap.image;
    if (Math.abs(endGap - wantEnd) > 0.5) problems.push(`④ → 카드 끝 ${endGap} ≠ ${wantEnd}`);
    const allowed = [pcCardHeight(spec.row[mode]), pcCardHeight(spec.row.pill)];
    if (!allowed.some((value) => Math.abs(value - m.cardH) <= 0.5)) problems.push(`카드 높이 ${m.cardH} 허용 아님(${allowed.join("/")})`);
  }
  if (m.railKind === "없음") problems.push("④ 닫힘");
  if (m.overflow) problems.push(`칸 넘침 ${m.overflow}`);
  if (m.scrollbars) problems.push(`스크롤바 보임 ${m.scrollbars}`);
  if (m.wrapPills.length) problems.push(`줄바꿈(칩) ${m.wrapPills.join(",")}`);
  if (m.wrapNames.length) problems.push(`줄바꿈(이름) ${m.wrapNames.join(",")}`);
  if (m.title !== TITLE || /[0-9년월]/.test(m.title ?? "")) problems.push(`제목 "${m.title}"`);
  if (device === "m") {
    if (m.regionRow) problems.push("모바일 지역 칩 줄 있음");
    if (!m.headOk) problems.push("경로·제목이 회색 띠 아래 아님");
    if (m.leadingRight !== null && m.firstInRail !== null && Math.abs(m.firstInRail - m.leadingRight) > 0.5) problems.push(`④ 첫 칸 x ${m.firstInRail} ≠ 제목 오른쪽 ${m.leadingRight}`);
  }
  return problems;
};

for (const mode of modes) {
  const result = {};
  for (const [tag, device, viewport] of [["pc-1440", "pc", { width: 1440, height: 900 }], ["pc-1280", "pc", { width: 1280, height: 720 }], ["m-393", "m", { width: 393, height: 852 }], ["m-360", "m", { width: 360, height: 780 }]].filter(([tag]) => !only || only === tag)) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, ...(device === "m" ? { isMobile: true, hasTouch: true } : {}) });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    const url = `${base}?qf=guazi${device === "pc" ? "&pc=1" : ""}${mode === "card" ? "&qfcard=card" : ""}`;
    const click = async (locator) => { await locator.scrollIntoViewIfNeeded(); await (device === "m" ? locator.tap() : locator.click()); await page.waitForTimeout(350); };
    const card = (label) => page.locator(".depth-rail .depth-card").filter({ has: page.locator(".depth-card-label", { hasText: new RegExp(`^${label}$`) }) }).first();
    const top = async () => page.evaluate(() => { const s = document.querySelector(".mobile-scroll"); if (s) s.scrollTop = 0; window.scrollTo(0, 0); });
    const land = async () => {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }); await page.waitForTimeout(300);
      await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}" });
    };
    const chooseUsed = () => click(page.locator(".bbm-category-menu__button").filter({ hasText: /^중고차/ }).first());
    const open = async () => { await land(); await chooseUsed(); };
    // ⑥ 이미지 로딩 전후 층 위치: 이미지를 막고 한 번, 풀고 한 번(처음 · 벤츠)
    const imageShift = [];
    for (const blocked of [true, false]) {
      if (blocked) await page.route(/\.(png|jpe?g|webp|svg)(\?|$)/, (route) => route.abort());
      await open(); await top();
      const a = await measure(page, device);
      await click(card("벤츠")); await top();
      const b = await measure(page, device);
      imageShift.push([a.layers, b.layers]);
      if (blocked) await page.unroute(/\.(png|jpe?g|webp|svg)(\?|$)/);
    }
    const shift = imageShift[0].flatMap((layers, i) => layers.map((layer, j) => Math.abs((layer.top ?? 0) - (imageShift[1][i][j].top ?? 0)) + Math.abs((layer.bottom ?? 0) - (imageShift[1][i][j].bottom ?? 0))));
    const maxShift = Math.max(...shift);

    errors.length = 0; // 이미지를 막은 실행의 "불러오기 실패"는 빼고 센다
    await land();
    const steps = [];
    // 첫 화면 유형 줄은 두 모양 모두 plain 규격(PC 102 · 모바일 82)
    const record = async (name, judgeMode = mode) => { await top(); const m = await measure(page, device); const problems = judge(m, device, judgeMode); steps.push({ name, ...m, problems }); if (problems.length) { failures += 1; await page.screenshot({ path: join(outDir, `fail-${mode}-${tag}-${steps.length}.png`) }); } };
    await record("첫 화면", "plain");
    await chooseUsed(); await record("처음");
    await click(card("벤츠")); await record("벤츠");
    await click(card("C클래스")); await record("C클래스");
    await click(card("W206")); await record("W206");
    await click(page.locator(".depth-rail.is-trim-row .trim-chip").filter({ hasText: /^C200$/ }).first()); await record("C200");
    await click(page.locator(".depth-rail.is-year-row .stable-pill").filter({ hasText: /^2023$/ }).first()); await record("2023");
    await click(page.locator(".depth-rail.is-year-row .stable-pill").filter({ hasText: /^2023$/ }).first()); await record("연식 해제");
    if (device === "pc") {
      await click(page.locator(".bbm-ct-reset").first());
      const confirm = page.locator("[role=dialog] button, .bbm-modal button").filter({ hasText: /^초기화$/ }).last();
      if (await confirm.count()) await click(confirm);
    } else await click(page.locator(".region-bar.is-bbm .reset-button").first());
    await record("필터 초기화");
    // QF-111 지역 단계: PC 지역 줄 서울 → 강남구(줄 높이 32 · 카드 높이 그대로), 모바일 지역 시트 서울 → 강남구(칩만 늘고 층 그대로)
    if (device === "pc") {
      const pill = (text) => page.locator(".bbm-ct-region-row .stable-pill").filter({ hasText: new RegExp(`^${text}$`) }).first();
      await click(pill("서울")); await record("지역 서울");
      await click(pill("강남구")); await record("지역 강남구");
    } else {
      await click(page.locator(".region-bar.is-bbm button").first());
      await click(page.locator(".stable-region-cell").filter({ hasText: /^서울$/ }).first()); await record("지역 서울");
      await click(page.locator(".stable-region-cell").filter({ hasText: /^강남구$/ }).first()); await record("지역 강남구");
    }
    // 앞으로 가는 흐름(처음 → 2023) 높이 변화 1회: PC 카드 높이 · 모바일 ④ 높이
    const forward = steps.slice(1, 7).map((step) => device === "pc" ? step.cardH : step.layers.find((layer) => layer.id === "④")?.h);
    const changes = forward.slice(1).filter((value, i) => Math.abs(value - forward[i]) > 0.5).length;
    const flowProblems = [];
    // QF-113 정렬 점검(처음 → 벤츠 → C클래스 → W206 → C200): ① 이미지 줄 첫 칸 x 모두 같고 왼쪽 고정 제목 바로 다음에 시작
    // ② "필터" 다음 칩 x 가 조건 수와 상관없이 같음 ③ 이미지 줄 칸 위 끝·이미지 영역 바닥 같음
    const alignSteps = steps.slice(1, 6);
    const imageSteps = alignSteps.filter((step) => step.align.firstCellX !== null);
    const uniq = (list) => [...new Set(list.map((v) => Math.round(v * 10) / 10))];
    const firstXs = uniq(imageSteps.map((step) => step.align.firstCellX));
    const wantX = imageSteps[0]?.align.labelRight;
    const align = { firstXs, wantX, afterFilterXs: uniq(alignSteps.map((step) => step.align.afterFilterX)), tops: uniq(imageSteps.map((step) => step.align.cellTop)), bottoms: uniq(imageSteps.map((step) => step.align.mediaBottom)), missingLabels: imageSteps.filter((step) => !step.align.hasLabel).map((step) => step.name), filterTexts: alignSteps.map((step) => step.align.filterText) };
    if (firstXs.length !== 1 || Math.abs(firstXs[0] - wantX) > 0.5) flowProblems.push(`① 이미지 줄 첫 칸 x ${firstXs.join("/")} (기대 ${wantX})`);
    if (align.missingLabels.length) flowProblems.push(`① 이미지 줄 이름표 없음(${align.missingLabels.join(",")})`);
    if (align.afterFilterXs.length !== 1) flowProblems.push(`② "필터" 다음 칩 x ${align.afterFilterXs.join("/")}`);
    if (align.tops.length !== 1 || align.bottoms.length !== 1) flowProblems.push(`③ 이미지 줄 위 끝 ${align.tops.join("/")} · 바닥 ${align.bottoms.join("/")}`);
    if (changes !== 1) flowProblems.push(`앞으로 가는 흐름 높이 변화 ${changes}회(${forward.join("→")})`);
    if (maxShift > 0.5) flowProblems.push(`이미지 로딩 전후 층 위치 차이 ${maxShift}`);
    if (errors.length) flowProblems.push(`콘솔 오류 ${errors.length}`);
    if (flowProblems.length) failures += 1;
    result[tag] = { steps, forward, changes, maxShift, align, errors: errors.length, flowProblems };
    await context.close();
  }
  all[mode] = result;
  writeFileSync(join(outDir, `stability-${mode}.json`), JSON.stringify(result, null, 1));
  // 단계 × 크기 표
  const tags = Object.keys(result);
  console.log(`\n[${mode}] 단계 × 크기 (O 통과 / X 실패, PC 카드 높이 · ④ 줄)`);
  console.log(["단계", ...tags].join(" | "));
  for (let i = 0; i < result[tags[0]].steps.length; i += 1) {
    console.log([result[tags[0]].steps[i].name, ...tags.map((tag) => { const step = result[tag].steps[i]; const h = tag.startsWith("pc") ? step.cardH : step.layers.find((layer) => layer.id === "④")?.h; return `${step.problems.length ? "X" : "O"} ${h} ${step.railKind}${step.problems.length ? ` (${step.problems.join("; ")})` : ""}`; })].join(" | "));
  }
  for (const tag of tags) { const a = result[tag].align; console.log(`${a.firstXs.length === 1 && a.afterFilterXs.length === 1 && a.tops.length === 1 && a.bottoms.length === 1 && !a.missingLabels.length ? "O" : "X"} ${tag} 정렬(QF-113): ① 제목 다음 첫 칸 x ${a.firstXs.join("/")}(기대 ${a.wantX}) ② 필터 다음 칩 x ${a.afterFilterXs.join("/")} ③ 칸 위 ${a.tops.join("/")} · 영역 바닥 ${a.bottoms.join("/")} · 필터 칩 ${a.filterTexts.join("→")}`); }
  for (const tag of tags) console.log(`${result[tag].flowProblems.length ? "X" : "O"} ${tag} 흐름: 높이 변화 ${result[tag].changes}회(${result[tag].forward.join("→")}) · 이미지 로딩 전후 차이 ${result[tag].maxShift} · 콘솔 오류 ${result[tag].errors}${result[tag].flowProblems.length ? ` — ${result[tag].flowProblems.join("; ")}` : ""}`);
}
await browser.close();
console.log(`\n결과: ${failures ? `실패 ${failures}건` : "모두 통과"} · reports/qf-106/stability-*.json`);
process.exitCode = failures ? 1 : 0;
