import assert from "node:assert/strict";
import test from "node:test";
import { AdminDatabase } from "../admin-server/database.mjs";
import { seedEncarCarDepth } from "../admin-server/seed-encar-car-depth.mjs";
import { AdminService } from "../admin-server/service.mjs";
import {
  countEncarFullDepthRows,
  loadEncarFullDepthSource,
  seedEncarFullDepth,
} from "../admin-server/seed-encar-full-depth.mjs";

const expected = { manufacturers: 63, modelGroups: 663, generations: 1_256, fuelDrives: 2_158, grades: 5_976, subgrades: 3_297 };

test("엔카 전체 뎁스 fixture는 PR #139 시드 위에 메타데이터와 3단계 트림을 멱등 시드한다", () => {
  const database = new AdminDatabase(":memory:");
  try {
    database.seed({ force: true });
    seedEncarCarDepth(database);

    const first = seedEncarFullDepth(database);
    assert.deepEqual(first.inserted, { manufacturers: 0, modelGroups: 0, generations: 0, fuelDrives: 2_158, grades: 5_976, subgrades: 3_297 });
    assert.deepEqual(first.coverage, expected);
    assert.deepEqual(countEncarFullDepthRows(database), expected);

    const geely = database.db.prepare("SELECT * FROM manufacturers WHERE scope_key = 'CAR' AND name_ko = '지리'").get();
    assert.equal(geely.status, "HIDDEN");
    assert.equal(geely.is_visible, 0);
    assert.equal(geely.source_system, "ENCAR");

    const hyundai = database.db.prepare("SELECT * FROM manufacturers WHERE scope_key = 'CAR' AND name_ko = '현대'").get();
    const grandeur = database.db.prepare("SELECT * FROM models WHERE manufacturer_id = ? AND parent_model_id IS NULL AND name_ko = '그랜저'").get(hyundai.id);
    const gn7 = database.db.prepare("SELECT * FROM models WHERE manufacturer_id = ? AND parent_model_id = ? AND name_ko = '그랜저 (GN7)'").get(hyundai.id, grandeur.id);
    assert.equal(grandeur.model_level, "MODEL_GROUP");
    assert.equal(grandeur.body_type, "세단");
    assert.equal(gn7.model_level, "GENERATION");
    assert.equal(gn7.generation_code, "GN7");
    assert.match(gn7.release_ym, /^\d{4}-\d{2}$/);
    assert.ok(gn7.encar_image_path);

    const fuel = database.db.prepare("SELECT * FROM model_trims WHERE generation_model_id = ? AND trim_level = 'FUEL_DRIVE' AND name_ko = '가솔린 2WD'").get(gn7.id);
    const grade = database.db.prepare("SELECT * FROM model_trims WHERE generation_model_id = ? AND parent_trim_id = ? AND trim_level = 'GRADE' AND name_ko = '2.5 가솔린 2WD'").get(gn7.id, fuel.id);
    const subgrade = database.db.prepare("SELECT * FROM model_trims WHERE generation_model_id = ? AND parent_trim_id = ? AND trim_level = 'SUBGRADE' AND name_ko = '프리미엄'").get(gn7.id, grade.id);
    assert.ok(fuel && grade && subgrade);
    assert.equal(fuel.listing_count_snapshot_at, "2026-10-04T00:00:00+09:00");
    const adminRows = new AdminService(database).listModelTrims(gn7.id);
    assert.ok(adminRows.some((row) => row.id === fuel.id));
    assert.ok(adminRows.some((row) => row.id === grade.id));
    assert.ok(adminRows.some((row) => row.id === subgrade.id));

    const rowsBeforeSecondRun = {
      manufacturers: database.count("manufacturers"),
      models: database.count("models"),
      trims: database.count("model_trims"),
    };
    const second = seedEncarFullDepth(database);
    assert.deepEqual(second.inserted, { manufacturers: 0, modelGroups: 0, generations: 0, fuelDrives: 0, grades: 0, subgrades: 0 });
    assert.deepEqual(second.reused, expected);
    assert.deepEqual({
      manufacturers: database.count("manufacturers"),
      models: database.count("models"),
      trims: database.count("model_trims"),
    }, rowsBeforeSecondRun);
  } finally {
    database.close();
  }
});

test("공통 원천은 엔카 메타데이터와 숨김·검수 상태를 유지한다", () => {
  const source = loadEncarFullDepthSource();
  assert.deepEqual(source.meta.counts, expected);
  assert.equal(source.manufacturers.filter((row) => row.sourceName === "지리" && row.isVisible === false).length, 1);
  assert.equal(source.modelGroups.filter((row) => row.bodyType).length, 40);
  assert.ok(source.generations.some((row) => row.encarImagePath));
  assert.ok(source.generations.some((row) => row.reviewStatus === "REVIEW_REQUIRED"));
  assert.ok(source.fuelDrives.some((row) => row.reviewStatus === "REVIEW_REQUIRED"));
  assert.ok(source.grades.some((row) => row.reviewStatus === "REVIEW_REQUIRED"));
});
