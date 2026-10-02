export type HeavyAssetStatus = "빈 슬롯" | "제작중" | "검수완료" | "미확인";
export type HeavyFallbackLevel = 0 | 1 | 2 | 3;

export const HEAVY_QUICKFILTER_MANIFEST_VERSION = "v02";
export const HEAVY_SLOT_MANIFEST_VERSION = "v02";

export type HeavyManufacturerSlot = {
  manufacturerCode: string;
  name: string;
  originalName: string;
  logoFile: string;
  driveFileId: string;
  equipmentTypeCodes: readonly string[];
  status: HeavyAssetStatus;
};

export const heavyManufacturerSlots: readonly HeavyManufacturerSlot[] = [
  { manufacturerCode: "develon", name: "디벨론", originalName: "DEVELON", logoFile: "heavy_develon_logo_v01.jpg", driveFileId: "1oTElr3xUr0o7jfzLcQDgQ50AQPWWhUI9", equipmentTypeCodes: ["hydraulic_excavator", "mini_excavator", "wheel_loader", "bulldozer", "carrier_dump"], status: "검수완료" },
  { manufacturerCode: "epiroc", name: "에피록", originalName: "Epiroc", logoFile: "heavy_epiroc_logo_v01.png", driveFileId: "1qwxTbmxrXUJtLk1eiDIhDXs5Ce_Kzk0b", equipmentTypeCodes: ["foundation_machine", "construction_other"], status: "검수완료" },
  { manufacturerCode: "hitachi", name: "히타치", originalName: "Hitachi", logoFile: "heavy_hitachi_logo_v01.jpg", driveFileId: "1TLOZtdYzfXfqK_Yc98djZtKijnAlfdEZ", equipmentTypeCodes: ["hydraulic_excavator", "mini_excavator", "wheel_loader"], status: "검수완료" },
  { manufacturerCode: "lgmg", name: "LGMG", originalName: "LGMG", logoFile: "heavy_lgmg_logo_v01.jpg", driveFileId: "1vbauSkIpuZOKrbnB2Bc55lPoSO2FyNLg", equipmentTypeCodes: ["self_propelled_aerial_work_platform", "aerial_work_platform"], status: "검수완료" },
  { manufacturerCode: "haulotte", name: "오로트", originalName: "Haulotte", logoFile: "heavy_haulotte_logo_v01.png", driveFileId: "1CeW21gNHVHcn0IbxICSboxYWw8ZyA7xv", equipmentTypeCodes: ["self_propelled_aerial_work_platform", "aerial_work_platform"], status: "검수완료" },
  { manufacturerCode: "new_holland", name: "뉴홀랜드", originalName: "New Holland", logoFile: "heavy_new_holland_logo_v01.jpg", driveFileId: "1iGlLGq-bL4cIbU3vxVkgVi1BXFTd977y", equipmentTypeCodes: ["mini_excavator", "wheel_loader", "construction_other"], status: "검수완료" },
  { manufacturerCode: "linde", name: "린데", originalName: "Linde", logoFile: "heavy_linde_logo_v01.jpg", driveFileId: "1TpRSSkBj0vJPNaPIoKSI5xIQygrt9Fdi", equipmentTypeCodes: ["forklift"], status: "검수완료" },
  { manufacturerCode: "schwing", name: "슈빙", originalName: "Schwing", logoFile: "heavy_schwing_logo_v01.jpg", driveFileId: "1ZKL0pOTYyxf56ZmS5-RC9pqvL7odzAaR", equipmentTypeCodes: ["construction_other"], status: "검수완료" },
  { manufacturerCode: "tailift", name: "타이리프트", originalName: "Tailift", logoFile: "heavy_tailift_logo_v01.jpg", driveFileId: "1kC7hqZ5yoTdZwmik2kco_xvLKpnCIHFx", equipmentTypeCodes: ["forklift"], status: "검수완료" },
  { manufacturerCode: "ffg", name: "FFG", originalName: "FFG", logoFile: "heavy_ffg_logo_v01.jpg", driveFileId: "1TtZhHh8HohWRhp-iDLoGGYV74IS3yLZ3", equipmentTypeCodes: ["forklift"], status: "검수완료" },
];

