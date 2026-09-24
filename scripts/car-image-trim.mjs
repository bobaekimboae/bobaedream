#!/usr/bin/env node
// 차량 카드 이미지 여백 잘라내기·재배치 (에셋 지침 A: 여백 0 trim → 2:1 캔버스, 폭 맞춤·아래 정렬)
// 색·필터는 바꾸지 않고 잘라내기와 크기 맞춤(재샘플링)만 한다.
// 사용:
//   node scripts/car-image-trim.mjs --analyze <파일...>
//   node scripts/car-image-trim.mjs [--width 192] [--height 96] [--fit width|height] <파일...>   (제자리 덮어쓰기)
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  const [value] = args.splice(i, 2).slice(1);
  return value;
};
const analyzeOnly = args.includes("--analyze");
if (analyzeOnly) args.splice(args.indexOf("--analyze"), 1);
const width = Number(option("--width", "192"));
const height = Number(option("--height", "96"));
const fit = option("--fit", "width");
const alphaThreshold = Number(option("--alpha", "8"));
const files = args;
if (!files.length) {
  console.error("파일을 지정하세요.");
  process.exit(1);
}

const mimeOf = (file) => (file.endsWith(".png") ? "image/png" : "image/webp");
const browser = await chromium.launch();
const page = await browser.newPage();

for (const file of files) {
  const input = readFileSync(file);
  const mime = mimeOf(file);
  const result = await page.evaluate(async ({ b64, mime, width, height, fit, alphaThreshold, analyzeOnly }) => {
    const img = new Image();
    img.src = `data:${mime};base64,${b64}`;
    await img.decode();
    const src = document.createElement("canvas");
    src.width = img.naturalWidth;
    src.height = img.naturalHeight;
    const sctx = src.getContext("2d");
    sctx.drawImage(img, 0, 0);
    const { data } = sctx.getImageData(0, 0, src.width, src.height);
    let x0 = src.width, y0 = src.height, x1 = -1, y1 = -1;
    for (let y = 0; y < src.height; y += 1) {
      for (let x = 0; x < src.width; x += 1) {
        if (data[(y * src.width + x) * 4 + 3] > alphaThreshold) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return { error: "투명 이미지(내용 없음)" };
    const box = [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
    const info = { size: [src.width, src.height], contentBox: box, fillPct: [Math.round((box[2] / src.width) * 100), Math.round((box[3] / src.height) * 100)] };
    if (analyzeOnly) return info;

    // 폭 맞춤(높이 넘치면 높이 맞춤) 또는 높이 맞춤, 가로 가운데·아래 정렬
    const scaleW = width / box[2];
    const scaleH = height / box[3];
    const scale = fit === "height" ? Math.min(scaleH, scaleW) : Math.min(scaleW, scaleH);
    const dw = box[2] * scale;
    const dh = box[3] * scale;
    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const octx = out.getContext("2d");
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(src, box[0], box[1], box[2], box[3], (width - dw) / 2, height - dh, dw, dh);
    const blob = await new Promise((resolve) => out.toBlob(resolve, mime, 0.92));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
    return { ...info, placed: [Math.round(dw * 10) / 10, Math.round(dh * 10) / 10], outType: blob.type, out: btoa(bin) };
  }, { b64: input.toString("base64"), mime, width, height, fit, alphaThreshold, analyzeOnly });

  const hash = createHash("md5").update(input).digest("hex").slice(0, 8);
  if (result.error) {
    console.log(`${file} ${hash} 오류: ${result.error}`);
    continue;
  }
  if (!analyzeOnly) {
    if (result.outType !== mime) throw new Error(`${file}: ${mime} 인코딩 실패(${result.outType})`);
    writeFileSync(file, Buffer.from(result.out, "base64"));
  }
  const { out, outType, ...summary } = result;
  console.log(`${file} ${hash} ${JSON.stringify(summary)}`);
}
await browser.close();
