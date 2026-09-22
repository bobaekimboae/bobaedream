import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { createAdminApp } from "../admin-server/app.mjs";
import { AdminDatabase } from "../admin-server/database.mjs";
import { createDemoApi } from "../public/category-admin/demo-api.js";
import { createAdminApi, resolveRuntimeConfig } from "../public/category-admin/runtime.js";

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
    assert.equal(byKey.get("MATERIAL_HANDLING"), "VEHICLE_TYPE");
    assert.equal(byKey.get("EV_OVERLAY"), "OVERLAY");
    assert.equal(byKey.get("PARTS_GOODS"), "ASSET_TYPE");
    assert.equal(byKey.get("DEALER_COMPLEX"), "SELLER_CHANNEL");
    assert.equal(byKey.get("TOP_PLACEMENT"), "SERVICE_BM");
    assert.equal(byKey.has("FORKLIFT_LOGISTICS"), false);
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

test("variable matrix covers every launch scope with screen-level schemas", async () => {
  await withApp(async ({ baseUrl }) => {
    const result = await request(baseUrl, "/api/admin/variable-matrix");
    assert.equal(result.response.status, 200);
    assert.deepEqual(result.json.schema_types, [
      "FILTER",
      "REGISTRATION_FORM",
      "LIST_META",
      "DETAIL",
      "OPTION",
      "SELLER",
      "PAID_PRODUCT",
      "MAKE_MODEL",
      "QA_CHECKLIST",
      "PLATFORM_DIFF",
    ]);
    const scopes = new Map(result.json.scopes.map((scope) => [scope.scope_key, scope]));
    const requiredTypes = ["FILTER", "REGISTRATION_FORM", "LIST_META", "DETAIL", "SELLER"];
    const optionScopes = new Set(["BIKE", "TRUCK_SPECIAL", "BUS", "CAMPING_CARAVAN", "CONSTRUCTION"]);
    for (const key of ["CAR", "BIKE", "TRUCK_SPECIAL", "BUS", "CAMPING_CARAVAN", "CONSTRUCTION", "MATERIAL_HANDLING", "ATTACHMENT", "PARTS_GOODS"]) {
      assert.ok(scopes.has(key), key);
      const scope = scopes.get(key);
      assert.equal(scope.completeness_percent, 100, key);
      assert.deepEqual(scope.missing_required_schema_types, [], key);
      for (const type of requiredTypes) assert.ok(scope.schema_counts[type] > 0, `${key} ${type}`);
      assert.ok(scope.schema_counts.PAID_PRODUCT > 0, `${key} PAID_PRODUCT`);
      assert.ok(scope.schema_counts.MAKE_MODEL > 0, `${key} MAKE_MODEL`);
      assert.equal(scope.schema_counts.QA_CHECKLIST, 0, `${key} QA_CHECKLIST starts as explicit backlog`);
      assert.equal(scope.schema_counts.PLATFORM_DIFF, 0, `${key} PLATFORM_DIFF starts as explicit backlog`);
      assert.equal(scope.schema_counts.OPTION > 0, optionScopes.has(key), `${key} OPTION should reflect real option groups only`);
    }
    assert.equal(scopes.has("FORKLIFT_LOGISTICS"), false);
  });
});

test("enum variables expose option set keys and DETAIL schemas are sectioned for real screens", async () => {
  await withApp(async ({ baseUrl }) => {
    const variables = await request(baseUrl, "/api/admin/variables");
    const enumVariables = variables.json.filter((item) => item.data_type === "enum");
    assert.ok(enumVariables.length > 0);
    assert.ok(enumVariables.every((item) => item.option_set_key), "enum variables must point to option set keys");

    const matrix = await request(baseUrl, "/api/admin/variable-matrix");
    const car = matrix.json.scopes.find((scope) => scope.scope_key === "CAR");
    const carDetail = car.schemas.find((schema) => schema.schema_type === "DETAIL");
    const sections = new Set(carDetail.items.map((item) => item.section_key));
    for (const section of ["BASIC_INFO", "SPEC", "CONDITION", "SELLER", "LOCATION", "MONETIZATION"]) {
      assert.ok(sections.has(section), `CAR DETAIL missing ${section}`);
    }
    assert.equal(car.schemas.find((schema) => schema.schema_type === "OPTION").item_count, 0);
  });
});

