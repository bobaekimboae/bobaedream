// QF-091: 개발 시안 카드의 등록연월·주행거리·연료·마력과 인증중고차·1년보증 배지를 채운다.
// 우리 매물 데이터에 없는 값(월·년형·마력·배지)을 매물 id 로 정해지는 샘플 값으로 채운다. 실제 매물 정보가 아니다.
type SampleSource = { id: number; title?: string; trim?: string; specs: string[]; filter?: { year: number; mileage: number; fuel: string }; badges?: string[]; uiTest?: unknown; virtualCategory?: { category?: string; categoryDetail?: string; berths?: number; beds?: number; seats?: number }; bike?: { genre: string; displacement: number; scenarioVersion?: string }; truck?: { trailer?: { load: string; length: string; axles: string; reg?: string }; load?: string; horsepower?: number; drive?: string }; heavy?: { hours?: number }; cardSpec?: string[] };

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
  // 「가솔린 하이브리드」 → 「하이브리드」로 축약(2026-10-08)
  return fuel;
};

// 연식만 있는 항목(24년식 · 18년형 · 2017년식)은 숫자 4자리로 통일하고, 년월 동시 표기(24년08월 · 17년10월(18년형))는 그대로 둔다(2026-10-10 「년월 동시 표기 말고는 연식은 숫자 2025 방식으로」)
const yearOnlyToNumber = (text: string) => text.split(" · ").map((part) => {
  const match = part.match(/^(\d{2}|\d{4})년[식형]$/);
  return match ? (match[1].length === 2 ? `20${match[1]}` : match[1]) : part;
}).join(" · ");

export function bbmCardSpec(source: SampleSource, withPower = true) {
  return yearOnlyToNumber(bbmCardSpecRaw(source, withPower));
}

