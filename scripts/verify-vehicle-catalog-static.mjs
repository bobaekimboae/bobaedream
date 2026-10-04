import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(process.env.VEHICLE_CATALOG_OUTPUT || "public/data/vehicle-catalog");
const parse = async (name) => JSON.parse(await readFile(join(root, name), "utf8"));
const fail = (message) => { throw new Error(message); };
const same = (label, actual, expected) => { if (actual !== expected) fail(`${label}: 예상 ${expected}, 실제 ${actual}`); };

const [manifest, cars, search, bikes] = await Promise.all([
  parse("manifest-v1.json"),
  parse("cars-index-v1.json"),
  parse("cars-search-v1.json"),
  parse("bikes-index-v1.json"),
]);

same("원본 제조사", manifest.cars.sourceCounts.manufacturers, 63);
same("원본 모델그룹", manifest.cars.sourceCounts.modelGroups, 663);
same("원본 세대", manifest.cars.sourceCounts.generations, 1_256);
same("원본 연료·구동", manifest.cars.sourceCounts.fuelDrive, 2_160);
same("원본 등급", manifest.cars.sourceCounts.grades, 5_978);
same("원본 세부등급", manifest.cars.sourceCounts.subgrades, 3_297);
same("공개 제조사", cars.manufacturers.length, 62);
same("공개 모델그룹", cars.modelGroups.length, 662);
same("공개 세대", cars.generations.length, 1_255);
same("검색 레코드", search.records.length, 13_412);
same("공개 바이크 제조사", bikes.manufacturers.length, 63);
same("공개 바이크 모델", bikes.models.length, 2_811);

if (JSON.stringify({ cars, search, bikes }).includes("지리")) fail("숨김 제조사 지리가 공개 JSON에 포함됨");
for (const [directory, expected] of [["cars", 62], ["bikes", 63]]) {
  same(`${directory} 제조사별 파일`, (await readdir(join(root, directory))).filter((name) => name.endsWith(".json")).length, expected);
}

const generationIds = new Set(cars.generations.map((row) => row.id));
const groupIds = new Set(cars.modelGroups.map((row) => row.id));
const makeIds = new Set(cars.manufacturers.map((row) => row.id));
if (cars.modelGroups.some((row) => !makeIds.has(row.makeId))) fail("부모 제조사가 없는 모델그룹 존재");
if (cars.generations.some((row) => !makeIds.has(row.makeId) || !groupIds.has(row.groupId))) fail("부모가 없는 세대 존재");

const carFiles = (await readdir(join(root, "cars"))).filter((name) => name.endsWith(".json"));
const totals = { fuelDrive: 0, grades: 0, subgrades: 0 };
for (const file of carFiles) {
  const payload = JSON.parse(await readFile(join(root, "cars", file), "utf8"));
  totals.fuelDrive += payload.fuelDrive.length;
  totals.grades += payload.grades.length;
  totals.subgrades += payload.subgrades.length;
  if (payload.fuelDrive.some((row) => !generationIds.has(row.generationId))) fail(`${file}: 부모가 없는 연료·구동`);
}
same("공개 연료·구동", totals.fuelDrive, 2_159);
same("공개 등급", totals.grades, 5_977);
same("공개 세부등급", totals.subgrades, 3_297);

const forbiddenPatterns = [
  /"encarCode"/u,
  /"encarImagePath"/u,
  /"listingCount"/u,
  /"priceMin"/u,
  /"priceMax"/u,
  /"newCarPrice"/u,
  /"lightwagenId"/u,
  /https?:\/\//u,
  /autoimg\.cn/u,
  /carsdata\/cars/u,
];
const publicFiles = ["manifest-v1.json", "cars-index-v1.json", "cars-search-v1.json", "bikes-index-v1.json", ...carFiles.map((file) => `cars/${file}`), ...(await readdir(join(root, "bikes"))).filter((name) => name.endsWith(".json")).map((file) => `bikes/${file}`)];
for (const file of publicFiles) {
  const text = await readFile(join(root, file), "utf8");
  const pattern = forbiddenPatterns.find((candidate) => candidate.test(text));
  if (pattern) fail(`${file}: 공개 금지 값 검출 ${pattern}`);
}

const sizes = Object.fromEntries(await Promise.all(["cars-index-v1.json", "cars-search-v1.json", "bikes-index-v1.json"].map(async (file) => [file, (await stat(join(root, file))).size])));
process.stdout.write(`${JSON.stringify({ status: "PASS", totals, sizes }, null, 2)}\n`);
