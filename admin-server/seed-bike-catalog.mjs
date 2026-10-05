import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AdminDatabase } from "./database.mjs";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_BIKE_SOURCE_PATH = resolve(
  moduleDirectory,
  "../data/bike-catalog-1005/bike-catalog.normalized.json",
);

const EXPECTED_COUNTS = Object.freeze({
  manufacturers: 86,
  visibleManufacturers: 65,
  hiddenManufacturers: 21,
  searchVisibleManufacturers: 62,
  modelGroups: 973,
  actualModelGroups: 920,
  implicitModelGroups: 53,
  models: 2_910,
  danawaPcodes: 135,
});

const EXPECTED_DATABASE_COUNTS = Object.freeze({
  manufacturers: 86,
  visibleManufacturers: 65,
  hiddenManufacturers: 21,
  searchVisibleManufacturers: 62,
  modelGroups: 973,
  actualModelGroups: 920,
  implicitModelGroups: 53,
  models: 2_910,
  modelSpecs: 2_910,
});

function assertSource(source) {
  const actual = {
    manufacturers: source.manufacturers?.length ?? -1,
    visibleManufacturers: source.manufacturers?.filter((item) => item.isVisible).length ?? -1,
    hiddenManufacturers: source.manufacturers?.filter((item) => !item.isVisible).length ?? -1,
    searchVisibleManufacturers: source.manufacturers?.filter((item) => item.isSearchVisible).length ?? -1,
    modelGroups: source.modelGroups?.length ?? -1,
    actualModelGroups: source.modelGroups?.filter((item) => !item.isImplicit).length ?? -1,
    implicitModelGroups: source.modelGroups?.filter((item) => item.isImplicit).length ?? -1,
    models: source.models?.length ?? -1,
    danawaPcodes: new Set(source.models?.flatMap((item) => item.danawaPcodes ?? [])).size,
  };
  if (JSON.stringify(actual) !== JSON.stringify(EXPECTED_COUNTS)) {
    throw new Error(`바이크 공통 시드 원천 건수 불일치: expected=${JSON.stringify(EXPECTED_COUNTS)} actual=${JSON.stringify(actual)}`);
  }
}

export function loadBikeCatalogSource(sourcePath = DEFAULT_BIKE_SOURCE_PATH) {
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));
  assertSource(source);
  return source;
}

