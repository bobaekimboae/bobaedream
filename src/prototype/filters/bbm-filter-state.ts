// QF-076·QF-089·QF-090: 개발 시안형 필터 공유 상태(사이드바·상단 칩·모달·바텀시트·전체 필터 화면·퀵필터가 같은 값).
// 목록 화면의 filters(ChoTotFilterState).bbm 에 들어가며, 제조사·모델·세대·등급은 기존 퀵필터 상태를 그대로 쓴다.
// 원본처럼 고르는 즉시 조건이 걸린다. 우리 데이터(Car.filter 등)에 값이 있는 항목만 목록을 거르고(BBM_DATA_*), 나머지는 선택 모양만 남는다.

export type BbmCheckKey =
  | "bodyType" | "carClass" | "region" | "complex" | "seats" | "drive" | "history" | "sellerKind" | "saleType"
  | "exteriorColor" | "seatColor" | "seatFinish" | "fuel" | "transmission" | "options" | "features";
export type BbmRangeKey = "year" | "mileage" | "price" | "power" | "efficiency" | "displacement" | "weight" | "length" | "width" | "height" | "evRange";
export type BbmRange = { min: string; max: string; preset?: string };
export type BbmPriceTab = "일반" | "리스 / 렌트";

export type BbmFilterValues = {
  checks: Partial<Record<BbmCheckKey, string[]>>;
  ranges: Partial<Record<BbmRangeKey, BbmRange>>;
  priceTab: BbmPriceTab;
  adPeriod: string;
  keyword: string;
  // 적용 칩 순서(건 순서대로). "check:키:선택지" · "range:키" · "ad" · "keyword"
  order?: string[];
  // 최근검색기록 숫자(원본: 첫 조건을 걸면 1이 되고 그 뒤로는 그대로)
  history?: number;
};

export const emptyBbmFilters: BbmFilterValues = { checks: {}, ranges: {}, priceTab: "일반", adPeriod: "전체", keyword: "", order: [], history: 0 };

// 우리 데이터로 실제로 거르는 항목(QF-090)
export const BBM_DATA_CHECK_KEYS: BbmCheckKey[] = ["bodyType", "fuel", "transmission", "seats", "exteriorColor", "sellerKind", "region"];
export const BBM_DATA_RANGE_KEYS: BbmRangeKey[] = ["year", "mileage", "price"];
export const isBbmDataKey = (key: string) => (BBM_DATA_CHECK_KEYS as string[]).includes(key) || (BBM_DATA_RANGE_KEYS as string[]).includes(key);
// 항목 안에서도 우리 데이터에 있는 선택지만 거른다(판매자 구분은 딜러·개인만)
const dataOptions: Partial<Record<BbmCheckKey, string[]>> = { sellerKind: ["딜러", "개인"] };
export const isBbmDataOption = (key: BbmCheckKey, option: string) => isBbmDataKey(key) && (!dataOptions[key] || dataOptions[key]!.includes(option));

// ── 값 바꾸기(항상 새 객체를 돌려준다). 적용 칩 순서·최근검색기록도 함께 갱신
const withOrder = (value: BbmFilterValues, id: string, active: boolean): BbmFilterValues => {
  const order = (value.order ?? []).filter((item) => item !== id);
  return { ...value, order: active ? [...order, id] : order, history: active ? Math.max(value.history ?? 0, 1) : value.history ?? 0 };
};
export const rangeIsSet = (range: BbmRange | undefined) => Boolean(range && (range.min || range.max || range.preset));

export const toggleBbmCheck = (value: BbmFilterValues, key: BbmCheckKey, option: string): BbmFilterValues => {
  const current = value.checks[key] ?? [];
  const on = !current.includes(option);
  const next = on ? [...current, option] : current.filter((item) => item !== option);
  return withOrder({ ...value, checks: { ...value.checks, [key]: next } }, `check:${key}:${option}`, on);
};
export const setBbmChecks = (value: BbmFilterValues, key: BbmCheckKey, options: string[]): BbmFilterValues => {
  const order = (value.order ?? []).filter((item) => !item.startsWith(`check:${key}:`));
  return { ...value, checks: { ...value.checks, [key]: options }, order: [...order, ...options.map((option) => `check:${key}:${option}`)] };
};
export const setBbmRange = (value: BbmFilterValues, key: BbmRangeKey, range: BbmRange): BbmFilterValues =>
  withOrder({ ...value, ranges: { ...value.ranges, [key]: range } }, `range:${key}`, rangeIsSet(range));
