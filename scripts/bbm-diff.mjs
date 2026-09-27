#!/usr/bin/env node
// OP-012: 개발 시안 원본(dev.bbmuseum.co.kr/car/list)과 우리 시안을 같은 크기·같은 상태로 찍어 영역별 픽셀 차이 비율을 낸다.
// 사용: npm run diff:bbm [-- --only=pc|m] [--state=pc-4,m-3] (vite preview 127.0.0.1:4173 이 떠 있어야 함)
// 출력: reports/diff/<커밋>/summary.json · <상태>-<영역>.png(원본 | 우리 | 차이 빨강) — 커밋하지 않음
// 매물 사진·매물 글자·매물 수 숫자는 두 쪽 모두 같은 회색 상자로 가려 모양·위치·크기만 비교한다.
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ORIGIN = "https://dev.bbmuseum.co.kr/car/list";
// 우리 화면 주소: 기본은 로컬 미리보기, BBM_OURS=https://bobaekimboae.github.io/bobaedream/ 로 배포본 대조
const OURS = process.env.BBM_OURS ?? "http://127.0.0.1:4173/bobaedream/";
const only = (process.argv.find((arg) => arg.startsWith("--only=")) ?? "").slice(7);
// --state=<이름 일부>: 그 상태만(반복 대조용)
const stateFilter = (process.argv.find((arg) => arg.startsWith("--state=")) ?? "").slice(8);
const commit = (() => { try { const hash = execSync("git rev-parse --short HEAD").toString().trim(); const dirty = execSync("git status --porcelain").toString().trim(); return dirty ? `${hash}-dirty` : hash; } catch { return "local"; } })();
const outDir = join("reports", "diff", commit);
mkdirSync(outDir, { recursive: true });

// 가림 상자: 원본·우리 각각의 선택자
const MASK = {
  orig: [".car-list-result-card__image-source", ".car-list-result-card__media-footer", ".car-list-result-card__title", ".car-list-result-card__spec", ".car-list-result-card__price", ".car-list-result-card__badges", ".car-list-card-location__address-text", ".car-list-result-card__seller-text", ".car-list-result-card__seller-logo", ".car-list-quick-filter-summary strong", ".car-list-filter-check-list__count", ".car-list-filter-catalog__count", "[class*=option-count]", ".car-list-mobile-page-header__search-main input"],
  ours: [".bbm-card-photo img", ".bbm-card-media-footer", ".bbm-card-title", ".bbm-card-spec", ".bbm-card-price", ".bbm-card-badges", ".bbm-card-location-text", ".bbm-card-seller-text", ".bbm-card-seller-logo", ".bbm-summary strong", ".bbmf-check-count", ".bbm-catalog-row em", ".top-bar .search-field input",
    ".car-photo", ".card-photo-meta", ".car-card h3", ".car-card .spec", ".car-card .price"],
};

const PC_REGIONS = [
  ["header", ".app-shell__header", ".bbm-header"],
  ["sidebar", "aside.car-list-filter", "aside.bbm-filter", { fit: true }],
  // QF-095: PC 상단 패널·유형 줄은 초톳 PC 상단 구조로 바뀌어 원본 대신 초톳 실측(npm run diff:chotot-top · check:top)으로 비교한다
  ["toolbar", ".car-list-content-toolbar", ".bbm-toolbar"],
  ["card", ".car-list-result-card", ".bbm-result-card, .bbm-list > *"],
];
const M_REGIONS = [
  ["header", ".car-list-mobile-page-header", "header.top-bar"],
  ["region", ".car-list-mobile-filter--region", ".region-bar"],
  ["chips", ".car-list-content-header", ".filter-shell"],
  ["type-row", ".car-list-category-menu", ".bbm-category-menu, .depth-rail"],
  ["video-sort", ".car-list-content-toolbar__mobile-options", ".bbm-m-options, .video-toggle-row"],
  ["tabs", ".car-list-content-toolbar", ".bbm-m-toolbar, .list-toolbar"],
  ["card", ".car-list-result-card", ".bbm-result-card, .car-card"],
];

