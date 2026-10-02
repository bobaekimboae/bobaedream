import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const scenarioPath = join(root, "docs", "bike", "bike_listing_scenario_v07.csv");
const imageDir = join(root, "public", "assets", "bike", "listings");
const outputPath = join(root, "src", "prototype", "bike", "scenario-v07.ts");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [headers, ...values] = rows.filter((entry) => entry.some(Boolean));
  return values.map((entry) => Object.fromEntries(headers.map((header, index) => [header, entry[index] ?? ""])));
}

const scenarioRows = parseCsv(readFileSync(scenarioPath, "utf8"));
const scenarioIds = new Set(scenarioRows.map((row) => row.scenario_id));
const imageFiles = new Set(scenarioRows.map((row) => row.image_file));

if (scenarioRows.length !== 30 || scenarioIds.size !== 30 || imageFiles.size !== 30) {
  throw new Error(`v07 rows/keys invalid: rows=${scenarioRows.length}, ids=${scenarioIds.size}, images=${imageFiles.size}`);
}

for (const row of scenarioRows) {
  if (row.scenario_version !== "v07") throw new Error(`Unexpected scenario version: ${row.scenario_id}`);
  if (row.is_virtual !== "true") throw new Error(`Non-virtual seller row: ${row.scenario_id}`);
  if (!existsSync(join(imageDir, row.image_file))) throw new Error(`Missing image: ${row.image_file}`);
}

const rows = scenarioRows.map((row) => ({
  scenario_id: row.scenario_id,
  image_file: row.image_file,
  title: row.title,
  brand: row.brand,
  model: row.model,
  year: Number(row.year),
  mileage_km: Number(row.mileage_km),
  displacement_cc: Number(row.displacement_cc),
  genre: row.genre,
  license_class: row.license_class,
  fuel: row.fuel,
  transmission: row.transmission,
  region: row.region,
  price_krw: Number(row.price_krw),
  seller_type: row.seller_type,
  condition: row.condition,
  certified: row.certified,
  delivery: row.delivery,
  quickfilter_tags: row.quickfilter_tags.split("|"),
  is_virtual: row.is_virtual === "true",
  source_manifest_version: row.source_manifest_version,
  scenario_version: row.scenario_version,
  seller_name: row.seller_name,
  seller_address: row.seller_address,
  seller_contact: row.seller_contact,
  seller_intro: row.seller_intro,
  business_hours: row.business_hours,
  image_grade: row.image_grade,
  image_note: row.image_note,
  image_action: row.image_action,
}));

const output = `export type BikeScenarioV07Row = {
  scenario_id: string;
  image_file: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage_km: number;
  displacement_cc: number;
  genre: string;
  license_class: string;
  fuel: string;
  transmission: string;
  region: string;
  price_krw: number;
  seller_type: string;
  condition: string;
  certified: string;
  delivery: string;
  quickfilter_tags: readonly string[];
  is_virtual: boolean;
  source_manifest_version: string;
  scenario_version: string;
  seller_name: string;
  seller_address: string;
  seller_contact: string;
  seller_intro: string;
  business_hours: string;
  image_grade: string;
  image_note: string;
  image_action: string;
};

export const bikeScenarioV07 = ${JSON.stringify(rows, null, 2)} as const satisfies readonly BikeScenarioV07Row[];
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, output, "utf8");
console.log(`Verified and generated ${rows.length} bike listings from v07.`);
