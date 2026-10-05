import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AdminDatabase } from "./database.mjs";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ENCAR_CSV_PATH = resolve(
  moduleDirectory,
  "seeds/encar-car-depth-1004/encar_car_depth_all_1004.csv",
);

const REVIEW_MARKER = /[🔴🟡]/u;
const EXPECTED_COUNTS = Object.freeze({ manufacturers: 63, modelGroups: 663, generations: 1_256 });

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.endsWith("\r") ? field.slice(0, -1) : field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("CSV 인용부호가 닫히지 않았습니다.");
  if (field.length > 0 || row.length > 0) {
    row.push(field.endsWith("\r") ? field.slice(0, -1) : field);
    rows.push(row);
  }
  return rows;
}

function stableToken(...parts) {
  return createHash("sha256").update(parts.join("\u0000"), "utf8").digest("hex").slice(0, 20);
}

function assertExpectedCounts(plan) {
  for (const [key, expected] of Object.entries(EXPECTED_COUNTS)) {
    const actual = plan[key].length;
    if (actual !== expected) throw new Error(`엔카 ${key} 건수 불일치: 예상 ${expected}, 실제 ${actual}`);
  }
}

export function buildEncarCarDepthPlan(csvPath = DEFAULT_ENCAR_CSV_PATH) {
  const text = readFileSync(csvPath, "utf8").replace(/^\uFEFF/u, "");
  const [headers, ...dataRows] = parseCsv(text);
  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const requiredHeaders = ["국산/수입", "제조사", "1뎁스 모델그룹", "2뎁스 모델(세대)"];
  for (const header of requiredHeaders) {
    if (!headerIndex.has(header)) throw new Error(`필수 CSV 컬럼 누락: ${header}`);
  }

  const manufacturers = new Map();
  const modelGroups = new Map();
  const generations = new Map();
  const reviewRows = [];

  for (let index = 0; index < dataRows.length; index += 1) {
    const values = dataRows[index];
    if (values.length === 1 && values[0] === "") continue;
    if (values.length !== headers.length) {
      throw new Error(`CSV ${index + 2}행 컬럼 수 불일치: 예상 ${headers.length}, 실제 ${values.length}`);
    }

    const origin = values[headerIndex.get("국산/수입")];
    const manufacturerName = values[headerIndex.get("제조사")];
    const modelGroupName = values[headerIndex.get("1뎁스 모델그룹")];
    const generationName = values[headerIndex.get("2뎁스 모델(세대)")];
    const sourceValues = [origin, manufacturerName, modelGroupName, generationName];

    if (sourceValues.some((value) => REVIEW_MARKER.test(value))) {
      reviewRows.push({ csvRow: index + 2, origin, manufacturerName, modelGroupName, generationName });
      continue;
    }
    if (sourceValues.some((value) => !value)) throw new Error(`CSV ${index + 2}행 필수 값 누락`);
    if (origin !== "국산" && origin !== "수입") throw new Error(`CSV ${index + 2}행 국산/수입 값 오류: ${origin}`);

    const manufacturerKey = `${origin}\u0000${manufacturerName}`;
    if (!manufacturers.has(manufacturerKey)) {
      manufacturers.set(manufacturerKey, {
        origin,
        name: manufacturerName,
        countryCode: origin === "국산" ? "KR" : null,
        sortOrder: manufacturers.size + 1,
      });
    }

    const modelGroupKey = `${manufacturerName}\u0000${modelGroupName}`;
    if (!modelGroups.has(modelGroupKey)) {
      modelGroups.set(modelGroupKey, {
        manufacturerName,
        name: modelGroupName,
        sortOrder: modelGroups.size + 1,
      });
    }

    const generationKey = `${manufacturerName}\u0000${modelGroupName}\u0000${generationName}`;
    if (!generations.has(generationKey)) {
      generations.set(generationKey, {
        manufacturerName,
        modelGroupName,
        name: generationName,
        sortOrder: generations.size + 1,
      });
    }
  }

  const plan = {
    manufacturers: [...manufacturers.values()],
    modelGroups: [...modelGroups.values()],
    generations: [...generations.values()],
    reviewRows,
    sourceRows: dataRows.filter((row) => !(row.length === 1 && row[0] === "")).length,
  };
  assertExpectedCounts(plan);
  return plan;
}

function exactlyOne(rows, description) {
  if (rows.length > 1) throw new Error(`${description}에 정확히 일치하는 기존 행이 여러 개입니다.`);
  return rows[0] ?? null;
}

