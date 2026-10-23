import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bbmCardSpec, bbmCardBadges } from "../src/prototype/data/bbm-card-samples.ts";
import { matchesStockCategory } from "../src/prototype/dealer-page/dealer-stock.ts";

const rows = JSON.parse(readFileSync(new URL("../src/prototype/data/deutsch-top10-imported-v01.json", import.meta.url)));
const old = JSON.parse(readFileSync(new URL("../src/prototype/data/deutsch-autoworld-all-v01.json", import.meta.url)));

test("official top ten snapshot contains 202 distinct listings assigned to the correct dealers", () => {
  assert.equal(rows.length, 202);
  assert.equal(new Set(rows.map(r => r.id)).size, 202);
  assert.equal(new Set(rows.map(r => r.sourceId)).size, 202);
  const counts = Object.fromEntries([...new Set(rows.map(r => r.dealer))].map(name => [name, rows.filter(r => r.dealer === name).length]));
  assert.deepEqual(counts, { 강환범: 62, 이필응: 24, 박태준: 20, 임종덕: 19, 장우석: 16, 이병훈: 15, 송재관: 13, 고준용: 12, 김대현: 11, 김성훈: 10 });
  for (const row of rows) {
    assert.equal(new URL(row.sourceUrl).searchParams.get("DemoNo"), row.sourceId);
    assert.equal(row.collectedAt, "2026-10-23");
    assert.ok(row.company && row.title && row.year && Number.isInteger(row.mileage));
    assert.ok(["정보 없음", "없음"].includes(row.accident));
    assert.equal("phone" in row || "plate" in row, false);
  }
});

test("every listing has five verified photos belonging to its own source vehicle", () => {
  for (const row of rows) {
    assert.equal(row.photos.length, 5, row.sourceId);
    assert.equal(new Set(row.photos.map(p => p.url)).size, 5);
    for (const photo of row.photos) {
      const url = new URL(photo.url);
      assert.equal(url.hostname, "www.dautoworld.com");
      // 재등록 매물 14대는 원본 상세가 이전 사진 묶음 ID를 그대로 참조한다.
      assert.match(url.pathname, new RegExp(`^/AttEdit/CarPhoto/(xxlarge|middle)/${row.photoSourceId.slice(0, 4)}/${row.photoSourceId}R[1-5]\\.jpg$`));
      assert.ok(photo.width > 100 && photo.height > 100);
    }
  }
});

test("the existing listing is updated only after a unique dealer, maker, year and mileage match", () => {
  const replacements = rows.filter(r => r.replacesId);
  assert.equal(replacements.length, 1);
  for (const row of replacements) {
    const prior = old.find(r => 100_000 + r[0] === row.replacesId);
    assert.equal(prior[10].trim(), row.dealer);
    assert.equal(prior[1], row.maker);
    assert.equal(prior[5], row.year);
    assert.equal(prior[6], row.mileage);
    assert.equal(row.id, row.replacesId);
  }
});

test("imported source listings never acquire synthetic power or certification badges", () => {
  const car = { id: 500_000, maker: "쉐보레", specs: [], cardSpec: ["23년05월", "12,345km"], deutschSource: {} };
  assert.doesNotMatch(bbmCardSpec(car, true), /마력|가솔린/);
  assert.deepEqual(bbmCardBadges(car), []);
  assert.equal(matchesStockCategory(car, "수입차"), true);
  assert.equal(matchesStockCategory(car, "국산차"), false);
});
