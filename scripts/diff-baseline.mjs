// QF-106b 원본 대조 기준 교체: diff:bbm · diff:bbm:flow 의 비교 기준(원본 쪽 캡처)을 저장·읽기
// - 기본: reports/baseline/<종류>/ 에 저장된 기준(QF-106b 결과)과 비교
// - --origin: 예전처럼 개발 시안 원본(dev.bbmuseum.co.kr/car/list)을 바로 찍어 비교
// - --save-baseline: 원본과 비교하면서, 지금 우리 화면을 새 기준으로 저장하고 원본 쪽 캡처는 reports/baseline-archive/<날짜>-bbmuseum/<종류>/ 에 보관
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const baselineArgs = () => {
  const has = (flag) => process.argv.includes(flag);
  const save = has("--save-baseline");
  const origin = save || has("--origin");
  return { save, origin, useBaseline: !origin };
};

const BASE = join("reports", "baseline");
const ARCHIVE = join("reports", "baseline-archive", "2026-09-27-bbmuseum");

// 전체 화면 캡처(base64)에서 영역을 잘라 가림 상자를 칠한 PNG(base64)로 만든다
export const cropRegion = (tool, shot, box) => (box ? tool.evaluate(async ([shot, box]) => {
  const image = await new Promise((resolve) => { const img = new Image(); img.onload = () => resolve(img); img.src = `data:image/png;base64,${shot}`; });
  const w = Math.round(box.w); const h = Math.round(box.h);
  if (!w || !h) return null;
  const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
  const context = canvas.getContext("2d");
  context.drawImage(image, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
  context.fillStyle = "#9a9a9a";
  for (const mask of box.masks ?? []) context.fillRect(mask.x, mask.y, mask.w, mask.h);
  return canvas.toDataURL("image/png").split(",")[1];
}, [shot, box]) : Promise.resolve(null));

const write = (dir, key, png, meta) => {
  mkdirSync(dir, { recursive: true });
  if (png) writeFileSync(join(dir, `${key}.png`), Buffer.from(png, "base64"));
  writeFileSync(join(dir, `${key}.json`), JSON.stringify(meta ?? {}, null, 1));
};

/** 새 기준 저장(우리) */
export const saveBaseline = (kind, key, png, meta) => write(join(BASE, kind), key, png, meta);
/** 이전 기준 보관(원본) — 이미 보관한 조각은 덮어쓰지 않는다(처음 보관본 유지) */
export const archiveOrigin = (kind, key, png, meta) => { if (existsSync(join(ARCHIVE, kind, `${key}.json`))) return; write(join(ARCHIVE, kind), key, png, meta); };

/** 저장된 기준 읽기: { shot, x: 0, y: 0, w, h, masks: [] } (가림은 이미 칠해져 있음) · meta */
export const loadBaseline = (kind, key) => {
  const png = join(BASE, kind, `${key}.png`); const json = join(BASE, kind, `${key}.json`);
  const meta = existsSync(json) ? JSON.parse(readFileSync(json, "utf8")) : null;
  if (!existsSync(png)) return { region: null, meta };
  return { region: { shot: readFileSync(png).toString("base64"), x: 0, y: 0, w: meta?.w ?? 0, h: meta?.h ?? 0, masks: [] }, meta };
};
