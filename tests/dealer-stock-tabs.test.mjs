import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/prototype/dealer-page/DealerPage.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/prototype/dealer-page/dealer-page.css", import.meta.url), "utf8");

test("dealer stock categories use the listing tab interaction pattern", () => {
  assert.match(source, /className="dp-stock-categories" role="tablist" aria-label="판매차량 분류"/);
  assert.match(source, /role="tab" aria-selected=\{category === item\}/);
  assert.doesNotMatch(source, /className="dp-stock-categories" role="group"/);
});

test("dealer stock tabs mirror the 55px listing tabs and selected underline", () => {
  assert.match(css, /\.dp-stock-categories\{[^}]*gap:18px[^}]*height:56px[^}]*border-bottom:1px solid #ebebeb/);
  assert.match(css, /\.dp-stock-categories button\{[^}]*height:55px[^}]*padding:0 12px[^}]*border-radius:0[^}]*font-size:15px/);
  assert.match(css, /button\[aria-selected="true"\]::after\{[^}]*bottom:-1px[^}]*height:2px[^}]*background:#1a1a1a/);
  assert.match(css, /@media \(max-width:767px\)\{\.dp-stock-categories\{gap:8px\}\.dp-stock-categories button\{min-width:38px;padding:0 6px/);
});
