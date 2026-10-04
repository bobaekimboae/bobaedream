#!/usr/bin/env node
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const baseUrl = process.env.BIKE_GENRE_URL ?? "http://127.0.0.1:5177/";
const outDir = join("reports", "bike-genre-v01");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const summary = { baseUrl, measuredAt: new Date().toISOString(), checks: [], mobile: null, pc: null };
const check = (name, ok, detail) => {
  summary.checks.push({ name, ok, detail });
  console.log(`${ok ? "O" : "X"} ${name} — ${detail}`);
};

const inspectGenreRows = async (page, scope) => page.locator(`${scope} .bbmf-bike-genre-row`).evaluateAll((rows) => rows.map((row) => {
  const imageBox = row.querySelector(".bbmf-bike-genre-image");
  const image = imageBox?.querySelector("img");
  const boxRect = imageBox?.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();
  const style = image ? getComputedStyle(image) : null;
  return {
    label: row.querySelector(".bbmf-bike-genre-label")?.textContent?.trim() ?? "",
    rowHeight: Math.round((rowRect?.height ?? 0) * 10) / 10,
    box: boxRect ? [Math.round(boxRect.width * 10) / 10, Math.round(boxRect.height * 10) / 10] : null,
    pending: imageBox?.classList.contains("is-pending") ?? false,
    src: image?.getAttribute("src") ?? null,
    source: image ? [image.naturalWidth, image.naturalHeight] : null,
    loaded: image ? image.complete && image.naturalWidth > 0 : null,
    objectFit: style?.objectFit ?? null,
    objectPosition: style?.objectPosition ?? null,
  };
}));

const runtimeFailures = [];
const attachFailureTracking = (page) => {
  page.on("pageerror", (error) => runtimeFailures.push(String(error)));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const location = message.location();
    if (location.url?.endsWith("/favicon.ico")) return;
    runtimeFailures.push(`${location.url || "console"}:${location.lineNumber ?? 0} ${message.text()}`);
  });
  page.on("response", (response) => { if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) runtimeFailures.push(`${response.status()} ${response.url()}`); });
};

const mobileContext = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
const mobile = await mobileContext.newPage();
attachFailureTracking(mobile);
await mobile.goto(`${baseUrl}?qf=guazi&category=${encodeURIComponent("바이크")}`, { waitUntil: "networkidle", timeout: 60_000 });
await mobile.locator(".filter-fixed").first().tap();
await mobile.locator(".bbmf-full-more").tap();
await mobile.locator(".bbmf-full-item").filter({ hasText: /^장르/ }).first().tap();
await mobile.locator(".bbmf-sheet .bbmf-bike-genre-list").waitFor({ state: "visible" });
summary.mobile = await inspectGenreRows(mobile, ".bbmf-sheet");
await mobile.locator(".bbmf-sheet").screenshot({ path: join(outDir, "mobile-393-genre-sheet.png"), animations: "disabled" });

const fourLabels = ["네이키드", "스쿠터", "스포츠", "멀티퍼포즈"];
const mobileMade = summary.mobile.filter((row) => fourLabels.includes(row.label));
check("모바일 장르 13개", summary.mobile.length === 13, `${summary.mobile.length}개`);
check("모바일 행 64px", summary.mobile.every((row) => row.rowHeight === 64), [...new Set(summary.mobile.map((row) => row.rowHeight))].join(", "));
check("모바일 표면 56×40", summary.mobile.every((row) => row.box?.[0] === 56 && row.box?.[1] === 40), JSON.stringify([...new Set(summary.mobile.map((row) => row.box?.join("×"))) ]));
check("제작 4종 180×120 로드", mobileMade.length === 4 && mobileMade.every((row) => row.loaded && row.source?.[0] === 180 && row.source?.[1] === 120), mobileMade.map((row) => `${row.label}:${row.source?.join("×")}`).join(", "));
check("contain·center bottom", mobileMade.every((row) => row.objectFit === "contain" && (row.objectPosition === "50% 100%" || row.objectPosition === "center bottom")), mobileMade.map((row) => `${row.label}:${row.objectFit}/${row.objectPosition}`).join(", "));
check("미제작 9종 점선 빈 슬롯", summary.mobile.filter((row) => row.pending && !row.src).length === 9, `${summary.mobile.filter((row) => row.pending && !row.src).length}개`);

await mobile.locator(".bbmf-bike-genre-row").filter({ hasText: /^스포츠/ }).tap();
const mobileConfirmText = await mobile.locator(".bbmf-sheet .bbmf-confirm").textContent();
check("스포츠 선택 결과 10대", mobileConfirmText?.includes("10대 보기") ?? false, mobileConfirmText?.trim() ?? "없음");
await mobileContext.close();

const pcContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const pc = await pcContext.newPage();
attachFailureTracking(pc);
await pc.goto(`${baseUrl}?qf=guazi&pc=1&category=${encodeURIComponent("바이크")}`, { waitUntil: "networkidle", timeout: 60_000 });
await pc.locator("aside.bbm-filter .bbm-filter-more-toggle").click();
const genreToggle = pc.locator("aside.bbm-filter .bbm-filter-toggle").filter({ hasText: /^장르/ }).first();
await genreToggle.click();
await pc.locator(".bbmf-modal .bbmf-bike-genre-list").waitFor({ state: "visible" });
summary.pc = await inspectGenreRows(pc, ".bbmf-modal");
await pc.locator(".bbmf-modal").screenshot({ path: join(outDir, "pc-1440-genre-modal.png"), animations: "disabled" });
const pcMade = summary.pc.filter((row) => fourLabels.includes(row.label));
check("PC 장르 13개", summary.pc.length === 13, `${summary.pc.length}개`);
check("PC 행 60px", summary.pc.every((row) => row.rowHeight === 60), [...new Set(summary.pc.map((row) => row.rowHeight))].join(", "));
check("PC 제작 4종 동일 파일", pcMade.length === 4 && pcMade.every((row) => row.loaded && row.source?.[0] === 180 && row.source?.[1] === 120), pcMade.map((row) => `${row.label}:${row.source?.join("×")}`).join(", "));
check("404·콘솔 오류 0", runtimeFailures.length === 0, runtimeFailures.length ? runtimeFailures.join(" | ") : "0건");

writeFileSync(join(outDir, "measurement.json"), JSON.stringify({ ...summary, runtimeFailures }, null, 2));
await pcContext.close();
await browser.close();

const failures = summary.checks.filter((item) => !item.ok);
console.log(`결과: ${summary.checks.length - failures.length}/${summary.checks.length} 통과`);
process.exitCode = failures.length ? 1 : 0;
