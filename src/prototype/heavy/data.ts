export type HeavyInventoryRow = {
  id: string;
  form: string;
  maker: string;
  model: string;
  year: number;
  price: number | null;
  hours: number;
  region: string;
  evaluation: string;
  detail: string;
};

export type HeavySelection = {
  form: string | null;
  detail: string | null;
  maker: string | null;
  model: string | null;
};

export const emptyHeavySelection: HeavySelection = { form: null, detail: null, maker: null, model: null };

export const heavyFormOrder = [
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

export const heavyDetailOptions: Record<string, string[]> = {
  "유압셔블(굴삭기)": ["6~9t (0.25) 급", "10~17t (0.45) 급", "18~25t (0.7) 급", "26t (1.0) 이상"],
  "미니 유압셔블(미니굴삭기)": ["2t 미만", "2~3t 미만", "3~4t 미만", "4~6t 미만"],
  "타이어셔블(휠로더)": ["일반 토목용", "쇄석/광산용", "농업/임업/축산용", "습지/논", "터널 사양", "제설 사양"],
  "롤러(다짐기)": ["토공용 진동롤러", "포장용 진동롤러", "타이어 롤러", "머캐덤 롤러", "핸드가이드 롤러", "진동 플레이트 컴팩터", "램머(콤팩터)"],
  "임업기계": ["6t (미니) 미만", "6~9t (0.25) 급", "10~17t (0.45) 급", "18~25t (0.7) 급", "26t (1.0) 이상"],
};

type HeavyTuple = readonly [string, string, string, string, number, number | null, number, string, string, string];
const rows: HeavyTuple[] = [
  ["HV001","유압셔블(굴삭기)","고마쓰","PC200-8",2018,72000000,6240,"경기","A","18~25t (0.7) 급"],
  ["HV002","유압셔블(굴삭기)","히타치건기","ZX200-5G",2020,98000000,4180,"충남","A+","18~25t (0.7) 급"],
  ["HV003","유압셔블(굴삭기)","고베루코건기","SK210LC-10",2019,87000000,5330,"경북","A","18~25t (0.7) 급"],
  ["HV004","유압셔블(굴삭기)","캐터필러","320GC",2021,145000000,2890,"경기","A+","18~25t (0.7) 급"],
  ["HV005","유압셔블(굴삭기)","히타치건기","ZX350LCK",2017,null,8120,"부산","B","26t (1.0) 이상"],
  ["HV006","유압셔블(굴삭기)","스미토모건기","SH210-6",2018,110000000,6770,"전남","A","18~25t (0.7) 급"],
  ["HV007","유압셔블(굴삭기)","가토제작소","HD820-8",2022,152000000,1980,"충북","A+","18~25t (0.7) 급"],
  ["HV008","유압셔블(굴삭기)","볼보","EC300E",2020,138000000,3650,"강원","A","26t (1.0) 이상"],
  ["HV009","미니 유압셔블(미니굴삭기)","구보타","U-30-6",2022,31000000,1180,"경기","A+","3~4t 미만"],
  ["HV010","미니 유압셔블(미니굴삭기)","얀마","VIO35-6",2021,34500000,1740,"충북","A","3~4t 미만"],
  ["HV011","미니 유압셔블(미니굴삭기)","다케우치제작소","TB260",2020,52000000,2650,"경남","A","4~6t 미만"],
  ["HV012","미니 유압셔블(미니굴삭기)","고마쓰","PC18MR-5",2023,26500000,620,"강원","A+","2t 미만"],
  ["HV013","타이어셔블(휠로더)","볼보","L90H",2021,165000000,3100,"경기","A","일반 토목용"],
  ["HV014","타이어셔블(휠로더)","캐터필러","950M",2018,125000000,7210,"충남","B","쇄석/광산용"],
  ["HV015","타이어셔블(휠로더)","고마쓰","WA380-8",2022,null,2460,"전북","A+","제설 사양"],
  ["HV016","불도저","캐터필러","D6R",2016,130000000,9450,"경북","B","전체"],
  ["HV017","불도저","고마쓰","D65PX-18",2020,185000000,4870,"전남","A","전체"],
  ["HV018","롤러(다짐기)","사카이중공업","SV512D",2019,68000000,2860,"경기","A","토공용 진동롤러"],
  ["HV019","롤러(다짐기)","보막","BW151AC",2021,76000000,1420,"충남","A+","포장용 진동롤러"],
  ["HV020","아스팔트 피니셔","스미토모건기","HA60W-8",2018,210000000,3980,"경기","A","전체"],
  ["HV021","그레이더","캐터필러","140K",2017,195000000,6840,"강원","A","전체"],
  ["HV022","크레인","가토제작소","KR-25H",2019,240000000,3450,"경기","A+","전체"],
  ["HV023","크레인","고베루코건기","7055",2016,null,7820,"부산","B","전체"],
  ["HV024","캐리어덤프(크롤러덤프)","모로오카","MST-2200VD",2020,155000000,2580,"경남","A","전체"],
  ["HV025","캐리어덤프(크롤러덤프)","얀마","C50R-5A",2022,88000000,1320,"충북","A+","전체"],
  ["HV026","환경기계(파쇄·선별)","고마쓰","BR380JG-1",2017,280000000,6360,"경기","A","전체"],
  ["HV027","환경기계(파쇄·선별)","모로오카","MC-2000",2019,225000000,4120,"강원","A","전체"],
  ["HV028","기초공사 기계","닛폰샤료제조","DH658",2015,320000000,10400,"경기","B","전체"],
  ["HV029","임업기계","고마쓰","PC138US",2021,190000000,2750,"강원","A+","10~17t (0.45) 급"],
  ["HV030","자주식 고소작업차","아이치코퍼레이션","SP14D",2022,55000000,980,"경기","A+","전체"],
];

export const heavyInventory: HeavyInventoryRow[] = rows.map(([id, form, maker, model, year, price, hours, region, evaluation, detail]) => ({ id, form, maker, model, year, price, hours, region, evaluation, detail }));
export const heavyDetailsFor = (form: string | null) => form ? heavyDetailOptions[form] ?? ["전체"] : [];

export const heavyRowsFor = (selection: Partial<HeavySelection>) => heavyInventory.filter((row) =>
  (!selection.form || row.form === selection.form)
  && (!selection.detail || selection.detail === "전체" || row.detail === selection.detail)
  && (!selection.maker || row.maker === selection.maker)
  && (!selection.model || row.model === selection.model));

export function getInitialHeavySelection(): HeavySelection {
  const params = new URLSearchParams(window.location.search);
  const formCandidate = params.get("heavy_form");
  const form = heavyFormOrder.includes(formCandidate as typeof heavyFormOrder[number]) ? formCandidate : null;
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
