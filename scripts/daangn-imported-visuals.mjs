#!/usr/bin/env node
// 수입차 임시 테스트 이미지: 당근 중고차 제조사 → 시리즈 → subseries 대표 이미지를
// 통합 차량 카탈로그의 모델그룹에 연결한다. 전용 보배드림 이미지 제작 전까지만 사용한다.
// 사용: node scripts/daangn-imported-visuals.mjs
import { readFileSync, writeFileSync } from "node:fs";

const ENDPOINT = "https://car.kr.karrotmarket.com/graphql";
const OUTPUT = "src/prototype/vehicle-catalog/daangn-imported-visuals.generated.ts";
const TARGET_MAKERS = ["아우디", "렉서스", "맥라렌", "애스턴마틴", "코닉세그", "폴스타"];
const index = JSON.parse(readFileSync("public/data/vehicle-catalog/cars-index-v1.json", "utf8"));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastRequestAt = 0;

const norm = (value) => String(value ?? "")
  .toLowerCase()
  .replace(/[()\[\]{}]/g, "")
  .replace(/클래스/g, "")
  .replace(/[\s\-·_\/]/g, "");

async function gql(query) {
  const wait = lastRequestAt + 1000 - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(`당근 GraphQL HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(payload.errors[0].message);
  return payload.data;
}

const companies = (await gql("{ autoBeginsCompanies { id name } }")).autoBeginsCompanies;
const result = {};
const stats = {};

for (const maker of TARGET_MAKERS) {
  const company = companies.find((item) => norm(item.name) === norm(maker));
  const groups = index.modelGroups.filter((group) => group.makeName === maker);
  result[maker] = {};
  if (!company) {
    stats[maker] = { groups: groups.length, matched: 0, reason: "당근 제조사 없음" };
    continue;
  }

  const series = (await gql(`{ autoBeginsSeries(companyId:"${company.id}") { id name } }`)).autoBeginsSeries;
  const seriesWithSubs = [];
  for (const item of series) {
    const subseries = (await gql(`{ autoBeginsSubseries(seriesId:"${item.id}") { id name imageUrl } }`)).autoBeginsSubseries;
    seriesWithSubs.push({ ...item, subseries });
  }

  for (const group of groups) {
    const groupKey = norm(group.name);
    let candidates = seriesWithSubs.filter((item) => norm(item.name) === groupKey);
    if (!candidates.length) {
      candidates = seriesWithSubs.filter((item) => {
        const seriesKey = norm(item.name);
        return seriesKey.length >= 2 && (seriesKey.includes(groupKey) || groupKey.includes(seriesKey));
      });
    }
    const image = candidates
      .flatMap((item) => item.subseries)
      .find((item) => item.imageUrl && (norm(item.name).includes(groupKey) || candidates.length === 1))
      ?? seriesWithSubs.flatMap((item) => item.subseries).find((item) => item.imageUrl && norm(item.name).includes(groupKey));
    if (image?.imageUrl) result[maker][group.name] = image.imageUrl;
  }
  stats[maker] = { groups: groups.length, matched: Object.keys(result[maker]).length };
  console.log(`${maker}: ${stats[maker].matched}/${stats[maker].groups}`);
}

const source = `// 이 파일은 scripts/daangn-imported-visuals.mjs 로 생성합니다.\n`
  + `// 당근 중고차 모델 이미지는 보배드림 전용 이미지 제작 전 임시 테스트 용도입니다.\n`
  + `export const daangnImportedModelImages: Record<string, Record<string, string>> = ${JSON.stringify(result, null, 2)};\n`
  + `export const daangnImportedModelImageStats = ${JSON.stringify(stats, null, 2)} as const;\n`;
writeFileSync(OUTPUT, source);
console.log(`완료: ${OUTPUT}`);
