import { bikeScenarioV07 } from "./scenario-v07";
import { bikeScenarioV08 } from "./scenario-v08";
import { bikeScenarioV11 } from "./scenario-v11";

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

// 2026-10-10: + 시트 v11 500대. 2026-10-08: 바이크 목록 = 사용자 지시 매물 bike-001(할리 포티에잇) + 시트 v08 50대. v07의 나머지 가상 29대는 목록에서 뺀다
const bikeScenario = [bikeScenarioV07[0], ...bikeScenarioV08, ...bikeScenarioV11];

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

type BikeModelVisual = { image: string; bodyFit: "width" | "height"; count: string; bodyType?: undefined; isEV: false };

const bikeInventoryModelVisualsByMaker = bikeInventory.reduce<Record<string, Record<string, BikeModelVisual>>>((result, row) => {
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

const bmwGeneratedModelVisuals: Record<string, BikeModelVisual> = {
  "S 1000 RR": { image: `${import.meta.env.BASE_URL}assets/bike/models/bmw/BMW-8451-s1000rr-autoscout-side-v01.png`, bodyFit: "width", count: bikeInventoryModelVisualsByMaker.BMW?.["S 1000 RR"]?.count ?? "0대", isEV: false },
  "G 310 R": { image: `${import.meta.env.BASE_URL}assets/bike/models/bmw/BMW-8371-g310r-autoscout-side-v01.png`, bodyFit: "width", count: bikeInventoryModelVisualsByMaker.BMW?.["G 310 R"]?.count ?? "0대", isEV: false },
  "S 1000 R": { image: `${import.meta.env.BASE_URL}assets/bike/models/bmw/BMW-8450-s1000r-autoscout-side-v01.png`, bodyFit: "width", count: bikeInventoryModelVisualsByMaker.BMW?.["S 1000 R"]?.count ?? "0대", isEV: false },
  "G 310 GS": { image: `${import.meta.env.BASE_URL}assets/bike/models/bmw/BMW-8370-g310gs-autoscout-side-v01.png`, bodyFit: "width", count: bikeInventoryModelVisualsByMaker.BMW?.["G 310 GS"]?.count ?? "0대", isEV: false },
  "R nine T": { image: `${import.meta.env.BASE_URL}assets/bike/models/bmw/BMW-13033-rninet-autoscout-side-v01.png`, bodyFit: "width", count: bikeInventoryModelVisualsByMaker.BMW?.["R nine T"]?.count ?? "0대", isEV: false },
  "C 400 GT": { image: `${import.meta.env.BASE_URL}assets/bike/models/bmw/BMW-8347-c400gt-autoscout-side-v01.png`, bodyFit: "width", count: bikeInventoryModelVisualsByMaker.BMW?.["C 400 GT"]?.count ?? "0대", isEV: false },
  "F 900 XR": { image: `${import.meta.env.BASE_URL}assets/bike/models/bmw/BMW-8369-f900xr-autoscout-side-v01.png`, bodyFit: "width", count: bikeInventoryModelVisualsByMaker.BMW?.["F 900 XR"]?.count ?? "0대", isEV: false },
  "F 900 R": { image: `${import.meta.env.BASE_URL}assets/bike/models/bmw/BMW-10886-f900r-autoscout-side-v01.png`, bodyFit: "width", count: bikeInventoryModelVisualsByMaker.BMW?.["F 900 R"]?.count ?? "0대", isEV: false },
  "R 18": { image: `${import.meta.env.BASE_URL}assets/bike/models/bmw/BMW-8433-r18-autoscout-side-v01.png`, bodyFit: "width", count: bikeInventoryModelVisualsByMaker.BMW?.["R 18"]?.count ?? "0대", isEV: false },
  "S 1000 XR": { image: `${import.meta.env.BASE_URL}assets/bike/models/bmw/BMW-8452-s1000xr-autoscout-side-v01.png`, bodyFit: "width", count: bikeInventoryModelVisualsByMaker.BMW?.["S 1000 XR"]?.count ?? "0대", isEV: false },
};

export const bikeListingModelVisualsByMaker: Record<string, Record<string, BikeModelVisual>> = {
  ...bikeInventoryModelVisualsByMaker,
  BMW: {
    ...(bikeInventoryModelVisualsByMaker.BMW ?? {}),
    ...bmwGeneratedModelVisuals,
  },
};
