#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(here, "encar-car-depth.normalized.json");
const outputPath = resolve(here, "../../public/data/encar-car-depth-1005/catalog.json");

const source = JSON.parse(await readFile(sourcePath, "utf8"));

const expected = source.meta.counts;
const actual = {
  manufacturers: source.manufacturers.length,
  modelGroups: source.modelGroups.length,
  generations: source.generations.length,
  fuelDrives: source.fuelDrives.length,
  grades: source.grades.length,
  subgrades: source.subgrades.length,
};
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error(`공통 시드 원천 건수 불일치: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
}

const sortRows = (rows) => [...rows].sort((left, right) => (
  (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
  || left.displayName.localeCompare(right.displayName, "ko")
));

const groupsBy = (rows, key) => {
  const result = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!result.has(value)) result.set(value, []);
    result.get(value).push(row);
  }
  return result;
};

const modelGroupsByMake = groupsBy(source.modelGroups, "makeKey");
const generationsByModel = groupsBy(source.generations, "parentModelKey");
const fuelDrivesByGeneration = groupsBy(source.fuelDrives, "generationKey");
const gradesByFuelDrive = groupsBy(source.grades, "parentTrimKey");
const subgradesByGrade = groupsBy(source.subgrades, "parentTrimKey");

const common = (row) => ({
  key: row.key,
  sourceName: row.sourceName,
  displayName: row.displayName,
  isVisible: row.isVisible,
  sortOrder: row.sortOrder,
  listingCount: row.listingCount,
  reviewStatus: row.reviewStatus,
  reviewReason: row.reviewReason,
});

const catalog = {
  meta: {
    schemaVersion: 1,
    sourceSystem: source.meta.sourceSystem,
    vehicleScope: source.meta.vehicleScope,
    snapshotDate: source.meta.snapshotDate,
    listingCountKind: source.meta.listingCountKind,
    counts: source.meta.counts,
    imagePolicy: "엔카 이미지 경로는 공개 catalog.json에 포함하지 않음",
    generatedFrom: "data/encar-car-depth-1005/encar-car-depth.normalized.json",
  },
  manufacturers: sortRows(source.manufacturers).map((make) => ({
    ...common(make),
    englishName: make.englishName,
    origin: make.origin,
    countryName: make.countryName,
    countryCode: make.countryCode,
    isPopular: make.isPopular,
    visibilityReason: make.visibilityReason,
    modelGroups: sortRows(modelGroupsByMake.get(make.key) ?? []).map((model) => ({
      ...common(model),
      englishName: model.englishName,
      bodyType: model.bodyType,
      priceMin10kKrw: model.priceMin10kKrw,
      priceMax10kKrw: model.priceMax10kKrw,
      generations: sortRows(generationsByModel.get(model.key) ?? []).map((generation) => ({
        ...common(generation),
        generationCode: generation.generationCode,
        releaseYm: generation.releaseYm,
        endYm: generation.endYm,
        salesStatus: generation.salesStatus,
        priceMin10kKrw: generation.priceMin10kKrw,
        priceMax10kKrw: generation.priceMax10kKrw,
        fuelDrives: sortRows(fuelDrivesByGeneration.get(generation.key) ?? []).map((fuelDrive) => ({
          ...common(fuelDrive),
          valueType: fuelDrive.valueType,
          fuel: fuelDrive.fuel,
          drive: fuelDrive.drive,
          grades: sortRows(gradesByFuelDrive.get(fuelDrive.key) ?? []).map((grade) => ({
            ...common(grade),
            priceMin10kKrw: grade.priceMin10kKrw,
            priceMax10kKrw: grade.priceMax10kKrw,
            subgrades: sortRows(subgradesByGrade.get(grade.key) ?? []).map((subgrade) => ({
              ...common(subgrade),
            })),
          })),
        })),
      })),
    })),
  })),
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output: outputPath, counts: catalog.meta.counts }, null, 2));
