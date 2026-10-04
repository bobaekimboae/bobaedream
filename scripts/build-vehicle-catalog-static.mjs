import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const DEFAULT_SOURCE = "C:/Users/bobae/Downloads/Claude outputs/codex_encar_1004";
const sourceRoot = resolve(process.env.VEHICLE_CATALOG_SOURCE || DEFAULT_SOURCE);
const generationImageRoot = resolve(process.env.VEHICLE_GENERATION_IMAGES || join(sourceRoot, "..", "gen_images"));
const outputRoot = resolve(process.env.VEHICLE_CATALOG_OUTPUT || "public/data/vehicle-catalog");
const assetRoot = "assets/vehicle-catalog";

const paths = {
  manufacturers: "catalog_fill_manufacturers_1004.csv",
  modelGroups: "catalog_fill_model_groups_1004.csv",
  generations: "catalog_fill_generations_1004.csv",
  fuelDrive: "catalog_fill_fuel_drive_1004.csv",
  grades: "catalog_fill_grades_1004.csv",
  depth: "encar_car_depth_all_1004.csv",
  imageJobs: "car_generation_image_jobs_1004.csv",
  bikeManufacturers: "bike_manufacturers_1004.csv",
  bikeModels: "bike_models_1004.csv",
};

const forbiddenPublicKeys = [
  "encarCode",
  "encarImagePath",
  "listingCount",
  "priceMin",
  "priceMax",
  "newCarPrice",
  "lightwagenId",
  "url",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/u, "");
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/u, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/u, ""));
    rows.push(row);
  }
  return rows;
}

async function readCsv(fileName) {
  const filePath = join(sourceRoot, fileName);
  const [headers, ...rows] = parseCsv(await readFile(filePath, "utf8"));
  if (!headers) throw new Error(`CSV 헤더 없음: ${filePath}`);
  return rows
    .filter((row) => row.some((value) => value !== ""))
    .map((values, rowIndex) => {
      if (values.length !== headers.length) throw new Error(`${fileName} ${rowIndex + 2}행 컬럼 수 불일치`);
      return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    });
}

const keyOf = (...parts) => parts.join("\u0000");
const idOf = (level, ...parts) => `${level}_${createHash("sha256").update(keyOf(...parts)).digest("hex").slice(0, 14)}`;
const numberOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const nullable = (value) => value?.trim() || null;
const sortByRank = (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ko");
const slugify = (value) => value
  .normalize("NFKD")
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "") || `brand-${createHash("sha1").update(value).digest("hex").slice(0, 8)}`;

function uniqueBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) if (!map.has(keyFn(row))) map.set(keyFn(row), row);
  return [...map.values()];
}

function assertCount(label, actual, expected) {
  if (actual !== expected) throw new Error(`${label} 개수 불일치: 예상 ${expected}, 실제 ${actual}`);
}

function jsonText(value) {
  const text = `${JSON.stringify(value)}\n`;
  for (const key of forbiddenPublicKeys) {
    if (text.includes(`"${key}"`)) throw new Error(`공개 금지 키 검출: ${key}`);
  }
  return text;
}

async function writeJson(filePath, value) {
  await mkdir(resolve(filePath, ".."), { recursive: true });
  await writeFile(filePath, jsonText(value), "utf8");
}

function logoSlug(manufacturer) {
  return slugify(manufacturer.englishName || manufacturer.name);
}

