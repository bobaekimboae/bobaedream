// 리액트 src/prototype/detail/index.tsx 안의 export 안 된 계산(그대로 옮김). 원본을 고치면 여기도 같이 고친다.
import { allDeutschDealers, deutschDealerForCar } from "@proto/listing/deutsch-autoworld-directory";
import { bbmCardSpec, bbmSampleHorsepower } from "@proto/data/bbm-card-samples";
import { asset, detailPhotos, sellerLabel, type Car } from "@proto/data";
import { allSeoulAutoGalleryDealers as sagDealers } from "@proto/listing/seoul-auto-gallery-dealer-rail";
import { seoulAutoGalleryShopByNo } from "@proto/data/seoul-autogallery-shops-v01";

export const cleanValue = (value?: string | null) => (value && value !== "전체" && value !== "정보 없음" && value !== "기타" ? value : "");
export const SIZE_CLASS: [string, string[]][] = [
  ["대형", ["S클래스", "S-클래스", "7시리즈", "A8", "G90", "G80", "그랜저", "K9", "K8", "팬텀", "컨티넨탈", "마이바흐", "플라잉스퍼", "911 ", "타이칸", "파나메라", "CLS"]],
  ["중형", ["E클래스", "E-클래스", "5시리즈", "A6", "쏘나타", "K5", "G70", "i5", "ES"]],
  ["준중형", ["C클래스", "C-클래스", "3시리즈", "A4", "아반떼", "K3", "i4", "2시리즈", "M3", "M4"]],
];
/* 규칙으로 정한 추정 값(UI 검증용, 실제 제원 아님): 차종은 모델 이름으로, 인승은 바디타입으로, 시트 색상 · 제시번호는 매물 번호로 정한 가상 값 */
export function derivedFacts(car: Car, model: string, body: string) {
  const name = `${model} ${car.title}`;
  const sizeClass = SIZE_CLASS.find(([, keys]) => keys.some((k) => name.includes(k)))?.[0] ?? "";
  const sports = ["페라리", "람보르기니", "맥라렌"].includes(car.maker);
  const seats = sports && (body === "쿠페" || body === "컨버터블") ? 2 : body === "쿠페" || body === "컨버터블" ? 4 : body === "MPV" ? 7 : body === "밴" ? 9 : body ? 5 : 0;
  const seatColors = ["블랙", "베이지", "브라운", "그레이", "레드", "화이트"];
  const doors = body === "쿠페" || body === "컨버터블" ? 2 : body === "세단" ? 4 : body === "밴" ? 3 : body ? 5 : 0;
  return {
    sizeClass,
    doors: doors ? `${doors}도어` : "",
    seats: seats ? `${seats}인승` : "",
    seatColor: seatColors[car.id % seatColors.length],
    offerNo: `2026${String((car.id * 7919 + 1380883) % 10000000).padStart(7, "0")}`,
  };
}
export const NO_INFO = "정보 없음";
export const FACTS_VISIBLE = 6;
export type VehicleFactRow = [label: string, value: string];
export type VehicleFactGroup = { title: string; rows: VehicleFactRow[]; basic?: boolean };

/* BMW 공식 G80 M3 Competition M xDrive 제원(2021~2024형 공통 차체/파워트레인).
   가격은 BMW 코리아 2023년 12월 가격표 기준이며 매물 고유 이력과 혼합하지 않는다. */
