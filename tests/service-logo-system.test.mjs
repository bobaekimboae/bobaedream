import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const assets = ["bike", "community", "truck", "construction", "oldcar"];
const assetPath = (name) => `public/assets/bbm/service-logos/v01/bobaedream-${name}-v01.png`;

for (const name of assets) {
  const file = await readFile(assetPath(name));
  const info = await stat(assetPath(name));
  assert.ok(info.size > 100_000, `${name} logo must contain the final transparent artwork`);
  assert.equal(file.toString("ascii", 1, 4), "PNG", `${name} logo must be a PNG`);
  assert.equal(file.readUInt32BE(16), 512, `${name} logo width must be normalized to 512px`);
  assert.equal(file.readUInt32BE(20), 512, `${name} logo height must be normalized to 512px`);
}

const pcHeader = await readFile("src/prototype/listing/pc-bbmuseum.tsx", "utf8");
for (const [category, asset] of [["바이크", "bike"], ["트럭 · 특장", "truck"], ["건설기계", "construction"], ["올드카", "oldcar"]]) {
  assert.ok(pcHeader.includes(`category === "${category}"`), `${category} must have a header mapping`);
  assert.ok(pcHeader.includes(`? "${asset}"`), `${category} must map to the ${asset} service logo`);
}

const mainHome = await readFile("src/main-home/MainHome.tsx", "utf8");
for (const name of assets) assert.ok(mainHome.includes(`serviceLogoAsset("${name}")`), `${name} must be exposed on the main navigation surface`);

const community = await readFile("public/community/bobaedream-pc-board-list.html", "utf8");
assert.ok(community.includes("bobaedream-community-v01.png"), "community header must use the community mark");

console.log("Service logo system verification passed (5 normalized assets and mapped surfaces).");
