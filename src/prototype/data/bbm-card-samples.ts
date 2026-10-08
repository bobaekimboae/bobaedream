// QF-091: 개발 시안 카드의 등록연월·주행거리·연료·마력과 인증중고차·1년보증 배지를 채운다.
// 우리 매물 데이터에 없는 값(월·년형·마력·배지)을 매물 id 로 정해지는 샘플 값으로 채운다. 실제 매물 정보가 아니다.
type SampleSource = { id: number; specs: string[]; filter?: { year: number; mileage: number; fuel: string }; badges?: string[]; uiTest?: unknown; virtualCategory?: { category?: string; categoryDetail?: string; berths?: number; beds?: number; seats?: number }; bike?: { genre: string; displacement: number }; truck?: { trailer?: { load: string; length: string; axles: string }; format?: string; subtype?: string; load?: string; horsepower?: number; drive?: string }; heavy?: { hours?: number }; cardSpec?: string[] };

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

// 트럭 유형을 스펙 줄 맨 앞에(바이크 장르·캠핑카 구분처럼, 2026-10-08 사용자 지시): 카고(화물)트럭 → 카고트럭
// 384px 한 줄에 들어가게 짧은 유형명으로(크레인·고소작업차 → 크레인/고소작업차 등)
const truckKindShort: Record<string, string> = {
  "카고(화물)트럭": "카고트럭", "윙바디·탑차": "윙바디", "냉장·냉동차": "냉동차", "탱크로리": "탱크로리", "버스": "버스",
  "캠핑카·카라반": "캠핑카", "환경·폐기물차": "청소차", "특수차": "특수차", "견인·운송차": "견인차", "트랙터 헤드": "트랙터", "트레일러": "트레일러",
};
// 특장차(크레인·고소작업·믹서·탱크로리·청소차·특수차·견인차)는 유형명이 길어 붙이지 않는다(2026-10-08 「특장은 유형 빼자」). 일반 트럭·버스·캠핑카·트랙터·트레일러만
const truckKindLabel = (format?: string, subtype = "") =>
  format === "덤프·믹서" ? (/믹서/.test(subtype) ? "" : "덤프트럭")
  : ["크레인·고소작업차", "탱크로리", "환경·폐기물차", "특수차", "견인·운송차"].includes(format ?? "") ? ""
  : truckKindShort[format ?? ""] ?? format ?? "";

export function bbmCardSpec(source: SampleSource, withPower = true) {
  // 지시값을 그대로 보여줄 매물(등록연월·주행 정확값)
  if (source.cardSpec?.length) return source.cardSpec.join(" · ");
  // 트레일러: 적재량 · 길이 · 축(엔진 없음)
  if (source.truck?.trailer) return [truckKindLabel(source.truck.format, source.truck.subtype), `${String(yearFromSpecs(source) % 100).padStart(2, "0")}년${String(((source.id * 5) % 12) + 1).padStart(2, "0")}월`, source.truck.trailer.load.replace(/^적재 ([\d.]+)톤$/, (_, t: string) => `적재 ${Math.round(Number(t) * 1000).toLocaleString("ko-KR")}kg`), source.truck.trailer.length, source.truck.trailer.axles].join(" · ");
  // 캠핑카: 바이크 장르처럼 구분을 맨 앞에(모터홈 · 카라반 · 트레일러, 2026-10-08) + 등록연월 · 주행 · 연료. 엔진 없는 카라반·트레일러는 등록연월 · 견인형
  if (source.virtualCategory?.category === "캠핑카") {
    const year = yearFromSpecs(source);
    const now = new Date();
    // 올해 연식은 이번 달을 넘지 않게(미래 등록월 방지)
    const month = Math.min(((source.id * 5) % 12) + 1, year >= now.getFullYear() ? now.getMonth() + 1 : 12);
    const registered = `${String(year % 100).padStart(2, "0")}년${String(month).padStart(2, "0")}월`;
    // 취침 인원을 끝에 붙인다: 취침 4인(2026-10-08 사용자 지시, 해외 표기 Sleeps 4 · 4 berth · 4 Schlafplätze와 같은 인원 기준)
    // 모터홈은 「승차 6인 · 취침 3인」, 카라반·트레일러는 승차 없이 「취침 4인」(2026-10-08 사용자 지시)
    const berths = [
      ...(source.virtualCategory.seats && source.virtualCategory.categoryDetail === "모터홈" ? [`승차 ${source.virtualCategory.seats}인`] : []),
      ...(source.virtualCategory.berths ? [`취침 ${source.virtualCategory.berths}인`] : []),
    ];
    const kind = source.virtualCategory.categoryDetail ?? "모터홈";
    return (kind !== "모터홈" ? [kind, registered, "견인형", ...berths] : [kind, registered, mileageLabel(source), fuelLabel(source), ...berths]).join(" · ");
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
    // 적재는 kg(1톤 → 적재 1,000kg), 순서 마력 · 적재 · 차축(2026-10-08 사용자 지시)
    const tons = load.match(/^([\d.]+)톤$/);
    const loadLabel = tons ? `적재 ${Math.round(Number(tons[1]) * 1000).toLocaleString("ko-KR")}kg` : load && load !== "기타" && load.replace("×", "x") !== source.truck.drive ? load : "";
    const power = [source.truck.horsepower ? `${source.truck.horsepower}마력` : "", loadLabel, source.truck.drive ?? ""].filter(Boolean);
    return [truckKindLabel(source.truck.format, source.truck.subtype), `${String(year % 100).padStart(2, "0")}년${String(month).padStart(2, "0")}월`, mileageLabel(source), fuelLabel(source), ...power].filter(Boolean).join(" · ");
  }
  // 바이크 연식은 「20년식」(연월 모를 때 표기, 2026-10-08 「바이크도 년식」)
  if (source.bike) return [source.bike.genre, `${String(yearFromSpecs(source) % 100).padStart(2, "0")}년식`, mileageLabel(source), `${source.bike.displacement.toLocaleString("ko-KR")}cc`].join(" · ");
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
  return source.badges?.length ? source.badges : badgePool[source.id % badgePool.length];
}
