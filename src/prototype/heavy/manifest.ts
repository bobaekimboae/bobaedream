export type HeavyAssetStatus = "빈 슬롯" | "제작중" | "검수완료" | "미확인";
export type HeavyFallbackLevel = 0 | 1 | 2 | 3;

export const HEAVY_QUICKFILTER_MANIFEST_VERSION = "v06";
export const HEAVY_SLOT_MANIFEST_VERSION = "v06";

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
  { manufacturerCode: "hyundai", name: "현대건설기계", originalName: "HD Hyundai Construction Equipment", logoFile: "heavy_hd_hyundai_logo_v06.png", driveFileId: "1XzTHb1EcEvY8W237tWpogbBB1grcLDH_", equipmentTypeCodes: ["hydraulic_excavator", "dump_truck"], status: "검수완료" },
  { manufacturerCode: "develon", name: "디벨론", originalName: "DEVELON", logoFile: "heavy_develon_logo_v06.png", driveFileId: "1HxxZAOlI-sysJItrhsBq4QmRwWCFWolM", equipmentTypeCodes: ["hydraulic_excavator", "mini_excavator", "wheel_loader", "bulldozer", "carrier_dump"], status: "검수완료" },
  { manufacturerCode: "volvo", name: "볼보CE", originalName: "Volvo Construction Equipment", logoFile: "heavy_volvo_ce_logo_v06.png", driveFileId: "1hakrt2xWDKh6HHdzYX2q1hUM9ySB78Zk", equipmentTypeCodes: ["hydraulic_excavator"], status: "검수완료" },
  { manufacturerCode: "caterpillar", name: "캐터필러", originalName: "Caterpillar", logoFile: "heavy_caterpillar_logo_v06.png", driveFileId: "1GVoPtBLSYjky5RseKcLnCTZbHog4C0mu", equipmentTypeCodes: [], status: "검수완료" },
  { manufacturerCode: "komatsu", name: "코마츠", originalName: "Komatsu", logoFile: "heavy_komatsu_logo_v06.png", driveFileId: "1IcI1R3UrWvMYLp2I8wj-ELt6SFF2M01s", equipmentTypeCodes: [], status: "검수완료" },
  { manufacturerCode: "hitachi", name: "히타치", originalName: "Hitachi Construction Machinery", logoFile: "heavy_hitachi_cm_logo_v06.png", driveFileId: "1W0L992SYfMjHoBd847CRaA7Mi-7bejad", equipmentTypeCodes: [], status: "검수완료" },
  { manufacturerCode: "kobelco", name: "코벨코", originalName: "Kobelco", logoFile: "heavy_kobelco_logo_v06.png", driveFileId: "1pD_kyyUjwL9dgI_T9DfaJ-IkYIAALi6f", equipmentTypeCodes: ["hydraulic_excavator", "mini_excavator"], status: "검수완료" },
  { manufacturerCode: "bobcat", name: "밥캣", originalName: "Bobcat", logoFile: "heavy_bobcat_logo_v06.png", driveFileId: "1-hl0GqhlmwsFkUculLaMwAJ8bHCq6knz", equipmentTypeCodes: [], status: "검수완료" },
  { manufacturerCode: "kubota", name: "구보타", originalName: "Kubota", logoFile: "heavy_kubota_logo_v06.png", driveFileId: "1OxqKNddf1wL2-TvhPoalMeF_Ir0yddW2", equipmentTypeCodes: ["mini_excavator"], status: "검수완료" },
  { manufacturerCode: "jcb", name: "JCB", originalName: "JCB", logoFile: "heavy_jcb_logo_v06.png", driveFileId: "1r5hV1nyGemcg3BVn2FBhSLwVdk2YkOw6", equipmentTypeCodes: [], status: "검수완료" },
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
