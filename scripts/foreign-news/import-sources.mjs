import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { languageForCountry, normalizeUrl, parseCsv, sha1 } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outputPath = path.join(root, "data", "foreign-news", "sources.json");
const sheetUrl = process.env.FOREIGN_NEWS_SHEET_CSV || "https://docs.google.com/spreadsheets/d/1hShhSU2q9CWDK3RSugXpJA6UruWGdBOGKn91MpScaTQ/export?format=csv&gid=948762535";

const response = await fetch(sheetUrl, { redirect: "follow" });
if (!response.ok) throw new Error(`source sheet download failed: ${response.status}`);
const rows = parseCsv(await response.text());
const candidates = rows.slice(2).filter((row) => String(row[12] || "").trim() === "자동차뉴스/웹진")
  .filter((row) => String(row[15] || "").trim() !== "한국");

const seen = new Set();
const sources = [];
for (const row of candidates) {
  const homepageUrl = normalizeUrl(row[7]);
  if (!homepageUrl || seen.has(homepageUrl)) continue;
  seen.add(homepageUrl);
  const country = String(row[15] || "").trim();
  sources.push({
    id: `src-${sha1(homepageUrl).slice(0, 10)}`,
    nameKo: String(row[6] || "").trim(),
    nameOriginal: String(row[6] || "").trim(),
    country,
    region: String(row[14] || "").trim(),
    language: languageForCountry(country),
    homepageUrl,
    feedUrl: "",
    fetchType: "discover",
    pollSeconds: 300,
    robotsStatus: "unknown",
    termsStatus: "review",
    publishMode: "review",
    status: "pending",
    lastCheckedAt: "",
    notes: "",
  });
}

sources.sort((left, right) => left.country.localeCompare(right.country, "ko") || left.nameKo.localeCompare(right.nameKo, "ko"));
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), sheetUrl, count: sources.length, sources }, null, 2)}\n`, "utf8");
console.log(`Imported ${sources.length} unique non-Korean automotive news sources -> ${path.relative(root, outputPath)}`);
if (sources.length !== 107) throw new Error(`expected 107 sources, received ${sources.length}`);


