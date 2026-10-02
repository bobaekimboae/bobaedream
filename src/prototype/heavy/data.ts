import { heavyScenarioV04 } from "./scenario-v04";

export type HeavyInventoryRow = {
  id: string;
  imageFile: string;
  title: string;
  form: string;
  maker: string;
  model: string;
  year: number;
  price: number | null;
  hours: number;
  region: string;
  evaluation: string;
  detail: string;
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
};

export type HeavySelection = {
  form: string | null;
  detail: string | null;
  maker: string | null;
  model: string | null;
};

export const emptyHeavySelection: HeavySelection = { form: null, detail: null, maker: null, model: null };

/** 빅레몬에서 확인한 건설기계 형식 기준. v04 매물에 없는 형식도 기준표로 보존한다. */
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
] as const;

export const biglemonHeavyDetailOptions: Record<string, string[]> = {
  "유압셔블(굴삭기)": ["6~9t (0.25) 급", "10~17t (0.45) 급", "18~25t (0.7) 급", "26t (1.0) 이상"],
  "미니 유압셔블(미니굴삭기)": ["2t 미만", "2~3t 미만", "3~4t 미만", "4~6t 미만"],
  "타이어셔블(휠로더)": ["일반 토목용", "쇄석/광산용", "농업/임업/축산용", "습지/논", "터널 사양", "제설 사양"],
  "롤러(다짐기)": ["토공용 진동롤러", "포장용 진동롤러", "타이어 롤러", "머캐덤 롤러", "핸드가이드 롤러", "진동 플레이트 컴팩터", "램머(콤팩터)"],
  "임업기계": ["6t (미니) 미만", "6~9t (0.25) 급", "10~17t (0.45) 급", "18~25t (0.7) 급", "26t (1.0) 이상"],
};

export const heavyInventory: HeavyInventoryRow[] = heavyScenarioV04.map((row) => ({
  id: row.scenario_id,
  imageFile: row.image_file,
  title: row.title,
  form: row.equipment_type,
  maker: row.manufacturer,
  model: row.model,
  year: row.year,
  price: row.price_10k_krw * 10000,
  hours: row.operating_hours,
  region: row.region,
  evaluation: row.condition,
  detail: row.detail_type,
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
}));

/** 시안에서 선택 가능한 값은 v04의 실제 매물값을 그대로 사용해 결과 0건과 임의 매핑을 막는다. */
export const heavyFormOrder = [...new Set(heavyInventory.map((row) => row.form))];
export const heavyDetailOptions: Record<string, string[]> = Object.fromEntries(
  heavyFormOrder.map((form) => [form, [...new Set(heavyInventory.filter((row) => row.form === form).map((row) => row.detail))]])
);

export const heavyDetailsFor = (form: string | null) => form ? heavyDetailOptions[form] ?? [] : [];

export const heavyRowsFor = (selection: Partial<HeavySelection>) => heavyInventory.filter((row) =>
  (!selection.form || row.form === selection.form)
  && (!selection.detail || selection.detail === "전체" || row.detail === selection.detail)
  && (!selection.maker || row.maker === selection.maker)
  && (!selection.model || row.model === selection.model));

export function getInitialHeavySelection(): HeavySelection {
  const params = new URLSearchParams(window.location.search);
  const formCandidate = params.get("heavy_form");
  const form = formCandidate && heavyFormOrder.includes(formCandidate) ? formCandidate : null;
  const detailCandidate = params.get("heavy_detail");
  const detail = form && detailCandidate && heavyDetailsFor(form).includes(detailCandidate) ? detailCandidate : null;
  const makerCandidate = params.get("heavy_maker");
  const maker = form && detail && makerCandidate && heavyRowsFor({ form, detail }).some((row) => row.maker === makerCandidate) ? makerCandidate : null;
  const modelCandidate = params.get("heavy_model");
  const model = form && detail && maker && modelCandidate && heavyRowsFor({ form, detail, maker }).some((row) => row.model === modelCandidate) ? modelCandidate : null;
  return { form, detail, maker, model };
}

export function replaceHeavyParams(selection: HeavySelection) {
  const url = new URL(window.location.href);
  const values = [["heavy_form", selection.form], ["heavy_detail", selection.detail], ["heavy_maker", selection.maker], ["heavy_model", selection.model]] as const;
  values.forEach(([key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
