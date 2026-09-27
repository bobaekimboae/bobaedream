#!/usr/bin/env node
// QF-097: 카탈로그 스냅숏 + 이미지 manifest → 화면용 데이터와 백엔드 전달용 목록(이미지를 다시 받지 않음)
// 출력: src/prototype/data/model-catalog-kr.generated.ts — 9개 제조사 모든 모델·세부 모델(0대 포함, 좌측 필터는 원본처럼 0대도 보인다). ratio 가 있으면 이미지 있음
//       reports/qf-097/missing-images.csv — 보배드림 카탈로그 image 값에 확장자가 없는 세부 모델(value · image_url 등)
// 사용: node scripts/model-catalog-data.mjs  (model-images-kr.mjs 가 끝에 부른다)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const snapshot = JSON.parse(readFileSync("src/prototype/data/model-catalog-kr.json", "utf8"));
const manifest = JSON.parse(readFileSync("public/assets/models/kr/manifest.json", "utf8"));
// QF-109: 이미지는 모두 코드 정렬 228×120(비율 1.9). source = daangn · bobaedream
const withFile = Object.values(manifest.makers).flatMap((entry) => entry.models).filter((item) => item.file);
const ratioOf = new Map(withFile.map((item) => [item.value, item.ratio ?? 1.9]));
const sourceOf = new Map(withFile.map((item) => [item.value, item.source]));
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;

const screen = snapshot.makers.map(({ maker, makerId, groups }) => ({
  maker, makerId,
  models: groups.map((group) => ({
    value: group.value, label: group.label, count: group.count,
    models: group.models.map((sub) => ({ value: sub.value, label: sub.label, count: sub.count, relYear: sub.rel_year, code: sub.code, generation: sub.generation, ...(ratioOf.has(sub.value) ? { ratio: ratioOf.get(sub.value), source: sourceOf.get(sub.value) } : {}) })),
  })),
}));
writeFileSync("src/prototype/data/model-catalog-kr.generated.ts", `// QF-097: node scripts/model-catalog-data.mjs 로 만든 파일(직접 고치지 않음). 카탈로그 받은 날짜 ${snapshot.fetchedAt}
// 9개 제조사 모든 모델·세부 모델(count 는 카탈로그 매물 수, 0 포함). ratio 가 있으면 public/assets/models/kr/{makerId}/{value}.png 가 있다(가로÷세로)
export type CatalogSubModel = { value: number; label: string; count: number; relYear: string | null; code: string | null; generation: string | null; ratio?: number; source?: "daangn" | "bobaedream" };
export type CatalogModel = { value: number; label: string; count: number; models: CatalogSubModel[] };
export type CatalogMaker = { maker: string; makerId: number; models: CatalogModel[] };
export const modelCatalogFetchedAt = ${JSON.stringify(snapshot.fetchedAt)};
export const modelCatalogKr: CatalogMaker[] = ${JSON.stringify(screen)};
`);

const csv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const rows = [["maker", "maker_id", "model", "sub_model_value", "sub_model_label", "code", "rel_year", "catalog_count", "image", "image_url", "our_image"].join(",")];
for (const { maker, makerId, groups } of snapshot.makers) for (const group of groups) for (const sub of group.models) {
  if (sub.image && IMAGE_EXT.test(sub.image)) continue;
  rows.push([maker, makerId, group.label, sub.value, sub.label, sub.code, sub.rel_year, sub.count, sub.image, sub.image_url, ratioOf.has(sub.value) ? "당근 이미지로 채움" : "없음(점선 빈 칸)"].map(csv).join(","));
}
mkdirSync("reports/qf-097", { recursive: true });
writeFileSync("reports/qf-097/missing-images.csv", `﻿${rows.join("\n")}\n`);
console.log(`화면용 데이터: 모델 ${screen.reduce((sum, entry) => sum + entry.models.length, 0)} · missing-images.csv ${rows.length - 1}줄`);
