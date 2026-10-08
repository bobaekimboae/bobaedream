import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [displayName, slug, assetPrefix] = process.argv.slice(2);
if (!displayName || !slug || !assetPrefix) {
  throw new Error("usage: node scripts/build-maker-image-manifest.mjs <displayName> <slug> <assetPrefix>");
}

const root = fileURLToPath(new URL("../", import.meta.url));
const sourcePath = path.join(root, "public", "data", "encar-car-depth-1005", "catalog.json");
const outputDir = path.join(root, "public", "data", `${slug}-catalog-v1`);
const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const maker = source.manufacturers.find((item) => item.displayName === displayName);
if (!maker) throw new Error(`${displayName} 원본 제조사를 찾지 못했습니다.`);

const stableId = (prefix, value) => `${prefix}_${crypto.createHash("sha1").update(value).digest("hex").slice(0, 20)}`;
const cleanVisualName = (name) => String(name || "")
  .replace(/\s*\(하이브리드\)/g, "")
  .replace(/\s*하이브리드/g, "")
  .replace(/\s+/g, " ")
  .trim();

const assets = new Map();
const generationImages = {};
for (const model of maker.modelGroups) {
  for (const generation of (model.generations || []).filter((item) => item.isVisible !== false)) {
    const visualName = cleanVisualName(generation.displayName);
    const assetId = stableId(assetPrefix, `${model.displayName}|${visualName}`);
    if (!assets.has(assetId)) {
      assets.set(assetId, {
        assetId,
        fileName: `${assetId}.png`,
        manufacturer: displayName,
        model: model.displayName,
        generationName: generation.displayName,
        visualName,
        releaseYm: generation.releaseYm,
        endYm: generation.endYm,
        listingCount: Number(generation.listingCount || 0),
        colorSourcePriority: [
          "manufacturer official archive",
          "carisyou.com",
          "auto.danawa.com",
          "koreacarmarket.com (pre-2010 only)",
        ],
        colorName: "미확인",
        colorEvidence: "미확인",
        sourceGenerationKeys: [generation.key],
        status: "pending",
      });
    } else {
      const asset = assets.get(assetId);
      asset.sourceGenerationKeys.push(generation.key);
      asset.listingCount += Number(generation.listingCount || 0);
    }
    generationImages[generation.key] = `${slug}-v1/${assetId}.png`;
  }
}

const orderedAssets = [...assets.values()].sort((a, b) => b.listingCount - a.listingCount || a.model.localeCompare(b.model, "ko") || a.generationName.localeCompare(b.generationName, "ko"));
orderedAssets.forEach((asset, index) => { asset.priority = index + 1; });

const manifest = {
  version: "2026-10-07-v01",
  manufacturerKey: maker.key,
  manufacturerName: displayName,
  sourceModels: maker.modelGroups.length,
  sourceGenerations: maker.modelGroups.flatMap((model) => model.generations || []).filter((generation) => generation.isVisible !== false).length,
  uniqueAssets: orderedAssets.length,
  rules: {
    master: "1920×1200 transparent PNG",
    delivery: "960×600 transparent PNG",
    angle: "AutoScout24-style left-facing front three-quarter",
    width: "88~90%",
    floorGap: "6%",
    lighting: "high-key studio, approximately +0.7EV midtone lift",
    shadow: "compact contact shadow",
    colorPriority: [
      "manufacturer official archive",
      "carisyou.com",
      "auto.danawa.com",
      "koreacarmarket.com (pre-2010 only)",
    ],
  },
  assets: orderedAssets,
};

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.join(root, "public", "assets", "maker-model", "generations", `${slug}-v1`), { recursive: true });
await fs.writeFile(path.join(outputDir, "image-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await fs.writeFile(path.join(outputDir, "generation-images.json"), `${JSON.stringify(generationImages, null, 2)}\n`);
await fs.writeFile(path.join(outputDir, "generation-images-available.json"), "{}\n");
console.log(JSON.stringify({ manufacturer: displayName, models: manifest.sourceModels, generations: manifest.sourceGenerations, uniqueAssets: manifest.uniqueAssets }, null, 2));
