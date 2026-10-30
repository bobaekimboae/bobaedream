// src/prototype/vehicle-catalog/index.tsx 안에서 export 되지 않은 형식·계산 함수의 사본(+ publicBase 차이 보정).
//
// 주의(넉스트 판 차이): 원본의 publicBase 는 `new URL(".", document.baseURI).pathname` 이라
// 넉스트 판(/bobaedream/nuxt/)에서 그대로 쓰면 사이트 맨 위(/bobaedream/)가 아닌 nuxt/ 아래를 가리킨다.
// 그래서 여기서는 사이트 맨 위 주소(import.meta.env.BASE_URL = globalThis.__BBM_SITE_BASE__, nuxt.config 참고)를 쓰고,
// 원본에서 export 된 publicCatalogAsset 도 같은 이유로 여기서 다시 만든다(계산은 원본과 같다).
import type { VehicleSearchRecord } from "@proto/vehicle-catalog/search.mjs";
import { daangnImportedModelImages } from "@proto/vehicle-catalog/daangn-imported-visuals.generated";
import { daangnGenerationImages, daangnModelImages } from "@proto/vehicle-catalog/daangn-drive-visuals.generated";

export type CatalogScope = "car" | "bike";
export type CatalogMake = { id: string; name: string; englishName?: string | null; logoPath?: string | null; kind?: string | null; sortOrder: number };
export type CatalogGroup = { id: string; makeId: string; makeName: string; name: string; sortOrder: number; imagePath?: string | null };
export type CatalogGeneration = { id: string; makeId: string; groupId: string; makeName: string; groupName: string; name: string; generationCode?: string | null; releaseYm?: string | null; endYm?: string | null; sortOrder: number; imagePath?: string | null };
export type BikeModel = { id: string; makeId: string; groupId: string; makeName: string; groupName: string; name: string; firstYear?: string | null; latestYear?: string | null; genre?: string | null; displacementBand?: string | null; sortOrder: number };
export type CatalogIndex = { manufacturers: CatalogMake[]; modelGroups: CatalogGroup[]; generations?: CatalogGeneration[]; models?: BikeModel[] };
export type Fuel = { id: string; generationId: string; name: string; sortOrder: number };
export type Grade = { id: string; generationId: string; fuelId: string; name: string; sortOrder: number };
export type Subgrade = { id: string; generationId: string; fuelId: string; gradeId: string; name: string; sortOrder: number };
export type CarMakeFile = { make: CatalogMake; modelGroups: CatalogGroup[]; generations: CatalogGeneration[]; fuelDrive: Fuel[]; grades: Grade[]; subgrades: Subgrade[] };
export type BikeMakeFile = { make: CatalogMake; modelGroups: CatalogGroup[]; models: BikeModel[] };
export type CatalogMakeFile = CarMakeFile | BikeMakeFile;

export const publicBase: string = import.meta.env.BASE_URL;
export const catalogBase = `${publicBase}data/vehicle-catalog`;
const ferrariSilverAsset = (path: string) => {
  if (typeof window === "undefined" || new URLSearchParams(window.location.search).get("ferrariStyle") !== "silver") return path;
  if (!path.includes("assets/quickfilter/car/ferrari-models/angle/ferrari_")) return path;
  const silverPath = path
    .replace("/ferrari-models/angle/", "/ferrari-models/angle-silver/")
    .replace(/_angle_v01\.png$/, "_angle_silver_v01.png");
  return `${silverPath}?v=ferrari-silver-v01`;
};
export const publicCatalogOriginalAsset = (path?: string | null) => {
  if (!path) return null;
  const originalPath = path
    .replace("/ferrari-models/angle-silver/", "/ferrari-models/angle/")
    .replace(/_angle_silver_v01\.png(?:\?[^#]*)?$/, "_angle_v01.png");
  return /^(?:https?:)?\/\//.test(originalPath) || originalPath.startsWith("/") ? originalPath : `${publicBase}${originalPath}`;
};
export const publicCatalogAsset = (path?: string | null) => {
  if (!path) return null;
  const variantPath = ferrariSilverAsset(path);
  return /^(?:https?:)?\/\//.test(variantPath) || variantPath.startsWith("/") ? variantPath : `${publicBase}${variantPath}`;
};
export const yearsLabel = (start?: string | null, end?: string | null) => start ? `${start.slice(0, 4)}~${end?.slice(0, 4) ?? "현재"}` : "연식 정보 없음";
export const daangnModelImage = (makeName?: string | null, modelName?: string | null) => makeName && modelName
  ? daangnModelImages[makeName]?.[modelName] ?? daangnImportedModelImages[makeName]?.[modelName] ?? null
  : null;
export const daangnGenerationImage = (generation: Pick<CatalogGeneration, "id" | "makeName" | "groupName">) => daangnGenerationImages[generation.id]
  ?? daangnModelImage(generation.makeName, generation.groupName);
export const daangnRecordImage = (record: VehicleSearchRecord) => daangnGenerationImages[record.pathIds[2] ?? ""]
  ?? daangnModelImage(record.path[0], record.path[1]);

export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${catalogBase}/${path}`);
  if (!response.ok) throw new Error(`차량 기준표를 불러오지 못했습니다 (${response.status})`);
  return response.json() as Promise<T>;
}
