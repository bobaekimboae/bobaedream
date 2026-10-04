import { readFile } from "node:fs/promises";
import { searchVehicleCatalog } from "../src/prototype/vehicle-catalog/search.mjs";

const cars = JSON.parse(await readFile("public/data/vehicle-catalog/cars-search-v1.json", "utf8")).records;
const bikes = JSON.parse(await readFile("public/data/vehicle-catalog/bikes-search-v1.json", "utf8")).records;

const cases = [
  [cars, "bmw", ["BMW"]],
  [cars, "비엠", ["BMW"]],
  [cars, "bmw 5", ["BMW", "5시리즈"]],
  [cars, "5시리즈", ["BMW", "5시리즈"]],
  [cars, "5series", ["BMW", "5시리즈"]],
  [cars, "5 series", ["BMW", "5시리즈"]],
  [cars, "G60", ["BMW", "5시리즈", "5시리즈 (G60)"]],
  [cars, "g30", ["BMW", "5시리즈", "5시리즈 (G30)"]],
  [cars, "520d", ["BMW", "5시리즈", "520d"]],
  [cars, "520i m스포츠", ["BMW", "5시리즈", "5시리즈 (G60)", "520i M 스포츠"]],
  [cars, "530i xdrive", ["BMW", "5시리즈", "5시리즈 (G60)", "530i xDrive M 스포츠"]],
  [cars, "x5", ["BMW", "X5"]],
  [cars, "G05", ["BMW", "X5", "X5 (G05)"]],
  [cars, "3시리즈 g20", ["BMW", "3시리즈", "3시리즈 (G20)"]],
  [cars, "ㄱㄹㅈ", ["현대", "그랜저"]],
  [cars, "GN7", ["현대", "그랜저", "GN7"]],
  [cars, "아반떼 N", ["현대", "아반떼", "2.0 N"]],
  [cars, "E클래스", ["벤츠", "E-클래스"]],
  [cars, "e-클래스", ["벤츠", "E-클래스"]],
  [cars, "W214", ["벤츠", "E-클래스", "W214"]],
  [cars, "MQ4", ["기아", "쏘렌토", "4세대"]],
  [cars, "쌍용", ["KG모빌리티(쌍용)"]],
  [cars, "토레스", ["KG모빌리티(쌍용)", "토레스"]],
  [cars, "포르쉐 911", ["포르쉐", "911"]],
  [bikes, "pcx", ["혼다", "PCX"]],
  [bikes, "골드윙", ["혼다", "골드윙"]],
];

const failures = [];
const results = [];
for (const [records, query, expected] of cases) {
  const first = searchVehicleCatalog(records, query, 1)[0];
  const path = first?.path.join(" › ") ?? "";
  const pass = expected.every((value) => path.includes(value));
  results.push({ query, first: path, pass });
  if (!pass) failures.push({ query, expected, actual: path });
}

process.stdout.write(`${JSON.stringify({ status: failures.length ? "FAIL" : "PASS", results, failures }, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