export const setBbmAdPeriod = (value: BbmFilterValues, adPeriod: string): BbmFilterValues => withOrder({ ...value, adPeriod }, "ad", adPeriod !== "전체");
export const setBbmKeyword = (value: BbmFilterValues, keyword: string): BbmFilterValues => withOrder({ ...value, keyword }, "keyword", Boolean(keyword.trim()));
export const clearBbmKey = (value: BbmFilterValues, key: BbmCheckKey | BbmRangeKey | "adPeriod" | "keyword"): BbmFilterValues => {
  if (key === "adPeriod") return setBbmAdPeriod(value, "전체");
  if (key === "keyword") return setBbmKeyword(value, "");
  const checks = { ...value.checks };
  const ranges = { ...value.ranges };
  delete checks[key as BbmCheckKey];
  delete ranges[key as BbmRangeKey];
  const order = (value.order ?? []).filter((item) => !item.startsWith(`check:${key}:`) && item !== `range:${key}`);
  return { ...value, checks, ranges, order };
};
// 전체 해제(사이드바 초기화). 최근검색기록 숫자는 남긴다
export const resetBbmFilters = (value: BbmFilterValues): BbmFilterValues => ({ ...emptyBbmFilters, history: value.history ?? 0 });

// ── 선택 개수: 적용 칩 하나당 1
export const countBbmSelections = (value: BbmFilterValues) => bbmAppliedIds(value).length;
export function bbmAppliedIds(value: BbmFilterValues) {
  const alive = (id: string) => {
    if (id === "ad") return value.adPeriod !== "전체";
    if (id === "keyword") return Boolean(value.keyword.trim());
    const [kind, key, option] = id.split(":");
    if (kind === "check") return Boolean(value.checks[key as BbmCheckKey]?.includes(option));
    return rangeIsSet(value.ranges[key as BbmRangeKey]);
  };
  const ids = (value.order ?? []).filter(alive);
  // 순서 기록 없이 들어온 값(예전 상태)도 빠뜨리지 않는다
  for (const [key, list] of Object.entries(value.checks)) for (const option of list ?? []) if (!ids.includes(`check:${key}:${option}`)) ids.push(`check:${key}:${option}`);
  for (const [key, range] of Object.entries(value.ranges)) if (rangeIsSet(range) && !ids.includes(`range:${key}`)) ids.push(`range:${key}`);
  if (value.adPeriod !== "전체" && !ids.includes("ad")) ids.push("ad");
  if (value.keyword.trim() && !ids.includes("keyword")) ids.push("keyword");
  // 원본 적용 칩 순서(2026-09-24 실측, 거는 순서와 무관): 바디타입 → 연료 → 가격 / 연식 → 인승 → 판매자 구분 → 주행거리. 두 관찰을 함께 만족하는 고정 순서(chipOrder). 같은 항목 안은 건 순서
  const rank = (id: string) => {
    if (id === "ad") return 900;
    if (id === "keyword") return 901;
    const [kind, key] = id.split(":");
    return chipOrder.indexOf(`${kind}:${key}`);
  };
  return ids.map((id, index) => ({ id, index })).sort((x, y) => rank(x.id) - rank(y.id) || x.index - y.index).map((entry) => entry.id);
}
const chipOrder = ["check:bodyType", "check:carClass", "range:year", "check:region", "check:complex", "check:seats", "check:drive", "check:history", "check:sellerKind", "check:saleType", "check:exteriorColor", "check:seatColor", "check:seatFinish", "check:fuel", "check:transmission", "check:options", "check:features", "range:mileage", "range:price", "range:power", "range:efficiency", "range:displacement", "range:weight", "range:length", "range:width", "range:height", "range:evRange"];