export type HeavySubmodelSlot = {
  equipmentTypeCode: string;
  equipmentTypeLabel: string;
  detailTypeCode: string;
  detailTypeLabel: string;
  manufacturerCode: string;
  modelCode: string;
  modelLabel: string;
  submodelCode: string;
  submodelLabel: string;
  modelImageFile: string;
  submodelImageFile: string;
  manufacturerCommonImageFile: string | null;
  heavyCommonImageFile: string;
  scenarioIds: readonly string[];
  status: HeavyAssetStatus;
  fallbackLevel: HeavyFallbackLevel;
};

export const heavySubmodelSlots: readonly HeavySubmodelSlot[] = [
  {
    equipmentTypeCode: "hydraulic_excavator",
    equipmentTypeLabel: "유압셔블(굴삭기)",
    detailTypeCode: "excavator_10_17t",
    detailTypeLabel: "10~17t (0.45) 급",
    manufacturerCode: "develon",
    modelCode: "develon_dx140",
    modelLabel: "DX140",
    submodelCode: "develon_dx140_standard_boom",
    submodelLabel: "DX140 표준붐",
    modelImageFile: "listings/heavy_listing_008_v01.jpeg",
    submodelImageFile: "listings/heavy_listing_008_v01.jpeg",
    manufacturerCommonImageFile: null,
    heavyCommonImageFile: "types/heavy_type_excavator_v01.png",
    scenarioIds: ["heavy-008"],
    status: "검수완료",
    fallbackLevel: 0,
  },
  {
    equipmentTypeCode: "hydraulic_excavator",
    equipmentTypeLabel: "유압셔블(굴삭기)",
    detailTypeCode: "unverified",
    detailTypeLabel: "미확인",
    manufacturerCode: "develon",
    modelCode: "develon_dx55w",
    modelLabel: "DX55W",
    submodelCode: "develon_dx55w_daejjok",
    submodelLabel: "DX55W 대쪽",
    modelImageFile: "listings/heavy_listing_016_v01.jpg",
    submodelImageFile: "listings/heavy_listing_016_v01.jpg",
    manufacturerCommonImageFile: null,
    heavyCommonImageFile: "types/heavy_type_excavator_v01.png",
    scenarioIds: ["heavy-016"],
    status: "검수완료",
    fallbackLevel: 0,
  },
];

export type HeavyImageCandidate = { file: string; fallbackLevel: HeavyFallbackLevel; label: string };

export function heavyImageCandidates(slot: HeavySubmodelSlot, depth: "model" | "submodel"): HeavyImageCandidate[] {
  const raw: HeavyImageCandidate[] = [
    { file: depth === "submodel" ? slot.submodelImageFile : slot.modelImageFile, fallbackLevel: 0, label: depth === "submodel" ? "세부 형식 이미지" : "모델 이미지" },
    { file: slot.modelImageFile, fallbackLevel: 1, label: "모델 이미지" },
    ...(slot.manufacturerCommonImageFile ? [{ file: slot.manufacturerCommonImageFile, fallbackLevel: 2 as const, label: "제조사 공통 이미지" }] : []),
    { file: slot.heavyCommonImageFile, fallbackLevel: 3, label: "건설기계 공통 이미지" },
  ];
  return raw.filter((item, index) => item.file && raw.findIndex((candidate) => candidate.file === item.file) === index);
}

export const approvedHeavyManufacturers = heavyManufacturerSlots.filter((slot) => slot.status === "검수완료");
export const approvedHeavySubmodels = heavySubmodelSlots.filter((slot) => slot.status === "검수완료");
