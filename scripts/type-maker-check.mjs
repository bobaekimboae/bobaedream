#!/usr/bin/env node
// QF-114 바이크 · 트럭·특장 제조사 줄 점검(과쯔). 유형마다 PC 1440·1280: 11칸 한 줄(넘침 0) · 이름표 없음 · 칸 84×102 · 이름 폭 76 · 순서(국산 → 구분선 → 수입 → 전체 브랜드)
// 로고 크기 3단계(상자 40·36 안 폭·높이 %) · 로고 없는 칸 = 첫 글자 원형 · 샘플 0대 흐리게 · 승용 브랜드 없음 · 전체 브랜드 열기(유형 목록만)·고르기·닫기
// 모바일 393: 칸 64×74 · 이름 폭 56 · 가로 스크롤. 캡처 reports/qf-114/
// 사용: node scripts/type-maker-check.mjs [--base=<주소>]
import { chromium, devices } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv.find((a) => a.startsWith("--base=")) ?? "").slice(7) || "http://127.0.0.1:4173/bobaedream/";
const out = join("reports", "qf-114"); mkdirSync(out, { recursive: true });
const lists = { 바이크: JSON.parse(readFileSync("src/prototype/data/brand-top10-bike.json", "utf8")), "트럭·특장": JSON.parse(readFileSync("src/prototype/data/brand-top10-truck.json", "utf8")) };
const passenger = ["제네시스", "쉐보레", "르노코리아", "아우디", "포르쉐", "BMW"];
const railLabel = (label) => ({ "KG모빌리티": "KGM", "만(MAN)": "MAN", "다프(DAF)": "DAF", "대림(DL)": "대림" }[label] ?? label);
const browser = await chromium.launch({ args: ["--disable-lcd-text"] });
const result = {}; let fails = 0;
const check = (name, ok, detail) => { if (!ok) fails += 1; console.log(`${ok ? "O" : "X"} ${name} — ${detail}`); };
const tier = (r) => (r <= 1.25 ? { key: "≤1.25", long: 0.825 } : r < 1.6 ? { key: "1.25~1.6", w: 0.91 } : { key: "≥1.6", w: 1 });