export const BMW_M3_COMPETITION_XDRIVE_2023 = {
  trim: "M3 컴페티션 M xDrive",
  transmission: "8단 M 스텝트로닉 Drivelogic",
  series: "G80",
  body: "4도어 세단",
  seats: "5인승",
  fuel: "가솔린",
  origin: "독일",
  displacement: "2,993cc",
  compression: "9.3:1",
  power: "510마력(375kW) @ 6,250rpm",
  torque: "650N·m @ 2,750–5,500rpm",
  engine: "S58 3.0L 직렬 6기통 트윈터보",
  length: "4,794mm",
  width: "1,903mm",
  height: "1,434mm",
  wheelbase: "2,857mm",
  curbWeight: "1,780kg(DIN) / 1,855kg(EU)",
  fuelTank: "59L",
  frontBrakes: "M 컴파운드 벤틸레이티드 · 6피스톤",
  rearBrakes: "M 컴파운드 벤틸레이티드 · 1피스톤 플로팅",
  frontSuspension: "어댑티브 M 더블 조인트 스트럿",
  rearSuspension: "어댑티브 M 5링크",
  steering: "EPS M 서보트로닉 · 가변비 14.6:1",
  frontTyre: "275/35 ZR19",
  rearTyre: "285/30 ZR20",
  frontWheel: "9.5J × 19",
  rearWheel: "10.5J × 20",
  launchPrice: "13,770만원",
} as const;
/* 임시 화면 검수용 시나리오. 백엔드 차량 이력 API 연결 시 이 객체를 응답 필드로 교체한다. */
export const BMW_M3_HISTORY_MOCK = {
  firstRegisteredAt: "2023년 7월 25일",
  factory: "BMW 뮌헨 공장",
  releasedAt: "2023년 7월 21일",
  priceWithoutOptions: "13,770만원",
  priceWithOptions: "14,680만원",
  importType: "정식 수입",
  purchaseDealer: "BMW 코오롱 모터스",
  dealerSaleMethod: "위탁 판매",
  dealerFee: "없음",
  ownerChanges: "1회",
  repairHistory: "1건",
  accidentHistory: "0건",
  encumbrance: "없음",
} as const;
export const isBmwM3CompetitionXDrive = (car: Car, model: string) => car.maker === "BMW" && /M3/i.test(`${model} ${car.title} ${car.trim}`) && /xDrive|컴페티션|Competition/i.test(`${car.title} ${car.trim}`);

export function carFacts(car: Car): string[][] {
  if (car.deutschSource) return [
    ["제조사", car.maker], ["모델", car.modelGroup ?? car.title],
    ["연식", bbmCardSpec(car, false).split(" · ")[0]],
    ["주행거리", `${car.filter?.mileage.toLocaleString("ko-KR")}km`],
    ["연료", car.filter?.fuel || NO_INFO], ["변속기", car.filter?.transmission || NO_INFO],
    ["배기량", car.filter?.displacement ? `${car.filter.displacement.toLocaleString("ko-KR")}cc` : NO_INFO],
    ["최초등록일", car.deutschSource.firstRegistered || NO_INFO],
    ["외관 색상", car.filter?.color || NO_INFO], ["사고여부", car.deutschSource.accident],
  ];
  const fd = car.ferrariDetail;
  const yearText = bbmCardSpec(car, false).split(" · ")[0];
  const model = (car.modelGroup ?? car.title.replace(new RegExp(`^${car.maker}\\s*`), "")).trim();
  const m3 = isBmwM3CompetitionXDrive(car, model) ? BMW_M3_COMPETITION_XDRIVE_2023 : null;
  const or = (value?: string | null) => value || NO_INFO;
  const body = cleanValue(fd?.body ?? car.filter?.body);
  const dv = derivedFacts(car, model, body);
  /* 2026-10-14 「차량번호 · 제조사 · 모델 · 연식 · 출시가격 … 제시번호 모두 포함 후 더보기」: 값이 없는 항목도 줄은 두고 `정보 없음`.
     차량번호 · 제시번호는 저장하지 않는 값이라 항상 `정보 없음`(상세 원본은 판매자에게 문의). */
  const rows: [string, string][] = [
    ["제조사", car.maker],
    ["모델", model],
    ["연식", yearText],
    ["주행거리", car.filter?.mileage ? `${car.filter.mileage.toLocaleString("ko-KR")}km` : NO_INFO],
    ["인승", m3?.seats ?? or(dv.seats)],
    ["연료", m3?.fuel ?? or(cleanValue(car.filter?.fuel))],
    ["배기량", m3?.displacement ?? or(fd?.displacement)],
    ["최초등록일", m3 ? BMW_M3_HISTORY_MOCK.firstRegisteredAt : NO_INFO],
    ["변속기", m3?.transmission ?? or(cleanValue(fd?.transmission ?? car.filter?.transmission))],
    ["차종", or(fd?.carType ?? dv.sizeClass)],
    ["도어 수", or(dv.doors)],
    ["바디타입", or(body)],
    ["외관 색상", or(cleanValue(fd?.color ?? car.filter?.color))],
    ["시트 색상", dv.seatColor],
    ["배출가스 등급", NO_INFO],
    ["이전 소유자", fd?.insurance ? `${fd.insurance.owners}명` : NO_INFO],
    ["키 수", NO_INFO],
    ["판매방식", or(fd?.saleType)],
    ["압류/저당", NO_INFO],
    ["제시번호", dv.offerNo],
    ["지역", car.place.split(" · ")[0]],
    ["판매자 유형", car.sellerType === "딜러" ? "매매업체(딜러)" : "개인"],
    ["성능점검", fd ? (fd.inspection ? "기록부 있음" : "없음") : ""],
    ["보험이력 조회", fd ? (fd.insurance ? "조회 완료" : NO_INFO) : ""],
  ];
  return rows.filter(([, value]) => value);
}