const STATES = [
  { key: "pc-1-first", device: "pc", regions: PC_REGIONS },
  { key: "pc-2-bodytype", device: "pc", regions: [["sidebar", "aside.car-list-filter", "aside.bbm-filter", { fit: true }]],
    orig: async (page) => { await page.locator(".car-list-filter-menu__item").filter({ hasText: /^바디타입/ }).first().locator("button").first().click(); },
    ours: async (page) => { await page.locator(".bbm-filter-toggle").filter({ hasText: /^바디타입/ }).first().click(); } },
  { key: "pc-3-fuel-modal", device: "pc", regions: [["modal", "[role=dialog].catalog-filter-modal, .catalog-filter-modal[role=dialog], [role=dialog]", ".bbmf-modal"]], overlay: true,
    orig: async (page) => { await page.locator(".car-list-filter-menu__item").filter({ hasText: /^연료/ }).first().locator("button").first().click(); },
    ours: async (page) => { await page.locator(".bbm-filter-toggle").filter({ hasText: /^연료/ }).first().click(); } },
  { key: "m-1-first", device: "m", regions: M_REGIONS },
  // 하단 탭바는 위쪽이 비쳐 뒤의 매물 사진이 보이므로, 두 쪽 모두 목록을 숨기고 비교한다
  { key: "m-1b-tabbar", device: "m", regions: [["tabbar", "nav.mobile-bottom-gnb", ".bbm-bottom-gnb"]],
    orig: async (page) => { await page.addStyleTag({ content: ".car-list-results{visibility:hidden!important}" }); },
    ours: async (page) => { await page.addStyleTag({ content: ".bbm-m-list{visibility:hidden!important}" }); } },
  { key: "m-2-full-filter", device: "m", regions: [["full-filter", ".car-list-filter--mobile-open", ".bbmf-full"]], overlay: true,
    orig: async (page) => { await page.locator(".car-list-mobile-filter__button--filter button").first().click(); },
    ours: async (page) => { await page.locator(".filter-fixed").first().tap(); } },
];

// QF-092 목록 영역: 스크롤·열기 도우미(원본은 창 스크롤, 우리는 .mobile-scroll 안 스크롤 — scrollIntoView 는 둘 다 된다)
const into = (selector, block = "center") => (page) => page.evaluate(([selector, block]) => [...document.querySelectorAll(selector)].find((e) => e.getBoundingClientRect().width > 0)?.scrollIntoView({ block }), [selector, block]);
const clickVisible = (selector) => (page) => page.evaluate((selector) => [...document.querySelectorAll(selector)].find((e) => e.getBoundingClientRect().width > 0)?.click(), selector);
const scrollDown = (amount) => (page) => page.evaluate((amount) => { const scroller = document.querySelector(".mobile-scroll"); if (scroller) scroller.scrollTop += amount; else window.scrollBy(0, amount); }, amount);
// 원본은 743쪽이라 번호가 10개(모바일 3개), 우리는 64대 4쪽 → 페이지 이동 비교 때만 원본 번호를 우리 개수(4)까지만 남긴다
const sameAsOurPages = (page) => page.addStyleTag({ content: ".ui-pagination__page-item:nth-child(n+5){display:none!important}" });
STATES.push(
  { key: "pc-4-list-end", device: "pc", regions: [["pagination", ".car-list-pagination", ".car-list-pagination"]],
    orig: async (page) => { await sameAsOurPages(page); await into(".car-list-pagination")(page); }, ours: into(".car-list-pagination") },
  { key: "pc-5-footer", device: "pc", regions: [["footer", "footer.app-shell__footer", "footer.app-shell__footer"]], orig: into("footer.app-shell__footer", "end"), ours: into("footer.app-shell__footer", "end") },
  { key: "pc-6-sort-open", device: "pc", regions: [["sort-menu", ".car-list-toolbar-menu", ".car-list-toolbar-menu"]], orig: clickVisible(".car-list-content-toolbar__sort"), ours: clickVisible(".bbm-sort") },
  { key: "pc-7-view-open", device: "pc", regions: [["view-menu", ".car-list-toolbar-menu", ".car-list-toolbar-menu"]], orig: clickVisible(".car-list-content-toolbar__view"), ours: clickVisible(".bbm-view") },
  { key: "m-3-list-end", device: "m", regions: [["pagination", ".car-list-pagination", ".car-list-pagination"]], orig: into(".car-list-pagination"), ours: into(".car-list-pagination") },
  { key: "m-4-footer", device: "m", regions: [["footer", ".app-footer-mobile", ".app-footer-mobile"]], orig: into(".app-footer-mobile"), ours: into(".app-footer-mobile") },
  { key: "m-4b-footer-open", device: "m", regions: [["footer-open", ".app-footer-mobile", ".app-footer-mobile"]],
    orig: async (page) => { await clickVisible(".app-footer-mobile__biz-summary")(page); await page.waitForTimeout(300); await into(".app-footer-mobile")(page); },
    ours: async (page) => { await clickVisible(".app-footer-mobile__biz-summary")(page); await page.waitForTimeout(300); await into(".app-footer-mobile")(page); } },
  { key: "m-5-sort-sheet", device: "m", regions: [["sort-sheet", ".catalog-filter-modal", ".bbmf-sheet"]], overlay: true, orig: clickVisible(".car-list-content-toolbar__sort"), ours: async (page) => { await page.locator(".bbm-m-sort").tap(); } },
  { key: "m-6-view-sheet", device: "m", regions: [["view-sheet", ".catalog-filter-modal", ".bbmf-sheet"]], overlay: true, orig: clickVisible(".car-list-content-toolbar__view"), ours: async (page) => { await page.locator(".bbm-m-view").tap(); } },
  { key: "m-7-scrolled-chips", device: "m", regions: [["sticky-chips", ".car-list-content-header", ".filter-shell"]], orig: scrollDown(1500), ours: scrollDown(1500) },
);

