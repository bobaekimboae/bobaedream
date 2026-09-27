#!/usr/bin/env node
// QF-095: 초톳 PC(xe.chotot.com) 상단 카드와 우리 과쯔 PC 상단 카드를 1440에서 같은 크기로 찍어 줄별(경로 · 제목 줄 · 칩 줄 · 유형 줄) 픽셀 차이를 낸다.
// 글자 내용·언어 차이는 두 쪽 모두 같은 방법으로 없앤다: 글자는 같은 폭의 투명 칸으로(글자만 투명, 아이콘은 보임), 칩·유형 칸 개수는 우리 개수에 맞추고, 아이콘·로고 그림은 회색 상자로 가린다.
// 모양(배경·모서리·테두리)·위치·간격·크기만 비교한다. 글자 크기·굵기·색은 수치표(computed style)로 따로 확인한다.
// 사용: npm run diff:chotot-top [-- --ours=<주소>] · 출력: reports/diff/<커밋>/chotot-top/summary.json · <줄>.png(초톳 | 우리 | 차이) — 커밋하지 않음
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CHOTOT = "https://xe.chotot.com/mua-ban-oto-quan-ba-dinh-ha-noi";
const OURS = ((process.argv.find((arg) => arg.startsWith("--ours=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/") + "?qf=guazi&pc=1";
const commit = (() => { try { const hash = execSync("git rev-parse --short HEAD").toString().trim(); const dirty = execSync("git status --porcelain").toString().trim(); return dirty ? `${hash}-dirty` : hash; } catch { return "local"; } })();
const outDir = join("reports", "diff", commit, "chotot-top");
mkdirSync(outDir, { recursive: true });

// 줄 구간(카드 기준 y): 초톳 실측 줄 위치
const BANDS = [["crumbs", 12, 41], ["title", 41, 81], ["chips", 81, 137], ["type-row", 137, 251], ["card", 0, 263]];

const SIDES = {
  chotot: {
    url: CHOTOT,
    card: `document.querySelector("h1").closest(".fc4z13b")`,
    // 초톳 → 우리와 같은 개수로: 칩(맨 앞 필터 칩 제외) 6개, 유형 칸 7개, 스크롤 화살표 숨김
    normalize: (card, counts) => {
      const chips = [...card.querySelectorAll("a[class*=chipFilterItem]")];
      chips.slice(counts.chips).forEach((chip) => { chip.parentElement.style.display = "none"; });
      card.querySelectorAll("[class*=WrapperScrollV2_icon], [class*=BreadCrumb_icon], .CFPrevIcon, .CFNextIcon").forEach((icon) => { icon.style.display = "none"; });
      const cells = [...card.querySelectorAll(".i8mxczi")];
      cells.slice(counts.cells).forEach((cell) => { cell.style.display = "none"; });
      // 초톳 칸 높이 102 는 두 줄 이름(Mercedes Benz) 때문 — 칸을 줄여도 원래 높이 102 를 유지
      cells.forEach((cell) => { cell.style.height = "102px"; });
      return { texts: card.querySelectorAll("li span, li a span, h1, button, a[class*=chipFilterItem] span, a.c1umyuca, .iuicfpt"), icons: [...card.querySelectorAll(".igh7o8e img, .igh7o8e span")] };
    },
  },
  ours: {
    url: OURS,
    card: `document.querySelector(".bbm-hybrid-top .bbm-content-head")`,
    normalize: (card) => ({ texts: card.querySelectorAll(".bbm-ct-crumbs button, .bbm-ct-crumbs strong, .bbm-ct-title, .bbm-ct-save, .filter-chip span, .filter-chip-label, .bbm-filter-button span, .bbm-ct-reset, .bbm-category-menu__label"), icons: [...card.querySelectorAll(".bbm-category-menu__icon-box")] }),
  },
};

const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const shoot = async (side, counts) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: side === "chotot" ? "vi-VN" : "ko-KR" });
  await page.goto(SIDES[side].url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(side === "chotot" ? 6000 : 1500);
  await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}" });
  const info = await page.evaluate(([side, cardExpr, normalizeSource, counts]) => {
    const card = eval(cardExpr);
    const normalize = eval(`(${normalizeSource})`);
    const { texts, icons } = normalize(card, counts);
    // 글자: 같은 폭의 투명 칸(단어·언어 차이 없애기). 경로·칩 글자 40, 제목 200, 검색저장 글자 60, 유형 이름 40
    const widthFor = (element) => element.matches("h1, .bbm-ct-title") ? 200 : element.matches(".iuicfpt, .bbm-category-menu__label") ? 40 : element.matches("button:not([class*=size-lg]), .bbm-ct-save, .bbm-ct-reset") ? null : 40;
    for (const element of texts) {
      const width = widthFor(element);
      element.style.webkitTextFillColor = "transparent";
      if (width && !element.matches("a.c1umyuca, .bbm-filter-button span")) { element.style.display = "inline-block"; element.style.width = `${width}px`; element.style.overflow = "hidden"; element.style.whiteSpace = "nowrap"; if (element.matches(".iuicfpt, .bbm-category-menu__label")) element.style.textAlign = "center"; }
    }
    // 나머지 글자도 글자만 투명(-webkit-text-fill-color) — 아이콘(currentColor SVG)과 경로 구분 "/"는 그대로 보인다(초톳 "/"는 ::after)
    card.querySelectorAll("*").forEach((element) => { if (element.matches(".bbm-ct-crumb-sep")) return; if ([...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim())) element.style.webkitTextFillColor = "transparent"; });
    const r = card.getBoundingClientRect();
    const masks = icons.map((icon) => icon.getBoundingClientRect()).filter((b) => b.width).map((b) => ({ x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height }));
    const chipCount = side === "ours" ? card.querySelectorAll(".bbm-ct-chip-track .filter-chip").length : null;
    const cellCount = side === "ours" ? card.querySelectorAll(".bbm-category-menu__item").length : null;
    return { x: r.left, y: r.top, w: r.width, h: r.height, masks, chipCount, cellCount };
  }, [side, SIDES[side].card, SIDES[side].normalize.toString(), counts]);
  const shot = (await page.screenshot({ clip: { x: info.x, y: info.y, width: info.w, height: info.h } })).toString("base64");
  await page.close();
  return { ...info, shot };
};
const ours = await shoot("ours", {});
const chotot = await shoot("chotot", { chips: ours.chipCount, cells: ours.cellCount });

