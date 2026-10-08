import { heavyScenarioV04 } from "./scenario-v04";
import { approvedHeavyManufacturers, approvedHeavySubmodels } from "./manifest";

export type HeavyInventoryRow = {
  id: string;
  imageFile: string;
  title: string;
  form: string;
  equipmentTypeCode: string;
  maker: string;
  manufacturerCode: string;
  model: string;
  modelCode: string;
  submodel: string;
  submodelCode: string;
  year: number;
  price: number | null;
  hours: number;
  region: string;
  evaluation: string;
  detail: string;
  detailTypeCode: string;
  sellerType: string;
  sellerName: string;
  sellerAddress: string;
  sellerContact: string;
  sellerIntro: string;
  businessHours: string;
  inspection: string;
  delivery: string;
  quickfilterTags: readonly string[];
  isVirtual: boolean;
  sourceManifestVersion: string;
  scenarioVersion: string;
  fallbackLevel: 0 | 1 | 2 | 3;
};

export type HeavySelection = {
  form: string | null;
  detail: string | null;
  maker: string | null;
  model: string | null;
  submodel: string | null;
  equipmentTypeCode: string | null;
  detailTypeCode: string | null;
  manufacturerCode: string | null;
  modelCode: string | null;
  submodelCode: string | null;
};

export const emptyHeavySelection: HeavySelection = {
  form: null,
  detail: null,
  maker: null,
  model: null,
  submodel: null,
  equipmentTypeCode: null,
  detailTypeCode: null,
  manufacturerCode: null,
  modelCode: null,
  submodelCode: null,
};

/** 빅레몬 시트에서 확인한 전체 형식 52종. 표기와 순서를 원본과 동일하게 유지한다. */
export const biglemonHeavyFormOrder = [
  "유압셔블(굴삭기)",
  "미니 유압셔블(미니굴삭기)",
  "타이어셔블(휠로더)",
  "불도저",
  "롤러(다짐기)",
  "아스팔트 피니셔",
  "그레이더",
  "크레인",
  "캐리어덤프(크롤러덤프)",
  "환경기계(파쇄·선별)",
  "기초공사 기계",
  "임업기계",
  "자주식 고소작업차",
  "신품 부품",
  "중고 부품",
  "평바디(카고)",
  "밴(탑차)",
  "윙바디",
  "냉동차/보냉차",
  "트랙터/트레일러",
  "크레인차(카고크레인)",
  "덤프차",
  "탱크로리/믹서차",
  "카캐리어",
  "중장비 운반차(셀프로더)",
  "지게차",
  "고소작업차",
  "버스",
  "운반차량 기타",
  "트랙터(농업용)",
  "이앙기",
  "콤바인",
  "예초기",
  "경운기",
  "발동기",
  "농업기계 기타",
  "어태치먼트(건설기계)",
  "어태치먼트(지게차)",
  "어태치먼트(농업기계)",
  "각종 버킷",
  "포크그랩(집게)",
  "마그넷",
  "유압 브레이커",
  "탈착기(퀵커플러)",
  "신품 어태치먼트",
  "발전기",
  "용접기",
  "투광기(조명)",
  "컴프레셔",
  "건설기계 기타",
  "토목/건축 자재",
  "기타",
] as const;

export const biglemonHeavyDetailOptions: Record<string, string[]> = {
  "유압셔블(굴삭기)": ["6~9t (0.25) 급", "10~17t (0.45) 급", "18~25t (0.7) 급", "26t (1.0) 이상"],
  "미니 유압셔블(미니굴삭기)": ["2t 미만", "2~3t 미만", "3~4t 미만", "4~6t 미만"],
  "타이어셔블(휠로더)": ["일반 토목용", "쇄석/광산용", "농업/임업/축산용", "습지/논", "터널 사양", "제설 사양"],
  "롤러(다짐기)": ["토공용 진동롤러", "포장용 진동롤러", "타이어 롤러", "머캐덤 롤러", "핸드가이드 롤러", "진동 플레이트 컴팩터", "램머(콤팩터)"],
  "임업기계": ["6t (미니) 미만", "6~9t (0.25) 급", "10~17t (0.45) 급", "18~25t (0.7) 급", "26t (1.0) 이상"],
};

