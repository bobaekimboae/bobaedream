import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AdminDatabase } from "./database.mjs";
import { seedEncarCarDepth } from "./seed-encar-car-depth.mjs";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ENCAR_SOURCE_PATH = resolve(
  moduleDirectory,
  "../data/encar-car-depth-1005/encar-car-depth.normalized.json",
);

const EXPECTED_COUNTS = Object.freeze({
  manufacturers: 63,
  modelGroups: 663,
  generations: 1_256,
  fuelDrives: 2_158,
  grades: 5_976,
  subgrades: 3_297,
});

function assertCounts(source) {
  const actual = Object.fromEntries(Object.keys(EXPECTED_COUNTS).map((key) => [key, source[key]?.length ?? -1]));
  if (JSON.stringify(actual) !== JSON.stringify(EXPECTED_COUNTS)) {
    throw new Error(`엔카 공통 시드 원천 건수 불일치: expected=${JSON.stringify(EXPECTED_COUNTS)} actual=${JSON.stringify(actual)}`);
  }
}

function exactlyOne(rows, description) {
  if (rows.length > 1) throw new Error(`${description}에 정확히 일치하는 기존 행이 여러 개입니다.`);
  return rows[0] ?? null;
}

function suffix(key) {
  return key.split("_").at(-1).toUpperCase();
}

export function loadEncarFullDepthSource(sourcePath = DEFAULT_ENCAR_SOURCE_PATH) {
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));
  assertCounts(source);
  return source;
}

