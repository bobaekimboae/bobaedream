import { bikeScenarioV07 } from "./scenario-v07";

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
};

export const bikeInventory: BikeInventoryRow[] = bikeScenarioV07.map((row) => ({
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