export const heavyFormLabelByCode: Record<string, string> = {
  hydraulic_excavator: "유압셔블(굴삭기)",
  mini_excavator: "미니 유압셔블(미니굴삭기)",
  wheel_loader: "타이어셔블(휠로더)",
  bulldozer: "불도저",
  vibratory_roller: "롤러(다짐기)",
  motor_grader: "그레이더",
  crawler_crane: "크레인",
  mining_dump_truck: "덤프차",
  carrier_dump: "캐리어덤프(크롤러덤프)",
  foundation_machine: "기초공사 기계",
  self_propelled_aerial_work_platform: "자주식 고소작업차",
  used_parts: "중고 부품",
  dump_truck: "덤프차",
  forklift: "지게차",
  aerial_work_platform: "고소작업차",
  construction_attachment: "어태치먼트(건설기계)",
  bucket: "각종 버킷",
  hydraulic_breaker: "유압 브레이커",
  construction_other: "건설기계 기타",
  scraper: "스크레이퍼",
  soil_stabilizer: "노상안정기",
  concrete_batching_plant: "콘크리트뱃칭플랜트",
  concrete_finisher: "콘크리트피니셔",
  concrete_spreader: "콘크리트살포기",
  concrete_mixer_truck: "콘크리트믹서트럭",
  concrete_pump: "콘크리트펌프",
  asphalt_mixing_plant: "아스팔트믹싱플랜트",
  asphalt_finisher: "아스팔트피니셔",
  asphalt_distributor: "아스팔트살포기",
  aggregate_spreader: "골재살포기",
  crusher: "쇄석기",
  air_compressor: "공기압축기",
  drilling_rig: "천공기",
  pile_driver: "항타 및 항발기",
  gravel_collector: "자갈채취기",
  dredger: "준설선",
  special_equipment: "특수건설기계",
  tower_crane: "타워크레인",
};

const heavyFormCodeByLabel = Object.fromEntries(Object.entries(heavyFormLabelByCode).map(([code, label]) => [label, code]));

type BiglemonMapping = {
  form: string;
  equipmentTypeCode: string;
  detail: string;
  detailTypeCode: string;
  basis: "확인" | "미확인";
};

const map = (form: string, equipmentTypeCode: string, detail: string, detailTypeCode: string, basis: "확인" | "미확인" = "확인"): BiglemonMapping =>
  ({ form, equipmentTypeCode, detail, detailTypeCode, basis });

