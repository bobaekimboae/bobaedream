#!/usr/bin/env node
// OP-013: 원본(dev.bbmuseum.co.kr/car/list)과 우리 시안에 같은 "조작 순서"를 실행하고, 단계마다 영역별 픽셀 차이 비율과
// 동작 점검표(목록 수·적용 칩·빠진 칩·배지·파랑 제목이 같은 방향으로 바뀌었는지)를 만든다.
// 사용: npm run diff:bbm:flow [-- --only=pc|m] (vite preview 127.0.0.1:4173 필요)
// 출력: reports/diff/<커밋>/flow/summary.json · checks.md · <단계>-<영역>.png(원본 | 우리 | 차이) — 커밋하지 않음
// 모든 숫자(총 대수·매물 수·버튼 숫자·배지 숫자)와 매물 목록·사진은 두 쪽 모두 같은 회색 상자로 가리고 모양·위치·색·문구 구조만 비교한다.
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ORIGIN = "https://dev.bbmuseum.co.kr/car/list";
// 우리 화면 주소: 기본은 로컬 미리보기, BBM_OURS=https://bobaekimboae.github.io/bobaedream/ 로 배포본 대조
const OURS = process.env.BBM_OURS ?? "http://127.0.0.1:4173/bobaedream/";
const only = (process.argv.find((arg) => arg.startsWith("--only=")) ?? "").slice(7);
const commit = (() => { try { const hash = execSync("git rev-parse --short HEAD").toString().trim(); const dirty = execSync("git status --porcelain").toString().trim(); return dirty ? `${hash}-dirty` : hash; } catch { return "local"; } })();
const outDir = join("reports", "diff", commit, "flow");
mkdirSync(outDir, { recursive: true });

