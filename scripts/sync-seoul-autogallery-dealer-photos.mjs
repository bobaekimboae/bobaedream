import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const shopsSource = await readFile(join(root, "src/prototype/data/seoul-autogallery-shops-v01.ts"), "utf8");
const shopNos = [...new Set([...shopsSource.matchAll(/shopNo:\s*"(\d+)"/g)].map((match) => match[1]))];
const outputDir = join(root, "public/assets/dealer-profile/seoul-auto-gallery-all");
await mkdir(outputDir, { recursive: true });

const htmlEntity = (value) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&#39;", "'")
  .replaceAll("&quot;", '"')
  .trim();

const request = async (url, binary = false) => {
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; BobaedreamPrototype/1.0)" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return binary ? Buffer.from(await response.arrayBuffer()) : response.text();
};

const records = [];
for (const [shopIndex, shopNo] of shopNos.entries()) {
  const pageUrl = `https://www.seoulautogallery.com/car/sangsa_detail.html?ShopNo=${shopNo}`;
  const html = await request(pageUrl);
  const items = html.match(/<div class="item">[\s\S]*?<\/div><!--\.item\s*-->/g) ?? [];
  for (const item of items) {
    const name = item.match(/<p class="txt-name">([\s\S]*?)<\/p>/)?.[1];
    const route = item.match(/EmpNo=(\d+)&ShopNo=(\d+)/);
    const photo = item.match(/photo\.korea-usedcar\.co\.kr\/dealer\/(\d+)\.JPG/i)?.[1];
    if (!name || !route || !photo) continue;
    const [, empNo, routedShopNo] = route;
    if (routedShopNo !== shopNo) continue;
    const source = `https://photo.korea-usedcar.co.kr/dealer/${photo}.JPG`;
    const file = `${shopNo}-${empNo}.jpg`;
    try {
      const bytes = await request(source, true);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      await writeFile(join(outputDir, file), bytes);
      records.push({ name: htmlEntity(name), shopNo, empNo, file, source, bytes: bytes.length, sha256, status: "downloaded" });
    } catch (error) {
      records.push({ name: htmlEntity(name), shopNo, empNo, file, source, status: "missing", error: String(error?.message ?? error) });
    }
  }
  process.stdout.write(`\r${shopIndex + 1}/${shopNos.length} shops · ${records.length} dealers`);
}

const hashFrequency = new Map();
for (const record of records) {
  if (!record.sha256) continue;
  hashFrequency.set(record.sha256, (hashFrequency.get(record.sha256) ?? 0) + 1);
}
const repeatedHashes = [...hashFrequency.entries()].filter(([, count]) => count >= 3).map(([sha256, count]) => ({ sha256, count }));
const payload = {
  source: "https://www.seoulautogallery.com/car/sangsa_detail.html?ShopNo={shopNo}",
  photoSource: "https://photo.korea-usedcar.co.kr/dealer/{shopNo}{empNo:4}.JPG",
  fetchedAt: new Date().toISOString(),
  shops: shopNos.length,
  dealers: records.length,
  downloaded: records.filter((record) => record.status === "downloaded").length,
  missing: records.filter((record) => record.status === "missing").length,
  repeatedHashes,
  records,
};
await writeFile(join(outputDir, "index.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`\nSaved ${payload.downloaded} official photos; ${payload.missing} missing.`);
if (repeatedHashes.length) console.log(`Repeated image hashes: ${JSON.stringify(repeatedHashes)}`);