const directBiglemonMapping: Record<string, BiglemonMapping> = {
  // 2026-10-08 사용자 지시: 「380」 자리를 볼보 EW60E(타이어식 5.5~6톤)로 교체
  "heavy-001": map("유압셔블(굴삭기)", "hydraulic_excavator", "6~9t (0.25) 급", "excavator_6_9t"),
  "heavy-002": map("유압셔블(굴삭기)", "hydraulic_excavator", "26t (1.0) 이상", "excavator_26t_plus"),
  "heavy-003": map("유압셔블(굴삭기)", "hydraulic_excavator", "26t (1.0) 이상", "excavator_26t_plus"),
  "heavy-004": map("유압셔블(굴삭기)", "hydraulic_excavator", "26t (1.0) 이상", "excavator_26t_plus"),
  "heavy-005": map("유압셔블(굴삭기)", "hydraulic_excavator", "26t (1.0) 이상", "excavator_26t_plus"),
  "heavy-006": map("유압셔블(굴삭기)", "hydraulic_excavator", "26t (1.0) 이상", "excavator_26t_plus"),
  "heavy-007": map("유압셔블(굴삭기)", "hydraulic_excavator", "10~17t (0.45) 급", "excavator_10_17t"),
  "heavy-008": map("유압셔블(굴삭기)", "hydraulic_excavator", "10~17t (0.45) 급", "excavator_10_17t"),
  "heavy-009": map("유압셔블(굴삭기)", "hydraulic_excavator", "6~9t (0.25) 급", "excavator_6_9t"),
  "heavy-010": map("유압셔블(굴삭기)", "hydraulic_excavator", "미확인", "unverified", "미확인"),
  "heavy-011": map("유압셔블(굴삭기)", "hydraulic_excavator", "6~9t (0.25) 급", "excavator_6_9t"),
  "heavy-012": map("유압셔블(굴삭기)", "hydraulic_excavator", "6~9t (0.25) 급", "excavator_6_9t"),
  "heavy-013": map("미니 유압셔블(미니굴삭기)", "mini_excavator", "2~3t 미만", "mini_2_3t"),
  "heavy-014": map("미니 유압셔블(미니굴삭기)", "mini_excavator", "3~4t 미만", "mini_3_4t"),
  "heavy-015": map("미니 유압셔블(미니굴삭기)", "mini_excavator", "2~3t 미만", "mini_2_3t"),
  "heavy-016": map("유압셔블(굴삭기)", "hydraulic_excavator", "미확인", "unverified", "미확인"),
  "heavy-017": map("유압셔블(굴삭기)", "hydraulic_excavator", "10~17t (0.45) 급", "excavator_10_17t"),
  "heavy-018": map("유압셔블(굴삭기)", "hydraulic_excavator", "10~17t (0.45) 급", "excavator_10_17t"),
  "heavy-019": map("각종 버킷", "bucket", "전체", "all"),
  "heavy-020": map("유압 브레이커", "hydraulic_breaker", "전체", "all"),
  "heavy-021": map("어태치먼트(건설기계)", "construction_attachment", "전체", "all"),
  "heavy-022": map("중고 부품", "used_parts", "전체", "all"),
  "heavy-023": map("덤프차", "dump_truck", "전체", "all"),
  "heavy-024": map("덤프차", "dump_truck", "전체", "all"),
  "heavy-025": map("덤프차", "dump_truck", "전체", "all"),
  "heavy-026": map("덤프차", "dump_truck", "전체", "all"),
  "heavy-027": map("덤프차", "dump_truck", "전체", "all"),
  "heavy-028": map("덤프차", "dump_truck", "전체", "all"),
  "heavy-029": map("덤프차", "dump_truck", "전체", "all"),
  "heavy-030": map("덤프차", "dump_truck", "전체", "all"),
};

const makerNameToDisplay: Record<string, string> = {
  코벨코: "고베루코건기",
  구보다: "구보타",
};

const manufacturerCodeByName: Record<string, string> = {
  미확인: "unknown",
  볼보: "volvo",
  현대: "hyundai",
  디벨론: "develon",
  코벨코: "kobelco",
  고베루코건기: "kobelco",
  구보다: "kubota",
  구보타: "kubota",
  타타대우: "tata_daewoo",
};

const quickSlotByScenario = new Map(approvedHeavySubmodels.flatMap((slot) => slot.scenarioIds.map((id) => [id, slot] as const)));

export const heavyInventory: HeavyInventoryRow[] = heavyScenarioV04.map((row) => {
  const mapping = directBiglemonMapping[row.scenario_id] ?? map("기타", "other", "미확인", "unverified", "미확인");
  const quickSlot = quickSlotByScenario.get(row.scenario_id);
  const maker = makerNameToDisplay[row.manufacturer] ?? row.manufacturer;
  return {
    id: row.scenario_id,
    imageFile: row.image_file,
    title: row.title,
    form: mapping.form,
    equipmentTypeCode: mapping.equipmentTypeCode,
    maker,
    manufacturerCode: quickSlot?.manufacturerCode ?? manufacturerCodeByName[maker] ?? "unknown",
    model: quickSlot?.modelLabel ?? row.model,
    modelCode: quickSlot?.modelCode ?? `heavy_model_${row.scenario_id.replace("heavy-", "")}`,
    submodel: quickSlot?.submodelLabel ?? row.title,
    submodelCode: quickSlot?.submodelCode ?? `heavy_submodel_${row.scenario_id.replace("heavy-", "")}`,
    year: row.year,
    price: row.price_10k_krw * 10000,
    hours: row.operating_hours,
    region: row.region,
    evaluation: row.condition,
    detail: mapping.detail,
    detailTypeCode: mapping.detailTypeCode,
    sellerType: row.seller_type,
    sellerName: row.seller_name,
    sellerAddress: row.seller_address,
    sellerContact: row.seller_contact,
    sellerIntro: row.seller_intro,
    businessHours: row.business_hours,
    inspection: row.inspection,
    delivery: row.delivery,
    quickfilterTags: row.quickfilter_tags,
    isVirtual: row.is_virtual,
    sourceManifestVersion: row.source_manifest_version,
    scenarioVersion: row.scenario_version,
    fallbackLevel: 0,
  };
});

