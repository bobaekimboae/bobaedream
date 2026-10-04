import assert from "node:assert/strict";
import test from "node:test";
import { AdminDatabase } from "../admin-server/database.mjs";
import {
  buildEncarCarDepthPlan,
  countCarDepthRows,
  countEncarCarDepth,
  seedEncarCarDepth,
} from "../admin-server/seed-encar-car-depth.mjs";

test("엔카 승용 뎁스 원본은 63 / 663 / 1,256이며 신위안은 1 / 1이다", () => {
  const plan = buildEncarCarDepthPlan();
  assert.equal(plan.sourceRows, 7_504);
  assert.equal(plan.manufacturers.length, 63);
  assert.equal(plan.modelGroups.length, 663);
  assert.equal(plan.generations.length, 1_256);
  assert.equal(plan.reviewRows.length, 0);

  assert.equal(plan.modelGroups.filter((row) => row.manufacturerName === "신위안").length, 1);
  assert.equal(plan.generations.filter((row) => row.manufacturerName === "신위안").length, 1);

  const reusedNames = new Set(["현대", "기아", "제네시스", "BMW", "벤츠"]);
  assert.equal(plan.modelGroups.filter((row) => reusedNames.has(row.manufacturerName)).length, 160);
  assert.equal(plan.generations.filter((row) => reusedNames.has(row.manufacturerName)).length, 438);
  assert.equal(plan.modelGroups.filter((row) => !reusedNames.has(row.manufacturerName)).length, 503);
  assert.equal(plan.generations.filter((row) => !reusedNames.has(row.manufacturerName)).length, 818);
});

test("엔카 승용 뎁스 시더는 원문 이름과 제조사 경계를 보존하고 두 번 실행해도 증가하지 않는다", () => {
  const database = new AdminDatabase(":memory:");
  try {
    database.seed({ force: true });
    const first = seedEncarCarDepth(database);
    assert.deepEqual(first.inserted, { manufacturers: 58, modelGroups: 658, generations: 1_256 });
    assert.deepEqual(countEncarCarDepth(database), { manufacturers: 63, modelGroups: 663, generations: 1_256 });
    assert.deepEqual(countCarDepthRows(database), { manufacturers: 63, modelGroups: 664, generations: 1_256 });

    const domesticChevrolet = database.db.prepare(`
      SELECT * FROM manufacturers WHERE scope_key = 'CAR' AND name_ko = '쉐보레(GM대우)'
    `).get();
    const importedChevrolet = database.db.prepare(`
      SELECT * FROM manufacturers WHERE scope_key = 'CAR' AND name_ko = '쉐보레'
    `).get();
    assert.equal(domesticChevrolet.country_code, "KR");
    assert.equal(importedChevrolet.country_code, null);
    assert.notEqual(domesticChevrolet.id, importedChevrolet.id);

    for (const name of ["BYD", "동풍소콘", "북기은상", "신위안", "지리"]) {
      const manufacturer = database.db.prepare(`
        SELECT * FROM manufacturers WHERE scope_key = 'CAR' AND name_ko = ?
      `).get(name);
      assert.ok(manufacturer, name);
      assert.equal(manufacturer.country_code, null, name);
    }

    const xinYuan = database.db.prepare("SELECT id FROM manufacturers WHERE scope_key = 'CAR' AND name_ko = '신위안'").get();
    const xinYuanGroups = database.db.prepare(`
      SELECT * FROM models WHERE manufacturer_id = ? AND parent_model_id IS NULL
    `).all(xinYuan.id);
    assert.equal(xinYuanGroups.length, 1);
    assert.equal(xinYuanGroups[0].name_ko, "이티밴");
    const xinYuanGenerations = database.db.prepare(`
      SELECT * FROM models WHERE manufacturer_id = ? AND parent_model_id = ?
    `).all(xinYuan.id, xinYuanGroups[0].id);
    assert.equal(xinYuanGenerations.length, 1);
    assert.equal(xinYuanGenerations[0].name_ko, "이티밴");

    const rowCountsBeforeSecondRun = {
      manufacturers: database.count("manufacturers"),
      models: database.count("models"),
    };
    const second = seedEncarCarDepth(database);
    assert.deepEqual(second.inserted, { manufacturers: 0, modelGroups: 0, generations: 0 });
    assert.deepEqual(second.reused, { manufacturers: 63, modelGroups: 663, generations: 1_256 });
    assert.deepEqual(countEncarCarDepth(database), { manufacturers: 63, modelGroups: 663, generations: 1_256 });
    assert.deepEqual({
      manufacturers: database.count("manufacturers"),
      models: database.count("models"),
    }, rowCountsBeforeSecondRun);
  } finally {
    database.close();
  }
});