/* 무다 차량 제원 시트(2026-10-13) 기준 30개 + 보배드림 매물·이력 7개 = 총 37개.
   접힌 화면은 기존 핵심 8개를 유지하고, 펼친 화면만 의미 단위로 묶는다. */
export function carFactGroups(car: Car): VehicleFactGroup[] {
  const fd = car.ferrariDetail;
  const model = (car.modelGroup ?? car.title.replace(new RegExp(`^${car.maker}\\s*`), "")).trim();
  const body = cleanValue(fd?.body ?? car.filter?.body);
  const dv = derivedFacts(car, model, body);
  const m3 = isBmwM3CompetitionXDrive(car, model) ? BMW_M3_COMPETITION_XDRIVE_2023 : null;
  const historyMock = m3 ? BMW_M3_HISTORY_MOCK : null;
  const value = (entry?: string | number | null) => entry === undefined || entry === null || entry === "" ? NO_INFO : String(entry);

  return [
    {
      title: "기본 정보",
      basic: true,
      rows: [
        ["제조사", car.maker], ["모델", model], ["세부모델", m3?.trim ?? value(car.trim)],
        ["변속기", m3?.transmission ?? value(cleanValue(fd?.transmission ?? car.filter?.transmission))], ["시리즈·코드", m3?.series ?? NO_INFO],
        ["차체형식", m3?.body ?? value(body ? `${dv.doors ? `${dv.doors} ` : ""}${body}` : "")], ["좌석 수", m3?.seats ?? value(dv.seats)],
        ["연료", m3?.fuel ?? value(cleanValue(car.filter?.fuel))],
      ],
    },
    {
      title: "엔진·성능",
      rows: [
        ["배기량", m3?.displacement ?? value(fd?.displacement ?? (car.filter?.displacement ? `${car.filter.displacement.toLocaleString("ko-KR")}cc` : ""))],
        ["압축비", m3?.compression ?? NO_INFO], ["최고출력", m3?.power ?? bbmSampleHorsepower(car.id)],
        ["최대토크", m3?.torque ?? NO_INFO], ["엔진 형식", m3?.engine ?? NO_INFO],
      ],
    },
    {
      title: "크기·중량",
      rows: [
        ["전장", m3?.length ?? NO_INFO], ["전폭", m3?.width ?? NO_INFO], ["전고", m3?.height ?? NO_INFO],
        ["축거", m3?.wheelbase ?? NO_INFO], ["공차중량", m3?.curbWeight ?? NO_INFO], ["연료탱크 용량", m3?.fuelTank ?? NO_INFO],
      ],
    },
    { title: "제동장치", rows: [["전륜 브레이크", m3?.frontBrakes ?? NO_INFO], ["후륜 브레이크", m3?.rearBrakes ?? NO_INFO]] },
    { title: "서스펜션", rows: [["전륜 서스펜션", m3?.frontSuspension ?? NO_INFO], ["후륜 서스펜션", m3?.rearSuspension ?? NO_INFO]] },
    { title: "조향장치", rows: [["조향 방식", m3?.steering ?? NO_INFO]] },
    { title: "타이어·휠", rows: [["전륜 타이어", m3?.frontTyre ?? NO_INFO], ["후륜 타이어", m3?.rearTyre ?? NO_INFO], ["전륜 휠", m3?.frontWheel ?? NO_INFO], ["후륜 휠", m3?.rearWheel ?? NO_INFO]] },
    {
      title: "차량 히스토리",
      rows: [
        ["생산 공장", historyMock?.factory ?? NO_INFO],
        ["출고일", historyMock?.releasedAt ?? NO_INFO],
        ["출고가격(옵션 미포함)", historyMock?.priceWithoutOptions ?? NO_INFO],
        ["출고가격(옵션 포함)", historyMock?.priceWithOptions ?? NO_INFO],
        ["정식/직수입 여부", historyMock?.importType ?? NO_INFO],
        ["구입 딜러", historyMock?.purchaseDealer ?? NO_INFO],
        ["판매 방식", historyMock?.dealerSaleMethod ?? NO_INFO],
        ["매도비(관리비용)", historyMock?.dealerFee ?? NO_INFO],
        ["소유자 변경", fd?.insurance ? `${fd.insurance.owners}회` : historyMock?.ownerChanges ?? NO_INFO],
        ["수리이력", historyMock?.repairHistory ?? NO_INFO],
        ["사고이력", historyMock?.accidentHistory ?? NO_INFO],
        ["압류/저당", historyMock?.encumbrance ?? NO_INFO],
        ["제시번호", dv.offerNo],
      ],
    },
  ];
}