for (const [type, list] of Object.entries(lists)) {
  const tag = type === "바이크" ? "bike" : "truck";
  const want = [...list.domestic.map(railLabel), "|", ...list.imported.map(railLabel), "전체 브랜드"].join(" ");
  result[type] = {};
  for (const [size, device, viewport] of [["pc-1440", "pc", { width: 1440, height: 900 }], ["pc-1280", "pc", { width: 1280, height: 800 }], ["m-393", "m", { width: 393, height: 852 }]]) {
    const ctx = device === "pc" ? await browser.newContext({ viewport }) : await browser.newContext({ ...devices["iPhone 13"], viewport, deviceScaleFactor: 2 });
    const page = await ctx.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    const act = (l) => (device === "pc" ? l.click() : l.tap());
    await page.goto(`${base}?qf=guazi${device === "pc" ? "&pc=1" : ""}`, { waitUntil: "networkidle" }); await page.waitForTimeout(500);
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
    await act(page.locator(".bbm-category-menu__button").filter({ hasText: type }).first()); await page.waitForTimeout(700);
    const m = await page.evaluate(() => {
      const rail = document.querySelector(".depth-rail.is-kr-maker"); if (!rail) return null;
      const track = rail.querySelector(".depth-rail-track"); const cards = [...rail.querySelectorAll(".depth-card")];
      const order = [...track.children].map((e) => (e.classList.contains("kr-maker-divider") ? "|" : e.querySelector(".depth-card-label")?.textContent.trim() ?? ""));
      return {
        order, n: cards.length, overflow: track.scrollWidth - track.clientWidth, lastRight: Math.round(cards.at(-1).getBoundingClientRect().right), railRight: Math.round(rail.getBoundingClientRect().right), label: Boolean(rail.querySelector(".depth-rail-label")),
        cells: cards.map((c) => { const box = c.querySelector(".depth-card-media").getBoundingClientRect(); const img = c.querySelector(".kr-brand-logo img"); const i = img?.getBoundingClientRect(); const logo = c.querySelector(".kr-brand-logo");
          return { name: c.querySelector(".depth-card-label").textContent.trim(), size: [Math.round(c.getBoundingClientRect().width), Math.round(c.getBoundingClientRect().height)], nameW: Math.round(c.querySelector(".depth-card-label").getBoundingClientRect().width), box: Math.round(box.width), ratio: Number(logo?.dataset.ratio ?? 0) || null, img: i ? [Math.round(i.width * 10) / 10, Math.round(i.height * 10) / 10] : null, initial: Boolean(c.querySelector(".kr-brand-initial")), dim: c.classList.contains("is-dim") }; }),
      };
    });
    if (!m) { check(`${type} ${size} 제조사 줄 있음`, false, "없음"); await ctx.close(); continue; }
    await page.locator(".depth-rail.is-kr-maker").screenshot({ path: join(out, `${tag}-${size}-rail.png`) });
    // 로고 크기 3단계
    const logoBad = m.cells.filter((c) => c.img && c.ratio).filter((c) => { const t = tier(c.ratio); const want = t.long ? (c.ratio >= 1 ? c.box * t.long : c.box * t.long) : c.box * t.w; const got = t.long ? Math.max(c.img[0], c.img[1]) : c.img[0]; return Math.abs(got - want) > 0.6; }).map((c) => `${c.name} ${c.img.join("×")}`);
    result[type][size] = { ...m, errors: errors.length };
    const cellSize = device === "pc" ? "84×102" : "64×74"; const nameW = device === "pc" ? 76 : 56;
    check(`${type} ${size} 순서 ${want}`, m.order.join(" ") === want, m.order.join(" "));
    check(`${type} ${size} 승용 브랜드 없음`, !m.cells.some((c) => passenger.includes(c.name) && !list.domestic.concat(list.imported).map(railLabel).includes(c.name)), m.cells.map((c) => c.name).join(","));
    check(`${type} ${size} 칸 ${cellSize} · 이름 폭 ${nameW} · 이름표 없음`, m.cells.every((c) => c.size.join("×") === cellSize && c.nameW === nameW) && !m.label, `${[...new Set(m.cells.map((c) => c.size.join("×")))]} · ${[...new Set(m.cells.map((c) => c.nameW))]}`);
    if (device === "pc") check(`${type} ${size} 11칸 한 줄(넘침 0)`, m.n === 11 && m.overflow <= 0 && m.lastRight <= m.railRight, `칸 ${m.n} · 넘침 ${m.overflow} · 끝 ${m.lastRight} ≤ ${m.railRight}`);
    else check(`${type} ${size} 가로 스크롤(11칸, 마지막 칸이 화면 밖)`, m.n === 11 && m.lastRight > 393, `칸 ${m.n} · 마지막 칸 오른쪽 ${m.lastRight}`);
    check(`${type} ${size} 로고 크기 3단계(82.5 · 91 · 100%)`, logoBad.length === 0, logoBad.join(", ") || m.cells.filter((c) => c.img).map((c) => `${c.name} ${c.ratio}→${c.img.join("×")}`).join(" · "));
    check(`${type} ${size} 로고 없는 칸 = 첫 글자 원형 · 샘플 0대 흐리게`, m.cells.filter((c) => c.name !== "전체 브랜드").every((c) => c.img || c.initial) && m.cells.filter((c) => c.name !== "전체 브랜드").every((c) => c.dim), `첫 글자 ${m.cells.filter((c) => c.initial).map((c) => c.name).join(",")} · 흐리게 ${m.cells.filter((c) => c.dim).length}`);
    // 전체 브랜드: 열기(유형 목록만) → 고르기 → 닫기
    await act(page.locator(".depth-rail .depth-card").filter({ hasText: "전체 브랜드" }).first()); await page.waitForTimeout(500);
    const opened = await page.evaluate(() => ({ sections: [...document.querySelectorAll(".bbm-maker-list .bbm-maker-section-title")].map((e) => e.textContent), rows: [...document.querySelectorAll(".bbm-maker-list .bbm-maker-row")].map((r) => r.querySelector(".bbm-maker-name").textContent), disabled: document.querySelectorAll(".bbm-maker-list .bbm-maker-row[disabled]").length }));
    if (size !== "pc-1280") await page.screenshot({ path: join(out, `${tag}-${size}-allbrands.png`) });
    const pick = list.imported[1];
    await act(page.locator(".bbm-maker-list .bbm-maker-row").filter({ has: page.locator(".bbm-maker-name", { hasText: new RegExp(`^${pick.replace(/[()]/g, "\\$&")}$`) }) }).first()); await page.waitForTimeout(600);
    const after = await page.evaluate(() => ({ open: Boolean(document.querySelector(".bbm-maker-list")), chips: [...document.querySelectorAll(".filter-chip.is-active")].filter((c) => c.getBoundingClientRect().width).map((c) => c.textContent.trim()) }));
    const allRows = [...list.all.domestic, ...list.all.imported, ...list.all.etc];
    check(`${type} ${size} 전체 브랜드: 유형 목록만(국산 → 수입 이름순 → 기타) · 0대도 고를 수 있게`, opened.sections.join(",") === "국산,수입 이름순,기타" && opened.rows.join(",") === allRows.join(",") && opened.disabled === 0, `${opened.sections.join("→")} · ${opened.rows.length}행`);
    check(`${type} ${size} 고르기(${pick}) → 닫힘 · 칩`, !after.open && after.chips.includes(pick), JSON.stringify(after));
    check(`${type} ${size} 콘솔 오류 0`, errors.length === 0, `${errors.length}`);
    await ctx.close();
  }
}
writeFileSync(join(out, "type-maker.json"), JSON.stringify(result, null, 1));
await browser.close();
console.log(`결과: ${fails ? `실패 ${fails}` : "모두 통과"}`);
process.exitCode = fails ? 1 : 0;