export function countBikeCatalogRows(database) {
  const row = database.db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM manufacturers WHERE scope_key = 'BIKE' AND source_system = 'BB_BIKE') AS manufacturers,
      (SELECT COUNT(*) FROM manufacturers WHERE scope_key = 'BIKE' AND source_system = 'BB_BIKE' AND is_visible = 1) AS visibleManufacturers,
      (SELECT COUNT(*) FROM manufacturers WHERE scope_key = 'BIKE' AND source_system = 'BB_BIKE' AND is_visible = 0) AS hiddenManufacturers,
      (SELECT COUNT(*) FROM manufacturers WHERE scope_key = 'BIKE' AND source_system = 'BB_BIKE' AND is_search_visible = 1) AS searchVisibleManufacturers,
      (SELECT COUNT(*) FROM models m JOIN manufacturers mf ON mf.id = m.manufacturer_id
        WHERE mf.scope_key = 'BIKE' AND m.source_system = 'BB_BIKE' AND m.model_level = 'MODEL_GROUP') AS modelGroups,
      (SELECT COUNT(*) FROM models m JOIN manufacturers mf ON mf.id = m.manufacturer_id
        WHERE mf.scope_key = 'BIKE' AND m.source_system = 'BB_BIKE' AND m.model_level = 'MODEL_GROUP' AND m.is_implicit = 0) AS actualModelGroups,
      (SELECT COUNT(*) FROM models m JOIN manufacturers mf ON mf.id = m.manufacturer_id
        WHERE mf.scope_key = 'BIKE' AND m.source_system = 'BB_BIKE' AND m.model_level = 'MODEL_GROUP' AND m.is_implicit = 1) AS implicitModelGroups,
      (SELECT COUNT(*) FROM models m JOIN manufacturers mf ON mf.id = m.manufacturer_id
        WHERE mf.scope_key = 'BIKE' AND m.source_system = 'BB_BIKE' AND m.model_level = 'MODEL') AS models,
      (SELECT COUNT(*) FROM bike_model_specs s JOIN models m ON m.id = s.model_id
        JOIN manufacturers mf ON mf.id = m.manufacturer_id WHERE mf.scope_key = 'BIKE') AS modelSpecs
  `).get();
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)]));
}

function exactlyOne(rows, description) {
  if (rows.length > 1) throw new Error(`${description} 중복`);
  return rows[0] ?? null;
}

function findManufacturer(database, sourceCode) {
  return exactlyOne(
    database.db.prepare(`
      SELECT * FROM manufacturers
      WHERE scope_key = 'BIKE' AND source_system = 'BB_BIKE' AND source_code = ?
    `).all(sourceCode),
    `manufacturers source_code=${sourceCode}`,
  );
}

function findModel(database, sourceCode, modelLevel) {
  return exactlyOne(
    database.db.prepare(`
      SELECT m.* FROM models m
      JOIN manufacturers mf ON mf.id = m.manufacturer_id
      WHERE mf.scope_key = 'BIKE' AND m.source_system = 'BB_BIKE'
        AND m.source_code = ? AND m.model_level = ?
    `).all(sourceCode, modelLevel),
    `models source_code=${sourceCode} level=${modelLevel}`,
  );
}

export function seedBikeCatalog(database, { sourcePath = DEFAULT_BIKE_SOURCE_PATH } = {}) {
  const source = loadBikeCatalogSource(sourcePath);
  const inserted = { manufacturers: 0, modelGroups: 0, models: 0, modelSpecs: 0 };
  const reused = { manufacturers: 0, modelGroups: 0, models: 0, modelSpecs: 0 };
  const timestamp = new Date().toISOString();
  const snapshotAt = `${source.meta.listingCountSnapshotDate}T00:00:00+09:00`;
  const manufacturerIds = new Map();
  const groupIds = new Map();

  database.transaction(() => {
    for (const item of source.manufacturers) {
      const patch = {
        scope_key: "BIKE",
        manufacturer_key: item.key,
        name_ko: item.displayName,
        name_en: item.englishName,
        source_system: item.sourceSystem,
        source_code: item.sourceCode,
        source_name: item.sourceName,
        origin_type: item.origin,
        country_name: item.countryName,
        is_popular: item.isPopular ? 1 : 0,
        is_visible: item.isVisible ? 1 : 0,
        is_search_visible: item.isSearchVisible ? 1 : 0,
        aliases_json: JSON.stringify(item.aliases),
        sort_order: item.sortOrder,
        listing_count_snapshot: item.listingCount,
        listing_count_snapshot_at: snapshotAt,
        review_status: item.reviewStatus,
        review_reason: item.reviewReason,
        status: item.isVisible ? "ACTIVE" : "HIDDEN",
        updated_at: timestamp,
      };
      const existing = findManufacturer(database, item.sourceCode);
      const row = existing
        ? database.update("manufacturers", existing.id, patch)
        : database.insert("manufacturers", {
          id: item.key,
          ...patch,
          created_at: timestamp,
        });
      existing ? reused.manufacturers += 1 : inserted.manufacturers += 1;
      manufacturerIds.set(item.key, row.id);
    }

    for (const item of source.modelGroups) {
      const manufacturerId = manufacturerIds.get(item.makeKey);
      if (!manufacturerId) throw new Error(`바이크 모델그룹 부모 제조사 누락: ${item.sourceCode}`);
      const patch = {
        manufacturer_id: manufacturerId,
        model_key: item.key,
        name_ko: item.displayName,
        parent_model_id: null,
        model_level: "MODEL_GROUP",
        source_system: item.sourceSystem,
        source_code: item.sourceCode,
        source_name: item.sourceName,
        is_implicit: item.isImplicit ? 1 : 0,
        sort_order: item.sortOrder,
        listing_count_snapshot: item.listingCount,
        listing_count_snapshot_at: snapshotAt,
        is_visible: item.isVisible ? 1 : 0,
        review_status: item.reviewStatus,
        review_reason: item.reviewReason,
        status: item.isVisible ? "ACTIVE" : "HIDDEN",
        updated_at: timestamp,
      };
      const existing = findModel(database, item.sourceCode, "MODEL_GROUP");
      const row = existing
        ? database.update("models", existing.id, patch)
        : database.insert("models", {
          id: item.key,
          ...patch,
          created_at: timestamp,
        });
      existing ? reused.modelGroups += 1 : inserted.modelGroups += 1;
      groupIds.set(item.key, row.id);
    }

    for (const item of source.models) {
      const manufacturerId = manufacturerIds.get(item.makeKey);
      const modelGroupId = groupIds.get(item.parentModelKey);
      if (!manufacturerId || !modelGroupId) throw new Error(`바이크 모델 부모 누락: ${item.sourceCode}`);
      const patch = {
        manufacturer_id: manufacturerId,
        model_key: item.key,
        name_ko: item.displayName,
        parent_model_id: modelGroupId,
        model_level: "MODEL",
        source_system: item.sourceSystem,
        source_code: item.sourceCode,
        source_name: item.sourceName,
        is_implicit: 0,
        release_ym: item.yearMin ? String(item.yearMin) : null,
        end_ym: item.yearMax ? String(item.yearMax) : null,
        sort_order: item.sortOrder,
        listing_count_snapshot: item.listingCount,
        listing_count_snapshot_at: snapshotAt,
        is_visible: item.isVisible ? 1 : 0,
        review_status: item.reviewStatus,
        review_reason: item.reviewReason,
        status: item.isVisible ? "ACTIVE" : "HIDDEN",
        updated_at: timestamp,
      };
      const existing = findModel(database, item.sourceCode, "MODEL");
      const row = existing
        ? database.update("models", existing.id, patch)
        : database.insert("models", {
          id: item.key,
          ...patch,
          created_at: timestamp,
        });
      existing ? reused.models += 1 : inserted.models += 1;

      const specPatch = {
        genre: item.genre,
        displacement_cc: item.displacementCc,
        displacement_band: item.displacementBand,
        fuel: item.fuel,
        year_min: item.yearMin,
        year_max: item.yearMax,
        image_path: item.imagePath,
        updated_at: timestamp,
      };
      const existingSpec = database.db.prepare("SELECT * FROM bike_model_specs WHERE model_id = ?").get(row.id);
      if (existingSpec) {
        database.db.prepare(`
          UPDATE bike_model_specs
          SET genre = ?, displacement_cc = ?, displacement_band = ?, fuel = ?,
            year_min = ?, year_max = ?, image_path = ?, updated_at = ?
          WHERE model_id = ?
        `).run(
          specPatch.genre,
          specPatch.displacement_cc,
          specPatch.displacement_band,
          specPatch.fuel,
          specPatch.year_min,
          specPatch.year_max,
          specPatch.image_path,
          specPatch.updated_at,
          row.id,
        );
        reused.modelSpecs += 1;
      } else {
        database.insert("bike_model_specs", {
          model_id: row.id,
          ...specPatch,
          created_at: timestamp,
        });
        inserted.modelSpecs += 1;
      }
    }
  });

  const coverage = countBikeCatalogRows(database);
  if (JSON.stringify(coverage) !== JSON.stringify(EXPECTED_DATABASE_COUNTS)) {
    throw new Error(`바이크 SQLite 시드 건수 불일치: expected=${JSON.stringify(EXPECTED_DATABASE_COUNTS)} actual=${JSON.stringify(coverage)}`);
  }
  return { source: EXPECTED_COUNTS, inserted, reused, coverage };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const database = new AdminDatabase();
  try {
    database.seed();
    console.log(JSON.stringify(seedBikeCatalog(database), null, 2));
  } finally {
    database.close();
  }
}
