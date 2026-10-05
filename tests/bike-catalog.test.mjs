import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = JSON.parse(readFileSync("data/bike-catalog-1005/bike-catalog.normalized.json", "utf8"));
const catalogText = readFileSync("public/data/bike-catalog-1005/catalog.json", "utf8");
const catalog = JSON.parse(catalogText);
const expected = {
  manufacturers: 86,
  visibleManufacturers: 65,
  hiddenManufacturers: 21,
  modelGroups: 973,
  actualModelGroups: 920,
  implicitModelGroups: 53,
  models: 2_910,
  danawaPcodes: 135,
  reviewRequiredModels: 278,
};

function flattenCatalog() {
  const manufacturers = catalog.manufacturers;
  const groups = manufacturers.flatMap((make) => make.modelGroups);
  const models = groups.flatMap((group) => group.models);
  return { manufacturers, groups, models };
}

function findPath(makeName, groupName, modelName) {
  const make = catalog.manufacturers.find((item) => item.sourceName === makeName);
  const group = make?.modelGroups.find((item) => item.sourceName === groupName || (groupName === "(그룹 없음)" && item.isImplicit));
  const model = group?.models.find((item) => item.sourceName === modelName);
  return { make, group, model };
}

test("바이크 공통 원천과 공개 catalog는 확정 건수를 보존한다", () => {
  assert.deepEqual(source.meta.counts, expected);
  const { danawaPcodes: _privatePcodeCount, ...publicExpected } = expected;
  assert.deepEqual(catalog.meta.counts, { ...publicExpected, danawaPcodeCount: 135 });
  const { manufacturers, groups, models } = flattenCatalog();
  assert.equal(manufacturers.length, 86);
  assert.equal(manufacturers.filter((item) => item.isVisible).length, 65);
  assert.equal(manufacturers.filter((item) => !item.isVisible).length, 21);
  assert.equal(groups.length, 973);
  assert.equal(groups.filter((item) => item.isImplicit).length, 53);
  assert.equal(groups.filter((item) => !item.isImplicit).length, 920);
  assert.equal(models.length, 2_910);
});

test("원본 3개 파일의 SHA-256과 출처 메타데이터를 고정한다", () => {
  const hashes = Object.fromEntries(source.meta.sourceFiles.map((item) => [item.name, item.sha256]));
  for (const fileName of ["bike_catalog_1005.json", "bike_makers_v2_1005.csv", "bike_models_v2_1005.csv"]) {
    const actual = createHash("sha256").update(readFileSync(`data/bike-catalog-1005/${fileName}`)).digest("hex");
    assert.equal(hashes[fileName], actual, fileName);
  }
  assert.equal(source.meta.vehicleScope, "BIKE");
  assert.equal(source.meta.sourceSystem, "BB_BIKE");
  assert.deepEqual(source.meta.sources, [
    { name: "라이트바겐", snapshotDate: "2026-05-27" },
    { name: "네이버 바이크", period: "2012~2021" },
    { name: "다나와", snapshotDate: "2026-10-05" },
  ]);
});

test("공개 catalog에는 원천 추적 필드를 노출하지 않는다", () => {
  assert.doesNotMatch(catalogText, /sourceCode|reitwagenId|naverUrl|danawaPcodes/);
  assert.ok(source.models.some((item) => item.reitwagenId));
  assert.ok(source.models.some((item) => item.naverUrl));
  assert.equal(new Set(source.models.flatMap((item) => item.danawaPcodes)).size, 135);
});

test("그룹 미사용 제조사는 모델이 있을 때 implicit 그룹 하나를 사용한다", () => {
  const noGroupMakes = source.manufacturers.filter((item) => !item.usesGroups);
  const makesWithModels = noGroupMakes.filter((make) => source.models.some((model) => model.makeKey === make.key));
  assert.equal(makesWithModels.length, 53);
  for (const make of makesWithModels) {
    const groups = source.modelGroups.filter((group) => group.makeKey === make.key);
    assert.equal(groups.length, 1, make.sourceName);
    assert.equal(groups[0].isImplicit, true, make.sourceName);
  }
});

test("숨김 제조사의 하위 노드는 모두 숨김이며 검수 사유는 원문을 포함한다", () => {
  const hiddenMakeKeys = new Set(source.manufacturers.filter((item) => !item.isVisible).map((item) => item.key));
  const hiddenGroupKeys = new Set(source.modelGroups.filter((item) => hiddenMakeKeys.has(item.makeKey)).map((item) => item.key));
  assert.ok(source.modelGroups.filter((item) => hiddenMakeKeys.has(item.makeKey)).every((item) => !item.isVisible));
  assert.ok(source.models.filter((item) => hiddenGroupKeys.has(item.parentModelKey)).every((item) => !item.isVisible));
  const review = source.models.filter((item) => item.reviewStatus === "REVIEW_REQUIRED");
  assert.equal(review.length, 278);
  assert.ok(review.every((item) => item.reviewReason && (item.reviewReason.includes("유사 후보") || item.reviewReason.includes("다나와만"))));
});

test("제조사 정렬과 클로드 마스터 지정 5개 경로를 검증한다", () => {
  const expectedFirstTen = ["혼다", "야마하", "BMW", "스즈키", "할리데이비슨", "가와사키", "SYM", "베스파", "로얄엔필드", "두카티"];
  assert.deepEqual(catalog.manufacturers.slice(0, 10).map((item) => item.sourceName), expectedFirstTen);
  assert.equal(catalog.manufacturers.at(-1).sourceName, "기타 제조사");

  const paths = [
    ["혼다", "PCX", "PCX 125"],
    ["KR모터스(효성)", "아퀼라", "아퀼라 300 S"],
    ["디앤에이모터스(대림)", "씨티베스트", "씨티베스트"],
    ["카요", "(그룹 없음)", "AU180"],
    ["BMW", "R 시리즈", "R nine T"],
  ];
  for (const path of paths) {
    const found = findPath(...path);
    assert.ok(found.make && found.group && found.model, path.join(" › "));
  }
  const pcx = source.models.find((item) => item.sourceName === "PCX 125" && item.sourceCode === "BKM001-0001");
  assert.deepEqual([pcx.yearMin, pcx.yearMax, pcx.danawaPcodes.length], [2009, 2026, 5]);
});

test("키와 원본 코드는 바이크 네임스페이스 규칙을 따른다", () => {
  assert.ok(source.manufacturers.every((item) => item.key.startsWith("make_bike_") && /^BKM\d{3}$/.test(item.sourceCode)));
  assert.ok(source.modelGroups.every((item) => item.key.startsWith("model_bike_group_") && /^BKM\d{3}-G\d{3}$/.test(item.sourceCode)));
  assert.ok(source.models.every((item) => item.key.startsWith("model_bike_") && /^BKM\d{3}-\d{4}$/.test(item.sourceCode)));
});
