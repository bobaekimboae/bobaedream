#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(here, "bike-catalog.normalized.json");
const outputPath = resolve(here, "../../public/data/bike-catalog-1005/catalog.json");
const source = JSON.parse(await readFile(sourcePath, "utf8"));

const expected = source.meta.counts;
const actual = {
  manufacturers: source.manufacturers.length,
  visibleManufacturers: source.manufacturers.filter((row) => row.isVisible).length,
  hiddenManufacturers: source.manufacturers.filter((row) => !row.isVisible).length,
  modelGroups: source.modelGroups.length,
  actualModelGroups: source.modelGroups.filter((row) => !row.isImplicit).length,
  implicitModelGroups: source.modelGroups.filter((row) => row.isImplicit).length,
  models: source.models.length,
  danawaPcodes: new Set(source.models.flatMap((row) => row.danawaPcodes)).size,
  reviewRequiredModels: source.models.filter((row) => row.reviewStatus === "REVIEW_REQUIRED").length,
};
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error(`공통 시드 원천 건수 불일치: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
}

const sortRows = (rows) => [...rows].sort((left, right) => (
  left.sortOrder - right.sortOrder || left.displayName.localeCompare(right.displayName, "ko")
));
const groupsBy = (rows, key) => rows.reduce((map, row) => {
  if (!map.has(row[key])) map.set(row[key], []);
  map.get(row[key]).push(row);
  return map;
}, new Map());
const modelGroupsByMake = groupsBy(source.modelGroups, "makeKey");
const modelsByGroup = groupsBy(source.models, "parentModelKey");
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
    schemaVersion: source.meta.schemaVersion,
    version: source.meta.version,
    vehicleScope: source.meta.vehicleScope,
    sourceSystem: source.meta.sourceSystem,
    snapshotDate: source.meta.snapshotDate,
    listingCountSnapshotDate: source.meta.listingCountSnapshotDate,
    listingCountKind: source.meta.listingCountKind,
    sources: source.meta.sources,
    filters: source.meta.filters,
    counts: {
      ...source.meta.counts,
      danawaPcodeCount: source.meta.counts.danawaPcodes,
      danawaPcodes: undefined,
    },
    imagePolicy: source.meta.imagePolicy,
    generatedFrom: "data/bike-catalog-1005/bike-catalog.normalized.json",
  },
  manufacturers: sortRows(source.manufacturers).map((make) => ({
    ...common(make),
    englishName: make.englishName,
    countryName: make.countryName,
    origin: make.origin,
    isChinese: make.isChinese,
    isPopular: make.isPopular,
    usesGroups: make.usesGroups,
    aliases: make.aliases,
    modelGroups: sortRows(modelGroupsByMake.get(make.key) ?? []).map((group) => ({
      ...common(group),
      isImplicit: group.isImplicit,
      models: sortRows(modelsByGroup.get(group.key) ?? []).map((model) => ({
        ...common(model),
        genre: model.genre,
        displacementCc: model.displacementCc,
        displacementBand: model.displacementBand,
        fuel: model.fuel,
        yearMin: model.yearMin,
        yearMax: model.yearMax,
        imagePath: model.imagePath,
      })),
    })),
  })),
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output: outputPath, counts: catalog.meta.counts }, null, 2));