async function buildCars() {
  const [manufacturerRows, groupRows, generationRows, fuelRows, gradeRows, depthRows, imageJobRows] = await Promise.all([
    readCsv(paths.manufacturers),
    readCsv(paths.modelGroups),
    readCsv(paths.generations),
    readCsv(paths.fuelDrive),
    readCsv(paths.grades),
    readCsv(paths.depth),
    readCsv(paths.imageJobs),
  ]);

  assertCount("승용 제조사", manufacturerRows.length, 63);
  assertCount("승용 모델그룹", groupRows.length, 663);
  assertCount("승용 세대", generationRows.length, 1_256);
  assertCount("승용 연료·구동", fuelRows.length, 2_160);
  assertCount("승용 등급", gradeRows.length, 5_978);

  const subgradeRows = uniqueBy(
    depthRows.filter((row) => row["5뎁스 세부등급"]),
    (row) => keyOf(row.제조사, row["1뎁스 모델그룹"], row["2뎁스 모델(세대)"], row["3뎁스 연료·구동"], row["4뎁스 등급"], row["5뎁스 세부등급"]),
  );
  assertCount("승용 세부등급", subgradeRows.length, 3_297);

  const jobByPath = new Map(imageJobRows.map((row) => [keyOf(row.제조사, row.모델그룹, row.세대), row]));
  const manufacturerByName = new Map();
  const allManufacturers = manufacturerRows.map((row) => {
    const name = row["제조사(엔카 원문)"];
    const manufacturer = {
      id: idOf("make", name),
      kind: row.구분,
      name,
      englishName: nullable(row.영문명),
      countryCode: nullable(row.국가코드),
      sortOrder: numberOr(row["엔카 정렬순서"], Number.MAX_SAFE_INTEGER),
      popular: row["인기 제조사"] === "Y",
      logoPath: null,
      slug: "",
    };
    manufacturer.slug = logoSlug(manufacturer);
    manufacturer.logoPath = ["기타 제조사", "사이언", "기타 수입차", "KG모빌리티(쌍용)"].includes(name)
      ? null
      : `${assetRoot}/logos/logo_${manufacturer.slug}.png`;
    manufacturerByName.set(name, manufacturer);
    return manufacturer;
  });

  const hiddenMakeNames = new Set(["지리"]);
  const manufacturers = allManufacturers.filter((row) => !hiddenMakeNames.has(row.name)).sort(sortByRank);
  const visibleMakeNames = new Set(manufacturers.map((row) => row.name));
  const manufacturerOrder = new Map(manufacturers.map((row, index) => [row.name, index]));

  const groupByPath = new Map();
  const allGroups = groupRows.map((row) => {
    const make = manufacturerByName.get(row.제조사);
    if (!make) throw new Error(`모델그룹 제조사 없음: ${row.제조사}`);
    const name = row["모델그룹(엔카 원문)"];
    const group = {
      id: idOf("group", row.제조사, name),
      makeId: make.id,
      makeName: row.제조사,
      name,
      englishName: nullable(row.영문명),
      sortOrder: numberOr(row["엔카 정렬순서"], Number.MAX_SAFE_INTEGER),
      imagePath: null,
    };
    groupByPath.set(keyOf(row.제조사, name), group);
    return group;
  });
  const modelGroups = allGroups.filter((row) => visibleMakeNames.has(row.makeName));

  const generationByPath = new Map();
  const allGenerations = generationRows.map((row) => {
    const group = groupByPath.get(keyOf(row.제조사, row.모델그룹));
    if (!group) throw new Error(`세대 모델그룹 없음: ${row.제조사} > ${row.모델그룹}`);
    const name = row["세부모델(엔카 원문)"];
    const job = jobByPath.get(keyOf(row.제조사, row.모델그룹, name));
    const sourceFile = job?.["파일명(PNG 1200x800)"];
    const webFile = job?.["웹용(WebP 600x400)"];
    const hasImage = Boolean(sourceFile && webFile && existsSync(join(generationImageRoot, sourceFile)));
    const generation = {
      id: idOf("generation", row.제조사, row.모델그룹, name),
      makeId: group.makeId,
      groupId: group.id,
      makeName: row.제조사,
      groupName: row.모델그룹,
      name,
      generationCode: nullable(row["세대코드(이름에서 추출)"]),
      releaseYm: nullable(row["출시 연월"]),
      endYm: nullable(row["단종 연월"]),
      saleStatus: nullable(row.판매상태),
      sortOrder: numberOr(row["엔카 정렬순서"], Number.MAX_SAFE_INTEGER),
      imagePath: hasImage ? `${assetRoot}/generations/${webFile}` : null,
    };
    generationByPath.set(keyOf(row.제조사, row.모델그룹, name), generation);
    return generation;
  });
  const generations = allGenerations.filter((row) => visibleMakeNames.has(row.makeName));

  const groupImages = new Map();
  for (const generation of [...generations].sort((a, b) => (b.releaseYm || "").localeCompare(a.releaseYm || "") || a.sortOrder - b.sortOrder)) {
    if (generation.imagePath && !groupImages.has(generation.groupId)) groupImages.set(generation.groupId, generation.imagePath);
  }
  for (const group of modelGroups) group.imagePath = groupImages.get(group.id) || null;

  const fuels = fuelRows.map((row, index) => {
    const generation = generationByPath.get(keyOf(row.제조사, row.모델그룹, row.세부모델));
    if (!generation) throw new Error(`연료·구동 세대 없음: ${row.제조사} > ${row.모델그룹} > ${row.세부모델}`);
    const name = row["연료·구동(엔카 원문)"];
    return {
      id: idOf("fuel", row.제조사, row.모델그룹, row.세부모델, name),
      makeName: row.제조사,
      groupName: row.모델그룹,
      generationName: row.세부모델,
      generationId: generation.id,
      name,
      sortOrder: index,
    };
  });
  const fuelByPath = new Map(fuels.map((row) => [keyOf(row.makeName, row.groupName, row.generationName, row.name), row]));

  const grades = gradeRows.map((row) => {
    const fuel = fuelByPath.get(keyOf(row.제조사, row.모델그룹, row.세부모델, row["연료·구동"]));
    if (!fuel) throw new Error(`등급 연료·구동 없음: ${row.제조사} > ${row.모델그룹} > ${row.세부모델} > ${row["연료·구동"]}`);
    const name = row["등급(엔카 원문)"];
    return {
      id: idOf("grade", row.제조사, row.모델그룹, row.세부모델, row["연료·구동"], name),
      makeName: row.제조사,
      groupName: row.모델그룹,
      generationName: row.세부모델,
      generationId: fuel.generationId,
      fuelId: fuel.id,
      fuelName: row["연료·구동"],
      name,
      sortOrder: numberOr(row["엔카 정렬순서"], Number.MAX_SAFE_INTEGER),
    };
  });
  const gradeByPath = new Map(grades.map((row) => [keyOf(row.makeName, row.groupName, row.generationName, row.fuelName, row.name), row]));

  const subgrades = subgradeRows.map((row, index) => {
    const grade = gradeByPath.get(keyOf(row.제조사, row["1뎁스 모델그룹"], row["2뎁스 모델(세대)"], row["3뎁스 연료·구동"], row["4뎁스 등급"]));
    if (!grade) throw new Error(`세부등급 등급 없음: ${row.제조사} > ${row["1뎁스 모델그룹"]} > ${row["4뎁스 등급"]}`);
    const name = row["5뎁스 세부등급"];
    return {
      id: idOf("subgrade", row.제조사, row["1뎁스 모델그룹"], row["2뎁스 모델(세대)"], row["3뎁스 연료·구동"], row["4뎁스 등급"], name),
      makeName: row.제조사,
      groupName: row["1뎁스 모델그룹"],
      generationName: row["2뎁스 모델(세대)"],
      generationId: grade.generationId,
      fuelId: grade.fuelId,
      fuelName: row["3뎁스 연료·구동"],
      gradeId: grade.id,
      gradeName: row["4뎁스 등급"],
      name,
      sortOrder: index,
    };
  });

  const publicFuels = fuels.filter((row) => visibleMakeNames.has(row.makeName));
  const publicGrades = grades.filter((row) => visibleMakeNames.has(row.makeName));
  const publicSubgrades = subgrades.filter((row) => visibleMakeNames.has(row.makeName));
  const releaseByGenerationId = new Map(generations.map((row) => [row.id, row.releaseYm]));
  const makeByName = new Map(manufacturers.map((row) => [row.name, row]));

  const searchRecords = [];
  for (const make of manufacturers) searchRecords.push({ id: make.id, type: "MAKE", name: make.name, path: [make.name], pathIds: [make.id], englishName: make.englishName, logoPath: make.logoPath, releaseYm: null, imagePath: null });
  for (const group of modelGroups) {
    const make = makeByName.get(group.makeName);
    searchRecords.push({ id: group.id, type: "MODEL_GROUP", name: group.name, path: [group.makeName, group.name], pathIds: [group.makeId, group.id], englishName: group.englishName, logoPath: make?.logoPath ?? null, releaseYm: null, imagePath: group.imagePath });
  }
  for (const generation of generations) {
    const make = makeByName.get(generation.makeName);
    searchRecords.push({ id: generation.id, type: "GENERATION", name: generation.name, path: [generation.makeName, generation.groupName, generation.name], pathIds: [generation.makeId, generation.groupId, generation.id], generationCode: generation.generationCode, logoPath: make?.logoPath ?? null, releaseYm: generation.releaseYm, endYm: generation.endYm, imagePath: generation.imagePath });
  }
  for (const fuel of publicFuels) {
    const make = makeByName.get(fuel.makeName);
    const group = groupByPath.get(keyOf(fuel.makeName, fuel.groupName));
    searchRecords.push({ id: fuel.id, type: "FUEL_DRIVE", name: fuel.name, path: [fuel.makeName, fuel.groupName, fuel.generationName, fuel.name], pathIds: [make.id, group.id, fuel.generationId, fuel.id], logoPath: make.logoPath, releaseYm: releaseByGenerationId.get(fuel.generationId) ?? null, imagePath: generationByPath.get(keyOf(fuel.makeName, fuel.groupName, fuel.generationName))?.imagePath ?? null });
  }
  for (const grade of publicGrades) {
    const make = makeByName.get(grade.makeName);
    const group = groupByPath.get(keyOf(grade.makeName, grade.groupName));
    searchRecords.push({ id: grade.id, type: "GRADE", name: grade.name, path: [grade.makeName, grade.groupName, grade.generationName, grade.fuelName, grade.name], pathIds: [make.id, group.id, grade.generationId, grade.fuelId, grade.id], logoPath: make.logoPath, releaseYm: releaseByGenerationId.get(grade.generationId) ?? null, imagePath: generationByPath.get(keyOf(grade.makeName, grade.groupName, grade.generationName))?.imagePath ?? null });
  }
  for (const subgrade of publicSubgrades) {
    const make = makeByName.get(subgrade.makeName);
    const group = groupByPath.get(keyOf(subgrade.makeName, subgrade.groupName));
    searchRecords.push({ id: subgrade.id, type: "SUBGRADE", name: subgrade.name, path: [subgrade.makeName, subgrade.groupName, subgrade.generationName, subgrade.fuelName, subgrade.gradeName, subgrade.name], pathIds: [make.id, group.id, subgrade.generationId, subgrade.fuelId, subgrade.gradeId, subgrade.id], logoPath: make.logoPath, releaseYm: releaseByGenerationId.get(subgrade.generationId) ?? null, imagePath: generationByPath.get(keyOf(subgrade.makeName, subgrade.groupName, subgrade.generationName))?.imagePath ?? null });
  }

  const firstIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    counts: { manufacturers: manufacturers.length, modelGroups: modelGroups.length, generations: generations.length },
    manufacturers: manufacturers.map(({ slug, ...row }) => row),
    modelGroups: modelGroups.sort((a, b) => manufacturerOrder.get(a.makeName) - manufacturerOrder.get(b.makeName) || sortByRank(a, b)),
    generations: generations.sort((a, b) => manufacturerOrder.get(a.makeName) - manufacturerOrder.get(b.makeName) || a.groupName.localeCompare(b.groupName, "ko") || sortByRank(a, b)),
  };

  await writeJson(join(outputRoot, "cars-index-v1.json"), firstIndex);
  await writeJson(join(outputRoot, "cars-search-v1.json"), { version: 1, generatedAt: firstIndex.generatedAt, records: searchRecords });

  for (const make of manufacturers) {
    const makeGroups = modelGroups.filter((row) => row.makeId === make.id).sort(sortByRank);
    const groupIds = new Set(makeGroups.map((row) => row.id));
    const makeGenerations = generations.filter((row) => groupIds.has(row.groupId)).sort(sortByRank);
    const generationIds = new Set(makeGenerations.map((row) => row.id));
    const makeFuels = publicFuels.filter((row) => generationIds.has(row.generationId)).sort((a, b) => a.sortOrder - b.sortOrder);
    const fuelIds = new Set(makeFuels.map((row) => row.id));
    const makeGrades = publicGrades.filter((row) => fuelIds.has(row.fuelId)).sort(sortByRank);
    const gradeIds = new Set(makeGrades.map((row) => row.id));
    const makeSubgrades = publicSubgrades.filter((row) => gradeIds.has(row.gradeId)).sort((a, b) => a.sortOrder - b.sortOrder);
    await writeJson(join(outputRoot, "cars", `${make.id}.json`), {
      version: 1,
      make: firstIndex.manufacturers.find((row) => row.id === make.id),
      modelGroups: makeGroups,
      generations: makeGenerations,
      fuelDrive: makeFuels,
      grades: makeGrades,
      subgrades: makeSubgrades,
    });
  }

  return {
    generatedAt: firstIndex.generatedAt,
    sourceCounts: { manufacturers: 63, modelGroups: 663, generations: 1_256, fuelDrive: 2_160, grades: 5_978, subgrades: 3_297 },
    hidden: { manufacturers: 1, modelGroups: 1, generations: 1, fuelDrive: 1, grades: 1, subgrades: 0, names: ["지리"] },
    publicCounts: { manufacturers: manufacturers.length, modelGroups: modelGroups.length, generations: generations.length, fuelDrive: publicFuels.length, grades: publicGrades.length, subgrades: publicSubgrades.length },
    searchRecords: searchRecords.length,
    makerFiles: manufacturers.length,
    generationImages: generations.filter((row) => row.imagePath).length,
  };
}

