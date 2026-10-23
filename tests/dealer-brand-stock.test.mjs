import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dealerBrandStock } from "../src/prototype/dealer-page/dealer-brand-stock.ts";

test("seller rails include domestic and imported stock, using Korean names to break ties", () => {
  const cars = [{ maker: "현대" }, { maker: "BMW" }, { maker: "벤츠" }, { maker: "현대" }, { maker: "아우디" }];
  const before = JSON.stringify(cars);
  assert.deepEqual(dealerBrandStock(cars), [
    { maker: "현대", count: 2 }, { maker: "벤츠", count: 1 }, { maker: "아우디", count: 1 }, { maker: "BMW", count: 1 },
  ]);
  assert.equal(JSON.stringify(cars), before);
  assert.deepEqual(dealerBrandStock([]), []);
});

test("each company/dealer rail accounts for its own imported source inventory", () => {
  const rows = JSON.parse(readFileSync(new URL("../src/prototype/data/deutsch-top10-imported-v01.json", import.meta.url)));
  const keys = [...new Set(rows.map(r => `${r.company}:${r.dealer}`))];
  assert.equal(keys.length, 12);
  for (const key of keys) {
    const cars = rows.filter(r => `${r.company}:${r.dealer}` === key);
    const brands = dealerBrandStock(cars);
    assert.equal(brands.reduce((sum, b) => sum + b.count, 0), cars.length, key);
    assert.equal(brands.length, new Set(cars.map(c => c.maker)).size, key);
    for (let i = 1; i < brands.length; i++) assert.ok(brands[i - 1].count >= brands[i].count, key);
  }
});