const devices = {
  pc: { viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 },
  m: { viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
};

// ── 영역 찾기(원본 · 우리)
const R = {
  pc: {
    chips: { orig: (p) => p.locator(".car-list-content-header .car-list-mobile-filter__tabs").first(), ours: (p) => p.locator(".bbm-chips").first() },
    head: { orig: (p) => p.locator("aside .car-list-filter-summary").first(), ours: (p) => p.locator(".bbm-filter-summary").first() },
    toolbar: { orig: (p) => p.locator(".car-list-content-toolbar").first(), ours: (p) => p.locator(".bbm-toolbar").first() },
    modal: { orig: (p) => p.locator("[role=dialog]:visible").last(), ours: (p) => p.locator(".bbmf-modal").last() },
    // 항목 제목: 항목 위쪽 머리 부분만(원본 항목 전체를 잡고 아래는 잘라 낸다 — cropHeight)
    title: (label) => ({ orig: (p) => p.locator(".car-list-filter-menu__item").filter({ hasText: new RegExp(`^${label}`) }).first(), ours: (p) => p.locator(".bbm-filter-item").filter({ has: p.locator(".bbm-filter-toggle", { hasText: new RegExp(`^${label}`) }) }).first() }),
  },
  m: {
    chips: { orig: (p) => p.locator(".car-list-content-header .car-list-mobile-filter__tabs").first(), ours: (p) => p.locator(".filter-shell").first() },
    toolbar: { orig: (p) => p.locator(".car-list-content-toolbar").first(), ours: (p) => p.locator(".bbm-m-toolbar").first() },
    sheet: { orig: (p) => p.locator(".catalog-filter-modal:visible").last(), ours: (p) => p.locator(".bbmf-sheet").last() },
    full: { orig: (p) => p.locator(".car-list-filter--mobile-open").first(), ours: (p) => p.locator(".bbmf-full").first() },
  },
};

// ── 조작(원본 · 우리). 모바일 우리 화면은 터치(tap)로 누른다
const tapOrClick = async (locator, mobile) => (mobile ? locator.tap() : locator.click());
const A = {
  orig: {
    openItem: (p, label) => p.locator(".car-list-filter-menu__item").filter({ hasText: new RegExp(`^${label}`) }).first().locator("button").first().click(),
    checkInSidebar: (p, label, option) => p.locator(".car-list-filter-menu__item").filter({ hasText: new RegExp(`^${label}`) }).first().locator("label, button, [class*=check]").filter({ hasText: new RegExp(`^${option}`) }).first().click(),
    inDialog: (p, text) => p.locator("[role=dialog]:visible").last().locator("button, label").filter({ hasText: new RegExp(`^${text}`) }).first().click(),
    dialogConfirm: (p) => p.locator("[role=dialog]:visible").last().locator("button").filter({ hasText: /보기|확인|초기화/ }).last().click(),
    chip: (p, text) => p.locator(".car-list-content-header .car-list-mobile-filter__button").filter({ hasText: new RegExp(`^${text}`) }).first().click(),
    chipClear: (p, text) => p.locator(".car-list-content-header .car-list-mobile-filter__button").filter({ hasText: new RegExp(`^${text}`) }).locator("button").last().click(),
    appliedChipOpen: (p, text) => p.locator(".car-list-content-header .car-list-mobile-filter__button").filter({ hasText: new RegExp(`^${text}`) }).locator("button").first().click(),
    dialogClose: (p) => p.locator("[role=dialog]:visible").last().locator(".catalog-filter-modal__close, button[aria-label*=닫기]").first().click(),
    maker: (p, name) => p.locator(".car-list-filter-catalog__row").filter({ hasText: new RegExp(`^${name}`) }).first().click(),
    reset: (p) => p.locator("aside .car-list-filter-summary__reset").first().click(),
    mChip: (p, text) => p.locator(".car-list-content-header .car-list-mobile-filter__button").filter({ hasText: new RegExp(`^${text}`) }).first().click(),
    mSheetPick: (p, text) => p.getByText(text, { exact: true }).last().click(),
    mSheetConfirm: (p) => p.locator("button:visible").filter({ hasText: /보기/ }).last().click(),
    mOpenFull: (p) => p.locator(".car-list-mobile-filter__button--filter button").first().click(),
    mFullItem: (p, label) => p.locator(".car-list-filter--mobile-open .car-list-filter-menu__label").filter({ hasText: new RegExp(`^${label}$`) }).first().click(),
    mFullConfirm: (p) => p.locator(".car-list-filter--mobile-open button").filter({ hasText: /보기/ }).last().click(),
  },
  ours: {
    openItem: (p, label) => p.locator(".bbm-filter-toggle").filter({ hasText: new RegExp(`^${label}`) }).first().click(),
    checkInSidebar: (p, label, option) => p.locator(".bbm-filter-item").filter({ has: p.locator(".bbm-filter-toggle", { hasText: new RegExp(`^${label}`) }) }).locator(".bbmf-check").filter({ hasText: new RegExp(`^${option}`) }).first().click(),
    inDialog: (p, text) => p.locator(".bbmf-modal").last().locator(".bbmf-check, .bbmf-presets button, .bbmf-choices button").filter({ hasText: new RegExp(`^${text}`) }).first().click(),
    dialogConfirm: (p) => p.locator(".bbmf-modal .bbmf-confirm").last().click(),
    chip: (p, text) => p.locator(".bbm-chips .filter-chip").filter({ hasText: new RegExp(`^${text}`) }).first().click(),
    chipClear: (p, text) => p.locator(".bbm-chips .filter-chip").filter({ hasText: new RegExp(`^${text}`) }).locator(".filter-chip-clear").first().click(),
    appliedChipOpen: (p, text) => p.locator(".bbm-chips .filter-chip.is-active").filter({ hasText: new RegExp(`^${text}`) }).locator(".filter-chip-label").first().click(),
    dialogClose: (p) => p.locator(".bbmf-modal .bbmf-close").last().click(),
    maker: (p, name) => p.locator(".bbm-catalog-row").filter({ hasText: new RegExp(`^${name}`) }).first().click(),
    reset: (p) => p.locator(".bbm-filter-reset").first().click(),
    mChip: (p, text) => p.locator(".filter-track .filter-chip").filter({ hasText: new RegExp(`^${text}`) }).first().tap(),
    mSheetPick: (p, text) => p.locator(".bbmf-sheet").last().locator(".bbmf-check, .bbmf-presets button, .bbmf-choices button").filter({ hasText: new RegExp(`^${text}`) }).first().tap(),
    mSheetConfirm: (p) => p.locator(".bbmf-sheet .bbmf-confirm").last().tap(),
    mOpenFull: (p) => p.locator(".filter-fixed").first().tap(),
    mFullItem: (p, label) => p.locator(".bbmf-full-item").filter({ hasText: new RegExp(`^${label}`) }).first().tap(),
    mFullConfirm: (p) => p.locator(".bbmf-full .bbmf-confirm").last().tap(),
  },
};

// ── 시나리오: 단계마다 조작 → 비교할 영역
const SCENARIOS = [
  { device: "pc", steps: [
    { key: "pc-1-suv", label: "① 바디타입 펼침 → SUV 체크", run: async (a, p) => { await a.openItem(p, "바디타입"); await p.waitForTimeout(500); await a.checkInSidebar(p, "바디타입", "SUV"); }, regions: ["chips", "head", ["title", "바디타입"], "toolbar"] },
    { key: "pc-2a-fuel-modal", label: "② 연료 모달 → 디젤(모달 열린 상태)", run: async (a, p) => { await a.openItem(p, "연료"); await p.waitForTimeout(700); await a.inDialog(p, "디젤"); }, regions: ["modal"] },
    { key: "pc-2b-fuel-confirm", label: "② 확인", run: async (a, p) => { await a.dialogConfirm(p); }, regions: ["chips", "head", ["title", "연료"]] },
    { key: "pc-3a-price-modal", label: "③ 가격 칩 → 3천만원(모달 열린 상태)", run: async (a, p) => { await a.chip(p, "가격"); await p.waitForTimeout(700); await a.inDialog(p, "3천만원"); }, regions: ["modal"] },
    { key: "pc-3b-price-view", label: "③ N대 보기", run: async (a, p) => { await a.dialogConfirm(p); }, regions: ["chips", "head", ["title", "가격"]] },
    { key: "pc-3c-applied-open", label: "③+ 적용 칩 디젤 눌러 모달 열기", run: async (a, p) => { await a.appliedChipOpen(p, "디젤"); }, regions: ["modal"] },
    { key: "pc-3d-applied-close", label: "③+ 모달 닫기(X)", run: async (a, p) => { await a.dialogClose(p); }, regions: ["chips", "head"] },
    { key: "pc-3e-applied-open", label: "③+ 적용 칩 'SUV'(펼침형 항목) 눌러 모달 열기", run: async (a, p) => { await a.appliedChipOpen(p, "SUV"); }, regions: ["modal"] },
    { key: "pc-3f-applied-close", label: "③+ 모달 닫기(X)", run: async (a, p) => { await a.dialogClose(p); }, regions: ["chips", "head"] },
    { key: "pc-4-suv-x", label: "④ 적용 칩 × 해제(SUV)", run: async (a, p) => { await a.chipClear(p, "SUV"); }, regions: ["chips", "head", ["title", "바디타입"]] },
    { key: "pc-5-hyundai", label: "⑤ 좌측 제조사 현대", run: async (a, p) => { await a.maker(p, "현대"); }, regions: ["chips", "head", ["title", "제조사 · 모델"]] },
    { key: "pc-6a-reset-confirm", label: "⑥ 사이드바 초기화(확인 창)", run: async (a, p) => { await a.reset(p); }, regions: ["modal"] },
    { key: "pc-6b-reset", label: "⑥ 초기화 확인", run: async (a, p) => { await a.dialogConfirm(p); }, regions: ["chips", "head", "toolbar"] },
  ] },
  { device: "m", steps: [
    { key: "m-1-price-sheet", label: "① 가격 칩 → 3천만원(시트 열린 상태)", run: async (a, p) => { await a.mChip(p, "가격"); await p.waitForTimeout(800); await a.mSheetPick(p, "3천만원"); }, regions: ["sheet"] },
    { key: "m-2-price-view", label: "② N대 보기", run: async (a, p) => { await a.mSheetConfirm(p); }, regions: ["chips", "toolbar"] },
    { key: "m-3a-body-sheet", label: "③ 필터 → 바디타입 → SUV(시트 열린 상태)", run: async (a, p) => { await a.mOpenFull(p); await p.waitForTimeout(900); await a.mFullItem(p, "바디타입"); await p.waitForTimeout(800); await a.mSheetPick(p, "SUV"); }, regions: ["sheet"] },
    { key: "m-3b-full", label: "③ 시트 N대 보기 → 전체 필터 화면", run: async (a, p) => { await a.mSheetConfirm(p); }, regions: ["full"] },
    { key: "m-3c-chips", label: "③ 전체 필터 N대 보기", run: async (a, p) => { await a.mFullConfirm(p); }, regions: ["chips"] },
    { key: "m-3d-fuel-sheet", label: "③+ 필터 → 연료 → 디젤(시트 열린 상태)", run: async (a, p) => { await a.mOpenFull(p); await p.waitForTimeout(900); await a.mFullItem(p, "연료"); await p.waitForTimeout(800); await a.mSheetPick(p, "디젤"); }, regions: ["sheet"] },
    { key: "m-3e-fuel-full", label: "③+ 시트 N대 보기 → 전체 필터 화면", run: async (a, p) => { await a.mSheetConfirm(p); }, regions: ["full"] },
    { key: "m-3f-fuel-chips", label: "③+ 전체 필터 N대 보기", run: async (a, p) => { await a.mFullConfirm(p); }, regions: ["chips"] },
    { key: "m-4-maker-sheet", label: "④ 제조사 칩 시트", run: async (a, p) => { await a.mChip(p, "제조사"); }, regions: ["sheet"] },
  ] },
];

// ── 동작 상태 읽기(점검표용)
async function readState(page, side, device) {
  return page.evaluate(([side, device]) => {
    const text = (e) => (e?.textContent ?? "").replace(/\s+/g, " ").trim();
    const visible = (e) => e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden";
    // 열린 창(모달·시트) 아래 확인 버튼 문구, 숫자는 N 으로
    const confirmText = (dialogs) => {
      const box = [...document.querySelectorAll(dialogs)].filter(visible).pop();
      const button = box && [...box.querySelectorAll("button")].filter((b) => visible(b) && /보기|확인|초기화|선택완료/.test(text(b))).pop();
      return button ? text(button).replace(/[\d,]+/g, "N").replace(/\s+/g, "") : "-";
    };
    if (side === "orig") {
      const chipEls = [...document.querySelectorAll(".car-list-content-header .car-list-mobile-filter__tabs-scroll > *")];
      const applied = chipEls.filter((e) => /selecte/.test(e.className) && !/전체차량/.test(text(e))).map(text);
      const plain = chipEls.filter((e) => !/selecte/.test(e.className)).map(text);
      const filterChip = text(document.querySelector(".car-list-content-header .car-list-mobile-filter__button--filter"));
      const count = text(document.querySelector(".car-list-quick-filter-summary strong"));
      const badge = device === "pc" ? text(document.querySelector("aside .car-list-filter-summary__selected-count")) : (filterChip.match(/\d+/)?.[0] ?? "");
      const blue = [...document.querySelectorAll("aside .car-list-filter-menu__label")].filter((e) => getComputedStyle(e).color === "rgb(27, 76, 140)").map(text);
      const history = text(document.querySelector(device === "pc" ? "aside .car-list-filter-summary__history" : ".car-list-filter-summary__history")).replace(/[^\d]/g, "");
      return { count, applied, plain, badge, blue, history, button: confirmText("[role=dialog], .catalog-filter-modal") };
    }
    const chipEls = [...document.querySelectorAll(device === "pc" ? ".bbm-chips .filter-chip" : ".filter-track .filter-chip")];
    const applied = chipEls.filter((e) => /is-active/.test(e.className) && !/전체차량/.test(text(e))).map(text);
    const plain = chipEls.filter((e) => !/is-active/.test(e.className)).map(text);
    const count = text(document.querySelector(".bbm-summary strong"));
    const badge = device === "pc" ? text(document.querySelector(".bbm-filter-count")) : text(document.querySelector(".filter-fixed-count"));
    const blue = [...document.querySelectorAll(".bbm-filter-item.is-applied .bbm-filter-label-text")].map(text);
    const history = device === "pc" ? text(document.querySelector(".bbm-filter-history")).replace(/[^\d]/g, "") : (document.querySelector(".filter-shell.is-bbm")?.getAttribute("data-history") ?? "");
    return { count, applied, plain, badge, blue, history, button: confirmText(".bbmf-full, .bbmf-modal, .bbmf-sheet") };
  }, [side, device]);
}

// 영역 캡처: 화면에 보이게 한 뒤 자르고, 숫자·매물 글자·사진 위치를 가림 상자로 돌려준다
async function captureRegion(page, locator, cropHeight) {
  if (!(await locator.count())) return null;
  // 영역 전체가 보이게(원본은 창 스크롤, 우리는 스크롤 레이어) 가운데로 옮긴 뒤 찍는다
  await locator.evaluate((element) => element.scrollIntoView({ block: "center" })).catch(() => {});
  await page.waitForTimeout(150);
  const info = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const box = { x: Math.max(0, rect.left), y: Math.max(0, rect.top), right: Math.min(window.innerWidth, rect.right), bottom: Math.min(window.innerHeight, rect.bottom) };
    const masks = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      // "N대 보기 / 확인 N대" 버튼은 숫자 자릿수에 따라 글자 위치가 밀리므로 글자 전체를 가린다
      if (/d/.test(node.textContent) && node.parentElement?.closest(".bbmf-confirm, .ui-btn--primary")) {
        const range = document.createRange(); range.selectNodeContents(node);
        for (const r of range.getClientRects()) if (r.width && r.height) masks.push({ x: r.left - box.x - 1, y: r.top - box.y, w: r.width + 2, h: r.height });
        continue;
      }
      for (const match of node.textContent.matchAll(/[\d][\d,.]*/g)) {
        const range = document.createRange();
        range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
        for (const r of range.getClientRects()) if (r.width && r.height) masks.push({ x: r.left - box.x - 1, y: r.top - box.y, w: r.width + 2, h: r.height });
      }
    }
    for (const node of element.querySelectorAll("img[src*='photo'], img[src*='cars/'], img[src*='detail/'], .car-list-result-card__image-source, .bbm-card-photo img, .bbm-maker-logo, .catalog-filter-modal__image")) {
      const r = node.getBoundingClientRect(); if (r.width && r.height) masks.push({ x: r.left - box.x, y: r.top - box.y, w: r.width, h: r.height });
    }
    return { x: box.x, y: box.y, w: box.right - box.x, h: box.bottom - box.y, masks };
  });
  if (cropHeight) info.h = Math.min(info.h, cropHeight);
  const shot = await page.screenshot();
  return { ...info, shot: shot.toString("base64") };
}