const devices = {
  pc: { viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 },
  m: { viewport: { width: 393, height: 852 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
};

// 한 쪽 화면을 열고 상태를 만든 뒤, 영역별 잘라낸 이미지(가림 적용)를 돌려준다
async function capture(browser, side, state) {
  const context = await browser.newContext(devices[state.device]);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  const url = side === "orig" ? ORIGIN : `${OURS}?qf=guazi${state.device === "pc" ? "&pc=1" : ""}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  // 두 쪽 모두 움직임·깜빡이는 커서를 멈춘다
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}" });
  const action = state[side];
  if (action) { await action(page).catch((error) => errors.push(`상태 만들기 실패: ${error.message}`)); await page.waitForTimeout(900); }
  const shot = await page.screenshot();
  const regions = {};
  for (const [name, origSel, oursSel] of state.regions) {
    const selector = side === "orig" ? origSel : oursSel;
    const info = await page.evaluate(([selector, masks, viewport]) => {
      const element = selector.split(",").flatMap((part) => [...document.querySelectorAll(part.trim())]).find((candidate) => candidate.getBoundingClientRect().width > 0);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const box = { x: Math.max(0, rect.left), y: Math.max(0, rect.top), right: Math.min(viewport.width, rect.right), bottom: Math.min(viewport.height, rect.bottom) };
      const maskRects = masks.flatMap((mask) => [...element.querySelectorAll(mask)]).map((node) => node.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0 && r.right > box.x && r.left < box.right && r.bottom > box.y && r.top < box.bottom)
        .map((r) => ({ x: r.left - box.x, y: r.top - box.y, w: r.width, h: r.height }));
      return { x: box.x, y: box.y, w: box.right - box.x, h: box.bottom - box.y, masks: maskRects };
    }, [selector, MASK[side], devices[state.device].viewport]);
    regions[name] = info;
  }
  await context.close();
  return { shot: shot.toString("base64"), regions, errors };
}

// 브라우저 캔버스로 픽셀 비교(새 패키지 없이)
// fit: 두 쪽이 겹치는 왼쪽 위 크기만 비교 — QF-093 에서 폭·위치를 일부러 바꾼 PC 상단 패널·유형 줄·좌측 필터(위치·폭은 배치 수치로 따로 검증, 모양은 3% 기준 그대로)
async function compare(page, origShot, oursShot, origBox, oursBox, fit = false) {
  return page.evaluate(async ([origShot, oursShot, origBox, oursBox, fit]) => {
    const load = (b64) => new Promise((resolve) => { const image = new Image(); image.onload = () => resolve(image); image.src = `data:image/png;base64,${b64}`; });
    const [a, b] = await Promise.all([load(origShot), load(oursShot)]);
    const pick = fit && origBox && oursBox ? Math.min : Math.max;
    const w = Math.round(pick(origBox?.w ?? 0, oursBox?.w ?? 0));
    const h = Math.round(pick(origBox?.h ?? 0, oursBox?.h ?? 0));
    if (!w || !h) return { ratio: 1, image: null, size: [0, 0] };
    const draw = (image, box) => {
      const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ff00ff"; context.fillRect(0, 0, w, h);
      if (box) {
        context.drawImage(image, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
        context.fillStyle = "#9a9a9a";
        for (const mask of box.masks) context.fillRect(mask.x, mask.y, mask.w, mask.h);
      }
      return canvas;
    };
    const ca = draw(a, origBox); const cb = draw(b, oursBox);
    const da = ca.getContext("2d").getImageData(0, 0, w, h).data;
    const db = cb.getContext("2d").getImageData(0, 0, w, h).data;
    const out = document.createElement("canvas"); out.width = w * 3 + 16; out.height = h;
    const octx = out.getContext("2d"); octx.fillStyle = "#fff"; octx.fillRect(0, 0, out.width, h);
    octx.drawImage(ca, 0, 0); octx.drawImage(cb, w + 8, 0);
    const diffImage = octx.createImageData(w, h);
    let differing = 0;
    for (let index = 0; index < da.length; index += 4) {
      const delta = Math.max(Math.abs(da[index] - db[index]), Math.abs(da[index + 1] - db[index + 1]), Math.abs(da[index + 2] - db[index + 2]));
      const gray = (da[index] + da[index + 1] + da[index + 2]) / 3;
      if (delta > 48) { differing += 1; diffImage.data.set([230, 30, 30, 255], index); }
      else diffImage.data.set([gray, gray, gray, 70], index);
    }
    octx.putImageData(diffImage, w * 2 + 16, 0);
    return { ratio: differing / (w * h), image: out.toDataURL("image/png").split(",")[1], size: [w, h] };
  }, [origShot, oursShot, origBox, oursBox, fit]);
}

// 글꼴 렌더링 맞춤: 원본(창 스크롤)은 LCD 서브픽셀, 우리(스크롤 레이어)는 회색조로 그려져 글자 가장자리만으로 차이가 난다 → 둘 다 회색조
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const tool = await browser.newPage();
const summary = { commit, measuredAt: new Date().toISOString(), states: {} };
for (const state of STATES) {
  if (only && state.device !== only) continue;
  if (stateFilter && !stateFilter.split(",").some((part) => state.key.includes(part))) continue;
  const [orig, ours] = await Promise.all([capture(browser, "orig", state), capture(browser, "ours", state)]);
  summary.states[state.key] = { regions: {}, oursErrors: ours.errors, origErrors: orig.errors.slice(0, 3) };
  for (const [name, , , options] of state.regions) {
    const result = await compare(tool, orig.shot, ours.shot, orig.regions[name], ours.regions[name], options?.fit);
    if (result.image) writeFileSync(join(outDir, `${state.key}-${name}.png`), Buffer.from(result.image, "base64"));
    summary.states[state.key].regions[name] = { diff: Math.round(result.ratio * 1000) / 10, size: result.size, orig: orig.regions[name] ? [orig.regions[name].w, orig.regions[name].h].map(Math.round) : null, ours: ours.regions[name] ? [ours.regions[name].w, ours.regions[name].h].map(Math.round) : null };
    console.log(`${state.key.padEnd(18)} ${name.padEnd(12)} ${String(summary.states[state.key].regions[name].diff).padStart(6)}%  원본 ${summary.states[state.key].regions[name].orig} / 우리 ${summary.states[state.key].regions[name].ours}`);
  }
  if (ours.errors.length) console.log(`  우리 콘솔 오류 ${ours.errors.length}건: ${ours.errors[0]}`);
}
writeFileSync(join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
await browser.close();
console.log(`결과: ${join(outDir, "summary.json")}`);
