#!/usr/bin/env node
// 오토홈 승용 브랜드 10종을 내려받아 테스트 전용 자산으로 정규화한다.
// 기본 brand/kr 자산은 건드리지 않는다.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join("public", "assets", "brand", "autohome10");
const GENERATED = join("src", "prototype", "listing", "brand-logos-autohome10.generated.ts");
mkdirSync(OUT, { recursive: true });

const selected = [
  { name: "현대", slug: "hyundai", driveId: "1DPlEf5ZHHKnCybRXLrHi2gMtr3fElwAT" },
  { name: "제네시스", slug: "genesis", driveId: "1b-6LNIRWfhlJpMq9lDiNAWOG44nVk9aE" },
  { name: "기아", slug: "kia", driveId: "1p-CArUqxW_9f5pl19W64GjyYPj5cecqy" },
  { name: "쉐보레(국산)", slug: "chevrolet", driveId: "1OmnqPQM_BFImutCnDVmqIncPw_MwsRp5" },
  { name: "르노코리아(삼성)", slug: "renault", driveId: "1odloFy4ibBNp_-nMWeJG-2l5iReqsIsu" },
  { name: "KG모빌리티(쌍용)", slug: "kgm", driveId: "15atfJLJ0W81CClufYq523NrpWqYmcUcc" },
  { name: "BMW", slug: "bmw", driveId: "1QPShoJfB5SqEFqqg-iBvj1lWUYRuDRXS" },
  { name: "벤츠", slug: "mercedes-benz", driveId: "1C46LpZ24D8RRM7f7KVLgEjV6V6KGF7CF" },
  { name: "아우디", slug: "audi", driveId: "1WY_yfXoZVNGUPD8JqOQgUAsW6Kh8t_Nb" },
  { name: "포르쉐", slug: "porsche", driveId: "1wojkzg56aDy4809NR-JZiV0ktfvqNNMW" },
];

const browser = await chromium.launch();
const page = await browser.newPage();
const output = [];
for (const item of selected) {
  const url = `https://drive.usercontent.google.com/download?id=${item.driveId}&export=download&confirm=t`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${item.name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const result = await page.evaluate(async (base64) => {
    const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const source = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = source.getContext("2d"); context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
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
    const array = new Uint8Array(await png.arrayBuffer()); let binary = "";
    for (const value of array) binary += String.fromCharCode(value);
    return { png: btoa(binary), originalSize: [bitmap.width, bitmap.height], trimmedSize: [width, height], ratio: width / height };
  }, bytes.toString("base64"));
  const file = `${item.slug}.png`;
  writeFileSync(join(OUT, file), Buffer.from(result.png, "base64"));
  output.push({ ...item, file, ratio: Math.round(result.ratio * 1000) / 1000, originalSize: result.originalSize, trimmedSize: result.trimmedSize });
}
await browser.close();

writeFileSync(join(OUT, "manifest.json"), `${JSON.stringify({
  generated: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }),
  sourceFolder: "https://drive.google.com/drive/folders/1j3iVajf-ReD2yL3Ho1kK5pxhxwmGbo64",
  warning: "비교 시안용. 르노삼성·쌍용 계열은 구형 로고가 포함되어 기본 자산으로 승격하지 않는다.",
  rule: "알파 16 이하 바깥 여백 제거 후 초톳형 40×40 광학 크기 규칙 적용.",
  brands: output,
}, null, 2)}\n`);

const rows = output.map((item) => `  ${JSON.stringify(item.name)}: { file: ${JSON.stringify(item.file)}, ratio: ${item.ratio}, driveId: ${JSON.stringify(item.driveId)} },`);
writeFileSync(GENERATED, `// scripts/brand-logo-autohome10.mjs 가 만든 오토홈 비교 시안용 파일.\nexport const autohomeTop10BrandLogos: Record<string, { file: string; ratio: number; driveId: string }> = {\n${rows.join("\n")}\n};\n`);
for (const item of output) console.log(`${item.name.padEnd(12)} ${item.trimmedSize.join("×")} ratio ${item.ratio}`);
