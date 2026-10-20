import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";

const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url)));
const worker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

function workerHarness(fetch) {
  const listeners = {};
  const offlineResponse = { offline: true };
  const context = { URL, Promise, fetch, caches: { match: async () => offlineResponse },
    self: { location: { href: "https://example.test/bobaedream/sw.js" }, addEventListener: (type, fn) => { listeners[type] = fn; } } };
  vm.runInNewContext(worker, context);
  return { listeners, offlineResponse };
}

test("home-screen app identity and launch stay inside the GitHub project site", () => {
  const base = "https://example.test/bobaedream/manifest.webmanifest";
  assert.equal(manifest.name, "보배드림");
  assert.equal(manifest.short_name, "보배드림");
  assert.equal(manifest.display, "standalone");
  assert.equal(new URL(manifest.id, base).pathname, "/bobaedream/");
  assert.equal(new URL(manifest.start_url, base).pathname, "/bobaedream/");
  assert.equal(new URL(manifest.scope, base).pathname, "/bobaedream/");
  for (const size of [192, 512]) {
    const icon = manifest.icons.find((item) => item.sizes === `${size}x${size}`);
    const png = readFileSync(new URL(`../public/app/icon-${size}.png`, import.meta.url));
    assert.equal(icon.purpose, "any maskable");
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});

test("navigation always prefers the current server response", async () => {
  const fresh = { currentDeployment: true };
  const { listeners } = workerHarness(async () => fresh);
  let response;
  listeners.fetch({ request: { mode: "navigate", method: "GET", url: "https://example.test/bobaedream/?qf=guazi" }, respondWith: (value) => { response = value; } });
  assert.equal(await response, fresh);
});

test("network failure opens the offline help instead of a stale member page", async () => {
  const { listeners, offlineResponse } = workerHarness(async () => { throw new TypeError("offline"); });
  let response;
  listeners.fetch({ request: { mode: "navigate", method: "GET", url: "https://example.test/bobaedream/?source=app" }, respondWith: (value) => { response = value; } });
  assert.equal(await response, offlineResponse);
});

test("worker does not intercept another project, external sites, APIs, or uploads", () => {
  const { listeners } = workerHarness(() => { throw new Error("must not fetch"); });
  for (const request of [
    { mode: "navigate", method: "GET", url: "https://example.test/another-project/" },
    { mode: "navigate", method: "GET", url: "https://outside.test/bobaedream/" },
    { mode: "cors", method: "GET", url: "https://example.test/bobaedream/api/private" },
    { mode: "navigate", method: "POST", url: "https://example.test/bobaedream/upload" },
  ]) listeners.fetch({ request, respondWith: () => assert.fail("unrelated request intercepted") });
});

test("published APK matches the signed release metadata and checksum", () => {
  const release = JSON.parse(readFileSync(new URL("../public/app/release.json", import.meta.url)));
  const apk = readFileSync(new URL("../public/app/bobaedream.apk", import.meta.url));
  const sum = readFileSync(new URL("../public/app/bobaedream.apk.sha256", import.meta.url), "utf8");
  assert.equal(release.package, "io.github.bobaekimboae.bobaedream");
  assert.equal(release.name, "보배드림");
  assert.equal(release.bytes, apk.length);
  assert.equal(release.sha256, createHash("sha256").update(apk).digest("hex"));
  assert.equal(sum.trim(), `${release.sha256}  bobaedream.apk`);
  assert.equal(apk.subarray(0, 2).toString(), "PK");
});
