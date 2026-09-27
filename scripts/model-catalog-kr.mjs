#!/usr/bin/env node
// QF-097: 과쯔 모드 모델·세부 모델 카탈로그 스냅숏(화면은 API 를 부르지 않고 이 파일만 읽는다).
// 출처: 개발 시안(bbmuseum) 필터 카탈로그 POST https://staging.bbmuseum.co.kr/v1/cars/filters/catalog-tree (Origin https://dev.bbmuseum.co.kr)
// 출력: src/prototype/data/model-catalog-kr.json — 받은 날짜 + 제조사별 모델(group) → 세부 모델(model) 필드 그대로(value·label·count·rel_year·code·generation·image·image_url)
// 사용: node scripts/model-catalog-kr.mjs  (다시 받은 뒤 node scripts/model-images-kr.mjs 로 이미지·표를 갱신)
import { writeFileSync } from "node:fs";

const ENDPOINT = "https://staging.bbmuseum.co.kr/v1/cars/filters/catalog-tree";
// 제조사 이름(좌측 필터·퀵필터 maker 값) → 카탈로그 maker_id
export const CATALOG_MAKERS = [
  { maker: "벤츠", makerId: 21 },
  { maker: "BMW", makerId: 1 },
  { maker: "현대", makerId: 49 },
  { maker: "기아", makerId: 3 },
  { maker: "포르쉐", makerId: 43 },
  { maker: "페라리", makerId: 41 },
  { maker: "람보르기니", makerId: 11 },
  { maker: "벤틀리", makerId: 22 },
  { maker: "롤스로이스", makerId: 16 },
];

const fetchMaker = async (makerId) => {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://dev.bbmuseum.co.kr" },
      body: JSON.stringify({ catalog_paths: [{ maker_id: makerId }], maker_id: makerId }),
    });
    if (response.ok) return (await response.json()).data;
    if (attempt >= 3) throw new Error(`maker_id ${makerId}: HTTP ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
};

const pickSub = (sub) => ({ value: sub.value, label: sub.label, count: sub.count, rel_year: sub.rel_year, code: sub.code, generation: sub.generation, image: sub.image, image_url: sub.image_url });

const makers = [];
for (const { maker, makerId } of CATALOG_MAKERS) {
  const data = await fetchMaker(makerId);
  const groups = data.options.map((group) => ({ value: group.value, label: group.label, count: group.count, rank: group.rank, models: group.options.map(pickSub) }));
  makers.push({ maker, makerId, groups });
  console.log(`${maker}(${makerId}): 모델 ${groups.length} · 세부 모델 ${groups.reduce((sum, group) => sum + group.models.length, 0)}`);
}
const snapshot = { fetchedAt: new Date().toISOString(), source: `${ENDPOINT} (Origin https://dev.bbmuseum.co.kr)`, makers };
writeFileSync("src/prototype/data/model-catalog-kr.json", `${JSON.stringify(snapshot, null, 1)}\n`);
console.log("저장: src/prototype/data/model-catalog-kr.json");
