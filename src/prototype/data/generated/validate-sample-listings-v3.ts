// @ts-nocheck -- 실행용 Node 검증 스크립트이며 브라우저 tsconfig에는 Node 타입을 추가하지 않는다.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { bbmCheckOptions } from "../../filters/bbm-filter-options";
import { sampleListingsV3 } from "./sample-listings-v3";

type Row = { label: string; count: number };
const count = (values: string[], options: string[]): Row[] => options.map((label) => ({ label, count: values.filter((value) => value === label).length }));
const table = (title: string, rows: Row[]) => `\n### ${title}\n\n| 선택지 | 매물 수 |\n|---|---:|\n${rows.map((row) => `| ${row.label} | ${row.count} |`).join("\n")}\n`;
const missing: string[] = [];
const checkedTable = (title: string, rows: Row[]) => {
  rows.filter((row) => row.count === 0).forEach((row) => missing.push(`${title}: ${row.label}`));
  return table(title, rows);
};

const prices = sampleListingsV3.map((listing) => listing.budget.priceTenThousandWon);
const years = sampleListingsV3.map((listing) => listing.filter.year);
const mileages = sampleListingsV3.map((listing) => listing.filter.mileage);
const priceRows: Row[] = [
  { label: "전체", count: prices.length },
  ...Array.from({ length: 8 }, (_, index) => ({ label: `${index + 1}천만원`, count: prices.filter((value) => value >= index * 1000 && value < (index + 1) * 1000).length })),
  { label: "9천만원~", count: prices.filter((value) => value >= 9000).length },
];
const yearRows: Row[] = [
  { label: "~1년", count: years.filter((value) => value >= 2025).length },
  { label: "~2년", count: years.filter((value) => value === 2024).length },
  { label: "~3년", count: years.filter((value) => value === 2023).length },
  { label: "~4년", count: years.filter((value) => value === 2022).length },
  { label: "~5년", count: years.filter((value) => value === 2021).length },
  { label: "6년~", count: years.filter((value) => value <= 2020).length },
];
const mileageRows: Row[] = [
  { label: "~5천km", count: mileages.filter((value) => value < 5000).length },
  { label: "5천~1만km", count: mileages.filter((value) => value >= 5000 && value < 10000).length },
  { label: "1~2만km", count: mileages.filter((value) => value >= 10000 && value < 20000).length },
  { label: "2~3만km", count: mileages.filter((value) => value >= 20000 && value < 30000).length },
  { label: "3~5만km", count: mileages.filter((value) => value >= 30000 && value < 50000).length },
  { label: "5~10만km", count: mileages.filter((value) => value >= 50000 && value < 100000).length },
  { label: "10~20만km", count: mileages.filter((value) => value >= 100000 && value < 200000).length },
  { label: "20만km~", count: mileages.filter((value) => value >= 200000).length },
];

const modelCounts = sampleListingsV3.reduce<Record<string, number>>((result, listing) => {
  const key = `${listing.maker} ${listing.modelGroup}`;
  result[key] = (result[key] ?? 0) + 1;
  return result;
}, {});
let report = `# 과쯔 샘플 매물 v3 필터 검증\n\n- 총 ${sampleListingsV3.length}대 / 고유 ID ${new Set(sampleListingsV3.map((listing) => listing.id)).size}개\n- 모델 ${Object.keys(modelCounts).length}개 / 모델별 최대 ${Math.max(...Object.values(modelCounts))}대\n- 국산 ${sampleListingsV3.filter((listing) => listing.filter.origin === "국산").length}대 / 수입 ${sampleListingsV3.filter((listing) => listing.filter.origin !== "국산").length}대\n`;
report += checkedTable("바디타입", count(sampleListingsV3.map((listing) => listing.vehicle.bodyType), bbmCheckOptions.bodyType));
report += checkedTable("차급", count(sampleListingsV3.map((listing) => listing.vehicle.carClass), bbmCheckOptions.carClass));
report += checkedTable("연료", count(sampleListingsV3.map((listing) => listing.vehicle.fuel), bbmCheckOptions.fuel));
report += checkedTable("변속기", count(sampleListingsV3.map((listing) => listing.equipment.transmission), bbmCheckOptions.transmission));
report += checkedTable("외부색상", count(sampleListingsV3.map((listing) => listing.equipment.exteriorColor), bbmCheckOptions.exteriorColor));
report += checkedTable("지역", count(sampleListingsV3.map((listing) => listing.transaction.region), bbmCheckOptions.region));
report += checkedTable("가격 구간", priceRows);
report += checkedTable("연식 구간", yearRows);
report += checkedTable("주행거리 구간", mileageRows);
report += checkedTable("사고 유무", count(sampleListingsV3.map((listing) => listing.trust.accidentStatus), ["무사고", "단순교환", "사고 이력"]));
report += checkedTable("소유자 수", count(sampleListingsV3.map((listing) => listing.filter.owners), ["1인", "2인", "3인 이상"]));

const manifestPath = join(process.cwd(), "public/assets/listings/v3/manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { assets: Array<{ filename: string; color: string; size: { width: number; height: number } }> };
const manifestByFile = new Map(manifest.assets.map((asset) => [`listings/v3/${asset.filename}`, asset]));
for (const listing of sampleListingsV3) {
  const asset = manifestByFile.get(listing.image);
  if (!asset) missing.push(`manifest: ${listing.image}`);
  else if (asset.color !== listing.equipment.exteriorColor) missing.push(`사진 색상: ${listing.listingNo} ${listing.equipment.exteriorColor}/${asset.color}`);
  if (!existsSync(join(process.cwd(), "public/assets", listing.image))) missing.push(`사진 파일: ${listing.image}`);
}
if (sampleListingsV3.length !== 250) missing.push(`총 매물 수: ${sampleListingsV3.length}`);
if (new Set(sampleListingsV3.map((listing) => listing.id)).size !== sampleListingsV3.length) missing.push("중복 ID");
if (sampleListingsV3.some((listing) => listing.budget.priceTenThousandWon < 300 || listing.budget.priceTenThousandWon > 20000)) missing.push("가격 범위");
if (sampleListingsV3.some((listing) => listing.filter.year < 2012 || listing.filter.year > 2026)) missing.push("연식 범위");
if (missing.length) throw new Error(`검증 실패\n${missing.join("\n")}`);

console.log(report);
console.log("\n검증 결과: 필수 선택지 누락 0건, 데이터·사진·manifest 불일치 0건");