export const heavyFormOrder: string[] = [...biglemonHeavyFormOrder];
export const heavyDetailOptions: Record<string, string[]> = Object.fromEntries(
  heavyFormOrder.map((form) => {
    const base = biglemonHeavyDetailOptions[form] ?? ["전체"];
    const hasUnverified = heavyInventory.some((row) => row.form === form && row.detail === "미확인");
    return [form, hasUnverified ? [...base, "미확인"] : base];
  })
);

export const heavyDetailsFor = (form: string | null) => form ? heavyDetailOptions[form] ?? [] : [];

const explicitHeavyDetailCodes: Record<string, string> = {
  "유압셔블(굴삭기)::6~9t (0.25) 급": "excavator_6_9t",
  "유압셔블(굴삭기)::10~17t (0.45) 급": "excavator_10_17t",
  "유압셔블(굴삭기)::18~25t (0.7) 급": "excavator_18_25t",
  "유압셔블(굴삭기)::26t (1.0) 이상": "excavator_26t_plus",
  "미니 유압셔블(미니굴삭기)::2t 미만": "mini_under_2t",
  "미니 유압셔블(미니굴삭기)::2~3t 미만": "mini_2_3t",
  "미니 유압셔블(미니굴삭기)::3~4t 미만": "mini_3_4t",
  "미니 유압셔블(미니굴삭기)::4~6t 미만": "mini_4_6t",
};

export const heavyDetailCodeFor = (form: string, detail: string) => {
  if (detail === "전체") return "all";
  if (detail === "미확인") return "unverified";
  const explicit = explicitHeavyDetailCodes[`${form}::${detail}`];
  if (explicit) return explicit;
  const index = heavyDetailsFor(form).indexOf(detail);
  const formCode = heavyFormCodeByLabel[form] ?? "heavy";
  return `${formCode}_detail_${Math.max(index, 0) + 1}`;
};

export const heavyRowsFor = (selection: Partial<HeavySelection>) => heavyInventory.filter((row) =>
  (!selection.equipmentTypeCode || row.equipmentTypeCode === selection.equipmentTypeCode)
  && (!selection.detailTypeCode || selection.detailTypeCode === "all" || row.detailTypeCode === selection.detailTypeCode)
  && (!selection.manufacturerCode || row.manufacturerCode === selection.manufacturerCode)
  && (!selection.modelCode || row.modelCode === selection.modelCode)
  && (!selection.submodelCode || row.submodelCode === selection.submodelCode)
  && (!selection.form || row.form === selection.form)
  && (!selection.detail || selection.detail === "전체" || row.detail === selection.detail)
  && (!selection.maker || selection.manufacturerCode || row.maker === selection.maker)
  && (!selection.model || selection.modelCode || row.model === selection.model)
  && (!selection.submodel || selection.submodelCode || row.submodel === selection.submodel));