const tool = await browser.newPage();
const summary = { chotot: CHOTOT, ours: OURS, commit, measuredAt: new Date().toISOString(), card: { chotot: [chotot.w, chotot.h], ours: [ours.w, ours.h] }, bands: {} };
for (const [name, top, bottom] of BANDS) {
  const result = await tool.evaluate(async ([a, b, top, bottom]) => {
    const load = (b64) => new Promise((resolve) => { const image = new Image(); image.onload = () => resolve(image); image.src = `data:image/png;base64,${b64}`; });
    const w = Math.round(Math.min(a.w, b.w)); const h = bottom - top;
    const draw = async (side) => { const image = await load(side.shot); const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h; const context = canvas.getContext("2d"); context.drawImage(image, 0, top, w, h, 0, 0, w, h); context.fillStyle = "#9a9a9a"; for (const m of side.masks) context.fillRect(m.x, m.y - top, m.w, m.h); return canvas; };
    const ca = await draw(a); const cb = await draw(b);
    const da = ca.getContext("2d").getImageData(0, 0, w, h).data; const db = cb.getContext("2d").getImageData(0, 0, w, h).data;
    const out = document.createElement("canvas"); out.width = w; out.height = h * 3 + 16;
    const octx = out.getContext("2d"); octx.fillStyle = "#fff"; octx.fillRect(0, 0, w, out.height); octx.drawImage(ca, 0, 0); octx.drawImage(cb, 0, h + 8);
    const diff = octx.createImageData(w, h); let differing = 0;
    for (let i = 0; i < da.length; i += 4) {
      const delta = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      const gray = (da[i] + da[i + 1] + da[i + 2]) / 3;
      if (delta > 48) { differing += 1; diff.data.set([230, 30, 30, 255], i); } else diff.data.set([gray, gray, gray, 70], i);
    }
    octx.putImageData(diff, 0, h * 2 + 16);
    return { ratio: differing / (w * h), image: out.toDataURL("image/png").split(",")[1] };
  }, [chotot, ours, top, bottom]);
  writeFileSync(join(outDir, `${name}.png`), Buffer.from(result.image, "base64"));
  summary.bands[name] = Math.round(result.ratio * 1000) / 10;
  console.log(`${name.padEnd(10)} ${String(summary.bands[name]).padStart(5)}%`);
}
writeFileSync(join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
console.log(`카드 초톳 ${chotot.w}×${chotot.h} / 우리 ${ours.w}×${ours.h} · 결과: ${join(outDir, "summary.json")}`);
await browser.close();
