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
  { id: "bmw-m3", brand: "BMW", model: "M3", trim: "2025 M3 xDrive 컴페티션 M", type: "ice", logo: "bmw.png", photoKey: "bmw-m3" },
  { id: "porsche-taycan", brand: "포르쉐", model: "타이칸", trim: "2025 Taycan 4S", type: "ev", logo: "porsche.png", photoKey: "porsche-taycan" },
  { id: "lamborghini-urus-phev", brand: "람보르기니", model: "우루스 SE", trim: "2025 플러그인 하이브리드", type: "phev", logo: "lamborghini.png", photoKey: "lamborghini-urus-phev" },
  { id: "lexus-rx450h", brand: "렉서스", model: "RX", trim: "2025 RX 450h+", type: "hybrid", logo: "lexus.png", photoKey: "lexus-rx450h" },
  { id: "mercedes-gls", brand: "벤츠", model: "GLS클래스", trim: "2025 GLS 450 4MATIC", type: "hybrid", logo: "mercedes-benz.png", photoKey: "mercedes-gls" },
  { id: "bmw-1-series", brand: "BMW", model: "1시리즈", trim: "2025 120 M Sport", type: "ice", logo: "bmw.png", photoKey: "bmw-1-series" },
  { id: "bmw-2-series", brand: "BMW", model: "2시리즈", trim: "2025 220i M Sport", type: "ice", logo: "bmw.png", photoKey: "bmw-2-series" },
  { id: "bmw-3-series", brand: "BMW", model: "3시리즈", trim: "2025 320i M Sport", type: "ice", logo: "bmw.png", photoKey: "bmw-3-series" },
  { id: "bmw-4-series", brand: "BMW", model: "4시리즈", trim: "2025 420i Coupe M Sport", type: "ice", logo: "bmw.png", photoKey: "bmw-4-series" },
  { id: "bmw-5-series", brand: "BMW", model: "5시리즈", trim: "2025 520i M Sport 48V", type: "hybrid", logo: "bmw.png", photoKey: "bmw-5-series" },
  { id: "bmw-7-series", brand: "BMW", model: "7시리즈", trim: "2025 750e xDrive", type: "phev", logo: "bmw.png", photoKey: "bmw-7-series" },
  { id: "bmw-8-series", brand: "BMW", model: "8시리즈", trim: "2025 840i xDrive Gran Coupe", type: "ice", logo: "bmw.png", photoKey: "bmw-8-series" },
  { id: "bmw-i3", brand: "BMW", model: "i3", trim: "2025 eDrive40L", type: "ev", logo: "bmw.png", photoKey: "bmw-i3" },
  { id: "bmw-i4", brand: "BMW", model: "i4", trim: "2025 eDrive40 M Sport", type: "ev", logo: "bmw.png", photoKey: "bmw-i4" },
  { id: "bmw-i5", brand: "BMW", model: "i5", trim: "2025 eDrive40 M Sport", type: "ev", logo: "bmw.png", photoKey: "bmw-i5" },
  { id: "bmw-i7", brand: "BMW", model: "i7", trim: "2025 xDrive60", type: "ev", logo: "bmw.png", photoKey: "bmw-i7" },
  { id: "bmw-ix", brand: "BMW", model: "iX", trim: "2025 xDrive50", type: "ev", logo: "bmw.png", photoKey: "bmw-ix" },
  { id: "bmw-ix1", brand: "BMW", model: "iX1", trim: "2025 xDrive30", type: "ev", logo: "bmw.png", photoKey: "bmw-ix1" },
  { id: "bmw-ix2", brand: "BMW", model: "iX2", trim: "2025 xDrive30", type: "ev", logo: "bmw.png", photoKey: "bmw-ix2" },
  { id: "bmw-ix3", brand: "BMW", model: "iX3", trim: "2025 M Sport", type: "ev", logo: "bmw.png", photoKey: "bmw-ix3" },
  { id: "bmw-m2", brand: "BMW", model: "M2", trim: "2025 M2 Coupe", type: "ice", logo: "bmw.png", photoKey: "bmw-m2" },
  { id: "bmw-m4", brand: "BMW", model: "M4", trim: "2025 M4 Competition M xDrive", type: "ice", logo: "bmw.png", photoKey: "bmw-m4" },
  { id: "bmw-m5", brand: "BMW", model: "M5", trim: "2025 M5 플러그인 하이브리드", type: "phev", logo: "bmw.png", photoKey: "bmw-m5" },
  { id: "bmw-x1", brand: "BMW", model: "X1", trim: "2025 xDrive23i 48V", type: "hybrid", logo: "bmw.png", photoKey: "bmw-x1" },
  { id: "bmw-x3", brand: "BMW", model: "X3", trim: "2025 xDrive30e", type: "phev", logo: "bmw.png", photoKey: "bmw-x3" },
  { id: "bmw-x5", brand: "BMW", model: "X5", trim: "2025 xDrive50e", type: "phev", logo: "bmw.png", photoKey: "bmw-x5" },
  { id: "bmw-x6", brand: "BMW", model: "X6", trim: "2025 xDrive40i", type: "ice", logo: "bmw.png", photoKey: "bmw-x6" },
  { id: "bmw-x7", brand: "BMW", model: "X7", trim: "2025 xDrive40i 48V", type: "hybrid", logo: "bmw.png", photoKey: "bmw-x7" },
  { id: "bmw-xm", brand: "BMW", model: "XM", trim: "2025 XM 플러그인 하이브리드", type: "phev", logo: "bmw.png", photoKey: "bmw-xm" },
  { id: "mercedes-a", brand: "벤츠", model: "A클래스", trim: "2025 A 200 48V", type: "hybrid", logo: "mercedes-benz.png", photoKey: "mercedes-a" },
  { id: "mercedes-b", brand: "벤츠", model: "B클래스", trim: "2025 B 200", type: "ice", logo: "mercedes-benz.png", photoKey: "mercedes-b" },
  { id: "mercedes-c", brand: "벤츠", model: "C클래스", trim: "2025 C 300e", type: "phev", logo: "mercedes-benz.png", photoKey: "mercedes-c" },
  { id: "mercedes-cla", brand: "벤츠", model: "CLA클래스", trim: "2025 CLA 250 4MATIC", type: "ice", logo: "mercedes-benz.png", photoKey: "mercedes-cla" },
  { id: "mercedes-cle", brand: "벤츠", model: "CLE클래스", trim: "2025 CLE 450 4MATIC 48V", type: "hybrid", logo: "mercedes-benz.png", photoKey: "mercedes-cle" },
  { id: "mercedes-cls", brand: "벤츠", model: "CLS클래스", trim: "2025 CLS 450 4MATIC", type: "ice", logo: "mercedes-benz.png", photoKey: "mercedes-cls" },
  { id: "mercedes-e", brand: "벤츠", model: "E클래스", trim: "2025 E 300e 4MATIC", type: "phev", logo: "mercedes-benz.png", photoKey: "mercedes-e" },
  { id: "mercedes-s", brand: "벤츠", model: "S클래스", trim: "2025 S 580e 4MATIC", type: "phev", logo: "mercedes-benz.png", photoKey: "mercedes-s" },
  { id: "mercedes-amg-gt", brand: "벤츠", model: "AMG GT", trim: "2025 AMG GT 63 4MATIC+", type: "ice", logo: "mercedes-benz.png", photoKey: "mercedes-amg-gt" },
  { id: "mercedes-g", brand: "벤츠", model: "G클래스", trim: "2025 G 450d 48V", type: "hybrid", logo: "mercedes-benz.png", photoKey: "mercedes-g" },
  { id: "mercedes-gla", brand: "벤츠", model: "GLA클래스", trim: "2025 GLA 250 4MATIC", type: "ice", logo: "mercedes-benz.png", photoKey: "mercedes-gla" },
  { id: "mercedes-glb", brand: "벤츠", model: "GLB클래스", trim: "2025 GLB 250 4MATIC", type: "ice", logo: "mercedes-benz.png", photoKey: "mercedes-glb" },
  { id: "mercedes-glc", brand: "벤츠", model: "GLC클래스", trim: "2025 GLC 350e 4MATIC", type: "phev", logo: "mercedes-benz.png", photoKey: "mercedes-glc" },
  { id: "mercedes-gle", brand: "벤츠", model: "GLE클래스", trim: "2025 GLE 400e 4MATIC", type: "phev", logo: "mercedes-benz.png", photoKey: "mercedes-gle" },
  { id: "mercedes-eqa", brand: "벤츠", model: "EQA", trim: "2025 EQA 250", type: "ev", logo: "mercedes-benz.png", photoKey: "mercedes-eqa" },
  { id: "mercedes-eqb", brand: "벤츠", model: "EQB", trim: "2025 EQB 300 4MATIC", type: "ev", logo: "mercedes-benz.png", photoKey: "mercedes-eqb" },
  { id: "mercedes-eqc", brand: "벤츠", model: "EQC", trim: "2025 EQC 400 4MATIC", type: "ev", logo: "mercedes-benz.png", photoKey: "mercedes-eqc" },
  { id: "mercedes-eqe", brand: "벤츠", model: "EQE", trim: "2025 EQE 350+", type: "ev", logo: "mercedes-benz.png", photoKey: "mercedes-eqe" },
  { id: "mercedes-eqs", brand: "벤츠", model: "EQS", trim: "2025 EQS 450+", type: "ev", logo: "mercedes-benz.png", photoKey: "mercedes-eqs" },
  { id: "mercedes-sl", brand: "벤츠", model: "SL클래스", trim: "2025 AMG SL 63 4MATIC+", type: "ice", logo: "mercedes-benz.png", photoKey: "mercedes-sl" },
  { id: "mercedes-clk", brand: "벤츠", model: "CLK클래스", trim: "2009 CLK 350", type: "ice", logo: "mercedes-benz.png", photoKey: "mercedes-clk" },
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
  temperature?: string;
  imageData?: string;
  createdAt: string;
  author: string;
};

export const ENERGY_STORAGE_KEY = "bobae-fuel-economy-posts-v1";
