import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { createAdminApp } from "../admin-server/app.mjs";
import { AdminDatabase } from "../admin-server/database.mjs";

async function withApp(run) {
  const database = new AdminDatabase(":memory:");
  const app = createAdminApp({ database });
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    await run({ baseUrl, app, database });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    database.close();
  }
}

async function request(baseUrl, path, { method = "GET", body, role = "SUPER_ADMIN" } = {}) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      "content-type": "application/json",
      "x-admin-email": "test@bobaedream.local",
      "x-admin-role": role,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json();
  return { response, json };
}

test("admin UI and health endpoint are executable", async () => {
  await withApp(async ({ baseUrl }) => {
    const health = await request(baseUrl, "/api/admin/health");
    assert.equal(health.response.status, 200);
    assert.equal(health.json.ok, true);

    const page = await fetch(baseUrl + "/category-admin/");
    assert.equal(page.status, 200);
    assert.match(await page.text(), /보배드림 카테고리 운영/);
  });
});

test("registry namespaces keep vehicle types, overlays, assets, sellers and BM separate", async () => {
  await withApp(async ({ baseUrl }) => {
    const result = await request(baseUrl, "/api/admin/registry");
    assert.equal(result.response.status, 200);
    const byKey = new Map(result.json.map((row) => [row.system_key, row.namespace]));
    assert.equal(byKey.get("CAR"), "VEHICLE_TYPE");
    assert.equal(byKey.get("EV_OVERLAY"), "OVERLAY");
    assert.equal(byKey.get("PARTS_GOODS"), "ASSET_TYPE");
    assert.equal(byKey.get("DEALER_COMPLEX"), "SELLER_CHANNEL");
    assert.equal(byKey.get("TOP_PLACEMENT"), "SERVICE_BM");
  });
});

test("invalid concepts cannot be created as vehicle types", async () => {
  await withApp(async ({ baseUrl }) => {
    for (const systemKey of ["IMPORT_CAR", "EV_OVERLAY", "DEALER_COMPLEX", "BRAND_CERTIFIED_CAR", "PARTS_GOODS", "ATTACHMENT"]) {
      const result = await request(baseUrl, "/api/admin/registry", {
        method: "POST",
        body: { namespace: "VEHICLE_TYPE", system_key: systemKey, name_ko: systemKey },
      });
      assert.equal(result.response.status, 422, systemKey);
    }
  });
});

test("published public schema resolves category to vehicle type and hides drafts", async () => {
  await withApp(async ({ baseUrl }) => {
    const before = await request(baseUrl, "/api/v1/placements/IMPORTED_CAR/schemas/FILTER?platform=MOBILE_APP");
    assert.equal(before.response.status, 200);
    assert.equal(before.json.resolution.resolution_level, "TYPE_DEFAULT");
    assert.equal(before.json.vehicle_type_id, "CAR");
    assert.equal(before.json.status, "PUBLISHED");
    assert.ok(before.json.schema_hash);
    assert.ok(before.json.items.some((item) => item.item_key === "car.sale_price"));

    const schemas = await request(baseUrl, "/api/admin/schemas");
    const carFilter = schemas.json.find((row) => row.vehicle_type_key === "CAR" && row.schema_type === "FILTER");
    const draft = await request(baseUrl, "/api/admin/schemas", {
      method: "POST",
      body: { clone_schema_id: carFilter.id, schema_version: "1.1.0", title: "CAR filter draft" },
    });
    assert.equal(draft.response.status, 201);
    assert.equal(draft.json.schema_version, "1.1.0");

    const stillPublished = await request(baseUrl, "/api/v1/placements/USED_CAR/schemas/FILTER?platform=MOBILE_APP");
    assert.equal(stillPublished.json.schema_version, "1.0.0");
  });
});

