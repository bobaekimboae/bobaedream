import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourcePath = path.join(root, "public", "data", "encar-car-depth-1005", "catalog.json");
const outputDir = path.join(root, "public", "data", "hyundai-catalog-v2");
const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const sourceMaker = source.manufacturers.find((maker) => maker.displayName === "현대");
if (!sourceMaker) throw new Error("현대 원본 제조사를 찾지 못했습니다.");

const stableId = (prefix, value) => `${prefix}_${crypto.createHash("sha1").update(value).digest("hex").slice(0, 20)}`;
const startYear = (generation) => Number(String(generation.releaseYm || "0").slice(0, 4));
const cleanVisualName = (name) => name
  .replace(/\s*하이브리드/g, "")
  .replace(/\s*\(하이브리드\)/g, "")
  .replace(/\s+/g, " ")
  .trim();

function targetModelName(sourceModel, generation) {
  if (sourceModel.displayName === "제네시스" && generation.displayName.includes("쿠페")) return "제네시스 쿠페";
  return sourceModel.displayName;
}

function generationIdentity(modelName, generation) {
  const year = startYear(generation);
  const name = generation.displayName;
  const fixed = {
    i40: [1, "VF"], ST1: [1, "ST1"], 다이너스티: [1, "LX"], 마르샤: [1, "H"], 맥스크루즈: [1, "NC"],
    베뉴: [1, "QX"], 베라크루즈: [1, "EN"], 스타리아: [1, "US4"], 쏠라티: [1, "H350"], 아슬란: [1, "AG"],
    아이오닉: [1, "AE"], 아이오닉5: [1, "NE"], 아이오닉6: [1, "CE"], 아이오닉9: [1, "ME"], 엑센트: [4, "RB"],
    엑셀: [2, "X2"], 엘란트라: [1, "J1"], 캐스퍼: [1, "AX1"], 클릭: [1, "TB"], 테라칸: [1, "HP"],
    투스카니: [1, "GK"], "트라제 XG": [1, "FO"], 티뷰론: [1, "RD"], 포니: [1, "110"], 프레스토: [1, "X1"]
  };
  if (fixed[modelName]) return { number: fixed[modelName][0], code: fixed[modelName][1] };
  if (modelName === "i30") return year >= 2016 ? { number: 3, code: "PD" } : year >= 2011 ? { number: 2, code: "GD" } : { number: 1, code: "FD" };
  if (modelName === "갤로퍼") return year >= 1997 ? { number: 2, code: "M2" } : { number: 1, code: "M" };
  if (modelName === "그랜저") {
    if (year >= 2022) return { number: 7, code: "GN7" };
    if (year >= 2016) return { number: 6, code: "IG" };
    if (year >= 2011) return { number: 5, code: "HG" };
    if (year >= 2005) return { number: 4, code: "TG" };
    if (year >= 1998) return { number: 3, code: "XG" };
    if (year >= 1992) return { number: 2, code: "LX" };
    return { number: 1, code: "L" };
  }
  if (modelName === "넥쏘") return year >= 2025 ? { number: 2, code: "NH2" } : { number: 1, code: "FE" };
  if (modelName === "베르나") return year >= 2005 ? { number: 2, code: "MC" } : { number: 1, code: "LC" };
  if (modelName === "벨로스터") return year >= 2018 ? { number: 2, code: "JS" } : { number: 1, code: "FS" };
  if (modelName === "스타렉스") return year >= 2007 ? { number: 2, code: "TQ" } : { number: 1, code: "A1" };
  if (modelName === "싼타페") {
    if (year >= 2023) return { number: 5, code: "MX5" };
    if (year >= 2018) return { number: 4, code: "TM" };
    if (year >= 2012) return { number: 3, code: "DM" };
    if (year >= 2005) return { number: 2, code: "CM" };
    return { number: 1, code: "SM" };
  }
  if (modelName === "쏘나타") {
    if (year >= 2019) return { number: 8, code: "DN8" };
    if (year >= 2014) return { number: 7, code: "LF" };
    if (year >= 2009) return { number: 6, code: "YF" };
    if (year >= 2004) return { number: 5, code: "NF" };
    if (year >= 1998) return { number: 4, code: "EF" };
    return { number: 3, code: "Y3" };
  }
  if (modelName === "아반떼") {
    if (year >= 2026) return { number: 8, code: "CN8" };
    if (year >= 2020) return { number: 7, code: "CN7" };
    if (year >= 2015) return { number: 6, code: "AD" };
    if (year >= 2010) return { number: 5, code: "MD" };
    if (year >= 2006) return { number: 4, code: "HD" };
    if (year >= 2000) return { number: 3, code: "XD" };
    return { number: 2, code: "J2" };
  }
  if (modelName === "에쿠스") return year >= 2009 ? { number: 2, code: "VI" } : { number: 1, code: "LZ" };
  if (modelName === "제네시스") return year >= 2013 ? { number: 2, code: "DH" } : { number: 1, code: "BH" };
  if (modelName === "제네시스 쿠페") return { number: 1, code: "BK" };
  if (modelName === "코나") return year >= 2023 ? { number: 2, code: "SX2" } : { number: 1, code: "OS" };
  if (modelName === "투싼") {
    if (year >= 2020) return { number: 4, code: "NX4" };
    if (year >= 2015) return { number: 3, code: "TL" };
    if (year >= 2009) return { number: 2, code: "LM" };
    return { number: 1, code: "JM" };
  }
  if (modelName === "팰리세이드") return year >= 2025 ? { number: 2, code: "LX3" } : { number: 1, code: "LX2" };
  throw new Error(`세대 규칙 누락: ${modelName}/${name}`);
}

