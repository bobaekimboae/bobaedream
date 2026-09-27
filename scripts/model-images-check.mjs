#!/usr/bin/env node
// QF-109 check:model-images — 코드 정렬 결과 점검(docs/model-image-spec.md)
// ① 파일: manifest 의 모든 이미지가 228×120 · 차 바닥선 111±1 · 차 폭 224±1(높이 100 제한이면 높이 100±1, 확대 안 함이면 원본 폭±1) · 그림자 표본 기대값±3 · 가로 가운데±1
// ② 화면(과쯔 plain, 미리보기 127.0.0.1:4173): 모델·세부모델 이미지 영역 PC 76×40(칸 위 6) · 모바일 56×36(칸 위 0), 이름 PC 칸 위 60 · 모바일 38,
//    보조 글자 PC 81 · 모바일 56, 제조사 줄 로고 상자 바닥 = 모델 줄 이미지 영역 바닥(칸 위 기준 차이 0), 빈 칸 점선 #DADADA
// 사용: npm run check:model-images [-- --base=<주소>]
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createNormalizer, SPEC } from "./image-normalize.mjs";

const base = (process.argv.find((a) => a.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const manifest = JSON.parse(readFileSync("public/assets/models/kr/manifest.json", "utf8"));
const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok }); console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };

const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const normalizer = await createNormalizer({ browser });
const items = Object.values(manifest.makers).flatMap((entry) => entry.models).filter((item) => item.file);
const bad = { size: [], bottom: [], width: [], center: [], shadow: [] };
for (const item of items) {
  const m = await normalizer.measure(readFileSync(join("public", "assets", "models", "kr", item.file)));
  const id = `${item.group}/${item.label}${item.code ? `(${item.code})` : ""}`;
  if (m.size[0] !== SPEC.canvas[0] || m.size[1] !== SPEC.canvas[1]) bad.size.push(id);
  if (!m.car || Math.abs(m.car.bottom - SPEC.baseline) > 1) bad.bottom.push(`${id} ${m.car?.bottom}`);
  const wantW = item.upscaleSkipped ? item.placed.w : SPEC.carWidth;
  const okW = m.car && (Math.abs(m.car.w - wantW) <= 1 || (item.heightCapped && Math.abs(m.car.h - SPEC.maxCarHeight) <= 1 && m.car.w <= SPEC.carWidth + 1));
  if (!okW) bad.width.push(`${id} ${m.car?.w}×${m.car?.h}`);
  if (m.car && Math.abs(m.car.x + m.car.w / 2 - SPEC.canvas[0] / 2) > 1) bad.center.push(`${id} ${m.car.x}`);
  if (m.shadow.some((s) => Math.abs(s.alpha - s.expected) > 3)) bad.shadow.push(`${id} ${m.shadow.map((s) => `${s.alpha}/${s.expected}`).join(" ")}`);
}
check(`파일 ${items.length}개 228×120`, !bad.size.length, bad.size.slice(0, 5).join(", ") || "모두");
check("차 바닥선 y 111±1", !bad.bottom.length, bad.bottom.slice(0, 5).join(", ") || "모두");
check("차 폭 224±1(높이 100 제한은 높이 100±1, 확대 안 함은 원본 폭)", !bad.width.length, bad.width.slice(0, 5).join(", ") || `모두 · 높이 제한 ${items.filter((i) => i.heightCapped).length} · 확대 안 함 ${items.filter((i) => i.upscaleSkipped).length}`);
check("가로 가운데 ±1", !bad.center.length, bad.center.slice(0, 5).join(", ") || "모두");
check("그림자 위치·진하기 동일(차 아래 y 116 표본 ±3)", !bad.shadow.length, bad.shadow.slice(0, 5).join(", ") || "모두");

