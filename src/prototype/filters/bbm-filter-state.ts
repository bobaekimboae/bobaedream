// QF-076: 개발 시안형 필터 공유 상태(사이드바·상단 칩·모달·바텀시트·전체 필터 화면·퀵필터가 같은 값).
// 목록 화면의 filters(ChoTotFilterState).bbm 에 들어가며, 제조사·모델·세대·등급은 기존 퀵필터 상태를 그대로 쓴다.
// 선택지 목록·문구는 원본 전수 수집(docs/bbm-filter-spec.md) 기준. 매물 수는 우리 시안 데이터로 계산한다.

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
};

export const emptyBbmFilters: BbmFilterValues = { checks: {}, ranges: {}, priceTab: "일반", adPeriod: "전체", keyword: "" };

// ── 값 바꾸기(항상 새 객체를 돌려준다)
export const toggleBbmCheck = (value: BbmFilterValues, key: BbmCheckKey, option: string): BbmFilterValues => {
  const current = value.checks[key] ?? [];
  const next = current.includes(option) ? current.filter((item) => item !== option) : [...current, option];
  return { ...value, checks: { ...value.checks, [key]: next } };
};
export const setBbmChecks = (value: BbmFilterValues, key: BbmCheckKey, options: string[]): BbmFilterValues => ({ ...value, checks: { ...value.checks, [key]: options } });
export const setBbmRange = (value: BbmFilterValues, key: BbmRangeKey, range: BbmRange): BbmFilterValues => ({ ...value, ranges: { ...value.ranges, [key]: range } });
export const clearBbmKey = (value: BbmFilterValues, key: BbmCheckKey | BbmRangeKey | "adPeriod" | "keyword"): BbmFilterValues => {
  if (key === "adPeriod") return { ...value, adPeriod: "전체" };
  if (key === "keyword") return { ...value, keyword: "" };
  const checks = { ...value.checks };
  const ranges = { ...value.ranges };
  delete checks[key as BbmCheckKey];
  delete ranges[key as BbmRangeKey];
  return { ...value, checks, ranges };
};

// ── 선택 개수(QF-074 배지): 체크는 고른 개수만큼, 범위는 최소·최대 중 하나라도 있으면 1, 광고기간·검색어는 각 1
export const countBbmSelections = (value: BbmFilterValues) =>
  Object.values(value.checks).reduce((sum, list) => sum + (list?.length ?? 0), 0)
  + Object.values(value.ranges).filter((range) => range && (range.min || range.max || range.preset)).length
  + (value.adPeriod !== "전체" ? 1 : 0)
  + (value.keyword.trim() ? 1 : 0);

// ── 우리 시안 매물(Car)에서 필터 값 뽑기. 데이터에 없는 속성은 비워 두어 매물 수 0(비활성)이 되게 한다
export type BbmCarLike = {
  title: string;
  sellerType: string;
  photos: number;
  place?: string;
  filter?: { year: number; seats: string; mileage: number; transmission: string; fuel: string; color: string; origin: string; body: string; video: boolean };
};
const bodyTypeByBody: Record<string, string> = { 세단: "승용", 해치백: "승용", SUV: "SUV", 승합: "승합", 스포츠카: "쿠페", 쿠페: "쿠페", 컨버터블: "컨버터블", 화물: "화물" };
const fuelByFuel: Record<string, string> = { 가솔린: "가솔린", 디젤: "디젤", LPG: "LPG", 전기: "전기", 하이브리드: "가솔린 하이브리드" };
const transmissionByValue: Record<string, string> = { 오토: "자동", 자동: "자동", 수동: "수동" };
const colorByValue: Record<string, string> = { 흰색: "흰색", 검정: "검정색", 회색: "쥐색", 은색: "은색", 빨강: "빨간색", 노랑: "노란색", 파랑: "청색", 초록: "녹색" };

export function bbmCarChecks(car: BbmCarLike): Partial<Record<BbmCheckKey, string[]>> {
  const data = car.filter;
  const values: Partial<Record<BbmCheckKey, string[]>> = {
    sellerKind: car.sellerType === "딜러" ? ["딜러"] : car.sellerType === "개인" ? ["개인"] : [],
    region: car.place ? [car.place.split(" ")[0]] : [],
    features: [car.photos > 0 ? "사진" : null, data?.video ? "영상" : null].filter((item): item is string => Boolean(item)),
  };
  if (!data) return values;
  values.bodyType = bodyTypeByBody[data.body] ? [bodyTypeByBody[data.body]] : ["기타"];
  values.seats = data.seats ? [data.seats.replace(" 이상", "")] : [];
  values.fuel = fuelByFuel[data.fuel] ? [fuelByFuel[data.fuel]] : ["기타"];
  values.transmission = transmissionByValue[data.transmission] ? [transmissionByValue[data.transmission]] : [];
  values.exteriorColor = colorByValue[data.color] ? [colorByValue[data.color]] : ["기타"];
  return values;
}

// 선택지별 매물 수(우리 데이터 기준)
export function countBbmOption(cars: BbmCarLike[], key: BbmCheckKey, option: string) {
  return cars.filter((car) => bbmCarChecks(car)[key]?.includes(option)).length;
}

// 목록 매칭: 체크 항목은 같은 항목 안 OR, 항목 사이 AND. 우리 데이터에 없는 항목을 고르면 0대
export function matchesBbmFilters(car: BbmCarLike, value: BbmFilterValues | undefined) {
  if (!value) return true;
  const carChecks = bbmCarChecks(car);
  for (const [key, selected] of Object.entries(value.checks) as Array<[BbmCheckKey, string[] | undefined]>) {
    if (!selected?.length) continue;
    const own = carChecks[key] ?? [];
    if (!selected.some((option) => own.includes(option))) return false;
  }
  const data = car.filter;
  const inRange = (range: BbmRange | undefined, actual: number | undefined) => {
    if (!range || (!range.min && !range.max)) return true;
    if (actual === undefined) return false;
    const min = range.min ? Number(range.min.replace(/[^\d.]/g, "")) : -Infinity;
    const max = range.max ? Number(range.max.replace(/[^\d.]/g, "")) : Infinity;
    return actual >= min && actual <= max;
  };
  if (!inRange(value.ranges.mileage, data?.mileage)) return false;
  if (value.ranges.year && (value.ranges.year.min || value.ranges.year.max)) {
    const year = data?.year;
    const toYear = (text: string) => Number(text.slice(0, 4));
    if (year === undefined) return false;
    if (value.ranges.year.min && year < toYear(value.ranges.year.min)) return false;
    if (value.ranges.year.max && year > toYear(value.ranges.year.max)) return false;
  }
  // 우리 데이터에 없는 제원(출력·연비·배기량·중량·크기·전기차 거리)을 범위로 고르면 0대
  for (const key of ["power", "efficiency", "displacement", "weight", "length", "width", "height", "evRange"] as BbmRangeKey[]) {
    if (!inRange(value.ranges[key], undefined)) return false;
  }
  if (value.keyword.trim() && !`${car.title}`.includes(value.keyword.trim())) return false;
  return true;
}
