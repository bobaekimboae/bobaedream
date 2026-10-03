export type TruckBrandLogoV01 = {
  file: string;
  ratio: number;
  source: "이처" | "당근" | "공식";
  driveId?: string;
};

// 트럭·특장 전용 로고 세트 v01.
// 국내 상용 브랜드는 당근의 한국 판매 표기를, 수입 트럭 브랜드는 이처의 선명한 PNG 원본을 우선한다.
export const truckBrandLogosV01: Record<string, TruckBrandLogoV01> = {
  "현대": { file: "truck_hyundai_logo_v01.png", ratio: 2, source: "당근" },
  "기아": { file: "truck_kia_logo_v01.png", ratio: 4.235, source: "당근" },
  "타타대우": { file: "truck_tata_daewoo_logo_v01.png", ratio: 1.533, source: "당근", driveId: "1dZr2V78qJDMEWXQdZcPsWzx2H7ulDypf" },
  "KG모빌리티": { file: "truck_kgm_logo_v01.png", ratio: 5.18, source: "공식" },
  "KG모빌리티(쌍용)": { file: "truck_kgm_logo_v01.png", ratio: 5.18, source: "공식" },
  "볼보": { file: "truck_volvo_trucks_logo_v01.png", ratio: 1, source: "이처", driveId: "1nHr4zJYVgAMoM5KYGQxEGQ74sqqwa7c7" },
  "스카니아": { file: "truck_scania_logo_v01.png", ratio: 1.048, source: "이처", driveId: "1EWPUKO3UGz0xrCBLwKk9Uiyh5WI1TNV7" },
  "만(MAN)": { file: "truck_man_logo_v01.png", ratio: 1.797, source: "이처", driveId: "13_xlW9tl6dPeirpy92gT1AwlHG48jTVm" },
  "벤츠": { file: "truck_mercedes_benz_logo_v01.png", ratio: 1.021, source: "이처", driveId: "1ZRcXHYVqy8Zv3MoAO36AQBk7vxE_lLN4" },
  "이베코": { file: "truck_iveco_logo_v01.png", ratio: 4.571, source: "이처", driveId: "1IuUuvgTztHeGwKyNnwrsQIDYWTEieG3x" },
  "다프(DAF)": { file: "truck_daf_logo_v01.png", ratio: 3.14, source: "이처", driveId: "1-Nogcg0sTItbd9vfB9TidS2q_5yRiKRo" },
};

const truckRailLabels: Record<string, string> = {
  "KG모빌리티": "KGM",
  "KG모빌리티(쌍용)": "KGM",
  "볼보": "볼보트럭",
  "만(MAN)": "MAN",
  "벤츠": "벤츠트럭",
  "다프(DAF)": "DAF",
};

export const truckRailLabel = (label: string) => truckRailLabels[label] ?? label;