test("created enum variables receive option set keys automatically", async () => {
  await withApp(async ({ baseUrl }) => {
    const created = await request(baseUrl, "/api/admin/variables", {
      method: "POST",
      role: "CATEGORY_MANAGER",
      body: {
        item_key: "bike.demo_enum",
        variable_group: "OPTION",
        item_name_ko: "데모 선택값",
        screen_label: "데모 선택값",
        ui_component: "single_select",
        data_type: "enum",
        source_site: "보배드림 가변설계 정본",
        source_url: "https://docs.google.com/spreadsheets/d/1ei78gzOyLeKXcVrrsKmNx5U3zWXmvpGyY6E9dcVOeFo/edit",
        korea_applicability: "APPLY",
      },
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.json.option_set_key, "bike.demo_enum.options");
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

test("material handling listings can appear in both construction and forklift views", async () => {
  await withApp(async ({ baseUrl }) => {
    const result = await request(baseUrl, "/api/internal/v1/listings/FORK-1/classify?dry_run=true", {
      method: "POST",
      body: { listing_domain: "VEHICLE_LISTING", vehicle_type_key: "MATERIAL_HANDLING", asset_subtype: "FORKLIFT", attributes: { lift_capacity_kg: 2500 } },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.json.projection.vehicle_type_key, "MATERIAL_HANDLING");
    assert.ok(result.json.projection.category_node_keys.includes("CONSTRUCTION"));
    assert.ok(result.json.projection.category_node_keys.includes("MATERIAL_HANDLING"));
    assert.ok(result.json.projection.category_node_keys.includes("FORKLIFT"));
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

test("public GitHub Pages demo loads dashboard and keeps mutations in demo state", async () => {
  const demo = createDemoApi();
  const health = await demo("/api/admin/health");
  assert.equal(health.mode, "PUBLIC_DEMO");

  const before = await demo("/api/admin/registry");
  const created = await demo("/api/admin/registry", {
    method: "POST",
    body: JSON.stringify({ namespace: "VEHICLE_TYPE", system_key: "AGRICULTURE", name_ko: "농기계", launch_status: "HOLD" }),
  }, "SUPER_ADMIN");
  assert.equal(created.system_key, "AGRICULTURE");
  const after = await demo("/api/admin/registry");
  assert.equal(after.length, before.length + 1);

  const classification = await demo("/api/internal/v1/listings/DEMO-1/classify?dry_run=true", {
    method: "POST",
    body: JSON.stringify({ listing_domain: "VEHICLE_LISTING", vehicle_type_key: "CAR", origin_type: "IMPORT", fuel_type: "ELECTRIC", theme_keys: ["LUXURY"] }),
  });
  assert.ok(classification.projection.category_node_keys.includes("IMPORTED_CAR"));
  assert.ok(classification.projection.category_node_keys.includes("ELECTRIC_CAR"));

  const matrix = await demo("/api/admin/variable-matrix");
  assert.ok(matrix.scopes.find((scope) => scope.scope_key === "BIKE").schema_counts.FILTER > 0);
  assert.ok(matrix.scopes.find((scope) => scope.scope_key === "MATERIAL_HANDLING"));
});

test("runtime mode is explicit and live API never falls back to demo data", async () => {
  const publicDemo = resolveRuntimeConfig({
    hostname: "bobaekimboae.github.io",
    origin: "https://bobaekimboae.github.io",
  });
  assert.equal(publicDemo.mode, "PUBLIC_DEMO");
  assert.equal(publicDemo.isDemo, true);

  const staging = resolveRuntimeConfig({
    hostname: "category-admin.staging.bobaedream.co.kr",
    origin: "https://category-admin.staging.bobaedream.co.kr",
  });
  assert.equal(staging.mode, "STAGING_API");
  assert.equal(staging.isDemo, false);

  let demoCalls = 0;
  const liveApi = createAdminApi({
    runtime: resolveRuntimeConfig({
      hostname: "admin.bobaedream.co.kr",
      origin: "https://admin.bobaedream.co.kr",
      configuredMode: "LIVE_API",
    }),
    demoApi: async () => { demoCalls += 1; return { mode: "PUBLIC_DEMO" }; },
    fetchImpl: async () => { throw new Error("network down"); },
  });

  await assert.rejects(
    liveApi("/api/admin/health"),
    /데모 데이터로 전환하지 않았습니다/,
  );
  assert.equal(demoCalls, 0);
});

test("seed references use the bobaedream design source instead of external marketplaces", async () => {
  const demo = createDemoApi();
  const variables = await demo("/api/admin/variables");
  assert.ok(variables.length > 0);
  assert.ok(variables.every((item) => item.source_site === "보배드림 가변설계 정본"));
  assert.ok(variables.every((item) => !/Auto Trader|eBay|TruckScout/i.test(item.source_site)));
});
