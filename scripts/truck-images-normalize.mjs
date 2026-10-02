#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { createNormalizer } from "./image-normalize.mjs";

const projectRoot = resolve(import.meta.dirname, "..");
const outputDir = resolve(process.argv[2] ?? join(projectRoot, "public/assets/truck/formats/v01"));
const sourceDir = resolve(process.argv[3] ?? join(projectRoot, "../bobaedream_truck_source_v01"));
const reportPath = resolve(process.argv[4] ?? join(projectRoot, "reports/truck-image-normalize-v01.csv"));

mkdirSync(sourceDir, { recursive: true });
mkdirSync(resolve(reportPath, ".."), { recursive: true });

const files = readdirSync(outputDir).filter((name) => name.endsWith(".png")).sort();
if (!files.length) throw new Error(`PNG 파일이 없습니다: ${outputDir}`);

for (const name of files) {
  const backup = join(sourceDir, name);
  if (!existsSync(backup)) copyFileSync(join(outputDir, name), backup);
}

const normalizer = await createNormalizer();
const rows = [];
try {
  for (const name of files) {
    const sourcePath = join(sourceDir, name);
    const result = await normalizer.normalize(readFileSync(sourcePath));
    if (result.error) throw new Error(`${name}: ${result.error}`);
    const png = Buffer.from(result.png, "base64");
    writeFileSync(join(outputDir, name), png);
    const measured = await normalizer.measure(png);
    rows.push({
      file: basename(name),
      original: result.original.join("x"),
      trimmed: result.trimmed.join("x"),
      placedX: result.placed.x,
      placedY: result.placed.y,
      placedW: result.placed.w,
      placedH: result.placed.h,
      measuredX: measured.car?.x ?? "",
      measuredY: measured.car?.y ?? "",
      measuredW: measured.car?.w ?? "",
      measuredH: measured.car?.h ?? "",
      bottom: measured.car?.bottom ?? "",
      heightCapped: result.heightCapped,
      meanLuma: result.meanLuma,
      meanSat: result.meanSat,
    });
  }
} finally {
  await normalizer.close();
}

const columns = Object.keys(rows[0]);
const csv = [columns.join(","), ...rows.map((row) => columns.map((column) => JSON.stringify(row[column])).join(","))].join("\n") + "\n";
writeFileSync(reportPath, csv);

const widths = rows.map((row) => Number(row.measuredW));
const heights = rows.map((row) => Number(row.measuredH));
const bottoms = [...new Set(rows.map((row) => row.bottom))];
console.log(JSON.stringify({
  count: rows.length,
  outputDir,
  sourceDir,
  reportPath,
  measuredWidth: [Math.min(...widths), Math.max(...widths)],
  measuredHeight: [Math.min(...heights), Math.max(...heights)],
  bottoms,
}, null, 2));
