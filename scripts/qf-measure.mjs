#!/usr/bin/env node
// 과쯔 퀵필터 실측 스크립트 (OP-008)
// 사용: npm run measure:qf [-- <URL>]
//   URL 기본값: 로컬 vite preview (없으면 dist/client로 자동 실행)
// 측정: 모바일 393×852 @3x(전체 흐름) + PC 1440×900 @1x &pc=1(제조사·벤츠 모델 레일)
// 출력: reports/shots/<커밋>/measure.json, 단계별 PNG(PC는 pc-*.png), 콘솔 표
import { chromium } from "@playwright/test";
import { execSync, spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_URL = "http://127.0.0.1:4173/?qf=guazi&category=%EC%A4%91%EA%B3%A0%EC%B0%A8";
const targetUrl = process.argv[2] ?? DEFAULT_URL;
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(targetUrl);

function commitId() {
  try {
    const hash = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim() ? "-dirty" : "";
    return hash + dirty;
  } catch {
    return "nogit";
  }
}

async function isReachable(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensurePreview(url) {
  if (!isLocal || (await isReachable(url))) return null;
  if (!existsSync("dist/client/index.html")) {
    throw new Error("dist/client가 없습니다. 먼저 npm run verify:qf 로 빌드하세요.");
  }
  const port = new URL(url).port || "4173";
  const child = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", port, "--strictPort"], { stdio: "ignore" });
  for (let i = 0; i < 50; i += 1) {
    if (await isReachable(url)) return child;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  child.kill();
  throw new Error(`vite preview가 ${port} 포트에서 시작되지 않았습니다.`);
}

// 레일 안 카드·칩 치수를 브라우저 안에서 계산한다.
function measureRailInPage() {
  const rail = document.querySelector(".depth-rail");
  if (!rail) return null;
  const r = rail.getBoundingClientRect();
  const label = rail.querySelector(".depth-rail-label");
  const labelBox = label?.getBoundingClientRect();
  const labelStyle = label ? getComputedStyle(label) : null;
  const round = (n) => Math.round(n * 10) / 10;
  const cards = [...rail.querySelectorAll(".depth-card")].map((card) => {
    const c = card.getBoundingClientRect();
    const media = card.querySelector(".depth-card-media");
    const m = media?.getBoundingClientRect();
    const name = card.querySelector(".depth-card-label");
    const sub = card.querySelector(".depth-card-sub");
    const ev = card.querySelector(".depth-card-ev");
    const e = ev?.getBoundingClientRect();
    const logo = media?.classList.contains("is-brand") ? media.querySelector(".brand-logo img, .brand-logo svg") : null;
    const l = logo?.getBoundingClientRect();
    return {
      label: name?.textContent ?? "",
      sub: sub?.textContent ?? null,
      selected: card.classList.contains("is-selected"),
      size: [round(c.width), round(c.height)],
      padTop: round(c.top - r.top),
      padBottom: round(r.bottom - c.bottom - parseFloat(getComputedStyle(rail).borderBottomWidth || "0")),
      media: m ? { size: [round(m.width), round(m.height)], top: round(m.top - c.top), kind: media.classList.contains("is-brand") ? "brand" : "vehicle" } : null,
      nameTop: name ? round(name.getBoundingClientRect().top - c.top) : null,
      subTop: sub ? round(sub.getBoundingClientRect().top - c.top) : null,
      spark: e ? { x: round(e.left - c.left), y: round(e.top - c.top), size: [round(e.width), round(e.height)], color: getComputedStyle(ev).color, ariaLabel: ev.getAttribute("aria-label") } : null,
      logo: l ? { size: [round(l.width), round(l.height)] } : null,
    };
  });
  const chips = [...rail.querySelectorAll(".trim-chip")].map((chip) => {
    const c = chip.getBoundingClientRect();
    const s = getComputedStyle(chip);
    return { label: chip.textContent, size: [round(c.width), round(c.height)], centerOffset: round(c.top + c.height / 2 - (r.top + r.height / 2)), fontSize: s.fontSize, border: s.border, selected: chip.classList.contains("is-selected"), disabled: chip.disabled };
  });
  return {
    railHeight: round(r.height),
    railLabel: label ? { text: label.textContent, fontSize: labelStyle.fontSize, color: labelStyle.color, centerOffset: round(labelBox.top + labelBox.height / 2 - (r.top + r.height / 2)) } : null,
    cards,
    chips,
    summaryChip: (() => {
      const chip = document.querySelector(".filter-chip.is-vehicle-summary");
      return chip ? { text: chip.textContent.trim(), width: round(chip.getBoundingClientRect().width) } : null;
    })(),
    topChips: [...document.querySelectorAll(".filter-track .filter-chip")].map((chip) => chip.textContent.trim()),
    // QF-028: 칩별 ▾(chevron-down) / × 표시 여부
    topChipMarks: [...document.querySelectorAll(".filter-track .filter-chip")].map((chip) => ({
      label: chip.textContent.trim(),
      active: chip.classList.contains("is-active"),
      chevron: Boolean(chip.querySelector("img[src*='chevron-down']")),
      clear: Boolean(chip.querySelector(".filter-chip-clear")),
    })),
    // 레일(Carousel)과 화면 안에 온전히 보이는 카드·칩 수
    visibleCount: (() => {
      const clip = rail.querySelector(".brand-carousel")?.getBoundingClientRect() ?? r;
      const left = Math.max(clip.left, 0);
      const right = Math.min(clip.right, window.innerWidth);
      const items = [...rail.querySelectorAll(".depth-card, .trim-chip")].map((el) => el.getBoundingClientRect());
      return { full: items.filter((b) => b.left >= left - 0.5 && b.right <= right + 0.5).length, partial: items.filter((b) => b.right > left && b.left < right).length, total: items.length };
    })(),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
}

// 이미지 칸 스크린샷에서 배경(모서리 픽셀)과 다른 픽셀의 경계를 구한다.
async function visibleBounds(page, locator, scale) {
  const png = await locator.screenshot({ animations: "disabled" });
  return page.evaluate(async ({ b64, scale }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, img.width, img.height);
    const bg = [data[0], data[1], data[2]];
    let minX = img.width, minY = img.height, maxX = -1, maxY = -1;
    for (let y = 0; y < img.height; y += 1) {
      for (let x = 0; x < img.width; x += 1) {
        const i = (y * img.width + x) * 4;
        if (Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) > 24) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return { size: [0, 0], background: `rgb(${bg.join(",")})` };
    const r = (n) => Math.round((n / scale) * 10) / 10;
    return { size: [r(maxX - minX + 1), r(maxY - minY + 1)], offset: [r(minX), r(minY)], background: `rgb(${bg.join(",")})` };
  }, { b64: png.toString("base64"), scale });
}

async function addVisibleSizes(page, result, viewportWidth, scale) {
  if (!result) return result;
  const medias = page.locator(".depth-rail .depth-card .depth-card-media");
  const count = Math.min(await medias.count(), result.cards.length);
  for (let i = 0; i < count; i += 1) {
    const media = medias.nth(i);
    if (!(await media.isVisible())) continue;
    const box = await media.boundingBox();
    if (!box || box.x < 0 || box.x + box.width > viewportWidth) continue; // 화면 밖 카드는 건너뜀
    result.cards[i].visible = await visibleBounds(page, media, scale);
  }
  return result;
}

async function clickCard(page, labelPattern) {
  const card = page.locator(".depth-rail .depth-card").filter({ has: page.locator(".depth-card-label", { hasText: labelPattern }) }).first();
  if (!(await card.count())) throw new Error(`카드를 찾지 못함: ${labelPattern}`);
  await card.evaluate((el) => el.click()); // Carousel 밖 카드도 클릭
  await page.waitForTimeout(400);
}

async function clickFirstCard(page) {
  const card = page.locator(".depth-rail .depth-card:not([disabled])").first();
  const label = await card.locator(".depth-card-label").textContent();
  await card.evaluate((el) => el.click());
  await page.waitForTimeout(400);
  return label;
}

const commit = commitId();
const outDir = join("reports", "shots", commit);
mkdirSync(outDir, { recursive: true });

const preview = await ensurePreview(targetUrl);
const browser = await chromium.launch();

// 모바일(393×852 @3x)과 PC(1440×900 @1x, &pc=1)를 같은 방식으로 측정한다.
async function createSession({ name, url, viewport, scale, mobile, prefix }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  const session = { name, url, viewport: `${viewport.width}x${viewport.height}@${scale}x`, page, consoleErrors: [], steps: [] };
  page.on("console", (msg) => { if (msg.type() === "error") session.consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => session.consoleErrors.push(String(err)));
  session.step = async (stepName) => {
    await page.waitForTimeout(300);
    const data = await addVisibleSizes(page, await page.evaluate(measureRailInPage), viewport.width, scale);
    const shot = join(outDir, `${prefix}${String(session.steps.length + 1).padStart(2, "0")}-${stepName}.png`);
    await page.screenshot({ path: shot });
    const rail = page.locator(".depth-rail").first();
    if (await rail.count()) await rail.screenshot({ path: shot.replace(/\.png$/, "-rail.png") });
    session.steps.push({ step: stepName, shot, ...data });
  };
  session.open = async () => {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator(".depth-rail").first().waitFor({ timeout: 15000 });
  };
  return session;
}

const mobile = await createSession({ name: "모바일", url: targetUrl, viewport: { width: 393, height: 852 }, scale: 3, mobile: true, prefix: "" });
const pc = await createSession({ name: "PC", url: `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}pc=1`, viewport: { width: 1440, height: 900 }, scale: 1, mobile: false, prefix: "pc-" });
const { page, steps, consoleErrors } = mobile;
const step = mobile.step;
const open = mobile.open;
let picker = null;

try {
  await open();
  await step("maker");
  await clickCard(page, /^벤츠$/);
  await step("benz-models");
  await clickCard(page, /^E-?클래스$/);
  await step("e-class-generations");
  const firstGeneration = await clickFirstCard(page);
  await step(`generation-${firstGeneration}`.replace(/[^\w가-힣-]+/g, "_"));
  await open();
  await clickCard(page, /^BMW$/);
  await step("bmw-models");
  await clickCard(page, /^3시리즈$/);
  await step("3-series-generations");
  // QF-018: 차종 시트에서 세대 없는 모델(SLS AMG) 선택 시 세대 칸 문구
  await page.locator(".filter-chip.is-vehicle-summary .filter-chip-label").evaluate((el) => el.click());
  const sheet = page.locator(".vehicle-picker-sheet");
  await sheet.waitFor({ timeout: 5000 });
  await sheet.locator(".vehicle-picker-grid.is-makers button", { hasText: /^벤츠$/ }).first().evaluate((el) => el.click());
  await sheet.locator(".vehicle-picker-grid:not(.is-makers):not(.is-generations) button", { hasText: /^SLS AMG$/ }).first().evaluate((el) => el.click());
  await page.waitForTimeout(300);
  picker = await page.evaluate(() => {
    const sheetEl = document.querySelector(".vehicle-picker-sheet");
    const panel = sheetEl.closest("[role='dialog']") ?? sheetEl;
    return {
      generationText: document.querySelector(".vehicle-picker-grid.is-generations")?.textContent?.trim() ?? null,
      selectedModel: document.querySelector(".vehicle-picker-grid:not(.is-makers):not(.is-generations) .is-selected")?.textContent ?? null,
      sheetHeightPct: Math.round((panel.getBoundingClientRect().height / window.innerHeight) * 100),
    };
  });
  await page.screenshot({ path: join(outDir, `${String(steps.length + 1).padStart(2, "0")}-picker-sls-amg.png`) });
} catch (error) {
  steps.push({ step: "error", error: String(error) });
  process.exitCode = 1;
}

// PC: 제조사 레일 → 벤츠 모델 레일
try {
  await pc.open();
  await pc.step("maker");
  await clickCard(pc.page, /^벤츠$/);
  await pc.step("benz-models");
} catch (error) {
  pc.steps.push({ step: "error", error: String(error) });
  process.exitCode = 1;
} finally {
  await browser.close();
  preview?.kill();
}

const pack = ({ name, url, viewport, consoleErrors: errors, steps: list }) => ({ name, url, viewport, consoleErrors: errors, steps: list });
const report = { url: targetUrl, commit, measuredAt: new Date().toISOString(), mobile: pack(mobile), pc: pack(pc), picker };
writeFileSync(join(outDir, "measure.json"), JSON.stringify(report, null, 2));

const fmt = (v) => (Array.isArray(v) ? v.join("×") : v ?? "-");
for (const s of steps) {
  if (s.error) { console.log(`\n[${s.step}] ${s.error}`); continue; }
  console.log(`\n[${s.step}] 레일 ${s.railHeight}px · 라벨 ${s.railLabel ? `${s.railLabel.text} ${s.railLabel.fontSize} ${s.railLabel.color} 중앙차 ${s.railLabel.centerOffset}` : "없음"} · 요약칩 ${s.summaryChip ? `${s.summaryChip.text} (${s.summaryChip.width}px)` : "-"} · 가로넘침 ${s.horizontalOverflow ? "있음" : "없음"}`);
  console.log(`  상단 칩: ${s.topChipMarks.map((c) => `${c.label}${c.chevron ? "▾" : ""}${c.clear ? "×" : ""}`).join(" | ")}`);
  if (s.cards.length) {
    // 화면에 보이는 카드와 전기차 카드만 표로 (전체는 measure.json)
    console.table(s.cards.filter((c) => c.visible || c.spark).map((c) => ({ 이름: c.label, "2줄째": c.sub ?? "-", 카드: fmt(c.size), "위/아래": `${c.padTop}/${c.padBottom}`, 이미지칸: fmt(c.media?.size), "실제보임": fmt(c.visible?.size), 로고: fmt(c.logo?.size), 스파크: c.spark ? `${c.spark.x},${c.spark.y} ${fmt(c.spark.size)}` : "-", 선택: c.selected ? "O" : "" })));
  }
  if (s.chips.length) {
    console.table(s.chips.slice(0, 8).map((c) => ({ 칩: c.label, 크기: fmt(c.size), 중앙차: c.centerOffset, 글자: c.fontSize, 선택: c.selected ? "O" : "", 비활성: c.disabled ? "O" : "" })));
  }
}
if (picker) console.log(`\n[차종 시트] 벤츠 ${picker.selectedModel ?? "-"} 선택 → 세대 칸 "${picker.generationText}" · 시트 높이 ${picker.sheetHeightPct}%`);

// 모바일·PC 비교 (제조사 레일, 벤츠 모델 레일)
const summarize = (s, errors) => {
  if (!s || s.error) return { 레일: s?.error ? "오류" : "-" };
  const card = s.cards[0];
  const medias = [...new Set(s.cards.map((c) => fmt(c.media?.size)))].join(", ");
  return {
    레일: `${s.railHeight}px`,
    카드: card ? fmt(card.size) : "-",
    "위/아래": card ? `${card.padTop}/${card.padBottom}` : "-",
    이미지칸: medias || "-",
    "보이는 카드": `${s.visibleCount.full}개 (일부 ${s.visibleCount.partial} / 전체 ${s.visibleCount.total})`,
    가로넘침: s.horizontalOverflow ? "있음" : "없음",
    콘솔오류: `${errors.length}건`,
  };
};
for (const name of ["maker", "benz-models"]) {
  const m = summarize(mobile.steps.find((s) => s.step === name), mobile.consoleErrors);
  const p = summarize(pc.steps.find((s) => s.step === name), pc.consoleErrors);
  console.log(`\n[모바일·PC 비교: ${name}]`);
  console.table(Object.fromEntries(Object.keys({ ...m, ...p }).map((key) => [key, { "모바일 393": m[key] ?? "-", "PC 1440": p[key] ?? "-" }])));
}
for (const s of pc.steps.filter((x) => x.error)) console.log(`[PC ${s.step}] ${s.error}`);
console.log(`\n콘솔 오류 모바일 ${consoleErrors.length}건 · PC ${pc.consoleErrors.length}건${consoleErrors.length ? `: ${consoleErrors.slice(0, 3).join(" | ")}` : ""}`);
console.log(`결과: ${join(outDir, "measure.json")}`);