export function chototFactRows(car: Car, groups: VehicleFactGroup[]) {
  const facts = new Map(groups.flatMap((group) => group.rows));
  const currentCondition = car.filter?.condition === "신차" ? "신차" : "중고";
  const transmission = facts.get("변속기") ?? NO_INFO;
  const compactTransmission = /스텝트로닉|자동/i.test(transmission) ? "자동" : transmission;
  const compactWeight = (facts.get("공차중량") ?? NO_INFO).split("(")[0].trim();
  const compactPower = (facts.get("최고출력") ?? NO_INFO).split("(")[0].trim();
  return {
    condition: [
      [["소유자 변경", facts.get("이전 소유자") ?? NO_INFO], ["기본 부속품", "확인 필요"]],
      [["검사 유효기간", "확인 필요"], ["생산국", facts.get("생산국") ?? NO_INFO]],
      [["차량 상태", currentCondition], ["보증 정책", "성능점검 보증"]],
    ] as VehicleFactRow[][],
    technical: [
      [["제조사", facts.get("제조사") ?? NO_INFO], ["모델", facts.get("모델") ?? NO_INFO]],
      [["연식", facts.get("연식") ?? NO_INFO], ["변속기", compactTransmission]],
      [["연료", facts.get("연료") ?? NO_INFO], ["바디타입", facts.get("차체형식") ?? NO_INFO]],
      [["좌석 수", facts.get("좌석 수") ?? NO_INFO], ["공차중량", compactWeight]],
      [["배기량", facts.get("배기량") ?? NO_INFO], ["최고출력", compactPower]],
    ] as VehicleFactRow[][],
  };
}
export const FACT_ICONS: Record<string, string> = {
  제조사: "maker-autoscout", 모델: "model-trim", 연식: "year", 주행거리: "mileage",
  연료: "fuel", 배기량: "engine-hubraum", 인승: "seats", 최초등록일: "first-registration", 변속기: "gearbox", 차종: "body", "도어 수": "doors", "배출가스 등급": "emission", "이전 소유자": "owners", "키 수": "keys", 바디타입: "body", "외관 색상": "color", "시트 색상": "interior",
  세부모델: "model-trim", "시리즈·코드": "document", 차체형식: "body", "좌석 수": "seats", 생산국: "location",
  판매방식: "seller-type", "압류/저당": "document", 제시번호: "document", 지역: "location", "판매자 유형": "seller-type", 성능점검: "document", "보험이력 조회": "document",
};
export const FACTS_VISIBLE_ICONS = 8;
export const VEHICLE_INFO_TOTAL_LABEL = 28;
// 실매물 상세(2026-10-13): 목록에서 연 매물의 사진을 쓰고, 없으면 기존 시안 사진을 쓴다
export const detailPhotosOf = (car: Car | null | undefined): string[] => {
  const list = car?.photoList?.length ? car.photoList : car?.image ? [car.image] : [];
  return list.length ? list.map((src) => asset(src)) : detailPhotos;
};