// ② 화면
for (const [tag, device, viewport] of [["pc-1440", "pc", { width: 1440, height: 900 }], ["m-393", "m", { width: 393, height: 852 }]]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, ...(device === "m" ? { isMobile: true, hasTouch: true } : {}) });
  const page = await context.newPage();
  const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  await page.goto(`${base}?qf=guazi${device === "pc" ? "&pc=1" : ""}`, { waitUntil: "networkidle" });
  const act = (l) => (device === "m" ? l.tap() : l.click());
  await act(page.locator(".bbm-category-menu__button").filter({ hasText: /^중고차/ }).first()); await page.waitForTimeout(500);
  const measureRail = () => page.evaluate(() => {
    const rail = [...document.querySelectorAll(".depth-rail")].find((r) => r.getBoundingClientRect().width);
    const cards = [...rail.querySelectorAll(".depth-card")].slice(0, 6);
    return cards.map((card) => {
      const c = card.getBoundingClientRect(); const media = card.querySelector(".depth-card-media").getBoundingClientRect();
      const label = card.querySelector(".depth-card-label")?.getBoundingClientRect(); const sub = card.querySelector(".depth-card-sub")?.getBoundingClientRect();
      const empty = card.querySelector(".kr-model-empty"); const es = empty ? getComputedStyle(empty) : null;
      return { card: [Math.round(c.width), Math.round(c.height)], media: [Math.round(media.width * 10) / 10, Math.round(media.height * 10) / 10], mediaTop: Math.round((media.top - c.top) * 10) / 10, mediaBottom: Math.round((media.bottom - c.top) * 10) / 10, labelTop: label ? Math.round((label.top - c.top) * 10) / 10 : null, subTop: sub ? Math.round((sub.top - c.top) * 10) / 10 : null, empty: es ? `${es.borderTopWidth} ${es.borderTopStyle} ${es.borderTopColor} ${es.borderTopLeftRadius}` : null };
    });
  });
  const makerCells = await measureRail();
  await act(page.locator(".depth-rail .depth-card").filter({ has: page.locator(".depth-card-label", { hasText: /^벤츠$/ }) }).first()); await page.waitForTimeout(600);
  const modelCells = await measureRail();
  await act(page.locator(".depth-rail .depth-card").filter({ has: page.locator(".depth-card-label", { hasText: /^C클래스$/ }) }).first()); await page.waitForTimeout(600);
  const subCells = await measureRail();
  const want = device === "pc" ? { media: [76, 40], top: 6, label: 60, sub: 81, card: [84, 102] } : { media: [56, 36], top: 0, label: 38, sub: 56, card: [64, 74] };
  const okCell = (cell) => cell.card[0] === want.card[0] && cell.card[1] === want.card[1] && cell.media[0] === want.media[0] && cell.media[1] === want.media[1] && cell.mediaTop === want.top && cell.labelTop === want.label && (cell.subTop === null || cell.subTop === want.sub);
  check(`${tag} 모델 줄(벤츠) 칸 ${want.card.join("×")} · 이미지 영역 ${want.media.join("×")}(칸 위 ${want.top}) · 이름 ${want.label} · 보조 ${want.sub}`, modelCells.length > 0 && modelCells.every(okCell), JSON.stringify(modelCells[0]));
  check(`${tag} 세부모델 줄(C클래스) 같은 규격`, subCells.length > 0 && subCells.every(okCell), `${subCells.length}칸 ${JSON.stringify(subCells[0])}`);
  const logoBottom = makerCells[0].mediaBottom; const carSlotBottom = modelCells[0].mediaBottom;
  check(`${tag} 제조사 로고 상자 바닥 = 모델 이미지 영역 바닥(칸 위 기준 차이 0)`, logoBottom === carSlotBottom, `로고 ${logoBottom} · 모델 ${carSlotBottom} · 차이 ${Math.round((carSlotBottom - logoBottom) * 10) / 10}`);
  const empties = [...modelCells, ...subCells].filter((cell) => cell.empty);
  check(`${tag} 빈 칸 = 같은 영역 1px 점선 #DADADA 모서리 6`, empties.every((cell) => cell.empty === "1px dashed rgb(218, 218, 218) 6px"), empties.length ? empties[0].empty : "이 흐름에 빈 칸 없음");
  check(`${tag} 콘솔 오류 0`, !errors.length, errors[0] ?? "0");
  await context.close();
}
await normalizer.close(); await browser.close();
const failed = checks.filter((c) => !c.ok).length;
console.log(`결과: 통과 ${checks.length - failed}/${checks.length}`);
process.exitCode = failed ? 1 : 0;
