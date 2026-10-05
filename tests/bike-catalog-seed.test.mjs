import assert from "node:assert/strict";
import test from "node:test";
import { AdminDatabase } from "../admin-server/database.mjs";
import { AdminService } from "../admin-server/service.mjs";
import { countBikeCatalogRows, seedBikeCatalog } from "../admin-server/seed-bike-catalog.mjs";

const expectedDatabaseCounts = {
  manufacturers: 86,
  visibleManufacturers: 65,
  hiddenManufacturers: 21,
  searchVisibleManufacturers: 62,
  modelGroups: 973,
  actualModelGroups: 920,
  implicitModelGroups: 53,
  models: 2_910,
  modelSpecs: 2_910,
};

test("바이크 fixture는 승용 공통 테이블과 바이크 보조 테이블에 두 번 멱등 시드한다", () => {
  const database = new AdminDatabase(":memory:");
  try {
    database.seed({ force: true });
    const first = seedBikeCatalog(database);
    assert.deepEqual(first.inserted, { manufacturers: 86, modelGroups: 973, models: 2_910, modelSpecs: 2_910 });
    assert.deepEqual(first.coverage, expectedDatabaseCounts);
    assert.deepEqual(countBikeCatalogRows(database), expectedDatabaseCounts);

    const service = new AdminService(database);
    const honda = service.listBikeManufacturers().find((item) => item.source_name === "혼다");
    const pcxGroup = service.listBikeModelGroups(honda.id).find((item) => item.source_name === "PCX");
    const pcx = service.listBikeModels(pcxGroup.id).find((item) => item.source_name === "PCX 125");
    assert.equal(pcx.displacement_band, "51~125cc");
    assert.equal(pcx.year_min, 2009);
    assert.equal(pcx.year_max, 2026);
    assert.equal(honda.scope_key, "BIKE");
    assert.equal(pcxGroup.model_level, "MODEL_GROUP");
    assert.equal(pcx.model_level, "MODEL");
    const bikeBmw = service.listBikeManufacturers().find((item) => item.source_code === "BKM003");
    const carBmw = database.db.prepare("SELECT * FROM manufacturers WHERE scope_key = 'CAR' AND name_ko = 'BMW'").get();
    assert.ok(carBmw);
    assert.notEqual(bikeBmw.id, carBmw.id);
    assert.equal(database.db.prepare("SELECT COUNT(*) AS count FROM manufacturers WHERE name_ko = 'BMW'").get().count, 2);

    const kr = service.listBikeManufacturers().find((item) => item.source_code === "BKM015");
    assert.equal(kr.display_name, "KR모터스");
    assert.deepEqual(kr.aliases_json, ["S&T모터스", "효성", "KR모터스(효성)"]);
    const kayo = service.listBikeManufacturers().find((item) => item.source_code === "BKM070");
    assert.equal(kayo.is_visible, true);
    assert.equal(kayo.is_search_visible, false);

    const traceColumns = database.db.prepare("PRAGMA table_info(bike_model_specs)").all().map((item) => item.name);
    assert.equal(traceColumns.includes("reitwagen_id"), false);
    assert.equal(traceColumns.includes("naver_url"), false);
    assert.equal(traceColumns.includes("danawa_pcodes"), false);

    assert.equal(database.count("bike_manufacturers"), 0);
    assert.equal(database.count("bike_model_groups"), 0);
    assert.equal(database.count("bike_models"), 0);

    const before = countBikeCatalogRows(database);
    const second = seedBikeCatalog(database);
    assert.deepEqual(second.inserted, { manufacturers: 0, modelGroups: 0, models: 0, modelSpecs: 0 });
    assert.deepEqual(second.reused, { manufacturers: 86, modelGroups: 973, models: 2_910, modelSpecs: 2_910 });
    assert.deepEqual(countBikeCatalogRows(database), before);
  } finally {
    database.close();
  }
});