test("schema workflow enforces role separation, independent publish and rollback", async () => {
  await withApp(async ({ baseUrl }) => {
    const schemas = await request(baseUrl, "/api/admin/schemas");
    const carFilter = schemas.json.find((row) => row.vehicle_type_key === "CAR" && row.schema_type === "FILTER");
    const registrationBefore = await request(baseUrl, "/api/v1/placements/USED_CAR/schemas/REGISTRATION_FORM?platform=ADMIN");

    const draft = await request(baseUrl, "/api/admin/schemas", {
      method: "POST",
      role: "PRODUCT_OWNER",
      body: { clone_schema_id: carFilter.id, schema_version: "1.1.0", title: "CAR filter v1.1" },
    });
    const id = draft.json.id;

    const deniedApproval = await request(baseUrl, `/api/admin/schemas/${id}/actions/approve`, { method: "POST", role: "PRODUCT_OWNER", body: {} });
    assert.equal(deniedApproval.response.status, 403);

    assert.equal((await request(baseUrl, `/api/admin/schemas/${id}/actions/request-review`, { method: "POST", role: "PRODUCT_OWNER", body: {} })).response.status, 200);
    assert.equal((await request(baseUrl, `/api/admin/schemas/${id}/actions/approve`, { method: "POST", role: "QA_REVIEWER", body: {} })).response.status, 200);
    assert.equal((await request(baseUrl, `/api/admin/schemas/${id}/actions/publish`, { method: "POST", role: "PUBLISHER", body: {} })).response.status, 200);

    const filterAfter = await request(baseUrl, "/api/v1/placements/USED_CAR/schemas/FILTER?platform=MOBILE_APP");
    const registrationAfter = await request(baseUrl, "/api/v1/placements/USED_CAR/schemas/REGISTRATION_FORM?platform=ADMIN");
    assert.equal(filterAfter.json.schema_version, "1.1.0");
    assert.equal(registrationAfter.json.schema_version, registrationBefore.json.schema_version);

    const rollback = await request(baseUrl, `/api/admin/schemas/${id}/actions/rollback`, { method: "POST", role: "PUBLISHER", body: {} });
    assert.equal(rollback.response.status, 200);
    const filterRolledBack = await request(baseUrl, "/api/v1/placements/USED_CAR/schemas/FILTER?platform=MOBILE_APP");
    assert.equal(filterRolledBack.json.schema_version, "1.0.0");
  });
});

test("PARTS_GOODS uses PARTS_LISTING and never appears in ALL_VEHICLES", async () => {
  await withApp(async ({ baseUrl }) => {
    const result = await request(baseUrl, "/api/internal/v1/listings/PART-1/classify?dry_run=true", {
      method: "POST",
      body: { listing_domain: "PARTS_LISTING", asset_type_key: "PARTS_GOODS", attributes: { oem_number: "123-ABC" } },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.json.projection.asset_type_key, "PARTS_GOODS");
    assert.ok(result.json.projection.category_node_keys.includes("PARTS_GOODS"));
    assert.ok(!result.json.projection.category_node_keys.includes("ALL_VEHICLES"));
  });
});

test("one CAR listing resolves to multiple category placements without changing vehicle type", async () => {
  await withApp(async ({ baseUrl }) => {
    const payload = {
      listing_domain: "VEHICLE_LISTING",
      vehicle_type_key: "CAR",
      origin_type: "IMPORT",
      fuel_type: "ELECTRIC",
      theme_keys: ["LUXURY"],
      attributes: { make_id: "BMW", model_id: "I4" },
    };
    const result = await request(baseUrl, "/api/internal/v1/listings/CAR-100/classify", { method: "POST", body: payload });
    assert.equal(result.response.status, 200);
    assert.equal(result.json.projection.vehicle_type_key, "CAR");
    for (const category of ["ALL_VEHICLES", "USED_CAR", "IMPORTED_CAR", "ELECTRIC_CAR", "LUXURY_CAR", "THEME_CAR"]) {
      assert.ok(result.json.projection.category_node_keys.includes(category), category);
    }
    const projection = await request(baseUrl, "/api/internal/v1/listings/CAR-100/projection");
    assert.equal(projection.response.status, 200);
    assert.ok(projection.json.category_node_keys_json.includes("IMPORTED_CAR"));
  });
});

test("read-only administrators cannot mutate configuration", async () => {
  await withApp(async ({ baseUrl }) => {
    const result = await request(baseUrl, "/api/admin/registry", {
      method: "POST",
      role: "READ_ONLY",
      body: { namespace: "VEHICLE_TYPE", system_key: "AGRICULTURE", name_ko: "농기계" },
    });
    assert.equal(result.response.status, 403);
  });
});