async function compare(tool, orig, ours) {
  return tool.evaluate(async ([orig, ours]) => {
    const load = (b64) => new Promise((resolve) => { const image = new Image(); image.onload = () => resolve(image); image.src = `data:image/png;base64,${b64}`; });
    const w = Math.round(Math.max(orig?.w ?? 0, ours?.w ?? 0)); const h = Math.round(Math.max(orig?.h ?? 0, ours?.h ?? 0));
    if (!w || !h) return { ratio: 1, image: null };
    const draw = async (region) => {
      const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
      const context = canvas.getContext("2d"); context.fillStyle = "#ff00ff"; context.fillRect(0, 0, w, h);
      if (region) { const image = await load(region.shot); context.drawImage(image, region.x, region.y, region.w, region.h, 0, 0, region.w, region.h); context.fillStyle = "#9a9a9a"; for (const m of region.masks) context.fillRect(m.x, m.y, m.w, m.h); }
      return canvas;
    };
    const ca = await draw(orig); const cb = await draw(ours);
    const da = ca.getContext("2d").getImageData(0, 0, w, h).data; const db = cb.getContext("2d").getImageData(0, 0, w, h).data;
    const out = document.createElement("canvas"); out.width = w * 3 + 16; out.height = h;
    const octx = out.getContext("2d"); octx.fillStyle = "#fff"; octx.fillRect(0, 0, out.width, h); octx.drawImage(ca, 0, 0); octx.drawImage(cb, w + 8, 0);
    const diff = octx.createImageData(w, h); let n = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      const g = (da[i] + da[i + 1] + da[i + 2]) / 3;
      if (d > 48) { n += 1; diff.data.set([230, 30, 30, 255], i); } else diff.data.set([g, g, g, 70], i);
    }
    octx.putImageData(diff, w * 2 + 16, 0);
    return { ratio: n / (w * h), image: out.toDataURL("image/png").split(",")[1] };
  }, [orig, ours]);
}