export function countCarDepthRows(database) {
  const counts = database.db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM manufacturers WHERE scope_key = 'CAR') AS manufacturers,
      (SELECT COUNT(*) FROM models m JOIN manufacturers mf ON mf.id = m.manufacturer_id
        WHERE mf.scope_key = 'CAR' AND m.parent_model_id IS NULL) AS modelGroups,
      (SELECT COUNT(*) FROM models m JOIN manufacturers mf ON mf.id = m.manufacturer_id
        WHERE mf.scope_key = 'CAR' AND m.parent_model_id IS NOT NULL) AS generations
  `).get();
  return Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number(value)]));
}

export function countEncarCarDepth(database, plan = buildEncarCarDepthPlan()) {
  const manufacturers = database.db.prepare("SELECT * FROM manufacturers WHERE scope_key = 'CAR'").all();
  const models = database.db.prepare(`
    SELECT m.* FROM models m
    JOIN manufacturers mf ON mf.id = m.manufacturer_id
    WHERE mf.scope_key = 'CAR'
  `).all();
  const manufacturerByName = new Map(manufacturers.map((row) => [row.name_ko, row]));
  const modelGroupByPath = new Map();
  let manufacturerCount = 0;
  let modelGroupCount = 0;
  let generationCount = 0;

  for (const sourceManufacturer of plan.manufacturers) {
    if (manufacturerByName.has(sourceManufacturer.name)) manufacturerCount += 1;
  }
  for (const sourceModelGroup of plan.modelGroups) {
    const manufacturer = manufacturerByName.get(sourceModelGroup.manufacturerName);
    if (!manufacturer) continue;
    const modelGroup = models.find((row) => (
      row.manufacturer_id === manufacturer.id
      && row.parent_model_id === null
      && row.name_ko === sourceModelGroup.name
    ));
    if (!modelGroup) continue;
    modelGroupByPath.set(`${sourceModelGroup.manufacturerName}\u0000${sourceModelGroup.name}`, modelGroup);
    modelGroupCount += 1;
  }
  for (const sourceGeneration of plan.generations) {
    const modelGroup = modelGroupByPath.get(`${sourceGeneration.manufacturerName}\u0000${sourceGeneration.modelGroupName}`);
    if (!modelGroup) continue;
    if (models.some((row) => row.parent_model_id === modelGroup.id && row.name_ko === sourceGeneration.name)) {
      generationCount += 1;
    }
  }
  return { manufacturers: manufacturerCount, modelGroups: modelGroupCount, generations: generationCount };
}

export function seedEncarCarDepth(database, { csvPath = DEFAULT_ENCAR_CSV_PATH } = {}) {
  const plan = buildEncarCarDepthPlan(csvPath);
  const inserted = { manufacturers: 0, modelGroups: 0, generations: 0 };
  const reused = { manufacturers: 0, modelGroups: 0, generations: 0 };
  const now = new Date().toISOString();

  database.transaction(() => {
    const manufacturerByName = new Map();
    for (const manufacturer of plan.manufacturers) {
      const existing = exactlyOne(
        database.db.prepare("SELECT * FROM manufacturers WHERE scope_key = 'CAR' AND name_ko = ?").all(manufacturer.name),
        `제조사 ${manufacturer.name}`,
      );
      if (existing) {
        manufacturerByName.set(manufacturer.name, existing);
        reused.manufacturers += 1;
        continue;
      }

      const token = stableToken(manufacturer.origin, manufacturer.name);
      const row = {
        id: `make_car_encar_${token}`,
        scope_key: "CAR",
        manufacturer_key: `ENCAR_${token.toUpperCase()}`,
        name_ko: manufacturer.name,
        name_en: null,
        country_code: manufacturer.countryCode,
        sort_order: manufacturer.sortOrder,
        status: "ACTIVE",
        created_at: now,
        updated_at: now,
      };
      database.insert("manufacturers", row);
      manufacturerByName.set(manufacturer.name, row);
      inserted.manufacturers += 1;
    }

    const modelGroupByPath = new Map();
    for (const modelGroup of plan.modelGroups) {
      const manufacturer = manufacturerByName.get(modelGroup.manufacturerName);
      const existing = exactlyOne(
        database.db.prepare(`
          SELECT * FROM models
          WHERE manufacturer_id = ? AND parent_model_id IS NULL AND name_ko = ?
        `).all(manufacturer.id, modelGroup.name),
        `모델그룹 ${modelGroup.manufacturerName} > ${modelGroup.name}`,
      );
      const path = `${modelGroup.manufacturerName}\u0000${modelGroup.name}`;
      if (existing) {
        modelGroupByPath.set(path, existing);
        reused.modelGroups += 1;
        continue;
      }

      const token = stableToken(modelGroup.manufacturerName, modelGroup.name);
      const row = {
        id: `model_car_encar_group_${token}`,
        manufacturer_id: manufacturer.id,
        model_key: `ENCAR_GROUP_${token.toUpperCase()}`,
        name_ko: modelGroup.name,
        name_en: null,
        parent_model_id: null,
        sort_order: modelGroup.sortOrder,
        status: "ACTIVE",
        created_at: now,
        updated_at: now,
      };
      database.insert("models", row);
      modelGroupByPath.set(path, row);
      inserted.modelGroups += 1;
    }

    for (const generation of plan.generations) {
      const manufacturer = manufacturerByName.get(generation.manufacturerName);
      const modelGroup = modelGroupByPath.get(`${generation.manufacturerName}\u0000${generation.modelGroupName}`);
      const existing = exactlyOne(
        database.db.prepare(`
          SELECT * FROM models
          WHERE manufacturer_id = ? AND parent_model_id = ? AND name_ko = ?
        `).all(manufacturer.id, modelGroup.id, generation.name),
        `세대 ${generation.manufacturerName} > ${generation.modelGroupName} > ${generation.name}`,
      );
      if (existing) {
        reused.generations += 1;
        continue;
      }

      const token = stableToken(generation.manufacturerName, generation.modelGroupName, generation.name);
      database.insert("models", {
        id: `model_car_encar_generation_${token}`,
        manufacturer_id: manufacturer.id,
        model_key: `ENCAR_GENERATION_${token.toUpperCase()}`,
        name_ko: generation.name,
        name_en: null,
        parent_model_id: modelGroup.id,
        sort_order: generation.sortOrder,
        status: "ACTIVE",
        created_at: now,
        updated_at: now,
      });
      inserted.generations += 1;
    }
  });

  return {
    source: EXPECTED_COUNTS,
    inserted,
    reused,
    reviewRows: plan.reviewRows.length,
    databaseCoverage: countEncarCarDepth(database, plan),
    databaseRows: countCarDepthRows(database),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const database = new AdminDatabase();
  try {
    database.seed();
    console.log(JSON.stringify(seedEncarCarDepth(database), null, 2));
  } finally {
    database.close();
  }
}
