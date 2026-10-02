#!/usr/bin/env node
// Drive 승용 브랜드 10종 후보 중 실제 40×40 슬롯 검수에서 고른 원본만 정규화한다.
// 기본 brand/kr 자산은 건드리지 않고, 테스트 전용 public/assets/brand/drive10 에 쓴다.
import { chromium } from "@playwright/test";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

const SOURCE = join("tmp", "brand-candidates-v02");
const OUT = join("public", "assets", "brand", "drive10");
const GENERATED = join("src", "prototype", "listing", "brand-logos-drive10.generated.ts");
mkdirSync(OUT, { recursive: true });

const selected = [
  { name: "현대", slug: "hyundai", source: "과쯔", input: "guazi-hyundai.png", driveId: "1F_-4f8JpQt1teo_Ajsff48JSQq5dIkOC", reason: "파란 심볼이 40px 슬롯에서 가장 선명함" },
  { name: "제네시스", slug: "genesis", source: "과쯔", input: "guazi-genesis.png", driveId: "1XUxQmEJq61zfqrvBJeRs4_KNxD6mqf2S", reason: "256px 원본·짙은 단색으로 저대비 크롬 후보보다 식별력이 좋음" },
  { name: "기아", slug: "kia", source: "K카", input: "kcar-kia.png", driveId: "1CSJKs0Uea_8sdJIpLzq46IlhfL_Zczd3", reason: "워드마크 획이 또렷하고 가로 점유율이 안정적임" },
  { name: "쉐보레(국산)", slug: "chevrolet", source: "K카", input: "kcar-chevrolet.png", driveId: "1MRc0OgwFJ61Fu8dUSjfDYdgFpjxM6cl-", reason: "보타이 외곽선과 금색 면이 작은 슬롯에서도 유지됨" },
  { name: "르노코리아(삼성)", slug: "renault", source: "K카", input: "kcar-renault.svg", driveId: "1uVWQ9FjUsMlRgNnVyYiy32bljhwXXceY", reason: "벡터 원본이며 세로형 심볼의 중심과 획이 안정적임" },
  { name: "KG모빌리티(쌍용)", slug: "kgm", source: "K카", input: "kcar-kgm.svg", driveId: "1Z1xtPlxpQkV6vjn2g9AetIXiK7CMt7Jm", reason: "구형 쌍용 심볼 대신 현행 KGM 워드마크 사용" },
  { name: "BMW", slug: "bmw", source: "과쯔", input: "guazi-bmw.png", driveId: "18tcOL2936T-T-RrGK_SYxWwq1aCmSY7O", reason: "원형 심볼 외곽과 내부 색 구분이 33px에서 균형적임" },
  { name: "벤츠", slug: "mercedes-benz", source: "과쯔", input: "guazi-benz.png", driveId: "1AzugBhRvOysYHQDZR8vHi3adl9y7FYbe", reason: "원형 외곽과 삼각별의 선 두께가 작은 슬롯에서 안정적임" },
  { name: "아우디", slug: "audi", source: "K카", input: "kcar-audi.png", driveId: "1SbIgmcKQ8sd2IA56t1KUNeYJZel9y1D-", reason: "가로형 4링의 실제 점유율과 대비가 가장 좋음" },
  { name: "포르쉐", slug: "porsche", source: "과쯔", input: "guazi-porsche.png", driveId: "1NWIIuejGBdOfLHRkOh4bv1sHAoI5O6V1", reason: "256px 원본을 투명 여백 제거해 문양 손실을 줄임" },
];

const browser = await chromium.launch();
const page = await browser.newPage();
const output = [];

for (const item of selected) {
  const sourcePath = join(SOURCE, item.input);
  const extension = extname(item.input).toLowerCase();
  if (extension === ".svg") {
    const svg = readFileSync(sourcePath, "utf8");
    const viewBox = svg.match(/viewBox=["']([^"']+)["']/i)?.[1]?.trim().split(/\s+/).map(Number);
    const ratio = viewBox && viewBox.length === 4 && viewBox[3] ? viewBox[2] / viewBox[3] : 1;
    const file = `${item.slug}.svg`;
    copyFileSync(sourcePath, join(OUT, file));
    output.push({ ...item, file, ratio: Math.round(ratio * 1000) / 1000, originalSize: viewBox ? [viewBox[2], viewBox[3]] : null, trimmedSize: viewBox ? [viewBox[2], viewBox[3]] : null });
    continue;
  }

  const bytes = readFileSync(sourcePath);
  const result = await page.evaluate(async (base64) => {
    const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const source = new OffscreenCanvas(bitmap.width, bitmap.height);
    const sourceContext = source.getContext("2d");
    sourceContext.drawImage(bitmap, 0, 0);
    const pixels = sourceContext.getImageData(0, 0, bitmap.width, bitmap.height).data;
    let minX = bitmap.width; let minY = bitmap.height; let maxX = -1; let maxY = -1;
    for (let y = 0; y < bitmap.height; y += 1) for (let x = 0; x < bitmap.width; x += 1) {
      if (pixels[(y * bitmap.width + x) * 4 + 3] > 16) {
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
    if (maxX < minX || maxY < minY) throw new Error("모두 투명한 이미지");
    const width = maxX - minX + 1; const height = maxY - minY + 1;
    const canvas = new OffscreenCanvas(width, height);
    canvas.getContext("2d").drawImage(source, minX, minY, width, height, 0, 0, width, height);
    const png = await canvas.convertToBlob({ type: "image/png" });
    const array = new Uint8Array(await png.arrayBuffer());
    let binary = ""; for (const value of array) binary += String.fromCharCode(value);
    return { png: btoa(binary), originalSize: [bitmap.width, bitmap.height], trimmedSize: [width, height], ratio: width / height };
  }, bytes.toString("base64"));
  const file = `${item.slug}.png`;
  writeFileSync(join(OUT, file), Buffer.from(result.png, "base64"));
  output.push({ ...item, file, ratio: Math.round(result.ratio * 1000) / 1000, originalSize: result.originalSize, trimmedSize: result.trimmedSize });
}

await browser.close();

writeFileSync(join(OUT, "manifest.json"), `${JSON.stringify({
  generated: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }),
  sourceFolder: "https://drive.google.com/drive/folders/1HkYia3Hv3FyQkVzMZYQI7jllav2RqO3n",
  rule: "알파 16 이하 바깥 여백 제거. 40×40 슬롯에서 wide=40px, square/tall=33px 광학 크기. 기본 로고 자산과 분리한 테스트 세트.",
  brands: output,
}, null, 2)}\n`);

const generatedRows = output.map((item) => `  ${JSON.stringify(item.name)}: { file: ${JSON.stringify(item.file)}, ratio: ${item.ratio}, source: ${JSON.stringify(item.source)}, driveId: ${JSON.stringify(item.driveId)} },`);
writeFileSync(GENERATED, `// scripts/brand-logo-drive10.mjs 가 만든 테스트 전용 파일. 직접 수정하지 않는다.\nexport const driveTop10BrandLogos: Record<string, { file: string; ratio: number; source: string; driveId: string }> = {\n${generatedRows.join("\n")}\n};\n`);

for (const item of output) console.log(`${item.name.padEnd(12)} ${item.source.padEnd(4)} ${basename(item.file).padEnd(18)} ratio ${item.ratio}`);
