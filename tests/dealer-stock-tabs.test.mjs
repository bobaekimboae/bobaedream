import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/prototype/dealer-page/DealerPage.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/prototype/dealer-page/dealer-page.css", import.meta.url), "utf8");

test("dealer stock categories keep accessible tab interaction semantics", () => {
  assert.match(source, /className="dp-stock-categories" role="tablist" aria-label="판매차량 분류"/);
  assert.match(source, /role="tab" aria-selected=\{category === item\}/);
  assert.doesNotMatch(source, /className="dp-stock-categories" role="group"/);
});

test("dealer stock categories use balanced blue selected pill chips", () => {
  assert.match(css, /\.dp-stock-categories\{[^}]*align-items:center[^}]*gap:8px[^}]*margin-top:12px/);
  assert.match(css, /\.dp-stock-categories button\{[^}]*height:36px[^}]*padding:0 16px[^}]*border-radius:999px[^}]*background:#f2f3f5[^}]*font-size:15px/);
  assert.match(css, /button\[aria-selected="true"\]\{[^}]*background:#eaf2ff[^}]*color:var\(--dp-brand\)[^}]*font-weight:700/);
  assert.doesNotMatch(css, /\.dp-stock-categories button\[aria-selected="true"\]::after/);
  assert.match(css, /@media \(max-width:767px\)\{\.dp-stock-categories\{gap:7px\}\.dp-stock-categories button\{height:34px;padding:0 13px;font-size:14px/);
});