// 줄이 멈추는 위치(화면 가장자리 기준): 앞 칸 왼쪽 8 · 다음 칸 오른쪽 8(이베이 첫 칸 왼쪽 8과 같은 여백)
export const THUMB_EDGE_LEFT = 8;
export const THUMB_EDGE_RIGHT = 8;

// 2026-10-15 「판매자명 페이지 · 브레드크럼」 상세 상단 시안(&detailtop=above | overlay): 판매자 줄 + 경로 줄을 사진 위(above) 또는 사진 위에 올려(overlay) 보여준다.
export function detailTopMode(): "above" | "overlay" | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("detailtop");
  return value === "above" || value === "overlay" ? value : null;
}

export function detailSellerName(car: Car) {
  const label = sellerLabel(car);
  const [personName, ...shopParts] = label.split(" ");
  return car.sellerType === "딜러" && !/딜러$/.test(label) && shopParts.length ? `${personName} 딜러` : label;
}

export function detailCrumbs(car: Car) {
  const kind = car.truck ? "트럭·특장" : car.bike ? "바이크" : car.heavy ? "건설기계" : "중고차";
  const body = carFacts(car).find(([label]) => label === "바디타입")?.[1];
  return ["홈", "차량", kind, ...(body && body !== NO_INFO && kind === "중고차" ? [body] : [])];
}
// 서울오토갤러리 매물의 판매자 페이지: 같은 이름 딜러가 있으면 그 딜러, 없으면 그 상사 대표 페이지(2026-10-21 상사 대표 79곳).
export function sagDealerFor(car: Car) {
  const info = car.seoulAutoGallery;
  if (!info) return undefined;
  const sameShop = (shopNo: string) => seoulAutoGalleryShopByNo.get(shopNo)?.company === info.company;
  return sagDealers.find((dealer) => dealer.name === info.dealer && sameShop(dealer.shopNo))
    ?? sagDealers.find((dealer) => car.dealer.startsWith(dealer.name) && !seoulAutoGalleryShopByNo.has(dealer.shopNo))
    ?? sagDealers.find((dealer) => dealer.role === "대표" && sameShop(dealer.shopNo));
}
export type CostVehicleType = "승용" | "경차" | "승합" | "화물";
export type CostRegion = "서울" | "경기" | "기타";
export type CostBenefit = "해당없음" | "다자녀" | "장애인";

export const formatCostManwon = (value: number) => {
  const rounded = Math.max(0, Math.round(value));
  const eok = Math.floor(rounded / 10000);
  const manwon = rounded % 10000;
  if (!eok) return `${manwon.toLocaleString("ko-KR")}만원`;
  return manwon ? `${eok}억 ${manwon.toLocaleString("ko-KR")}만원` : `${eok}억원`;
};

export const formatCostWon = (value: number) => `${Math.max(0, Math.round(value * 10000)).toLocaleString("ko-KR")}원`;

// 상사명(2026-10-13 「지역 밑에 상사명 2줄 · 그 밑에 등록일」): 페라리 실제 상세는 시트의 상사, 나머지는 판매자 이름 뒤 상사 낱말. 없으면 줄을 만들지 않는다
// 법인 표기 「주식회사」·「(주)」는 화면에서 생략한다(2026-10-13, 인수인계 문서 기재)
export const stripCorp = (name: string) => name.replace(/\(주\)|주식회사/g, "").replace(/\s+/g, " ").trim();
export function carShopName(car: Car) {
  if (car.ferrariDetail) return stripCorp(car.ferrariDetail.shop);
  const label = sellerLabel(car);
  const [, ...rest] = label.split(" ");
  return car.sellerType === "딜러" && !/딜러$/.test(label) && rest.length ? stripCorp(rest.join(" ")) : "";
}