const regionLocator = (device, name, side) => {
  if (Array.isArray(name)) return R[device].title(name[1])[side];
  return R[device][name][side];
};
const regionName = (name) => Array.isArray(name) ? `title-${name[1].replace(/[^\w가-힣]/g, "")}` : name;

// 글꼴 렌더링 맞춤(원본 LCD · 우리 회색조) → 둘 다 회색조
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const tool = await browser.newPage();
const summary = { commit, measuredAt: new Date().toISOString(), steps: [] };
const checkRows = [];
for (const scenario of SCENARIOS) {
  if (only && scenario.device !== only) continue;
  const sides = {};
  for (const side of ["orig", "ours"]) {
    const context = await browser.newContext(devices[scenario.device]);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(side === "orig" ? ORIGIN : `${OURS}?qf=guazi${scenario.device === "pc" ? "&pc=1" : ""}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1200);
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}" });
    sides[side] = { context, page, errors, prev: await readState(page, side, scenario.device) };
  }
  for (const step of scenario.steps) {
    const row = { key: step.key, label: step.label, regions: {}, skipped: [] };
    for (const side of ["orig", "ours"]) {
      const { page } = sides[side];
      try { await step.run(A[side], page); } catch (error) { row.skipped.push(`${side}: ${error.message.split("\n")[0]}`); }
      await page.waitForTimeout(side === "orig" ? 1500 : 500);
    }
    for (const name of step.regions) {
      const fail = (side) => (error) => { console.log(`  ${side} 캡처 실패`, name, error.message.split("\n")[0]); return null; };
      const [o, u] = [await captureRegion(sides.orig.page, regionLocator(scenario.device, name, "orig")(sides.orig.page), Array.isArray(name) ? 44 : 0).catch(fail("원본")), await captureRegion(sides.ours.page, regionLocator(scenario.device, name, "ours")(sides.ours.page), Array.isArray(name) ? 44 : 0).catch(fail("우리"))];
      const result = await compare(tool, o, u);
      if (result.image) writeFileSync(join(outDir, `${step.key}-${regionName(name)}.png`), Buffer.from(result.image, "base64"));
      row.regions[regionName(name)] = Math.round(result.ratio * 1000) / 10;
    }
    // 동작 점검표: 이전 단계 대비 같은 방향으로 바뀌었는가
    const now = { orig: await readState(sides.orig.page, "orig", scenario.device), ours: await readState(sides.ours.page, "ours", scenario.device) };
    const num = (text) => Number((text || "").replace(/[^\d]/g, "")) || 0;
    const dir = (a, b) => Math.sign(num(b) - num(a));
    const checks = {
      "목록 수 변화": scenario.device === "pc" ? [dir(sides.orig.prev.count, now.orig.count), dir(sides.ours.prev.count, now.ours.count)] : null,
      "적용 칩": [now.orig.applied.length, now.ours.applied.length],
      "적용 칩 문구": [now.orig.applied.join(" | "), now.ours.applied.join(" | ")],
      "칩 줄(빠진 칩 반영)": [now.orig.plain.join(" "), now.ours.plain.join(" ")],
      "배지 개수": [now.orig.badge || "0", now.ours.badge || "0"],
      "파랑 제목": scenario.device === "pc" ? [now.orig.blue.join(","), now.ours.blue.join(",")] : null,
      "최근검색기록": [now.orig.history || "-", now.ours.history || "-"],
      "창 버튼 문구": [now.orig.button, now.ours.button],
    };
    row.checks = Object.fromEntries(Object.entries(checks).filter(([, v]) => v).map(([k, [o, u]]) => [k, { orig: o, ours: u, same: String(o) === String(u) }]));
    sides.orig.prev = now.orig; sides.ours.prev = now.ours;
    summary.steps.push(row);
    console.log(`${step.key.padEnd(20)} ${Object.entries(row.regions).map(([k, v]) => `${k} ${v}%`).join(" · ")}${row.skipped.length ? `  [건너뜀 ${row.skipped.join(" / ")}]` : ""}`);
    checkRows.push(row);
  }
  summary[`${scenario.device}Errors`] = sides.ours.errors;
  for (const side of ["orig", "ours"]) await sides[side].context.close();
}
writeFileSync(join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
const md = ["| 단계 | 항목 | 원본 | 우리 | 일치 |", "|---|---|---|---|---|", ...checkRows.flatMap((row) => Object.entries(row.checks).map(([k, v]) => `| ${row.label} | ${k} | ${v.orig === "" ? "-" : v.orig} | ${v.ours === "" ? "-" : v.ours} | ${v.same ? "O" : "X"} |`))];
writeFileSync(join(outDir, "checks.md"), md.join("\n"));
await browser.close();
console.log(`결과: ${join(outDir, "summary.json")} · ${join(outDir, "checks.md")}`);
