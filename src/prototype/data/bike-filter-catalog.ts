import catalog from "./bike-filter-catalog.json";

export type BikeModel = {
  name: string;
  capacity: number | null;
  fuel: string | null;
  genre: string | null;
  year: number | null;
  power: number | null;
  weight: number | null;
  seatHeight: number | null;
  price: number | null;
  searchCount: number;
  id: string;
};

export const bikeFilterCatalog = catalog;
export const bikeBrandNames = catalog.brands.map((item) => item.name);
export const bikeTopBrands = catalog.top10;
export const bikeBrandCount = Object.fromEntries(catalog.brands.map((item) => [item.name, item.count])) as Record<string, number>;
export const bikeModelsByMaker = Object.fromEntries(
  Object.entries(catalog.modelsByBrand).map(([maker, models]) => [maker, (models as BikeModel[]).map((model) => model.name)]),
) as Record<string, string[]>;
export const bikeModelByMakerAndName = Object.fromEntries(
  Object.entries(catalog.modelsByBrand).map(([maker, models]) => [maker, Object.fromEntries((models as BikeModel[]).map((model) => [model.name, model]))]),
) as Record<string, Record<string, BikeModel>>;
