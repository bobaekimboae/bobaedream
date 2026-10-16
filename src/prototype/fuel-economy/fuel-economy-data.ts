export type EnergyType = "ice" | "hybrid" | "ev" | "phev";

export type EnergyModel = {
  id: string;
  brand: string;
  model: string;
  trim: string;
  type: EnergyType;
  logo: string;
  photoKey: string;
};

export const energyModels: EnergyModel[] = [
  { id: "bmw-m3", brand: "BMW", model: "M3", trim: "2023 M3 xDrive 컴페티션 M", type: "ice", logo: "bmw.png", photoKey: "sag-01" },
  { id: "porsche-taycan", brand: "포르쉐", model: "타이칸", trim: "2023 EV", type: "ev", logo: "porsche.png", photoKey: "sag-02" },
  { id: "lamborghini-urus-phev", brand: "람보르기니", model: "우루스 SE", trim: "2025 플러그인 하이브리드", type: "phev", logo: "lamborghini.png", photoKey: "lamborghini_urus_phev_3003" },
  { id: "lexus-rx450h", brand: "렉서스", model: "RX", trim: "2022 RX 450h", type: "hybrid", logo: "lexus.png", photoKey: "sag-06" },
  { id: "mercedes-gls", brand: "벤츠", model: "GLS클래스", trim: "2022 GLS 580 4매틱", type: "ice", logo: "mercedes-benz.png", photoKey: "sag-03" },
];

export const energyTypeLabel: Record<EnergyType, string> = {
  ice: "내연기관",
  hybrid: "하이브리드",
  ev: "전기차",
  phev: "플러그인 하이브리드",
};

export type SavedEnergyPost = {
  id: string;
  modelId: string;
  title: string;
  body: string;
  city: string;
  odometer: string;
  fuelConsumption?: string;
  energyConsumption?: string;
  fullChargeRange?: string;
  imageData?: string;
  createdAt: string;
  author: string;
};

export const ENERGY_STORAGE_KEY = "bobae-fuel-economy-posts-v1";