const modelBuckets = new Map();
for (const sourceModel of sourceMaker.modelGroups) {
  for (const sourceGeneration of (sourceModel.generations || []).filter((generation) => generation.isVisible !== false)) {
    const modelName = targetModelName(sourceModel, sourceGeneration);
    if (!modelBuckets.has(modelName)) {
      modelBuckets.set(modelName, {
        sourceModel,
        sourceModelKeys: new Set(),
        sourceGenerations: [],
      });
    }
    const bucket = modelBuckets.get(modelName);
    bucket.sourceModelKeys.add(sourceModel.key);
    bucket.sourceGenerations.push(sourceGeneration);
  }
}

const modelGroups = [];
const sourceMap = { version: "2026-10-07-v01", maker: sourceMaker.key, models: {} };
for (const [modelName, bucket] of modelBuckets) {
  const sourceModel = bucket.sourceModel;
  const modelKey = stableId("model_car_hyundai_v2", modelName);
  const generations = bucket.sourceGenerations
    .sort((a, b) => (b.releaseYm || "").localeCompare(a.releaseYm || ""))
    .map((generation, index) => {
      const identity = generationIdentity(modelName, generation);
      const generationKey = stableId("generation_car_hyundai_v2", `${modelName}|${generation.key}`);
      const visualName = cleanVisualName(generation.displayName);
      const imageAssetId = stableId("hyundai_asset", `${modelName}|${visualName}`);
      sourceMap.models[generationKey] = {
        modelKey,
        sourceModelKey: sourceModel.key,
        sourceGenerationKey: generation.key,
        sourceName: generation.sourceName,
      };
      return {
        ...generation,
        key: generationKey,
        sourceKey: generation.key,
        sourceModelKey: sourceModel.key,
        generationNumber: identity.number,
        generationCode: identity.code,
        imageAssetId,
        sortOrder: index + 1,
      };
    });
  const listingCount = generations.reduce((sum, generation) => sum + Number(generation.listingCount || 0), 0);
  modelGroups.push({
    ...sourceModel,
    key: modelKey,
    sourceKey: sourceModel.key,
    sourceModelKeys: [...bucket.sourceModelKeys],
    sourceName: modelName,
    displayName: modelName,
    bodyType: modelName === "제네시스 쿠페" ? "쿠페" : sourceModel.bodyType,
    listingCount,
    generations,
  });
}

modelGroups.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || b.listingCount - a.listingCount || a.displayName.localeCompare(b.displayName, "ko"));
modelGroups.forEach((model, index) => { model.sortOrder = index + 1; });

const catalog = {
  version: "2026-10-07-v2",
  rebuild: true,
  source: {
    catalog: "../encar-car-depth-1005/catalog.json",
    manufacturerKey: sourceMaker.key,
    officialHeritage: "https://www.hyundai.com/kr/ko/brand/heritage/model",
    danawa: "https://auto.danawa.com/auto/?Work=brand&Brand=303",
    carisyou: "https://www.carisyou.com/car/",
  },
  manufacturer: {
    ...sourceMaker,
    modelGroups,
  },
  meta: {
    sourceModels: sourceMaker.modelGroups.length,
    sourceGenerations: sourceMaker.modelGroups.flatMap((model) => model.generations || []).filter((generation) => generation.isVisible !== false).length,
    rebuiltModels: modelGroups.length,
    rebuiltGenerations: modelGroups.flatMap((model) => model.generations).length,
    imageAssets: new Set(modelGroups.flatMap((model) => model.generations.map((generation) => generation.imageAssetId))).size,
    listingCount: modelGroups.reduce((sum, model) => sum + model.listingCount, 0),
  },
};

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
await fs.writeFile(path.join(outputDir, "source-map.json"), `${JSON.stringify(sourceMap, null, 2)}\n`);
console.log(JSON.stringify(catalog.meta, null, 2));