function bbmCardSpecRaw(source: SampleSource, withPower = true) {
  // 지시값을 그대로 보여줄 매물(등록연월·주행 정확값)
  // 주행거리는 정확값(56,067km)도 축약(6만km · 4천km)한다(2026-10-08 「주행거리는 축약해라」)
  if (source.cardSpec?.length) return source.cardSpec.map((part) => /^[\d,]+km$/.test(part) ? mileageLabel({ ...source, filter: { year: 0, fuel: "", mileage: Number(part.replace(/[^\d]/g, "")) } }) : part).join(" · ");
  // 트레일러: 적재량 · 길이 · 축(엔진 없음)
  // 트레일러: 등록연월 · 적재 · 축수 · 길이(2026-10-10 「트레일러는 적재도 추가, 축 앞에」), 목록형·피드형 모두 한 줄
  if (source.truck?.trailer) return [source.truck.trailer.reg ?? `${String(yearFromSpecs(source) % 100).padStart(2, "0")}년${String(((source.id * 5) % 12) + 1).padStart(2, "0")}월`, source.truck.trailer.load, source.truck.trailer.axles, source.truck.trailer.length].filter(Boolean).join(" · ");
  // 캠핑카: 바이크 장르처럼 구분을 맨 앞에(모터홈 · 카라반 · 트레일러, 2026-10-08) + 등록연월 · 주행 · 연료. 엔진 없는 카라반·트레일러는 등록연월 · 취침(「견인형」은 2026-10-08 뺌)
  if (source.virtualCategory?.category === "캠핑카") {
    const year = yearFromSpecs(source);
    const now = new Date();
    // 올해 연식은 이번 달을 넘지 않게(미래 등록월 방지)
    const month = Math.min(((source.id * 5) % 12) + 1, year >= now.getFullYear() ? now.getMonth() + 1 : 12);
    const registered = `${String(year % 100).padStart(2, "0")}년${String(month).padStart(2, "0")}월`;
    // 취침 인원을 끝에 붙인다: 취침 4인(2026-10-08 사용자 지시, 해외 표기 Sleeps 4 · 4 berth · 4 Schlafplätze와 같은 인원 기준)
    // 모터홈은 「승차 6명 · 취침 3명」, 카라반·트레일러는 승차 없이 「취침 4명」(2026-10-08 사용자 지시)
    const berths = [
      ...(source.virtualCategory.seats && source.virtualCategory.categoryDetail === "모터홈" ? [`승차 ${source.virtualCategory.seats}명`] : []),
      ...(source.virtualCategory.berths ? [`취침 ${source.virtualCategory.berths}명`] : []),
    ];
    const kind = source.virtualCategory.categoryDetail ?? "모터홈";
    return (kind !== "모터홈" ? [kind, registered, ...berths] : [kind, registered, mileageLabel(source), fuelLabel(source), ...berths]).join(" · ");
  }
  if (source.uiTest || source.virtualCategory) return source.specs.join(" · ");
  // 바이크(2026-10-07 사용자 지시): 장르 · 연식 · 주행 · 배기량 (예: 네이키드 · 2023 · 2만km · 2,300cc)
  // 건설기계: 주행거리(km) 대신 사용시간(「h」 대신 「시간」, 2026-10-08 사용자 지시)
  if (source.heavy) {
    const year = yearFromSpecs(source);
    const month = ((source.id * 5) % 12) + 1;
    return [`${String(year % 100).padStart(2, "0")}년${String(month).padStart(2, "0")}월`, `${(source.heavy.hours ?? 0).toLocaleString("ko-KR")}시간`, fuelLabel(source)].join(" · ");
  }
  // 트럭(엔카 화물·특장 목록 규칙): 연식 · 주행 · 연료 + 마력 · 적재용량 · 차축 구성(2026-10-08, 목록에서는 둘째 줄)
  if (source.truck) {
    const year = yearFromSpecs(source);
    const month = ((source.id * 5) % 12) + 1;
    const load = source.truck.load ?? "";
    // 적재는 톤으로 축약(적재 1톤 · 적재 2.5톤), 순서 마력 · 적재 · 차축(2026-10-08 사용자 지시)
    const tons = load.match(/^([\d.]+)톤$/);
    const loadLabel = tons ? `적재 ${tons[1]}톤` : load && load !== "기타" && load.replace("×", "x") !== source.truck.drive ? load : "";
    // 제목(차명 + 등급)에 이미 있는 차축은 뺀다(2026-10-08 「축약」). 적재는 제목에 톤수가 있어도 항상 넣는다(2026-10-10 「트럭들도 적재 기존처럼 추가」)
    const titleText = `${source.title ?? ""} ${source.trim ?? ""}`.replace(/×/g, "x");
    const inTitle = (part: string) => Boolean(part) && titleText.includes(part.replace(/^적재 /, "").replace(/×/g, "x"));
    const power = [source.truck.horsepower ? `${source.truck.horsepower}마력` : "", loadLabel, inTitle(source.truck.drive ?? "") ? "" : source.truck.drive ?? ""].filter(Boolean);
    return [`${String(year % 100).padStart(2, "0")}년${String(month).padStart(2, "0")}월`, mileageLabel(source), fuelLabel(source), ...power].filter(Boolean).join(" · ");
  }
  // 바이크 스펙 줄은 장르 · 연식(숫자만) · 주행 · 배기량(2026-10-08 「2002 숫자만 표기하자」)
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
  // 지시값으로 넣은 매물(cardSpec)은 샘플 배지를 붙이지 않는다(2026-10-07 사용자 지시 「배지 빼고」)
  if (source.cardSpec?.length) return source.badges ?? [];
  if (source.virtualCategory) return source.badges ?? [];
  // 트럭 트레일러 시트 매물(v10)은 샘플 배지를 붙이지 않는다
  if (source.truck?.trailer) return source.badges ?? [];
  // 바이크 시트 매물(v08)은 실제 매물 유형만(라이트바겐 인증중고 = 「인증중고차」), 샘플 배지를 붙이지 않는다
  if (source.bike?.scenarioVersion === "v08") return source.badges ?? [];
  return source.badges?.length ? source.badges : badgePool[source.id % badgePool.length];
}
