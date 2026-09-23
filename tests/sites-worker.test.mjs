import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";

async function assetFetch(request) {
  const url = new URL(request.url);
  try {
    const file = await readFile(new URL(`../dist/client${url.pathname}`, import.meta.url));
    return new Response(file, { status: 200 });
  } catch {
    return new Response("not found", { status: 404 });
  }
}

function request(path, init = {}) {
  return worker.fetch(new Request(`https://bobaedream.example${path}`, init), {
    ASSETS: { fetch: assetFetch },
  });
}

test("serves existing static assets without a fallback", async () => {
  const response = await request("/assets/does-not-exist.js");
  assert.equal(response.status, 404);
});

test("falls back to index.html for an unknown app route", async () => {
  const response = await request("/market/list?maker=BMW", { headers: { accept: "text/html" } });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /id="root"/);
});

test("does not turn missing API or write requests into the app shell", async () => {
  for (const [path, init] of [
    ["/api/missing", {}],
    ["/market/list", { method: "POST" }],
  ]) {
    let calls = 0;
    const response = await worker.fetch(new Request(`https://bobaedream.example${path}`, init), {
      ASSETS: {
        fetch() {
          calls += 1;
          return new Response("not found", { status: 404 });
        },
      },
    });

    assert.equal(response.status, 404);
    assert.equal(calls, 1);
  }
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/client/category-admin/app.js", import.meta.url));
  await access(new URL("../dist/client/category-admin/styles.css", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
  const adminHtml = await readFile(new URL("../dist/client/category-admin/index.html", import.meta.url), "utf8");
  assert.match(adminHtml, /차량유형 가변 매트릭스/);
  assert.match(adminHtml, /릴리스 상세·검수/);
});
