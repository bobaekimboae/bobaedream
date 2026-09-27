#!/usr/bin/env node
// QF-109 코드 정렬 부품(당근 · 보배드림 · AI 생성 이미지 공통, docs/model-image-spec.md)
// 입력 이미지 → (불투명 흰 배경이면 가장자리부터 이어진 흰색 제거) → 알파 16 이하 여백 자르기 → 228×120 투명 PNG에 배치
// 배치(모든 이미지 동일): 차 폭 224 고정 · 바닥선(차 아래 끝) y = 111 · 가로 가운데
//   폭 224일 때 차 높이가 100을 넘으면 높이 100으로 줄이고 바닥선은 그대로
//   원본보다 크게 키워야 하면 키우지 않고 원본 크기 그대로(바닥선만 맞춤) → upscaleSkipped
// 그림자(코드로 그림): 타원 가로 220 · 세로 12, 중심 (114, 113), 검정 14% → 가장자리 0%, 차 뒤에
// 좌우 반전 없음. 색·모양은 바꾸지 않음(크기·위치만)
// 사용(부품): import { createNormalizer } from "./image-normalize.mjs"; const n = await createNormalizer(); await n.normalize(bytes) → { png, ... }; await n.close()
// 사용(명령): node scripts/image-normalize.mjs <입력> <출력.png>
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const SPEC = { canvas: [228, 120], carWidth: 224, maxCarHeight: 100, baseline: 111, shadow: { cx: 114, cy: 113, rx: 110, ry: 6, alpha: 0.14 }, alphaCut: 16 };