// ── 범위 해석: 입력칸(최저·최대) 또는 구간 칩 → 숫자 범위
const num = (text: string) => { const n = Number(text.replace(/[^\d.]/g, "")); return Number.isFinite(n) && text.trim() ? n : null; };
const thisYear = 2026;
export function bbmPresetBounds(key: BbmRangeKey, preset: string): { min: number | null; max: number | null } {
  if (key === "price") {
    if (preset === "전체") return { min: null, max: null };
    if (preset === "9천만원~") return { min: 9000, max: null };
    const m = preset.match(/^(\d)천만원$/);
    return m ? { min: Number(m[1]) * 1000, max: Number(m[1]) * 1000 + 999 } : { min: null, max: null };
  }
  if (key === "year") {
    if (preset === "6년~") return { min: null, max: thisYear - 6 };
    const m = preset.match(/^~(\d)년$/);
    return m ? { min: thisYear - Number(m[1]), max: null } : { min: null, max: null };
  }
  const unit = (text: string) => text.includes("만") ? Number(text.replace(/[^\d.]/g, "")) * 10000 : text.includes("천") ? Number(text.replace(/[^\d.]/g, "")) * 1000 : num(text) ?? 0;
  const parts = preset.replace(/km|ps|cc|kg|km\/L/g, "").trim().split("~").map((part) => part.trim());
  if (key === "mileage") {
    // "1~2만km" 처럼 앞 숫자에 단위가 없으면 뒤 단위를 따른다
    const tailUnit = parts[1]?.includes("만") ? "만" : parts[1]?.includes("천") ? "천" : "";
    const first = parts[0] ? (/[만천]/.test(parts[0]) ? unit(parts[0]) : unit(parts[0] + tailUnit)) : null;
    return { min: parts[0] ? first : null, max: parts[1] ? unit(parts[1]) : null };
  }
  return { min: parts[0] ? num(parts[0]) : null, max: parts[1] ? num(parts[1]) : null };
}
export function bbmRangeBounds(key: BbmRangeKey, range: BbmRange | undefined) {
  if (!range) return { min: null, max: null };
  if (range.preset && !range.min && !range.max) return bbmPresetBounds(key, range.preset);
  if (key === "year") return { min: range.min ? num(range.min.slice(0, 4)) : null, max: range.max ? num(range.max.slice(0, 4)) : null };
  return { min: range.min ? num(range.min) : null, max: range.max ? num(range.max) : null };
}
// 연식 구간 칩 → 년·월 채움(원본: ~3년 → 2023년 9월 ~ 2026년 9월, 기준 2026년 9월)
export const BBM_TODAY = { year: 2026, month: 9 };
export function bbmYearPresetRange(preset: string): BbmRange {
  const now = `${BBM_TODAY.year}년 ${BBM_TODAY.month}월`;
  if (preset === "6년~") return { min: "", max: `${BBM_TODAY.year - 6}년 ${BBM_TODAY.month}월`, preset };
  const m = preset.match(/^~(\d)년$/);
  return m ? { min: `${BBM_TODAY.year - Number(m[1])}년 ${BBM_TODAY.month}월`, max: now, preset } : { min: "", max: "", preset };
}
// 주행거리 구간 칩 → km 입력칸 채움(원본: 5천~1만km → 5,000 · 10,000)
export function bbmMileagePresetRange(preset: string): BbmRange {
  const { min, max } = bbmPresetBounds("mileage", preset);
  return { min: min === null ? "" : min.toLocaleString("ko-KR"), max: max === null ? "" : max.toLocaleString("ko-KR"), preset };
}
// 가격 구간 칩 → 입력칸 자동 채움(원본: "3,000" · "3999")
export function bbmPricePresetRange(preset: string): BbmRange {
  const { min, max } = bbmPresetBounds("price", preset);
  if (min === null && max === null) return { min: "", max: "", preset };
  return { min: min === null ? "" : min.toLocaleString("ko-KR"), max: max === null ? "" : String(max), preset };
}

