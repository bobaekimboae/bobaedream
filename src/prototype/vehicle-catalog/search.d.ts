export type VehicleSearchType = "MAKE" | "MODEL_GROUP" | "GENERATION" | "FUEL_DRIVE" | "GRADE" | "SUBGRADE" | "BIKE_MODEL";
export type VehicleSearchRecord = {
  id: string;
  type: VehicleSearchType;
  name: string;
  path: string[];
  pathIds: string[];
  englishName?: string | null;
  generationCode?: string | null;
  logoPath?: string | null;
  releaseYm?: string | null;
  endYm?: string | null;
  imagePath?: string | null;
};
export function normalizeVehicleSearch(value: unknown): string;
export function choseongOf(value: unknown): string;
export function searchVehicleCatalog(records: VehicleSearchRecord[], query: string, limit?: number): VehicleSearchRecord[];