export async function createNormalizer({ browser: given } = {}) {
  const browser = given ?? await chromium.launch();
  const page = await browser.newPage();
  await page.goto("about:blank");
  const normalize = (bytes) => page.evaluate(async ([b64, spec]) => {
    const bitmap = await createImageBitmap(await (await fetch(`data:application/octet-stream;base64,${b64}`)).blob());
    const w = bitmap.width; const h = bitmap.height;
    const source = new OffscreenCanvas(w, h);
    const sctx = source.getContext("2d", { willReadFrequently: true });
    sctx.drawImage(bitmap, 0, 0);
    const image = sctx.getImageData(0, 0, w, h); const data = image.data;
    const at = (x, y) => (y * w + x) * 4;
    const nearWhite = (i) => data[i + 3] > spec.alphaCut && data[i] >= 235 && data[i + 1] >= 235 && data[i + 2] >= 235;
    // 불투명 흰 배경: 가장자리 픽셀의 40% 이상이 불투명한 흰색 → 가장자리에서 이어진 흰색만 투명으로(차 안의 흰색은 남김)
    let edge = 0; let edgeWhite = 0;
    for (let x = 0; x < w; x += 1) for (const y of [0, h - 1]) { edge += 1; if (nearWhite(at(x, y))) edgeWhite += 1; }
    for (let y = 1; y < h - 1; y += 1) for (const x of [0, w - 1]) { edge += 1; if (nearWhite(at(x, y))) edgeWhite += 1; }
    const whiteBackground = edgeWhite / edge >= 0.4;
    if (whiteBackground) {
      const seen = new Uint8Array(w * h); const stack = [];
      const push = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const k = y * w + x; if (seen[k]) return; seen[k] = 1; if (nearWhite(k * 4)) stack.push(k); };
      for (let x = 0; x < w; x += 1) { push(x, 0); push(x, h - 1); }
      for (let y = 0; y < h; y += 1) { push(0, y); push(w - 1, y); }
      while (stack.length) { const k = stack.pop(); data[k * 4 + 3] = 0; const x = k % w; const y = (k - x) / w; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
      sctx.putImageData(image, 0, 0);
    }
    // 알파 16 이하 여백 자르기
    let minX = w; let minY = h; let maxX = -1; let maxY = -1;
    for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) if (data[at(x, y) + 3] > spec.alphaCut) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    if (maxX < 0) return { error: "모두 투명" };
    const trimW = maxX - minX + 1; const trimH = maxY - minY + 1;
    // 색 확인(바꾸지 않음): 불투명 픽셀 평균 밝기·채도 — 진한 색·유채색 차는 보고서에 목록으로
    let luma = 0; let sat = 0; let n = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 128) { const r = data[i]; const g = data[i + 1]; const b = data[i + 2]; const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); luma += 0.2126 * r + 0.7152 * g + 0.0722 * b; sat += mx ? (mx - mn) / mx : 0; n += 1; }
    const meanLuma = n ? Math.round(luma / n) : null; const meanSat = n ? Math.round((sat / n) * 100) / 100 : null;
    // 배치 크기
    let scale = spec.carWidth / trimW; let heightCapped = false;
    if (trimH * scale > spec.maxCarHeight) { scale = spec.maxCarHeight / trimH; heightCapped = true; }
    let upscaleSkipped = false;
    if (scale > 1) { scale = 1; upscaleSkipped = true; }
    const carW = trimW * scale; const carH = trimH * scale;
    const x0 = (spec.canvas[0] - carW) / 2; const y0 = spec.baseline + 1 - carH; // 차 아래 끝 픽셀 = y 111(111 행까지 칠함)
    const out = new OffscreenCanvas(spec.canvas[0], spec.canvas[1]);
    const ctx = out.getContext("2d");
    // 그림자(차 뒤)
    const s = spec.shadow;
    ctx.save(); ctx.translate(s.cx, s.cy); ctx.scale(s.rx, s.ry);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, `rgba(0,0,0,${s.alpha})`); gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // 차
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, minX, minY, trimW, trimH, x0, y0, carW, carH);
    const buffer = new Uint8Array(await (await out.convertToBlob({ type: "image/png" })).arrayBuffer());
    let binary = ""; for (let i = 0; i < buffer.length; i += 1) binary += String.fromCharCode(buffer[i]);
    return { png: btoa(binary), original: [w, h], trimmed: [trimW, trimH], placed: { x: Math.round(x0 * 10) / 10, y: Math.round(y0 * 10) / 10, w: Math.round(carW * 10) / 10, h: Math.round(carH * 10) / 10 }, scale: Math.round(scale * 1000) / 1000, heightCapped, upscaleSkipped, whiteBackground, meanLuma, meanSat };
  }, [bytes.toString("base64"), SPEC]);

  // 점검: 그림자만 있을 때의 알파(기대값)보다 16 이상 진한 픽셀 = 차. 차 상자·그림자 표본(차 아래 y 116 한 줄)
  const measure = (pngBytes) => page.evaluate(async ([b64, spec]) => {
    const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
    const w = bitmap.width; const h = bitmap.height;
    const canvas = new OffscreenCanvas(w, h); const ctx = canvas.getContext("2d", { willReadFrequently: true }); ctx.drawImage(bitmap, 0, 0);
    const { data } = ctx.getImageData(0, 0, w, h);
    const s = spec.shadow;
    const shadowAlpha = (x, y) => { const t = Math.hypot((x + 0.5 - s.cx) / s.rx, (y + 0.5 - s.cy) / s.ry); return t < 1 ? s.alpha * (1 - t) * 255 : 0; };
    let minX = w; let minY = h; let maxX = -1; let maxY = -1;
    for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) if (data[(y * w + x) * 4 + 3] > shadowAlpha(x, y) + 16) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    const sample = [60, 114, 168].map((x) => ({ x, alpha: data[(116 * w + x) * 4 + 3], expected: Math.round(shadowAlpha(x, 116)) }));
    return { size: [w, h], car: maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, bottom: maxY }, shadow: sample };
  }, [pngBytes.toString("base64"), SPEC]);

  return { normalize, measure, close: async () => { await page.close(); if (!given) await browser.close(); } };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) { console.log("사용: node scripts/image-normalize.mjs <입력> <출력.png>"); process.exit(1); }
  const normalizer = await createNormalizer();
  const result = await normalizer.normalize(readFileSync(input));
  if (result.error) { console.log(result.error); process.exitCode = 1; }
  else { writeFileSync(output, Buffer.from(result.png, "base64")); const { png, ...info } = result; console.log(JSON.stringify(info), JSON.stringify(await normalizer.measure(Buffer.from(png, "base64")))); }
  await normalizer.close();
}
