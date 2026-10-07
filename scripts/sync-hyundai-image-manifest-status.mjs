import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const dataDir = path.join(root, "public/data/hyundai-catalog-v2");
const assetDir = path.join(root, "public/assets/maker-model/generations/hyundai-v2");
const manifestPath = path.join(dataDir, "image-manifest.json");
const fullMapPath = path.join(dataDir, "generation-images.json");
const availableMapPath = path.join(dataDir, "generation-images-available.json");

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const fullMap = JSON.parse(await fs.readFile(fullMapPath, "utf8"));
const existingFiles = new Set(await fs.readdir(assetDir));
const availableAssets = new Set();

manifest.assets = manifest.assets.map((asset) => {
  const exists = existingFiles.has(asset.fileName);
  if (exists) availableAssets.add(asset.fileName);
  return { ...asset, status: exists ? "generated" : "pending" };
});

const availableMap = Object.fromEntries(
  Object.entries(fullMap).filter(([, value]) => availableAssets.has(path.basename(value))),
);

await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await fs.writeFile(availableMapPath, `${JSON.stringify(availableMap, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  generatedAssets: availableAssets.size,
  pendingAssets: manifest.assets.length - availableAssets.size,
  generationConnections: Object.keys(availableMap).length,
}, null, 2));
