#!/usr/bin/env node
// QF-109: 당근 중고차 차종 트리(제조사 → 시리즈 → subseries + 이미지) 받기. 화면에서는 부르지 않고 이 스크립트로만 받는다
// 요청은 1초에 1번 이하, 실패하면 30초 쉬고 3번까지 다시. 받은 것은 tmp/daangn-cache/ 에 저장(있으면 다시 받지 않음, 커밋하지 않음)
// 출력: tmp/daangn-cache/tree.json · tmp/daangn-cache/img/{subseriesId}.webp
// 사용: node scripts/daangn-fetch.mjs [--brands=벤츠,BMW]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CACHE = join("tmp", "daangn-cache");
const DAANGN = "https://car.kr.karrotmarket.com/graphql";
mkdirSync(join(CACHE, "img"), { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let last = 0;
const polite = async () => { const wait = last + 1000 - Date.now(); if (wait > 0) await sleep(wait); last = Date.now(); };
const retry = async (label, fn) => {
  for (let attempt = 1; ; attempt += 1) {
    await polite();
    try { return await fn(); } catch (error) {
      if (attempt > 3) throw new Error(`${label}: ${error.message}`);
      console.log(`  ${label} 실패(${error.message}) → 30초 뒤 다시(${attempt}/3)`);
      await sleep(30000);
    }
  }
};
const cached = (name, fn) => { const file = join(CACHE, name); if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8")); return fn().then((value) => { writeFileSync(file, JSON.stringify(value)); return value; }); };
const gql = (query) => retry("GraphQL", async () => {
  const response = await fetch(DAANGN, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json(); if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
});

// 보배드림(시안) 제조사 이름 ↔ 당근 제조사 이름
export const BRAND_MAP = { 벤츠: "벤츠", BMW: "BMW", 현대: "현대", 기아: "기아", 포르쉐: "포르쉐", 페라리: "페라리", 람보르기니: "람보르기니", 벤틀리: "벤틀리", 롤스로이스: "롤스로이스", "쉐보레(국산)": "쉐보레", "르노코리아(삼성)": "르노코리아", "KG모빌리티(쌍용)": "KGM", 제네시스: "제네시스" };

const only = (process.argv.find((arg) => arg.startsWith("--brands=")) ?? "").slice(9).split(",").filter(Boolean);
const snapshot = JSON.parse(readFileSync("src/prototype/data/model-catalog-kr.json", "utf8"));
const brands = snapshot.makers.map((entry) => entry.maker).filter((name) => !only.length || only.includes(name));
const companies = (await cached("companies.json", () => gql("{ autoBeginsCompanies { id name } }"))).autoBeginsCompanies;
const tree = { fetchedAt: new Date().toISOString(), brandMap: {}, companies: {} };
for (const brand of brands) {
  const target = BRAND_MAP[brand] ?? brand;
  const company = companies.find((item) => item.name === target) ?? companies.find((item) => item.name.replace(/\s/g, "") === target.replace(/\s/g, ""));
  tree.brandMap[brand] = company ? { id: company.id, name: company.name } : null;
  if (!company) { console.log(`${brand}: 당근 제조사 없음`); continue; }
  const series = (await cached(`series-${company.id}.json`, () => gql(`{ autoBeginsSeries(companyId:"${company.id}") { id name } }`))).autoBeginsSeries;
  const entry = { id: company.id, name: company.name, series: [] };
  for (const item of series) {
    const subs = (await cached(`subseries-${item.id}.json`, () => gql(`{ autoBeginsSubseries(seriesId:"${item.id}") { id name imageUrl } }`))).autoBeginsSubseries;
    for (const sub of subs) {
      const file = join(CACHE, "img", `${sub.id}.webp`);
      if (sub.imageUrl && !existsSync(file)) {
        try { const bytes = await retry(`이미지 ${sub.id}`, async () => { const r = await fetch(sub.imageUrl); if (!r.ok) throw new Error(`HTTP ${r.status}`); return Buffer.from(await r.arrayBuffer()); }); writeFileSync(file, bytes); }
        catch (error) { console.log(`  이미지 실패 ${sub.name}: ${error.message}`); }
      }
    }
    entry.series.push({ id: item.id, name: item.name, subseries: subs.map((sub) => ({ id: sub.id, name: sub.name, imageUrl: sub.imageUrl, cached: existsSync(join(CACHE, "img", `${sub.id}.webp`)) })) });
    console.log(`${brand} ${item.name}: ${subs.length}`);
  }
  tree.companies[brand] = entry;
}
writeFileSync(join(CACHE, "tree.json"), JSON.stringify(tree, null, 1));
console.log("완료:", Object.entries(tree.companies).map(([brand, entry]) => `${brand} 시리즈 ${entry.series.length} · subseries ${entry.series.reduce((sum, item) => sum + item.subseries.length, 0)}`).join(" / "));
