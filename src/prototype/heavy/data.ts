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

type BiglemonMapping = { form: string; detail: string; basis: "확인" | "미확인" };

const directBiglemonMapping: Record<string, BiglemonMapping> = {
  "heavy-001": { form: "유압셔블(굴삭기)", detail: "26t (1.0) 이상", basis: "확인" },
  "heavy-002": { form: "유압셔블(굴삭기)", detail: "26t (1.0) 이상", basis: "확인" },
  "heavy-003": { form: "유압셔블(굴삭기)", detail: "26t (1.0) 이상", basis: "확인" },
  "heavy-004": { form: "유압셔블(굴삭기)", detail: "26t (1.0) 이상", basis: "확인" },
  "heavy-005": { form: "유압셔블(굴삭기)", detail: "26t (1.0) 이상", basis: "확인" },
  "heavy-006": { form: "유압셔블(굴삭기)", detail: "26t (1.0) 이상", basis: "확인" },
  "heavy-007": { form: "유압셔블(굴삭기)", detail: "10~17t (0.45) 급", basis: "확인" },
  "heavy-008": { form: "유압셔블(굴삭기)", detail: "10~17t (0.45) 급", basis: "확인" },
  "heavy-009": { form: "유압셔블(굴삭기)", detail: "6~9t (0.25) 급", basis: "확인" },
  "heavy-010": { form: "유압셔블(굴삭기)", detail: "미확인", basis: "미확인" },
  "heavy-011": { form: "유압셔블(굴삭기)", detail: "6~9t (0.25) 급", basis: "확인" },
  "heavy-012": { form: "유압셔블(굴삭기)", detail: "6~9t (0.25) 급", basis: "확인" },
  "heavy-013": { form: "미니 유압셔블(미니굴삭기)", detail: "2~3t 미만", basis: "확인" },
  "heavy-014": { form: "미니 유압셔블(미니굴삭기)", detail: "3~4t 미만", basis: "확인" },
  "heavy-015": { form: "미니 유압셔블(미니굴삭기)", detail: "2~3t 미만", basis: "확인" },
  "heavy-016": { form: "유압셔블(굴삭기)", detail: "미확인", basis: "미확인" },
  "heavy-017": { form: "유압셔블(굴삭기)", detail: "10~17t (0.45) 급", basis: "확인" },
  "heavy-018": { form: "유압셔블(굴삭기)", detail: "10~17t (0.45) 급", basis: "확인" },
  "heavy-019": { form: "각종 버킷", detail: "전체", basis: "확인" },
  "heavy-020": { form: "유압 브레이커", detail: "전체", basis: "확인" },
  "heavy-021": { form: "어태치먼트(건설기계)", detail: "전체", basis: "확인" },
  "heavy-022": { form: "중고 부품", detail: "전체", basis: "확인" },
  "heavy-023": { form: "덤프차", detail: "전체", basis: "확인" },
  "heavy-024": { form: "덤프차", detail: "전체", basis: "확인" },
  "heavy-025": { form: "덤프차", detail: "전체", basis: "확인" },
  "heavy-026": { form: "덤프차", detail: "전체", basis: "확인" },
  "heavy-027": { form: "덤프차", detail: "전체", basis: "확인" },
  "heavy-028": { form: "덤프차", detail: "전체", basis: "확인" },
  "heavy-029": { form: "덤프차", detail: "전체", basis: "확인" },
  "heavy-030": { form: "덤프차", detail: "전체", basis: "확인" },
};

const makerNameToBiglemon: Record<string, string> = {
  "코벨코": "고베루코건기",
  "구보다": "구보타",
};

export const heavyInventory: HeavyInventoryRow[] = heavyScenarioV04.map((row) => {
  const mapping = directBiglemonMapping[row.scenario_id] ?? { form: "기타", detail: "미확인", basis: "미확인" as const };
  return {
    id: row.scenario_id,
    imageFile: row.image_file,
    title: row.title,
    form: mapping.form,
    maker: makerNameToBiglemon[row.manufacturer] ?? row.manufacturer,
    model: row.model,
    year: row.year,
    price: row.price_10k_krw * 10000,
    hours: row.operating_hours,
    region: row.region,
    evaluation: row.condition,
    detail: mapping.detail,
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
  };
});

export const heavyFormOrder = [...biglemonHeavyFormOrder];
export const heavyDetailOptions: Record<string, string[]> = Object.fromEntries(
  heavyFormOrder.map((form) => {
    const base = biglemonHeavyDetailOptions[form] ?? ["전체"];
    const hasUnverified = heavyInventory.some((row) => row.form === form && row.detail === "미확인");
    return [form, hasUnverified ? [...base, "미확인"] : base];
  })
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
