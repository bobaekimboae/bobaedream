import { bikeBrandLogosV01 } from "./brand-logos-bike-v01";

type BikeLogo = {
  file: string;
  ratio: number;
  source: "motofan" | "autohome" | "official";
};

// Google Drive `모토팬` 180×180 원본에서 외곽 흰 배경을 제거한 비교 세트.
// 로얄엔필드는 제공 자료에 없으므로 기존 공식 로고를 유지한다.
export const bikeBrandLogosMotofanV01: Record<string, BikeLogo> = {
  "혼다": { file: "BKM001_Honda.png", ratio: 102 / 83, source: "motofan" },
  "야마하": { file: "BKM002_Yamaha.png", ratio: 104 / 127, source: "motofan" },
  "BMW": { file: "BKM003_BMW_Motorrad.png", ratio: 110 / 109, source: "motofan" },
  "스즈키": { file: "BKM004_Suzuki.png", ratio: 118 / 120, source: "motofan" },
  "할리데이비슨": { file: "BKM005_Harley_Davidson.png", ratio: 110 / 88, source: "motofan" },
  "가와사키": { file: "BKM006_Kawasaki.png", ratio: 1, source: "motofan" },
  "SYM": { file: "BKM007_SYM.png", ratio: 108 / 107, source: "motofan" },
  "베스파": { file: "BKM008_Vespa.png", ratio: 136 / 47, source: "motofan" },
  "두카티": { file: "BKM010_Ducati.png", ratio: 102 / 109, source: "motofan" },
};

export type SelectedBikeLogo = {
  logo: BikeLogo;
  directory: "motofan-trim" | "autohome-trim";
  set: "motofan-bike" | "autohome-bike" | "motofan-bike-fallback";
};

export function selectedBikeBrandLogo(name: string): SelectedBikeLogo | null {
  const requestedSet = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("bikelogo")
    : null;
  const motofan = requestedSet === "motofan" ? bikeBrandLogosMotofanV01[name] : null;
  if (motofan) return { logo: motofan, directory: "motofan-trim", set: "motofan-bike" };
  const fallback = bikeBrandLogosV01[name];
  if (!fallback) return null;
  return {
    logo: fallback,
    directory: "autohome-trim",
    set: requestedSet === "motofan" ? "motofan-bike-fallback" : "autohome-bike",
  };
}
