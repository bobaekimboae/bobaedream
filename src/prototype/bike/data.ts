import { bikeScenarioV07 } from "./scenario-v07";
import { bikeScenarioV08 } from "./scenario-v08";

export type BikeInventoryRow = {
  id: string;
  imageFile: string;
  title: string;
  maker: string;
  model: string;
  year: number;
  mileage: number;
  displacement: number;
  genre: string;
  licenseClass: string;
  fuel: string;
  transmission: string;
  region: string;
  price: number;
  sellerType: string;
  condition: string;
  certified: string;
  delivery: string;
  quickfilterTags: readonly string[];
  isVirtual: boolean;
  sourceManifestVersion: string;
  scenarioVersion: string;
  sellerName: string;
  sellerAddress: string;
  sellerContact: string;
  sellerIntro: string;
  businessHours: string;
  imageGrade: string;
  imageNote: string;
  imageAction: string;
  /** v08 시트 매물만: 서류 상태 · 판매자 기재 상태 · 튜닝 · 정비 요약 · 게시 후 지난 일수 */
  documents?: string;
  conditionSummary?: string;
  tuningSummary?: string;
  maintenanceSummary?: string;
  postedDays?: number;
};

// 2026-10-08: 바이크 목록 = 사용자 지시 매물 bike-001(할리 포티에잇) + 시트 v08 50대. v07의 나머지 가상 29대는 목록에서 뺀다
const bikeScenario = [bikeScenarioV07[0], ...bikeScenarioV08];

export const bikeInventory: BikeInventoryRow[] = bikeScenario.map((row) => ({
  id: row.scenario_id,
  imageFile: row.image_file,
  title: row.title,
  maker: row.brand,
  model: row.model,
  year: row.year,
  mileage: row.mileage_km,
  displacement: row.displacement_cc,
  genre: row.genre,
  licenseClass: row.license_class,
  fuel: row.fuel,
  transmission: row.transmission,
  region: row.region,
  price: row.price_krw,
  sellerType: row.seller_type,
  condition: row.condition,
  certified: row.certified,
  delivery: row.delivery,
  quickfilterTags: row.quickfilter_tags,
  isVirtual: row.is_virtual,
  sourceManifestVersion: row.source_manifest_version,
  scenarioVersion: row.scenario_version,
  sellerName: row.seller_name,
  sellerAddress: row.seller_address,
  sellerContact: row.seller_contact,
  sellerIntro: row.seller_intro,
  businessHours: row.business_hours,
  imageGrade: row.image_grade,
  imageNote: row.image_note,
  imageAction: row.image_action,
  ...("sheet_row" in row ? { documents: row.documents, conditionSummary: row.condition_summary, tuningSummary: row.tuning_summary, maintenanceSummary: row.maintenance_summary, postedDays: row.posted_days } : {}),
}));

export const bikeListingModelsByMaker = bikeInventory.reduce<Record<string, string[]>>((result, row) => {
  const models = result[row.maker] ?? [];
  if (!models.includes(row.model)) models.push(row.model);
  result[row.maker] = models;
  return result;
}, {});

export const bikeListingModelVisualsByMaker = bikeInventory.reduce<Record<string, Record<string, { image: string; bodyFit: "height"; count: string; bodyType?: undefined; isEV: false }>>>((result, row) => {
  const maker = result[row.maker] ?? {};
  const current = maker[row.model];
  const count = current ? Number(current.count.replace(/[^0-9]/g, "")) + 1 : 1;
  maker[row.model] = {
    image: current?.image ?? `${import.meta.env.BASE_URL}assets/bike/listings/${row.imageFile}`,
    bodyFit: "height",
    count: `${count}대`,
    isEV: false,
  };
  result[row.maker] = maker;
  return result;
}, {});
