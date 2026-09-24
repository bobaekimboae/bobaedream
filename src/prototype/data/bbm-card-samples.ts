// QF-091: 개발 시안 원본 카드 모양("YY년MM월(YY년형) · N만km · 연료 · N마력", 인증중고차·1년보증 배지)을 맞추려고
// 우리 매물 데이터에 없는 값(월·년형·마력·배지)을 매물 id 로 정해지는 샘플 값으로 채운다. 실제 매물 정보가 아니다.
type SampleSource = { id: number; specs: string[]; filter?: { year: number; mileage: number; fuel: string }; badges?: string[] };

const horsepowerPool = [190, 204, 245, 258, 150, 170, 305, 367, 122, 184, 225, 272];
const badgePool: string[][] = [["인증중고차", "1년보증"], ["인증중고차", "1년보증"], [], ["1년보증"], ["인증중고차"], []];

const yearFromSpecs = (source: SampleSource) => {
  if (source.filter?.year) return source.filter.year;
  const match = source.specs.join(" ").match(/(\d{2,4})년/);
  if (!match) return 2020;
  const value = Number(match[1]);
  return value < 100 ? 2000 + value : value;
};

const mileageLabel = (source: SampleSource) => {
  const km = source.filter?.mileage ?? Number((source.specs.find((spec) => /km/.test(spec)) ?? "0").replace(/[^\d]/g, ""));
  if (km >= 10000) return `${Math.round(km / 10000)}만km`;
  if (km >= 1000) return `${Math.round(km / 1000)}천km`;
  return `${km}km`;
};

const fuelLabel = (source: SampleSource) => {
  const fuel = source.filter?.fuel ?? source.specs.find((spec) => /가솔린|디젤|LPG|전기|하이브리드/.test(spec)) ?? "가솔린";
  return fuel === "하이브리드" ? "가솔린 하이브리드" : fuel;
};

export function bbmCardSpec(source: SampleSource, withPower = true) {
  const year = yearFromSpecs(source);
  const month = String(((source.id * 5) % 12) + 1).padStart(2, "0");
  // 등록 연도 = 연식 - (id 가 짝수면 1년): 원본처럼 "15년07월(16년형)" 모양
  const registered = source.id % 2 === 0 ? year - 1 : year;
  const parts = [`${String(registered % 100).padStart(2, "0")}년${month}월(${String(year % 100).padStart(2, "0")}년형)`, mileageLabel(source), fuelLabel(source)];
  if (withPower) parts.push(`${horsepowerPool[source.id % horsepowerPool.length]}마력`);
  return parts.join(" · ");
}

export function bbmCardBadges(source: SampleSource) {
  return source.badges?.length ? source.badges : badgePool[source.id % badgePool.length];
}
