import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = JSON.parse(readFileSync("data/encar-car-depth-1005/encar-car-depth.normalized.json", "utf8"));
const catalogText = readFileSync("public/data/encar-car-depth-1005/catalog.json", "utf8");
const catalog = JSON.parse(catalogText);
const expected = { manufacturers: 63, modelGroups: 663, generations: 1_256, fuelDrives: 2_158, grades: 5_976, subgrades: 3_297 };

function countsFromCatalog() {
  const counts = { manufacturers: 0, modelGroups: 0, generations: 0, fuelDrives: 0, grades: 0, subgrades: 0 };
  for (const make of catalog.manufacturers) {
    counts.manufacturers += 1;
    for (const model of make.modelGroups) {
      counts.modelGroups += 1;
      for (const generation of model.generations) {
        counts.generations += 1;
        for (const fuelDrive of generation.fuelDrives) {
          counts.fuelDrives += 1;
          for (const grade of fuelDrive.grades) {
            counts.grades += 1;
            counts.subgrades += grade.subgrades.length;
          }
        }
      }
    }
  }
  return counts;
}

function findPath(names) {
  const [makeName, modelName, generationName, fuelName, gradeName, subgradeName] = names;
  const make = catalog.manufacturers.find((row) => row.sourceName === makeName);
  const model = make?.modelGroups.find((row) => row.sourceName === modelName);
  const generation = model?.generations.find((row) => row.sourceName === generationName);
  const fuel = fuelName ? generation?.fuelDrives.find((row) => row.sourceName === fuelName) : null;
  const grade = gradeName ? fuel?.grades.find((row) => row.sourceName === gradeName) : null;
  const subgrade = subgradeName ? grade?.subgrades.find((row) => row.sourceName === subgradeName) : null;
  return { make, model, generation, fuel, grade, subgrade };
}

test("공통 시드 원천과 시안 catalog는 확정 건수를 보존한다", () => {
  assert.deepEqual(source.meta.counts, expected);
  assert.deepEqual(catalog.meta.counts, expected);
  assert.deepEqual(countsFromCatalog(), expected);
});

test("Catalog 원본의 추가 2건씩은 이름이 빈 선택 불가 행으로 기록한다", () => {
  assert.equal(source.meta.rawCounts.catalogFuelDriveRows, 2_160);
  assert.equal(source.meta.rawCounts.catalogGradeRows, 5_978);
  assert.equal(source.meta.exclusions.fuelDrives.length, 2);
  assert.equal(source.meta.exclusions.grades.length, 2);
  assert.deepEqual(source.meta.exclusions.fuelDrives.map((row) => row.path.slice(0, 3)), [
    ["쉐보레", "기타", "기타"],
    ["기타 수입차", "기타", "기타"],
  ]);
  assert.ok(source.meta.exclusions.fuelDrives.every((row) => row.path.at(-1) === ""));
  assert.ok(source.meta.exclusions.grades.every((row) => row.path.at(-1) === ""));
});

test("시안 JSON에는 엔카 이미지 경로와 엔카 코드가 없다", () => {
  assert.doesNotMatch(catalogText, /encarImagePath|sourceCode|\/carpicture\//i);
});

test("지리와 하위 경로는 데이터에 남고 노출만 숨긴다", () => {
  const geely = catalog.manufacturers.find((row) => row.sourceName === "지리");
  assert.ok(geely);
  assert.equal(geely.isVisible, false);
  assert.ok(geely.modelGroups.every((model) => model.isVisible === false));
  assert.ok(geely.modelGroups.flatMap((model) => model.generations).every((generation) => generation.isVisible === false));
});

test("현대 모델그룹 40개에만 바디타입을 넣는다", () => {
  const rows = catalog.manufacturers.flatMap((make) => make.modelGroups.map((model) => ({ make: make.sourceName, bodyType: model.bodyType })));
  assert.equal(rows.filter((row) => row.bodyType).length, 40);
  assert.ok(rows.filter((row) => row.bodyType).every((row) => row.make === "현대"));
});

test("엔카 원문 가장자리 공백은 sourceName에 보존하고 화면 이름만 정리한다", () => {
  const byd = catalog.manufacturers.find((row) => row.displayName === "BYD");
  const fiat = catalog.manufacturers.find((row) => row.displayName === "피아트");
  const sealion = byd.modelGroups.find((row) => row.displayName === "씨라이언 7");
  const ducato = fiat.modelGroups.find((row) => row.displayName === "두카토");
  assert.equal(sealion.sourceName, "씨라이언 7 ");
  assert.equal(ducato.sourceName, " 두카토");
});

test("빈 엔카 코드는 null이고 빈 정렬값 7개는 부모 단계의 마지막 순서로 배정한다", () => {
  for (const collection of ["manufacturers", "modelGroups", "generations", "fuelDrives", "grades", "subgrades"]) {
    assert.ok(source[collection].every((row) => row.sourceCode !== ""), collection);
  }

  const vwId4 = findPath(["폭스바겐", "ID.4", "ID.4", "전기 2WD", "프로"]);
  const vwId5 = findPath(["폭스바겐", "ID.5", "ID.5", "전기 2WD", "프로"]);
  assert.equal(vwId4.generation.sortOrder, 1);
  assert.equal(vwId4.grade.sortOrder, 1);
  assert.equal(vwId5.generation.sortOrder, 1);
  assert.equal(vwId5.grade.sortOrder, 1);

  const renaultGrades = ["RE", "SE", "SE 플러스"].map((gradeName) => (
    findPath(["르노코리아(삼성)", "SM3", "SM3 Z.E.", "전기", gradeName]).grade
  ));
  assert.deepEqual(renaultGrades.map((row) => row.sortOrder), [1, 2, 3]);

  const nullCodeGenerations = source.generations.filter((row) => row.sourceCode === null);
  const nullCodeGrades = source.grades.filter((row) => row.sourceCode === null);
  assert.equal(nullCodeGenerations.length, 2);
  assert.equal(nullCodeGrades.length, 5);
});

test("클로드 마스터 지정 샘플 5개 경로가 원문 그대로 존재한다", () => {
  const paths = [
    ["현대", "그랜저", "그랜저 (GN7)", "가솔린 2WD", "2.5 가솔린 2WD", "프리미엄"],
    ["BMW", "5시리즈", "5시리즈 (G30)"],
    ["벤츠", "E-클래스", "E-클래스 W213"],
    ["기아", "쏘렌토", "쏘렌토 4세대"],
    ["포르쉐", "911", "911 (992)"],
  ];
  for (const path of paths) {
    const found = findPath(path);
    assert.ok(found.make && found.model && found.generation, path.join(" › "));
    if (path[3]) assert.ok(found.fuel, path.join(" › "));
    if (path[4]) assert.ok(found.grade, path.join(" › "));
    if (path[5]) assert.ok(found.subgrade, path.join(" › "));
  }
});
