// QF-091: 개발 시안 카드의 등록연월·주행거리·연료·마력과 인증중고차·1년보증 배지를 채운다.
// 우리 매물 데이터에 없는 값(월·년형·마력·배지)을 매물 id 로 정해지는 샘플 값으로 채운다. 실제 매물 정보가 아니다.
type SampleSource = { id: number; specs: string[]; filter?: { year: number; mileage: number; fuel: string }; badges?: string[]; uiTest?: unknown; virtualCategory?: unknown; bike?: { genre: string; displacement: number } };

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
  // 9,500km 이상은 천 단위 반올림이 「10천km」가 되므로 만 단위로 올린다
  if (km >= 9500) return `${Math.round(km / 10000)}만km`;
  if (km >= 1000) return `${Math.round(km / 1000)}천km`;
  return `${km}km`;
};

const fuelLabel = (source: SampleSource) => {
  const fuel = source.filter?.fuel ?? source.specs.find((spec) => /가솔린|디젤|LPG|전기|하이브리드/.test(spec)) ?? "가솔린";
  return fuel === "하이브리드" ? "가솔린 하이브리드" : fuel;
};

export function bbmCardSpec(source: SampleSource, withPower = true) {
  if (source.uiTest || source.virtualCategory) return source.specs.join(" · ");
  // 바이크(2026-10-07 사용자 지시): 장르 · 연식 · 주행 · 배기량 (예: 네이키드 · 2023 · 2만km · 2,300cc)
  if (source.bike) return [source.bike.genre, String(yearFromSpecs(source)), mileageLabel(source), `${source.bike.displacement.toLocaleString("ko-KR")}cc`].join(" · ");
  const year = yearFromSpecs(source);
  const month = ((source.id * 5) % 12) + 1;
  // 목록은 등록연월만 간결하게 표시한다. 연형은 상세 정보에서 다룬다.
  const registered = source.id % 2 === 0 ? year - 1 : year;
  const parts = [`${String(registered % 100).padStart(2, "0")}년${String(month).padStart(2, "0")}월`, mileageLabel(source), fuelLabel(source)];
  if (withPower) parts.push(`${horsepowerPool[source.id % horsepowerPool.length]}마력`);
  return parts.join(" · ");
}

export function bbmCardBadges(source: SampleSource) {
  if (source.virtualCategory) return source.badges ?? [];
  return source.badges?.length ? source.badges : badgePool[source.id % badgePool.length];
}
