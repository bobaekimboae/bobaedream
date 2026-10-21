import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/prototype/dealer-page/DealerPage.tsx", import.meta.url), "utf8");

test("e-조이모터스 헤더 uses official production-model Ferrari and Lamborghini video CDNs", () => {
  assert.match(source, /ferrari-cdn\.thron\.com\/delivery\/public\/video\/ferrari\/00a07e31-f626-4ef7-86cc-0226c7d5d30d\/bocxuw\/WEBFULLHD\/urxmo7_ferrari-12cilindri-off/);
  assert.match(source, /videolamborghini-meride-tv\.akamaized\.net\/video\/folder2\/1786627119hero_lamborghini\.mp4/);
  assert.match(source, /model: "12Cilindri"/);
  assert.match(source, /model: "Revuelto SV"/);
  assert.match(source, /dealer\.shopNo === JOY_SHOP_NO/);
});

test("dealer video cover keeps accessible playback controls and a static fallback", () => {
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /autoPlay=\{!paused\}/);
  assert.match(source, /video\.play\(\)\.catch\(\(\) => setPaused\(true\)\)/);
  assert.match(source, /헤더 영상 일시정지/);
  assert.match(source, /className="dp-cover-photo" src=\{fallback\}/);
  assert.match(source, /onError=\{\(\) => setFailedVideo\(activeVideo\)\}/);
});