export function countEncarFullDepthRows(database) {
  const row = database.db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM manufacturers WHERE scope_key = 'CAR' AND source_system = 'ENCAR') AS manufacturers,
      (SELECT COUNT(*) FROM models WHERE model_level = 'MODEL_GROUP' AND source_system = 'ENCAR') AS modelGroups,
      (SELECT COUNT(*) FROM models WHERE model_level = 'GENERATION' AND source_system = 'ENCAR') AS generations,
      (SELECT COUNT(*) FROM model_trims WHERE trim_level = 'FUEL_DRIVE' AND source_system = 'ENCAR') AS fuelDrives,
      (SELECT COUNT(*) FROM model_trims WHERE trim_level = 'GRADE' AND source_system = 'ENCAR') AS grades,
      (SELECT COUNT(*) FROM model_trims WHERE trim_level = 'SUBGRADE' AND source_system = 'ENCAR') AS subgrades
  `).get();
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)]));
}

export function seedEncarFullDepth(database, { sourcePath = DEFAULT_ENCAR_SOURCE_PATH } = {}) {
  const source = loadEncarFullDepthSource(sourcePath);
  const inserted = { manufacturers: 0, modelGroups: 0, generations: 0, fuelDrives: 0, grades: 0, subgrades: 0 };
  const reused = { manufacturers: 0, modelGroups: 0, generations: 0, fuelDrives: 0, grades: 0, subgrades: 0 };
  const timestamp = new Date().toISOString();
  const snapshotAt = `${source.meta.snapshotDate}T00:00:00+09:00`;
  const manufacturerIds = new Map();
  const modelIds = new Map();
  const trimIds = new Map();

  database.transaction(() => {
    for (const item of source.manufacturers) {
      const existing = exactlyOne(
        database.db.prepare("SELECT * FROM manufacturers WHERE scope_key = 'CAR' AND TRIM(name_ko) = ?").all(item.displayName),
        `제조사 ${item.displayName}`,
      );
      const patch = {
        name_ko: item.displayName,
        name_en: item.englishName,
        source_system: item.sourceSystem,
        source_code: item.sourceCode,
        source_name: item.sourceName,
        origin_type: item.origin,
        country_name: item.countryName,
        country_code: item.countryCode,
        is_popular: item.isPopular ? 1 : 0,
        is_visible: item.isVisible ? 1 : 0,
        sort_order: item.sortOrder,
        listing_count_snapshot: item.listingCount,
        listing_count_snapshot_at: snapshotAt,
        review_status: item.reviewStatus,
        review_reason: item.reviewReason,
        status: item.isVisible ? "ACTIVE" : "HIDDEN",
        updated_at: timestamp,
      };
      let row;
      if (existing) {
        row = database.update("manufacturers", existing.id, patch);
        reused.manufacturers += 1;
      } else {
        row = database.insert("manufacturers", {
          id: item.key,
          scope_key: "CAR",
          manufacturer_key: `ENCAR_${suffix(item.key)}`,
          ...patch,
          created_at: timestamp,
        });
        inserted.manufacturers += 1;
      }
      manufacturerIds.set(item.key, row.id);
    }

    for (const item of source.modelGroups) {
      const manufacturerId = manufacturerIds.get(item.makeKey);
      if (!manufacturerId) throw new Error(`모델그룹 부모 제조사 누락: ${item.sourceName}`);
      const existing = exactlyOne(
        database.db.prepare("SELECT * FROM models WHERE manufacturer_id = ? AND parent_model_id IS NULL AND TRIM(name_ko) = ?").all(manufacturerId, item.displayName),
        `모델그룹 ${item.displayName}`,
      );
      const patch = {
        name_ko: item.displayName,
        name_en: item.englishName,
        model_level: item.level,
        source_system: item.sourceSystem,
        source_code: item.sourceCode,
        source_name: item.sourceName,
        body_type: item.bodyType,
        sort_order: item.sortOrder,
        price_min_10k_krw: item.priceMin10kKrw,
        price_max_10k_krw: item.priceMax10kKrw,
        listing_count_snapshot: item.listingCount,
        listing_count_snapshot_at: snapshotAt,
        is_visible: item.isVisible ? 1 : 0,
        review_status: item.reviewStatus,
        review_reason: item.reviewReason,
        status: item.isVisible ? "ACTIVE" : "HIDDEN",
        updated_at: timestamp,
      };
      let row;
      if (existing) {
        row = database.update("models", existing.id, patch);
        reused.modelGroups += 1;
      } else {
        row = database.insert("models", {
          id: item.key,
          manufacturer_id: manufacturerId,
          model_key: `ENCAR_GROUP_${suffix(item.key)}`,
          parent_model_id: null,
          ...patch,
          created_at: timestamp,
        });
        inserted.modelGroups += 1;
      }
      modelIds.set(item.key, row.id);
    }

    for (const item of source.generations) {
      const manufacturerId = manufacturerIds.get(item.makeKey);
      const parentModelId = modelIds.get(item.parentModelKey);
      if (!manufacturerId || !parentModelId) throw new Error(`세부모델 부모 누락: ${item.sourceName}`);
      const existing = exactlyOne(
        database.db.prepare("SELECT * FROM models WHERE manufacturer_id = ? AND parent_model_id = ? AND TRIM(name_ko) = ?").all(manufacturerId, parentModelId, item.displayName),
        `세부모델 ${item.displayName}`,
      );
      const patch = {
        name_ko: item.displayName,
        model_level: item.level,
        source_system: item.sourceSystem,
        source_code: item.sourceCode,
        source_name: item.sourceName,
        generation_code: item.generationCode,
        release_ym: item.releaseYm,
        end_ym: item.endYm,
        sales_status: item.salesStatus,
        encar_image_path: item.encarImagePath,
        sort_order: item.sortOrder,
        price_min_10k_krw: item.priceMin10kKrw,
        price_max_10k_krw: item.priceMax10kKrw,
        listing_count_snapshot: item.listingCount,
        listing_count_snapshot_at: snapshotAt,
        is_visible: item.isVisible ? 1 : 0,
        review_status: item.reviewStatus,
        review_reason: item.reviewReason,
        status: item.isVisible ? "ACTIVE" : "HIDDEN",
        updated_at: timestamp,
      };
      let row;
      if (existing) {
        row = database.update("models", existing.id, patch);
        reused.generations += 1;
      } else {
        row = database.insert("models", {
          id: item.key,
          manufacturer_id: manufacturerId,
          model_key: `ENCAR_GENERATION_${suffix(item.key)}`,
          parent_model_id: parentModelId,
          name_en: null,
          body_type: null,
          ...patch,
          created_at: timestamp,
        });
        inserted.generations += 1;
      }
      modelIds.set(item.key, row.id);
    }

    const seedTrims = (items, counterKey) => {
      for (const item of items) {
        const generationModelId = modelIds.get(item.generationKey);
        const parentTrimId = item.parentTrimKey ? trimIds.get(item.parentTrimKey) : null;
        if (!generationModelId || (item.parentTrimKey && !parentTrimId)) throw new Error(`트림 부모 누락: ${item.sourceName}`);
        const existing = exactlyOne(
          database.db.prepare("SELECT * FROM model_trims WHERE generation_model_id = ? AND trim_key = ?").all(generationModelId, item.key),
          `${item.level} ${item.sourceName}`,
        );
        const patch = {
          parent_trim_id: parentTrimId,
          trim_level: item.level,
          name_ko: item.displayName,
          source_system: item.sourceSystem,
          source_code: item.sourceCode,
          source_name: item.sourceName,
          value_type: item.valueType ?? null,
          fuel: item.fuel ?? null,
          drive: item.drive ?? null,
          sort_order: item.sortOrder,
          price_min_10k_krw: item.priceMin10kKrw ?? null,
          price_max_10k_krw: item.priceMax10kKrw ?? null,
          listing_count_snapshot: item.listingCount,
          listing_count_snapshot_at: snapshotAt,
          is_visible: item.isVisible ? 1 : 0,
          review_status: item.reviewStatus,
          review_reason: item.reviewReason,
          status: item.isVisible ? "ACTIVE" : "HIDDEN",
          updated_at: timestamp,
        };
        let row;
        if (existing) {
          row = database.update("model_trims", existing.id, patch);
          reused[counterKey] += 1;
        } else {
          row = database.insert("model_trims", {
            id: item.key,
            generation_model_id: generationModelId,
            trim_key: item.key,
            ...patch,
            created_at: timestamp,
          });
          inserted[counterKey] += 1;
        }
        trimIds.set(item.key, row.id);
      }
    };

    seedTrims(source.fuelDrives, "fuelDrives");
    seedTrims(source.grades, "grades");
    seedTrims(source.subgrades, "subgrades");
  });

  const coverage = countEncarFullDepthRows(database);
  if (JSON.stringify(coverage) !== JSON.stringify(EXPECTED_COUNTS)) {
    throw new Error(`엔카 SQLite 시드 건수 불일치: expected=${JSON.stringify(EXPECTED_COUNTS)} actual=${JSON.stringify(coverage)}`);
  }
  return { source: EXPECTED_COUNTS, inserted, reused, coverage };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const database = new AdminDatabase();
  try {
    database.seed();
    seedEncarCarDepth(database);
    console.log(JSON.stringify(seedEncarFullDepth(database), null, 2));
  } finally {
    database.close();
  }
}