// ── 우리 시안 매물(Car)에서 필터 값 뽑기
export type BbmCarLike = {
  title: string;
  sellerType: string;
  photos: number;
  place?: string;
  price?: string;
  filter?: { year: number; seats: string; mileage: number; transmission: string; fuel: string; color: string; origin: string; body: string; video: boolean };
};
const bodyTypeByBody: Record<string, string> = { 세단: "승용", 해치백: "승용", 왜건: "승용", SUV: "SUV", RV: "RV", 승합: "승합", 스포츠카: "쿠페", 쿠페: "쿠페", 컨버터블: "컨버터블", 화물: "화물" };
const fuelByFuel: Record<string, string> = { 가솔린: "가솔린", 디젤: "디젤", LPG: "LPG", 전기: "전기", 하이브리드: "가솔린 하이브리드" };
const transmissionByValue: Record<string, string> = { 오토: "자동", 자동: "자동", CVT: "자동", 수동: "수동" };
const colorByValue: Record<string, string> = { 흰색: "흰색", 검정: "검정색", 회색: "쥐색", 은색: "은색", 빨강: "빨간색", 노랑: "노란색", 파랑: "청색", 초록: "녹색" };

export function bbmCarChecks(car: BbmCarLike): Partial<Record<BbmCheckKey, string[]>> {
  const data = car.filter;
  const values: Partial<Record<BbmCheckKey, string[]>> = {
    sellerKind: car.sellerType === "딜러" ? ["딜러"] : car.sellerType === "개인" ? ["개인"] : [],
    region: car.place ? [car.place.split(" ")[0]] : [],
  };
  if (!data) return values;
  values.bodyType = bodyTypeByBody[data.body] ? [bodyTypeByBody[data.body]] : ["기타"];
  values.seats = data.seats ? [data.seats.replace(" 이상", "")] : [];
  values.fuel = fuelByFuel[data.fuel] ? [fuelByFuel[data.fuel]] : ["기타"];
  values.transmission = transmissionByValue[data.transmission] ? [transmissionByValue[data.transmission]] : [];
  values.exteriorColor = colorByValue[data.color] ? [colorByValue[data.color]] : ["기타"];
  return values;
}
const carRangeValue = (car: BbmCarLike, key: BbmRangeKey) => key === "year" ? car.filter?.year : key === "mileage" ? car.filter?.mileage : key === "price" ? (car.price ? Number(car.price.replace(/[^\d]/g, "")) : undefined) : undefined;

// 목록 매칭: 우리 데이터가 있는 항목만. 체크는 같은 항목 안 OR, 항목 사이 AND. except 는 그 항목을 빼고(선택지 옆 매물 수 계산용)
export function matchesBbmFilters(car: BbmCarLike, value: BbmFilterValues | undefined, except?: string) {
  if (!value) return true;
  const carChecks = bbmCarChecks(car);
  for (const key of BBM_DATA_CHECK_KEYS) {
    if (key === except) continue;
    const selected = value.checks[key]?.filter((option) => isBbmDataOption(key, option));
    if (!selected?.length) continue;
    const own = carChecks[key] ?? [];
    if (!selected.some((option) => own.includes(option))) return false;
  }
  for (const key of BBM_DATA_RANGE_KEYS) {
    if (key === except) continue;
    const { min, max } = bbmRangeBounds(key, value.ranges[key]);
    if (min === null && max === null) continue;
    const actual = carRangeValue(car, key);
    if (actual === undefined) return false;
    if (min !== null && actual < min) return false;
    if (max !== null && actual > max) return false;
  }
  return true;
}

// 선택지별 매물 수: 다른 조건을 모두 반영하고 그 항목만 뺀 목록에서 센다(원본과 같은 방식)
export function countBbmOption(cars: BbmCarLike[], key: BbmCheckKey, option: string) {
  return cars.filter((car) => bbmCarChecks(car)[key]?.includes(option)).length;
}