export function normalizeHeavySelection(selection: HeavySelection): HeavySelection {
  const manufacturer = approvedHeavyManufacturers.find((slot) => slot.manufacturerCode === selection.manufacturerCode || slot.name === selection.maker);
  if (!manufacturer) {
    return {
      ...selection,
      maker: null,
      model: null,
      submodel: null,
      manufacturerCode: null,
      modelCode: null,
      submodelCode: null,
    };
  }
  if (selection.equipmentTypeCode && manufacturer.equipmentTypeCodes.length > 0 && !manufacturer.equipmentTypeCodes.includes(selection.equipmentTypeCode)) {
    return {
      ...selection,
      maker: null,
      model: null,
      submodel: null,
      manufacturerCode: null,
      modelCode: null,
      submodelCode: null,
    };
  }
  const scoped = approvedHeavySubmodels.filter((slot) =>
    slot.manufacturerCode === manufacturer.manufacturerCode
    && (!selection.equipmentTypeCode || slot.equipmentTypeCode === selection.equipmentTypeCode)
    && (!selection.detailTypeCode || selection.detailTypeCode === "all" || slot.detailTypeCode === selection.detailTypeCode));
  const modelSlot = scoped.find((slot) => slot.modelCode === selection.modelCode || slot.modelLabel === selection.model);
  if (!modelSlot) {
    return {
      ...selection,
      maker: manufacturer.name,
      manufacturerCode: manufacturer.manufacturerCode,
      model: null,
      submodel: null,
      modelCode: null,
      submodelCode: null,
    };
  }
  const submodelSlot = scoped.find((slot) => slot.modelCode === modelSlot.modelCode && (slot.submodelCode === selection.submodelCode || slot.submodelLabel === selection.submodel));
  if (!submodelSlot) {
    return {
      ...selection,
      maker: manufacturer.name,
      manufacturerCode: manufacturer.manufacturerCode,
      model: modelSlot.modelLabel,
      modelCode: modelSlot.modelCode,
      submodel: null,
      submodelCode: null,
    };
  }
  return {
    ...selection,
    form: submodelSlot.equipmentTypeLabel,
    detail: submodelSlot.detailTypeLabel,
    maker: manufacturer.name,
    model: modelSlot.modelLabel,
    submodel: submodelSlot.submodelLabel,
    equipmentTypeCode: submodelSlot.equipmentTypeCode,
    detailTypeCode: submodelSlot.detailTypeCode,
    manufacturerCode: manufacturer.manufacturerCode,
    modelCode: modelSlot.modelCode,
    submodelCode: submodelSlot.submodelCode,
  };
}

export function getInitialHeavySelection(): HeavySelection {
  const params = new URLSearchParams(window.location.search);
  const legacyForm = params.get("heavy_form");
  const form = legacyForm && heavyFormOrder.includes(legacyForm) ? legacyForm : null;
  const equipmentTypeCode = params.get("heavy_equipment_type_code") ?? (form ? heavyFormCodeByLabel[form] ?? null : null);
  const legacyDetail = params.get("heavy_detail");
  const detail = form && legacyDetail && heavyDetailsFor(form).includes(legacyDetail) ? legacyDetail : null;
  const detailTypeCode = params.get("heavy_detail_type_code") ?? (detail === "미확인" ? "unverified" : detail === "전체" ? "all" : null);
  const legacyMaker = params.get("heavy_maker");
  const manufacturerCode = params.get("heavy_manufacturer_code") ?? approvedHeavyManufacturers.find((slot) => slot.name === legacyMaker)?.manufacturerCode ?? null;
  const legacyModel = params.get("heavy_model");
  const modelCode = params.get("heavy_model_code") ?? approvedHeavySubmodels.find((slot) => slot.manufacturerCode === manufacturerCode && (slot.modelLabel === legacyModel || slot.submodelLabel === legacyModel))?.modelCode ?? null;
  const legacySubmodel = params.get("heavy_submodel");
  const submodelCode = params.get("heavy_submodel_code") ?? approvedHeavySubmodels.find((slot) => slot.modelCode === modelCode && (slot.submodelLabel === legacySubmodel || slot.submodelLabel === legacyModel))?.submodelCode ?? null;
  return normalizeHeavySelection({
    form,
    detail,
    maker: legacyMaker,
    model: legacyModel,
    submodel: legacySubmodel,
    equipmentTypeCode,
    detailTypeCode,
    manufacturerCode,
    modelCode,
    submodelCode,
  });
}

export function replaceHeavyParams(selection: HeavySelection) {
  const url = new URL(window.location.href);
  const values = [
    ["heavy_equipment_type_code", selection.equipmentTypeCode],
    ["heavy_detail_type_code", selection.detailTypeCode],
    ["heavy_manufacturer_code", selection.manufacturerCode],
    ["heavy_model_code", selection.modelCode],
    ["heavy_submodel_code", selection.submodelCode],
    ["heavy_form", selection.form],
    ["heavy_detail", selection.detail],
    ["heavy_maker", selection.maker],
    ["heavy_model", selection.model],
    ["heavy_submodel", selection.submodel],
  ] as const;
  values.forEach(([key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
