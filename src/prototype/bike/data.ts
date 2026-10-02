import { bikeScenarioV04 } from "./scenario-v04";

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
};

export const bikeInventory: BikeInventoryRow[] = bikeScenarioV04.map((row) => ({
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
}));