async function buildBikes() {
  const [manufacturerRows, modelRows] = await Promise.all([readCsv(paths.bikeManufacturers), readCsv(paths.bikeModels)]);
  assertCount("바이크 제조사", manufacturerRows.length, 87);
  assertCount("바이크 모델", modelRows.length, 2_900);
  const hiddenNames = new Set(manufacturerRows.filter((row) => row["노출 제안"] === "숨김 제안").map((row) => row.제조사));
  const manufacturers = manufacturerRows.filter((row) => !hiddenNames.has(row.제조사)).map((row, index) => ({
    id: idOf("bike_make", row.제조사),
    name: row.제조사,
    englishName: nullable(row.영문),
    country: nullable(row.국가),
    kind: row.구분,
    sortOrder: index,
  }));
  const makeByName = new Map(manufacturers.map((row) => [row.name, row]));
  const visibleModels = modelRows.filter((row) => makeByName.has(row.제조사));
  const groups = uniqueBy(visibleModels, (row) => keyOf(row.제조사, row.모델그룹 || row.모델)).map((row, index) => {
    const name = row.모델그룹 || row.모델;
    return { id: idOf("bike_group", row.제조사, name), makeId: makeByName.get(row.제조사).id, makeName: row.제조사, name, sortOrder: index };
  });
  const groupByPath = new Map(groups.map((row) => [keyOf(row.makeName, row.name), row]));
  const models = visibleModels.map((row, index) => {
    const groupName = row.모델그룹 || row.모델;
    const group = groupByPath.get(keyOf(row.제조사, groupName));
    return {
      id: idOf("bike_model", row.제조사, groupName, row.모델),
      makeId: group.makeId,
      groupId: group.id,
      makeName: row.제조사,
      groupName,
      name: row.모델,
      genre: nullable(row.장르),
      displacement: nullable(row.배기량),
      displacementBand: nullable(row["배기량 구간"]),
      fuel: nullable(row.연료),
      firstYear: nullable(row["연식 최초"]),
      latestYear: nullable(row["연식 최근"]),
      sortOrder: index,
    };
  });
  const generatedAt = new Date().toISOString();
  const searchRecords = [
    ...manufacturers.map((make) => ({ id: make.id, type: "MAKE", name: make.name, path: [make.name], pathIds: [make.id], englishName: make.englishName, logoPath: null, releaseYm: null, imagePath: null })),
    ...groups.map((group) => ({ id: group.id, type: "MODEL_GROUP", name: group.name, path: [group.makeName, group.name], pathIds: [group.makeId, group.id], logoPath: null, releaseYm: null, imagePath: null })),
    ...models.map((model) => ({ id: model.id, type: "BIKE_MODEL", name: model.name, path: [model.makeName, model.groupName, model.name], pathIds: [model.makeId, model.groupId, model.id], logoPath: null, releaseYm: model.latestYear, endYm: null, imagePath: null })),
  ];
  await writeJson(join(outputRoot, "bikes-index-v1.json"), { version: 1, generatedAt, counts: { manufacturers: manufacturers.length, modelGroups: groups.length, models: models.length }, manufacturers, modelGroups: groups, models });
  await writeJson(join(outputRoot, "bikes-search-v1.json"), { version: 1, generatedAt, records: searchRecords });
  for (const make of manufacturers) {
    const makeGroups = groups.filter((row) => row.makeId === make.id);
    const groupIds = new Set(makeGroups.map((row) => row.id));
    await writeJson(join(outputRoot, "bikes", `${make.id}.json`), { version: 1, make, modelGroups: makeGroups, models: models.filter((row) => groupIds.has(row.groupId)) });
  }
  return { sourceCounts: { manufacturers: 87, models: 2_900 }, hidden: { manufacturers: hiddenNames.size, models: modelRows.length - models.length, names: [...hiddenNames] }, publicCounts: { manufacturers: manufacturers.length, modelGroups: groups.length, models: models.length }, searchRecords: searchRecords.length, makerFiles: manufacturers.length };
}

async function main() {
  await mkdir(outputRoot, { recursive: true });
  const [cars, bikes] = await Promise.all([buildCars(), buildBikes()]);
  const manifest = {
    version: 1,
    generatedAt: cars.generatedAt,
    sourceDirectory: basename(sourceRoot),
    publicPolicy: {
      allowlistedFieldsOnly: true,
      idPolicy: "원문 경로의 SHA-256 앞 14자리",
      hiddenItemsExcluded: true,
    },
    cars,
    bikes,
  };
  await writeJson(join(outputRoot, "manifest-v1.json"), manifest);
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

await main();
