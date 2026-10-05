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
      (SELECT COUNT(*) FROM bike_manufacturers WHERE source_system = 'BB_BIKE') AS manufacturers,
      (SELECT COUNT(*) FROM bike_manufacturers WHERE source_system = 'BB_BIKE' AND is_visible = 1) AS visibleManufacturers,
      (SELECT COUNT(*) FROM bike_manufacturers WHERE source_system = 'BB_BIKE' AND is_visible = 0) AS hiddenManufacturers,
      (SELECT COUNT(*) FROM bike_manufacturers WHERE source_system = 'BB_BIKE' AND is_search_visible = 1) AS searchVisibleManufacturers,
      (SELECT COUNT(*) FROM bike_model_groups WHERE source_system = 'BB_BIKE') AS modelGroups,
      (SELECT COUNT(*) FROM bike_model_groups WHERE source_system = 'BB_BIKE' AND is_implicit = 0) AS actualModelGroups,
      (SELECT COUNT(*) FROM bike_model_groups WHERE source_system = 'BB_BIKE' AND is_implicit = 1) AS implicitModelGroups,
      (SELECT COUNT(*) FROM bike_models WHERE source_system = 'BB_BIKE') AS models
  `).get();
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)]));
}

function findOne(database, table, sourceCode) {
  const rows = database.db.prepare(`SELECT * FROM ${table} WHERE source_system = 'BB_BIKE' AND source_code = ?`).all(sourceCode);
  if (rows.length > 1) throw new Error(`${table} source_code 중복: ${sourceCode}`);
  return rows[0] ?? null;
}

export function seedBikeCatalog(database, { sourcePath = DEFAULT_BIKE_SOURCE_PATH } = {}) {
  const source = loadBikeCatalogSource(sourcePath);
  const inserted = { manufacturers: 0, modelGroups: 0, models: 0 };
  const reused = { manufacturers: 0, modelGroups: 0, models: 0 };
  const timestamp = new Date().toISOString();
  const snapshotAt = `${source.meta.listingCountSnapshotDate}T00:00:00+09:00`;
  const manufacturerIds = new Map();
  const groupIds = new Map();

  database.transaction(() => {
    for (const item of source.manufacturers) {
      const patch = {
        source_name: item.sourceName,
        display_name: item.displayName,
        english_name: item.englishName,
        country_name: item.countryName,
        origin_type: item.origin,
        is_chinese: item.isChinese ? 1 : 0,
        is_popular: item.isPopular ? 1 : 0,
        is_visible: item.isVisible ? 1 : 0,
        is_search_visible: item.isSearchVisible ? 1 : 0,
        aliases_json: JSON.stringify(item.aliases),
        uses_groups: item.usesGroups ? 1 : 0,
        sort_order: item.sortOrder,
        listing_count_snapshot: item.listingCount,
        listing_count_snapshot_at: snapshotAt,
        review_status: item.reviewStatus,
        review_reason: item.reviewReason,
        status: item.isVisible ? "ACTIVE" : "HIDDEN",
        updated_at: timestamp,
      };
      const existing = findOne(database, "bike_manufacturers", item.sourceCode);
      const row = existing
        ? database.update("bike_manufacturers", existing.id, patch)
        : database.insert("bike_manufacturers", {
          id: item.key,
          source_system: item.sourceSystem,
          source_code: item.sourceCode,
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
        source_name: item.sourceName,
        display_name: item.displayName,
        is_implicit: item.isImplicit ? 1 : 0,
        is_visible: item.isVisible ? 1 : 0,
        sort_order: item.sortOrder,
        listing_count_snapshot: item.listingCount,
        listing_count_snapshot_at: snapshotAt,
        review_status: item.reviewStatus,
        review_reason: item.reviewReason,
        status: item.isVisible ? "ACTIVE" : "HIDDEN",
        updated_at: timestamp,
      };
      const existing = findOne(database, "bike_model_groups", item.sourceCode);
      const row = existing
        ? database.update("bike_model_groups", existing.id, patch)
        : database.insert("bike_model_groups", {
          id: item.key,
          source_system: item.sourceSystem,
          source_code: item.sourceCode,
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
        model_group_id: modelGroupId,
        source_name: item.sourceName,
        display_name: item.displayName,
        genre: item.genre,
        displacement_cc: item.displacementCc,
        displacement_band: item.displacementBand,
        fuel: item.fuel,
        year_min: item.yearMin,
        year_max: item.yearMax,
        image_path: item.imagePath,
        is_visible: item.isVisible ? 1 : 0,
        sort_order: item.sortOrder,
        listing_count_snapshot: item.listingCount,
        listing_count_snapshot_at: snapshotAt,
        review_status: item.reviewStatus,
        review_reason: item.reviewReason,
        status: item.isVisible ? "ACTIVE" : "HIDDEN",
        updated_at: timestamp,
      };
      const existing = findOne(database, "bike_models", item.sourceCode);
      if (existing) {
        database.update("bike_models", existing.id, patch);
        reused.models += 1;
      } else {
        database.insert("bike_models", {
          id: item.key,
          source_system: item.sourceSystem,
          source_code: item.sourceCode,
          ...patch,
          created_at: timestamp,
        });
        inserted.models += 1;
      }
    }
  });

  const coverage = countBikeCatalogRows(database);
  const expectedDatabaseCounts = Object.fromEntries(
    Object.entries(EXPECTED_COUNTS).filter(([key]) => key !== "danawaPcodes"),
  );
  if (JSON.stringify(coverage) !== JSON.stringify(expectedDatabaseCounts)) {
    throw new Error(`바이크 SQLite 시드 건수 불일치: expected=${JSON.stringify(expectedDatabaseCounts)} actual=${JSON.stringify(coverage)}`);
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