// 판매자 정보 영역(2026-10-13 「지역 밑에 판매자 정보 영역 추가」): 실제 매물은 지역 바로 아래(상단 블록)에 그리고, 아래 회색 영역의 옛 판매자 카드는 숨긴다
// 지역 줄에서 줄 맨 앞으로 내려간 항목은 앞의 가운데 점을 뺀다(2026-10-13)
// 상세 지역 줄(2026-10-14): 1줄은 확인 가능한 시·구·동까지, 2줄은 단지ㆍ상사명으로 표시한다.
// 원본 데이터에 동이 있으면 그대로 쓰고, 서울오토갤러리는 실제 소재지인 양재동을 보완한다.
export function detailLocationDong(car: Car): string | undefined {
  const [main] = car.place.split(" · ");
  const parts = main.trim().split(/\s+/);
  const dong = parts.find((part) => /(동|읍|면)$/.test(part));
  if (dong) return dong;
  if (car.place.includes("서울오토갤러리")) return "양재동";
  const [, city, ward] = parts;
  if (city?.endsWith("시") && ward?.endsWith("구")) return ward;
  return car.place.includes("도이치오토월드") || car.place.includes("SK V1 모터스") ? "권선구" : undefined;
}
// 지역 줄의 단지 · 상사명 링크(2026-10-13 「에어비앤비처럼 단지 상사 밑줄 링크」): 이동할 곳이 있는 항목에만 밑줄을 긋는다.
// 단지 = 카테고리 목록(서울오토갤러리 · 도이치오토월드), 상사명 = 딜러 페이지(서울오토갤러리 딜러 중 화면이 있는 5명)
export const complexCategories = ["서울오토갤러리", "도이치오토월드", "SK V1 모터스"];
export function locationLinks(car: Car): Record<string, string> {
  const links: Record<string, string> = {};
  const base = new URLSearchParams(window.location.search);
  const complex = complexCategories.find((name) => car.place.split(" · ").includes(name));
  if (complex) {
    const next = new URLSearchParams(base);
    ["profile", "shop", "emp", "tab", "category", "maker", "q"].forEach((key) => next.delete(key));
    next.set("category", complex);
    links[complex] = `${window.location.pathname}?${next.toString()}`;
  }
  const shop = carShopName(car);
  const sagDealer = car.seoulAutoGallery ? sagDealerFor(car) : undefined;
  if (shop && sagDealer) links[shop] = `${window.location.pathname}?profile=dealer&shop=${sagDealer.shopNo}&emp=${sagDealer.empNo}`;
  if (shop && car.joyMotors) links[shop] = `${window.location.pathname}?qf=guazi&profile=dealer&shop=joy&emp=1`;
  const dawDealer = deutschDealerForCar(car);
  if (shop && dawDealer) {
    const owner = allDeutschDealers.find((dealer) => dealer.shopNo === dawDealer.shopNo && dealer.empNo === "1") ?? dawDealer;
    links[shop] = `${window.location.pathname}?qf=guazi&profile=dealer&shop=${owner.shopNo}&emp=${owner.empNo}`;
  }
  return links;
}
export type RailCar = { image: string; title: string; price: string; place: string; posted: string; meta?: string };
export const pcAsset = (name: string) => asset(`pc-detail/${name}`);
export const detailTabLabels: Record<string, string> = { "차량 설명": "설명", "차량 정보": "기본 정보", "차량 히스토리": "히스토리", "사고·성능점검": "사고·점검", "차량 옵션": "옵션", "보험 이력": "보험", "성능 점검": "점검", "보증 정보": "보증정보", "판매 정보": "판매 정보", "동급매물": "동급" };
