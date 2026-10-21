import test from "node:test";
import assert from "node:assert/strict";
import { matchesStockCategory, stockUrl, readStockCategory } from "../src/prototype/dealer-page/dealer-stock.ts";

test("card inventory links retain the seller and select only the requested stock category", () => {
  for (const category of ["전체", "국산차", "수입차", "상용차", "슈퍼카"]) {
    const url = new URL(stockUrl("https://example.test/bobaedream/?card=1&listing=123&pcauth=member&tab=intro#logo=private", "450554", "5", category));
    assert.equal(url.pathname, "/bobaedream/");
    assert.equal(url.searchParams.get("shop"), "450554");
    assert.equal(url.searchParams.get("emp"), "5");
    assert.equal(url.searchParams.get("tab"), "ads");
    assert.equal(readStockCategory(url.searchParams.get("stockCategory")), category);
    for (const param of ["card", "listing", "pcauth"]) assert.equal(url.searchParams.has(param), false);
    assert.equal(url.hash, "");
  }
  assert.equal(readStockCategory("unknown"), "전체");
});

test("stock categories distinguish domestic, imported, commercial, and actual supercar models", () => {
  const cars = [
    { maker: "현대" }, { maker: "쉐보레" }, { maker: "KGM" },
    { maker: "BMW", modelGroup: "3시리즈" },
    { maker: "현대", truck: {} }, { maker: "볼보", truck: {} },
    { maker: "포르쉐", modelGroup: "마칸" }, { maker: "포르쉐", modelGroup: "911" },
    { maker: "람보르기니" },
  ];
  assert.equal(cars.filter(c => matchesStockCategory(c, "전체")).length, 9);
  assert.deepEqual(cars.filter(c => matchesStockCategory(c, "국산차")).map(c=>c.maker), ["현대", "쉐보레", "KGM"]);
  assert.equal(cars.filter(c => matchesStockCategory(c, "수입차")).length, 4);
  assert.equal(cars.filter(c => matchesStockCategory(c, "상용차")).length, 2);
  assert.deepEqual(cars.filter(c => matchesStockCategory(c, "슈퍼카")).map(c=>c.modelGroup ?? c.maker), ["911", "람보르기니"]);
  for (const body of ["픽업트럭", "버스", "상용밴"]) assert.equal(matchesStockCategory({maker:"현대",filter:{body}}, "상용차"), true);
});
