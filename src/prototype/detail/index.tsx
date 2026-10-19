import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDownIcon, HeartFilledIcon, HeartIcon, LockClosedIcon, MobileIcon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { BottomSheet, Carousel, MobileScroll, useFlow } from "../../mobile";
import { bbmCardSpec, bbmSampleHorsepower } from "../data/bbm-card-samples";
import {
  asset,
  classCars,
  detailPhotos,
  detailVehiclePlate,
  extraInfo,
  formatMileage,
  getActiveDetailCar,
  isDesktopPreview,
  isForcedMobileView,
  optionItems,
  parsePrice,
  priceHistoryRows,
  relatedCars,
  sellerDetailPhoto,
  sellerLabel,
  sellerScenario,
  useFavorites,
  vehicleHistoryUrl,
  vehicleInfo,
  type DetailSheet,
  type Car,
} from "../data";
import { BbmResultCard } from "../listing/bbm-list";
import { dealers as sagDealers } from "../listing/seoul-auto-gallery-dealer-rail";

type DetailUi = {
  liked: boolean;
  setLiked: (liked: boolean) => void;
  sheet: DetailSheet;
  setSheet: (sheet: DetailSheet) => void;
  toast: string;
  notify: (message: string) => void;
};

const DetailUiContext = createContext<DetailUi | null>(null);

function useDetailUi() {
  const value = useContext(DetailUiContext);
  if (!value) throw new Error("useDetailUi must be used inside DetailUiProvider");
  return value;
}

function DetailUiProvider({ children }: { children: ReactNode }) {
  const [liked, setLiked] = useState(false);
  const [sheet, setSheet] = useState<DetailSheet>(null);
  const [toast, setToast] = useState("");
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  return <DetailUiContext.Provider value={{ liked, setLiked, sheet, setSheet, toast, notify }}>{children}</DetailUiContext.Provider>;
}

function SectionCard({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`detail-card ${className}`}>
      <div className="detail-section-heading"><h2>{title}</h2>{action}</div>
      {children}
    </section>
  );
}

function InfoGrid({ items }: { items: string[][] }) {
  return <dl className="detail-info-grid">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

// 차량 정보(2026-10-13 「카앤비드처럼 구성 · 한국 문화에 맞게」): Cars & Bids의 핵심 정보 격자(라벨 위 · 값 아래, 제조사 · 모델 · 주행거리 · 엔진 · 구동 · 변속기 · 바디 · 색상 · 지역 · 판매자 유형)를
// 한국 중고차 기준(연식 · 정확한 주행거리 · 연료 · 변속기 · 배기량 · 바디타입 · 색상 · 지역 · 판매자 유형 · 판매구분 · 성능점검 · 보험이력)으로 옮겼다. 값이 없는 칸은 만들지 않는다
const cleanValue = (value?: string | null) => (value && value !== "전체" && value !== "정보 없음" && value !== "기타" ? value : "");
const SIZE_CLASS: [string, string[]][] = [
  ["대형", ["S클래스", "S-클래스", "7시리즈", "A8", "G90", "G80", "그랜저", "K9", "K8", "팬텀", "컨티넨탈", "마이바흐", "플라잉스퍼", "911 ", "타이칸", "파나메라", "CLS"]],
  ["중형", ["E클래스", "E-클래스", "5시리즈", "A6", "쏘나타", "K5", "G70", "i5", "ES"]],
  ["준중형", ["C클래스", "C-클래스", "3시리즈", "A4", "아반떼", "K3", "i4", "2시리즈", "M3", "M4"]],
];
/* 규칙으로 정한 추정 값(UI 검증용, 실제 제원 아님): 차종은 모델 이름으로, 인승은 바디타입으로, 시트 색상 · 제시번호는 매물 번호로 정한 가상 값 */
function derivedFacts(car: Car, model: string, body: string) {
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
const NO_INFO = "정보 없음";
const FACTS_VISIBLE = 6;
type VehicleFactRow = [label: string, value: string];
type VehicleFactGroup = { title: string; rows: VehicleFactRow[]; basic?: boolean };

/* BMW 공식 G80 M3 Competition M xDrive 제원(2021~2024형 공통 차체/파워트레인).
   가격은 BMW 코리아 2023년 12월 가격표 기준이며 매물 고유 이력과 혼합하지 않는다. */
const BMW_M3_COMPETITION_XDRIVE_2023 = {
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
const BMW_M3_HISTORY_MOCK = {
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
const isBmwM3CompetitionXDrive = (car: Car, model: string) => car.maker === "BMW" && /M3/i.test(`${model} ${car.title} ${car.trim}`) && /xDrive|컴페티션|Competition/i.test(`${car.title} ${car.trim}`);

function carFacts(car: Car): string[][] {
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
function carFactGroups(car: Car): VehicleFactGroup[] {
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

function chototFactRows(car: Car, groups: VehicleFactGroup[]) {
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

/* 차량 정보 아이콘 시안(`&facts=icons`, 2026-10-14, 노션 「영국_오토트레이더 초톳 변경」 아이콘 원본 그대로 `public/assets/bbm/detail-icons/`) */
const FACT_ICONS: Record<string, string> = {
  제조사: "maker-autoscout", 모델: "model-trim", 연식: "year", 주행거리: "mileage",
  연료: "fuel", 배기량: "engine-hubraum", 인승: "seats", 최초등록일: "first-registration", 변속기: "gearbox", 차종: "body", "도어 수": "doors", "배출가스 등급": "emission", "이전 소유자": "owners", "키 수": "keys", 바디타입: "body", "외관 색상": "color", "시트 색상": "interior",
  세부모델: "model-trim", "시리즈·코드": "document", 차체형식: "body", "좌석 수": "seats", 생산국: "location",
  판매방식: "seller-type", "압류/저당": "document", 제시번호: "document", 지역: "location", "판매자 유형": "seller-type", 성능점검: "document", "보험이력 조회": "document",
};
const FACTS_VISIBLE_ICONS = 8;
const VEHICLE_INFO_TOTAL_LABEL = 28;
function VehicleInfoCard() {
  const [expanded, setExpanded] = useState(false);
  const car = getActiveDetailCar();
  const facts = car ? carFacts(car) : [];
  const factGroups = car ? carFactGroups(car) : [];
  const factsMode = new URLSearchParams(window.location.search).get("facts");
  if (car && factsMode === "chotot") {
    const chototRows = chototFactRows(car, factGroups);
    return (
      <SectionCard title="차량 정보" className="vehicle-info-card is-facts-chotot">
        <div className="chotot-fact-groups">
          <section className="chotot-fact-group">
            <h3>차량 상태</h3>
            <dl>{chototRows.condition.flatMap((row, rowIndex) => row.map(([label, factValue]) => <div key={`${rowIndex}-${label}`}><dt>{label}</dt><dd>{factValue}</dd></div>))}</dl>
          </section>
          <section className="chotot-fact-group">
            <h3>기술 제원</h3>
            <dl>{chototRows.technical.flatMap((row, rowIndex) => row.map(([label, factValue]) => <div key={`${rowIndex}-${label}`}><dt>{label}</dt><dd>{label === "제조사" ? <a className="detail-fact-link" href={`?qf=guazi&maker=${encodeURIComponent(factValue)}`}>{factValue}</a> : factValue}</dd></div>))}</dl>
          </section>
        </div>
      </SectionCard>
    );
  }
  if (car && (factsMode === "icons" || factsMode === "mudah" || factsMode === "icons-charancha")) return (
    <SectionCard title="차량 정보" className="vehicle-info-card is-facts-icons">
      {!expanded ? <dl className={`detail-facts is-icons${factsMode === "icons-charancha" ? " is-charancha" : ""}`}>{facts.slice(0, FACTS_VISIBLE_ICONS).map(([label, value]) => <div key={label}>{FACT_ICONS[label] ? <img src={asset(`bbm/detail-icons/${FACT_ICONS[label]}.svg`)} data-icon={FACT_ICONS[label]} alt="" aria-hidden="true" draggable={false} /> : <span className="detail-fact-icon-gap" />}<span className="detail-fact-text"><dt>{label}</dt><dd>{label === "제조사" ? <a className="detail-fact-link" href={`?qf=guazi&maker=${encodeURIComponent(value)}`}>{value}</a> : value}</dd></span></div>)}</dl> : (
        <div className="detail-fact-groups">
          {factGroups.filter((group) => group.title !== "차량 히스토리").map((group) => <section className={`detail-fact-group${group.basic ? " is-basic" : ""}`} key={group.title}>
            <h3>{group.title}</h3>
            <dl>{group.rows.map(([label, factValue]) => <div key={label}>
              {group.basic && FACT_ICONS[label] ? <img src={asset(`bbm/detail-icons/${FACT_ICONS[label]}.svg`)} data-icon={FACT_ICONS[label]} alt="" aria-hidden="true" draggable={false} /> : null}
              <dt>{label}</dt>
              <dd>{label === "제조사" ? <a className="detail-fact-link" href={`?qf=guazi&maker=${encodeURIComponent(factValue)}`}>{factValue}</a> : factValue}</dd>
            </div>)}</dl>
          </section>)}
        </div>
      )}
      {facts.length > FACTS_VISIBLE_ICONS ? <button type="button" className="detail-more is-airbnb" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}><span>{expanded ? "차량 정보 접기" : `차량 정보 ${VEHICLE_INFO_TOTAL_LABEL}개 모두 보기`}</span></button> : null}
    </SectionCard>
  );
  if (car) return (
    <SectionCard title="차량 정보" className="vehicle-info-card">
      <dl className={`detail-facts${factsMode === "left" ? " is-left" : ""}`}>{(expanded ? facts : facts.slice(0, FACTS_VISIBLE)).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{label === "제조사" ? <a className="detail-fact-link" href={`?qf=guazi&maker=${encodeURIComponent(value)}`}>{value}</a> : value}</dd></div>)}</dl>
      {facts.length > FACTS_VISIBLE ? <button type="button" className="detail-more" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}><span>{expanded ? "정보 접기" : "정보 더보기"}</span><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transformOrigin: "8px 8px", transform: expanded ? "rotate(180deg)" : "none" }} /></svg></button> : null}
    </SectionCard>
  );
  const items = expanded ? [...vehicleInfo, ...extraInfo] : vehicleInfo;

  return (
    <SectionCard title="차량 정보" className="vehicle-info-card">
      <dl className="vehicle-info-rows">
        {items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <button className="vehicle-info-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        {expanded ? "접기" : "더보기"}
        <img className={expanded ? "is-expanded" : ""} src={asset("detail/vehicle-info-chevron.svg")} alt="" />
      </button>
    </SectionCard>
  );
}

function VehicleHistoryCard() {
  const car = getActiveDetailCar();
  if (!car) return null;
  const rows = carFactGroups(car).find((group) => group.title === "차량 히스토리")?.rows ?? [];
  const deliveryLabels = new Set(["생산 공장", "출고일", "출고가격(옵션 미포함)", "출고가격(옵션 포함)", "정식/직수입 여부", "구입 딜러"]);
  const saleLabels = new Set(["판매 방식", "매도비(관리비용)", "제시번호"]);
  const conditionLabels = new Set(["수리이력", "사고이력"]);
  const historyGroups = [
    { title: "출고·유통 정보", rows: rows.filter(([label]) => deliveryLabels.has(label)) },
    { title: "판매 정보", rows: rows.filter(([label]) => saleLabels.has(label)) },
    { title: "소유·권리 정보", rows: rows.filter(([label]) => !deliveryLabels.has(label) && !saleLabels.has(label) && !conditionLabels.has(label)) },
  ];
  return (
    <SectionCard title="차량 히스토리" className="vehicle-history-card">
      <div className="vehicle-history-groups">
        {historyGroups.map((group) => <section className="vehicle-history-group" key={group.title}>
          <h3>{group.title}</h3>
          <dl className="vehicle-history-grid">
            {group.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </section>)}
      </div>
    </SectionCard>
  );
}

function AccidentInspectionCard() {
  const car = getActiveDetailCar();
  if (!car) return null;
  const historyRows = new Map(carFactGroups(car).find((group) => group.title === "차량 히스토리")?.rows ?? []);
  const accidentHistory = historyRows.get("사고이력") ?? NO_INFO;
  const repairHistory = historyRows.get("수리이력") ?? NO_INFO;
  const inspectionRecord = car.ferrariDetail?.inspection === false ? "기록부 없음" : "확인하기";

  return (
    <SectionCard title="사고·성능점검" className="warranty-card accident-inspection-card">
      <div className="warranty-box">
        <div><span>사고이력</span><strong><a className="vehicle-history-link" href={vehicleHistoryUrl(detailVehiclePlate)}>{accidentHistory}</a></strong></div>
        <div><span>수리이력</span><strong><a className="vehicle-history-link" href={vehicleHistoryUrl(detailVehiclePlate)}>{repairHistory}</a></strong></div>
        <div><span>성능점검기록부</span><strong><a className="vehicle-history-link" href={vehicleHistoryUrl(detailVehiclePlate)}>{inspectionRecord}</a></strong></div>
      </div>
    </SectionCard>
  );
}

// 차량 설명(Cars & Bids의 Highlights): 실제로 가진 값만으로 문장을 만든다(없는 값은 문장에서 뺀다)
function DetailHighlights() {
  const [expanded, setExpanded] = useState(false);
  const car = getActiveDetailCar();
  if (!car) return null;
  const fd = car.ferrariDetail;
  const yearText = bbmCardSpec(car, false).split(" · ")[0];
  const color = cleanValue(fd?.color ?? car.filter?.color);
  const lines: string[] = [];
  lines.push(`${yearText} ${car.title}${car.trim ? ` ${car.trim}` : ""}${color ? `, ${color} 외장` : ""} 차량입니다.`);
  if (car.filter?.mileage) lines.push(`주행거리는 ${car.filter.mileage.toLocaleString("ko-KR")}km이며 ${cleanValue(car.filter.fuel) || "연료 정보 없음"} 모델입니다.`);
  if (fd?.insurance) lines.push(`보험이력 조회 결과 내 차 피해 ${fd.insurance.own}건 · 상대 차 피해 ${fd.insurance.other}건, 소유자 변경 ${fd.insurance.owners}회, 번호판 변경 ${fd.insurance.plateChanges}회입니다.`);
  else if (fd) lines.push("등록된 보험이력 정보가 없어 직접 확인이 필요합니다.");
  if (fd?.options.length) lines.push(`판매자가 등록한 옵션은 ${fd.optionCount}개이며 주요 옵션은 ${fd.options.join(", ")} 등입니다.`);
  lines.push(`${car.place.split(" · ")[0]}에서 ${car.sellerType === "딜러" ? "매매업체" : "개인"}가 판매 중입니다. 실차 확인과 성능점검 기록부 확인 후 거래하세요.`);
  const description = lines.join(" ");
  return (
    <SectionCard title="차량 설명" className="detail-highlights">
      <div className={`detail-highlights-copy${expanded ? " is-expanded" : ""}`}>
        <p>{description}</p>
      </div>
      {lines.length > 2 ? (
        <button className="detail-highlights-more" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          <span>{expanded ? "접기" : "더 보기"}</span>
          <img className={expanded ? "is-expanded" : ""} src={asset("icons/chotot/chotot-list-detail-dropdown-arrow-region-search.svg")} alt="" />
        </button>
      ) : null}
    </SectionCard>
  );
}

// 실매물 상세(2026-10-13): 목록에서 연 매물의 사진을 쓰고, 없으면 기존 시안 사진을 쓴다
const detailPhotosOf = (car: Car | null | undefined): string[] => {
  const list = car?.photoList?.length ? car.photoList : car?.image ? [car.image] : [];
  return list.length ? list.map((src) => asset(src)) : detailPhotos;
};

// 줄이 멈추는 위치(화면 가장자리 기준): 앞 칸 왼쪽 8 · 다음 칸 오른쪽 8(이베이 첫 칸 왼쪽 8과 같은 여백)
const THUMB_EDGE_LEFT = 8;
const THUMB_EDGE_RIGHT = 8;

// 2026-10-15 「판매자명 페이지 · 브레드크럼」 상세 상단 시안(&detailtop=above | overlay): 판매자 줄 + 경로 줄을 사진 위(above) 또는 사진 위에 올려(overlay) 보여준다.
function detailTopMode(): "above" | "overlay" | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("detailtop");
  return value === "above" || value === "overlay" ? value : null;
}

function detailSellerName(car: Car) {
  const label = sellerLabel(car);
  const [personName, ...shopParts] = label.split(" ");
  return car.sellerType === "딜러" && !/딜러$/.test(label) && shopParts.length ? `${personName} 딜러` : label;
}

function detailCrumbs(car: Car) {
  const kind = car.truck ? "트럭·특장" : car.bike ? "바이크" : car.heavy ? "건설기계" : "중고차";
  const body = carFacts(car).find(([label]) => label === "바디타입")?.[1];
  return ["홈", "차량", kind, ...(body && body !== NO_INFO && kind === "중고차" ? [body] : [])];
}

function DetailTopCrumbs({ car }: { car: Car }) {
  return (
    <nav className="detail-top-crumbs" aria-label="현재 위치">
      <ol>{detailCrumbs(car).map((crumb) => <li key={crumb}>{crumb}</li>)}</ol>
    </nav>
  );
}

function DetailTopSeller({ car, overlay }: { car: Car; overlay?: boolean }) {
  const isDealer = car.sellerType === "딜러";
  const shop = carShopName(car);
  const sagDealer = car.seoulAutoGallery ? sagDealers.find((dealer) => car.dealer.startsWith(dealer.name)) : undefined;
  const href = sagDealer ? `${window.location.pathname}?profile=dealer&shop=${sagDealer.shopNo}&emp=${sagDealer.empNo}` : undefined;
  const body = (
    <>
      <img className="detail-top-seller-avatar" src={asset(sellerDetailPhoto(car))} alt="" draggable={false} />
      <span className="detail-top-seller-text">
        <strong>{detailSellerName(car)}</strong>
        {!overlay ? <small>{isDealer ? [shop, `${car.stock}대 판매중`].filter(Boolean).join(" · ") : "개인 판매자"}</small> : null}
      </span>
      <svg className="detail-top-seller-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </>
  );
  const className = `detail-top-seller${overlay ? " is-overlay" : ""}`;
  return href ? <a className={className} href={href} aria-label={`${detailSellerName(car)} 판매자 페이지`}>{body}</a> : <div className={className}>{body}</div>;
}

function DetailHero({ onBack }: { onBack: () => void }) {
  const { setSheet, notify } = useDetailUi();
  const photos = detailPhotosOf(getActiveDetailCar());
  const imageAspectRatio = getActiveDetailCar()?.imageAspectRatio;
  const [photoIndex, setPhotoIndex] = useState(1);
  const heroRef = useRef<HTMLElement>(null);
  const jumpLockRef = useRef<number | null>(null);
  const jumpTimerRef = useRef(0);

  useEffect(() => {
    const carousel = heroRef.current?.querySelector<HTMLElement>(".detail-media-carousel");
    const firstPhoto = carousel?.querySelector<HTMLElement>(".detail-media-track > img");
    if (!carousel || !firstPhoto) return;
    let snapTimer = 0;
    const updatePhotoIndex = () => {
      const photoWidth = firstPhoto.getBoundingClientRect().width || carousel.clientWidth;
      const nextIndex = Math.min(photos.length, Math.max(1, Math.round(carousel.scrollLeft / photoWidth) + 1));
      // 썸네일을 눌러 먼 사진으로 갈 때는 지나가는 사진 번호를 무시한다(Swiper·Embla 썸네일 동기화와 같은 방식: 눌린 칸이 즉시 선택, 도착하면 잠금 해제)
      const lock = jumpLockRef.current;
      if (lock !== null) {
        if (nextIndex !== lock) return;
        jumpLockRef.current = null;
      }
      setPhotoIndex(nextIndex);
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        const targetLeft = photoWidth * (nextIndex - 1);
        if (Math.abs(carousel.scrollLeft - targetLeft) > 1) carousel.scrollTo({ left: targetLeft, behavior: "smooth" });
      }, 90);
    };
    carousel.addEventListener("scroll", updatePhotoIndex, { passive: true });
    updatePhotoIndex();
    return () => {
      window.clearTimeout(snapTimer);
      carousel.removeEventListener("scroll", updatePhotoIndex);
    };
  }, [photos.length]);

  // 선택한 썸네일이 줄 안에서 완전히 보이도록 필요할 때만 줄을 가로로 옮긴다(카이디 방식, 페이지 스크롤은 건드리지 않음)
  // 이동은 requestAnimationFrame 하나로 목표를 계속 바꿔 가며 부드럽게 따라간다(브라우저 smooth를 연달아 부르면 매번 멈췄다 다시 시작해 덜컹거린다)
  const thumbsRef = useRef<HTMLDivElement>(null);
  const stripAnimRef = useRef(0);
  const stripTargetRef = useRef<number | null>(null);
  useEffect(() => () => window.cancelAnimationFrame(stripAnimRef.current), []);
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.children[photoIndex - 1] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const edgeLeft = THUMB_EDGE_LEFT;
    const edgeRight = THUMB_EDGE_RIGHT;
    const prev = (strip.children[photoIndex - 2] as HTMLElement | undefined) ?? thumb;
    const next = (strip.children[photoIndex] as HTMLElement | undefined) ?? thumb;
    const maxLeft = Math.max(0, strip.scrollWidth - strip.clientWidth);
    const left = photoIndex === 1 ? 0 : prev.offsetLeft - edgeLeft;
    const right = next.offsetLeft + next.offsetWidth + edgeRight - strip.clientWidth;
    // 진행 중인 이동의 목표를 기준으로 필요한 만큼만 옮긴다
    const from = stripTargetRef.current ?? strip.scrollLeft;
    const target = Math.min(maxLeft, Math.max(0, left < from ? left : right > from ? right : from));
    if (Math.abs(target - strip.scrollLeft) < 1 && stripTargetRef.current === null) return;
    stripTargetRef.current = target;
    window.cancelAnimationFrame(stripAnimRef.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      strip.scrollLeft = target;
      stripTargetRef.current = null;
      return;
    }
    // 거리와 상관없이 일정한 감속: 남은 거리의 일부씩 가까워진다(목표가 바뀌어도 속도가 끊기지 않음)
    const step = () => {
      const goal = stripTargetRef.current;
      if (goal === null) return;
      const diff = goal - strip.scrollLeft;
      if (Math.abs(diff) < 0.5) {
        strip.scrollLeft = goal;
        stripTargetRef.current = null;
        return;
      }
      strip.scrollLeft += diff * 0.22 + Math.sign(diff) * 0.4;
      stripAnimRef.current = window.requestAnimationFrame(step);
    };
    stripAnimRef.current = window.requestAnimationFrame(step);
  }, [photoIndex]);

  const choosePhoto = (index: number) => {
    const carousel = heroRef.current?.querySelector<HTMLElement>(".detail-media-carousel");
    const firstPhoto = carousel?.querySelector<HTMLElement>(".detail-media-track > img");
    if (!carousel || !firstPhoto) return;
    // 눌린 칸을 바로 선택하고, 큰 사진이 도착할 때까지(또는 1.2초) 지나가는 사진 번호는 무시한다
    jumpLockRef.current = index + 1;
    window.clearTimeout(jumpTimerRef.current);
    jumpTimerRef.current = window.setTimeout(() => { jumpLockRef.current = null; }, 1200);
    setPhotoIndex(index + 1);
    carousel.scrollTo({ left: firstPhoto.getBoundingClientRect().width * index, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  // 썸네일 줄 키보드 조작(WAI-ARIA 캐러셀 관례): 좌우 화살표로 이전·다음, Home·End로 처음·끝
  const onThumbKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
    let next = -1;
    if (event.key in keys) next = Math.min(photos.length - 1, Math.max(0, photoIndex - 1 + keys[event.key]));
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = photos.length - 1;
    if (next < 0) return;
    event.preventDefault();
    choosePhoto(next);
    (thumbsRef.current?.children[next] as HTMLElement | undefined)?.focus({ preventScroll: true });
  };

  const totalPhotos = photos.length;
  const activePhoto = photoIndex - 1;
  const topCar = getActiveDetailCar();
  const topMode = topCar ? detailTopMode() : null;
  const heroActions = (
    <div className="detail-hero-actions">
      <button type="button" aria-label="목록으로 돌아가기" onClick={onBack}><img src={asset("detail/reddit-back.svg")} alt="" /></button>
      <div>
        <button type="button" aria-label="공유하기" onClick={() => notify("공유 링크를 복사했어요")}><img src={asset("detail/autoscout24-share.svg")} alt="" /></button>
        <button type="button" aria-label="더보기" onClick={() => setSheet("more")}><img src={asset("detail/autoscout24-more-vertical.svg")} alt="" /></button>
      </div>
    </div>
  );

  return (
    <>
    {topMode === "above" && topCar ? <><div className="detail-top-head">{heroActions}</div><DetailTopSeller car={topCar} /><DetailTopCrumbs car={topCar} /></> : null}
    <section ref={heroRef} className={`detail-hero${topMode ? ` is-top-${topMode}` : ""}`} aria-label="차량 사진">
      <div className="detail-hero-main">
        <Carousel ariaLabel="차량 사진" className="detail-media-carousel" contentClassName="detail-media-track">
          {photos.map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={`차량 사진 ${index + 1}`} draggable={false} />)}
        </Carousel>
        {photoIndex === 1 && (getActiveDetailCar() ? getActiveDetailCar()?.filter?.video : true) ? <span className="detail-video-play" aria-hidden="true"><span /></span> : null}
        <div className="detail-photo-count" aria-live="polite" aria-atomic="true">{photoIndex} / {totalPhotos}</div>
        {topMode === "above" ? null : heroActions}
        {topMode === "overlay" && topCar ? <><div className="detail-top-overlay"><DetailTopCrumbs car={topCar} /></div><DetailTopSeller car={topCar} overlay /></> : null}
      </div>
    </section>
    {photos.length > 1 && new URLSearchParams(window.location.search).get("thumbs") === "on" ? <div className="detail-thumbs" ref={thumbsRef} role="group" aria-label="차량 사진 썸네일" onKeyDown={onThumbKey}>
      {photos.map((photo, index) => <button key={`${photo}-${index}`} type="button" aria-label={`사진 ${index + 1} 보기`} aria-pressed={index === activePhoto} className={index === activePhoto ? "is-active" : ""} style={imageAspectRatio ? { height: 64 / imageAspectRatio } : undefined} onClick={() => choosePhoto(index)}><img src={photo} alt="" draggable={false} loading="lazy" style={imageAspectRatio ? { objectFit: "contain" } : undefined} /></button>)}
    </div> : null}
    </>
  );
}

function VehicleSummary() {
  const { liked, setLiked, setSheet, notify } = useDetailUi();
  const car = getActiveDetailCar();
  // 첫 메타정보는 목록 카드와 같은 값을 그대로 쓴다(초톳 상세와 동일, 2026-10-13)
  const summarySpecs = ["2019", formatMileage("42,920 km"), "가솔린", detailVehiclePlate, "1인소유"];
  // 상세 상단 정보는 목록 카드와 같은 컴포넌트(제조사 모델 · 메타정보 · 가격 · 지역 · 하트)를 쓰고 사진·판매자 줄만 숨긴다(2026-10-13 「초톳처럼 리스트와 동일하게」)
  const summaryRef = useRef<HTMLElement>(null);
  useLocationWrap(summaryRef);
  useLocationLinks(summaryRef, car);
  // 상단 메타의 마력은 유지한다. 아래 차량 정보 8칸에서만 마력을 제외한다.
  const detailPower = car ? (isBmwM3CompetitionXDrive(car, (car.modelGroup ?? car.title).trim()) ? "510마력" : bbmSampleHorsepower(car.id)) : undefined;
  const detailBodyType = car ? carFacts(car).find(([label]) => label === "바디타입")?.[1] : undefined;
  if (car) return (
    <section ref={summaryRef} className="vehicle-summary is-list-summary marketplace is-bbm-m is-qf-guazi"><div className="bbm-m-list">
      <BbmResultCard car={car} locationDong={detailLocationDong(car)} detailLocation={{}} variant="mobile" detailSummary detailPower={detailPower} detailBodyType={detailBodyType === NO_INFO ? undefined : detailBodyType} liked={liked} onToggleLike={() => setLiked(!liked)} onOpen={() => undefined} onChat={() => undefined} />
    </div>
      <p className="detail-posted-line"><img src={asset("bbm/autoscout24-clock-54b8e0b2-balanced.svg")} alt="" aria-hidden="true" draggable={false} /><span>{car.posted}</span></p>
      <DetailSellerInfo car={car} /></section>
  );
  return (
    <section className="vehicle-summary">
      <div className="vehicle-title-row"><h1>2019 벤틀리 컨티넨탈 GT 3세대 6.0 퍼스트 에디션</h1><button type="button" aria-label="매물 저장" aria-pressed={liked} onClick={() => setLiked(!liked)}>{liked ? <HeartFilledIcon /> : <HeartIcon />}<span>{liked ? "저장됨" : "저장"}</span></button></div>
      <div className="vehicle-spec-row" aria-label="차량 핵심 정보">
        {summarySpecs.map((spec) => <span key={spec} >{spec}</span>)}
      </div>
      <div className="detail-price-row">
        <strong>1억 4,500만원</strong>
        <button type="button" onClick={() => setSheet("priceHistory")}>가격 변동</button>
      </div>
      <p className="vehicle-finance">할부 예상 월 153만원부터</p>
      <p className="vehicle-phone-note">판매자가 안심번호로 연락을 받아요</p>
      <div className="detail-contact-row" aria-label="판매자 연락">
        <a href="tel:05062469261">안심번호</a>
        <button type="button" onClick={() => notify("카카오 상담을 준비했어요")}>카카오</button>
        <button type="button" onClick={() => setSheet("contact")}>채팅</button>
      </div>
      <div className="vehicle-location-row">
        <p>서울 서초구 양재동</p>
        <span>등록 2개월 전</span>
      </div>
    </section>
  );
}

function PriceHistorySheet({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(1);
  const visiblePages = [1, 2, 3, 4, 5, 10];
  const selectPage = (nextPage: number) => setPage(Math.min(10, Math.max(1, nextPage)));

  useEffect(() => {
    const overlay = document.querySelector<HTMLElement>('[data-testid="sheet-overlay"]');
    if (!overlay) return;
    overlay.addEventListener("click", onClose);
    return () => overlay.removeEventListener("click", onClose);
  }, [onClose]);

  return (
    <div className="price-history-sheet">
      <button className="price-history-close" type="button" aria-label="가격 변동 내역 닫기" onClick={onClose}>
        <img src={asset("detail/price-history-close.svg")} alt="" />
      </button>
      <div className="price-history-table" role="table" aria-label="가격 변동 내역">
        <div className="price-history-head" role="row">
          <span role="columnheader">날짜</span><span role="columnheader">변동</span><span role="columnheader">가격</span>
        </div>
        {priceHistoryRows.map((row) => (
          <div className="price-history-row" role="row" key={row.date}>
            <span role="cell">{row.date}</span>
            <strong className={row.direction === "down" ? "is-down" : ""} role="cell">
              {row.direction === "first" ? <span className="price-history-tag-icon"><img src={asset("detail/price-tag.svg")} alt="" /><img src={asset("detail/price-tag-dot.svg")} alt="" /></span> : <img src={asset(`detail/price-${row.direction}.svg`)} alt="" />}
              {row.change}
            </strong>
            <b role="cell">{row.price}</b>
          </div>
        ))}
      </div>
      <p className="price-history-note">가격 변동 내역은 판매자가 제공한 정보를 기준으로 합니다.</p>
      <nav className="price-history-pagination" aria-label="가격 변동 페이지">
        <button type="button" aria-label="이전 페이지" disabled={page === 1} onClick={() => selectPage(page - 1)}><span className="price-history-pagination-arrow is-previous" aria-hidden="true"><img src={asset("detail/pagination-left.svg")} alt="" /></span></button>
        {visiblePages.map((pageNumber, index) => (
          <span key={pageNumber} className="price-history-page-slot">
            {index === visiblePages.length - 1 ? <img className="price-history-ellipsis" src={asset("detail/pagination-ellipsis.svg")} alt="" /> : null}
            <button type="button" aria-label={`${pageNumber} 페이지`} aria-current={page === pageNumber ? "page" : undefined} onClick={() => selectPage(pageNumber)}>{pageNumber}</button>
          </span>
        ))}
        <button type="button" aria-label="다음 페이지" disabled={page === 10} onClick={() => selectPage(page + 1)}><span className="price-history-pagination-arrow is-next" aria-hidden="true"><img src={asset("detail/pagination-right.svg")} alt="" /></span></button>
      </nav>
    </div>
  );
}

type CostVehicleType = "승용" | "경차" | "승합" | "화물";
type CostRegion = "서울" | "경기" | "기타";
type CostBenefit = "해당없음" | "다자녀" | "장애인";

const formatCostManwon = (value: number) => {
  const rounded = Math.max(0, Math.round(value));
  const eok = Math.floor(rounded / 10000);
  const manwon = rounded % 10000;
  if (!eok) return `${manwon.toLocaleString("ko-KR")}만원`;
  return manwon ? `${eok}억 ${manwon.toLocaleString("ko-KR")}만원` : `${eok}억원`;
};

const formatCostWon = (value: number) => `${Math.max(0, Math.round(value * 10000)).toLocaleString("ko-KR")}원`;

function CostCalculatorSheet({ onClose }: { onClose: () => void }) {
  const { notify } = useDetailUi();
  const car = getActiveDetailCar();
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialPrice = Math.max(100, parsePrice(car?.price ?? "1억 4,500만원") || 14500);
  const [price, setPrice] = useState(initialPrice);
  const [vehicleType, setVehicleType] = useState<CostVehicleType>("승용");
  const [fuel, setFuel] = useState(car?.filter?.fuel ?? "가솔린");
  const [region, setRegion] = useState<CostRegion>(car?.place.includes("경기") ? "경기" : car?.place.includes("서울") ? "서울" : "기타");
  const [benefit, setBenefit] = useState<CostBenefit>("해당없음");
  const [downPayment, setDownPayment] = useState(30);
  const [loanMonths, setLoanMonths] = useState(36);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [loanOpen, setLoanOpen] = useState(false);

  const taxRate: Record<CostVehicleType, number> = { 승용: .07, 경차: .04, 승합: .05, 화물: .05 };
  const bondRate: Record<CostRegion, number> = { 서울: .012, 경기: .01, 기타: .008 };
  const baseAcquisitionTax = Math.round(price * taxRate[vehicleType]);
  const taxDiscount = benefit === "장애인" ? baseAcquisitionTax : benefit === "다자녀" ? Math.min(140, baseAcquisitionTax) : 0;
  const acquisitionTax = Math.max(0, baseAcquisitionTax - taxDiscount);
  const bondDiscount = Math.round(price * bondRate[region]);
  const registrationFees = 5;
  const managementFee = 44;
  const inspectionInsurance = 12;
  const transferCost = acquisitionTax + bondDiscount + registrationFees;
  const total = price + transferCost + managementFee + inspectionInsurance;
  const financed = Math.round(total * (1 - downPayment / 100));
  const monthlyRate = .069 / 12;
  const monthlyPayment = financed * monthlyRate * ((1 + monthlyRate) ** loanMonths) / (((1 + monthlyRate) ** loanMonths) - 1);
  const fuelOptions = Array.from(new Set([fuel, "가솔린", "디젤", "하이브리드", "전기"]));
  const title = car ? `${car.title} ${car.trim}`.trim() : "벤틀리 컨티넨탈 GT 3세대";

  const complete = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    notify(`계산 결과는 ${formatCostManwon(total)}입니다.`);
  };

  return (
    <div className="cost-calculator-sheet cost-calculator-smart">
      <button className="cost-calculator-close" type="button" aria-label="구매비용 계산기 닫기" onClick={onClose}>
        <img src={asset("detail/price-history-close.svg")} alt="" />
      </button>

      <div className="cost-calculator-scroll" ref={scrollRef}>
        <section className="cost-smart-vehicle" aria-label="계산 대상 차량">
          <span>선택 차량</span>
          <strong>{title}</strong>
          <small>{car?.filter ? `${car.filter.year}년 · ${car.filter.mileage.toLocaleString("ko-KR")}km · ${car.filter.fuel}` : "2016년 · 117,037km · 가솔린"}</small>
        </section>

        <section className="cost-smart-total" aria-live="polite">
          <span>총 구매비용</span>
          <strong>{formatCostManwon(total)}</strong>
          <small>차량가격 포함 · 자동차보험료 제외</small>
        </section>

        <section className="cost-smart-form" aria-label="기본 계산 조건">
          <label className="cost-smart-field">
            <span>차량가격</span>
            <span><input inputMode="numeric" value={price.toLocaleString("ko-KR")} onChange={(event) => setPrice(Math.max(0, Number(event.target.value.replace(/[^\d]/g, "")) || 0))} aria-label="차량가격, 만원 단위" />만원</span>
          </label>
          <label className="cost-smart-field">
            <span>등록지역</span>
            <select value={region} onChange={(event) => setRegion(event.target.value as CostRegion)}>{(["서울", "경기", "기타"] as CostRegion[]).map((value) => <option key={value}>{value}</option>)}</select>
          </label>
          <button className="cost-smart-disclosure" type="button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((value) => !value)}>
            차량 기본정보 변경 <span aria-hidden="true">{advancedOpen ? "−" : "+"}</span>
          </button>
          {advancedOpen ? (
            <div className="cost-smart-advanced">
              <label><span>차종</span><select value={vehicleType} onChange={(event) => setVehicleType(event.target.value as CostVehicleType)}>{(["승용", "경차", "승합", "화물"] as CostVehicleType[]).map((value) => <option key={value}>{value}</option>)}</select></label>
              <label><span>연료</span><select value={fuel} onChange={(event) => setFuel(event.target.value)}>{fuelOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label><span>감면</span><select value={benefit} onChange={(event) => setBenefit(event.target.value as CostBenefit)}>{(["해당없음", "다자녀", "장애인"] as CostBenefit[]).map((value) => <option key={value}>{value}</option>)}</select></label>
            </div>
          ) : null}
          <button className="cost-smart-calculate" type="button" onClick={complete}>계산하기</button>
        </section>

        <section className="cost-smart-section" aria-labelledby="cost-breakdown-title">
          <h3 id="cost-breakdown-title">비용 상세</h3>
          <div className="cost-smart-list">
            <div><span>차량가격</span><strong>{formatCostWon(price)}</strong></div>
            <button type="button" aria-expanded={transferOpen} onClick={() => setTransferOpen((value) => !value)}><span>이전등록비 <small>{transferOpen ? "접기" : "상세"}</small></span><strong>{formatCostWon(transferCost)}</strong></button>
            {transferOpen ? <div className="cost-smart-sublist"><span>취득세 <b>{formatCostWon(acquisitionTax)}</b></span><span>공채 할인 <b>{formatCostWon(bondDiscount)}</b></span><span>등록 수수료 <b>{formatCostWon(registrationFees)}</b></span></div> : null}
            <div><span>관리비용</span><strong>{formatCostWon(managementFee)}</strong></div>
            <div><span>성능책임보험료</span><strong>{formatCostWon(inspectionInsurance)}</strong></div>
            <div><span>배송비</span><strong>별도</strong></div>
          </div>
        </section>

        <section className="cost-smart-section cost-smart-loan" aria-labelledby="cost-loan-title">
          <button className="cost-smart-loan-head" type="button" aria-expanded={loanOpen} onClick={() => setLoanOpen((value) => !value)}>
            <span><b id="cost-loan-title">할부 월 예상</b><small>연 6.9% · 원리금균등</small></span>
            <strong>{formatCostManwon(monthlyPayment)} <i aria-hidden="true">{loanOpen ? "−" : "+"}</i></strong>
          </button>
          {loanOpen ? <div className="cost-smart-loan-options">
            <div className="cost-option-row"><span>선수금</span><div>{[20, 30, 40].map((value) => <button type="button" key={value} aria-pressed={downPayment === value} onClick={() => setDownPayment(value)}>{value}%</button>)}</div></div>
            <div className="cost-option-row"><span>기간</span><div>{[24, 36, 48].map((value) => <button type="button" key={value} aria-pressed={loanMonths === value} onClick={() => setLoanMonths(value)}>{value}개월</button>)}</div></div>
            <div className="cost-smart-loan-principal"><span>대출원금</span><strong>{formatCostWon(financed)}</strong></div>
          </div> : null}
        </section>

        <p className="cost-disclaimer">계산 결과는 참고용입니다. 실제 세금과 부대비용은 차량 상태, 구매자 조건, 등록지역에 따라 달라질 수 있습니다.</p>
      </div>
      <div className="cost-calculator-footer"><div><span>총 구매비용</span><strong>{formatCostManwon(total)}</strong></div><button type="button" onClick={onClose}>계산 완료</button></div>
    </div>
  );
}

function OptionsCard({ desktop = false }: { desktop?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const fd = getActiveDetailCar()?.ferrariDetail;
  if (getActiveDetailCar() && !fd) return null;
  const ferrariIconByKeyword: Array<[string, string]> = [
    ["후방카메라", "option-04.png"],
    ["주차감지", "option-03.png"],
    ["LED헤드램프", "option-02.png"],
    ["스마트키", "option-smart-key.png"],
    ["열선시트", "option-08.png"],
    ["전동시트", "option-09.png"],
    ["가죽시트", "option-06.png"],
  ];
  const ferrariOptions = fd
    ? fd.options.map((label) => ({
      label,
      icon: ferrariIconByKeyword.find(([keyword]) => label.includes(keyword))?.[1] ?? "option-06.png",
    }))
    : [];
  const normalizedFerrariLabels = new Set(ferrariOptions.map(({ label }) => label.replace(/\s+/g, "")));
  const options = fd
    ? [
      ...ferrariOptions,
      ...optionItems.filter(({ label }) => !normalizedFerrariLabels.has(label.replace(/\s+/g, ""))),
    ]
    : optionItems;
  const previewCount = Math.min(8, options.length);
  const visibleOptions = expanded ? options : options.slice(0, previewCount);
  const canToggle = options.length > previewCount;

  return (
    <SectionCard title="차량 옵션" className="airbnb-options-card">
      <ul className="option-amenity-list">
        {visibleOptions.map(({ label, icon }, index) => (
          <li key={label}>
            <img src={!fd && desktop ? pcAsset(`9653-img${index + 1}.png`) : asset(`detail/${icon}`)} alt="" draggable={false} />
            <span>{label}</span>
          </li>
        ))}
      </ul>
      {canToggle ? (
        <button className="option-amenity-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? "옵션 간단히 보기" : `주요 옵션 ${options.length}개 모두 보기`}
        </button>
      ) : null}
      {fd ? <p className="detail-real-note option-amenity-note">판매자 등록 옵션 {fd.optionCount}개 중 확인된 주요 옵션입니다.</p> : null}
    </SectionCard>
  );
}

function HistoryCard() {
  const [expanded, setExpanded] = useState(false);
  const fd = getActiveDetailCar()?.ferrariDetail;
  if (getActiveDetailCar() && !fd) return null;
  if (fd) return (
    <SectionCard title="보험 이력" className="is-history-card">
      {fd.insurance ? <>
        <div className="insurance-summary"><div>내 차 피해<strong>{fd.insurance.own}건</strong></div><div>상대 차 피해<strong>{fd.insurance.other}건</strong></div><div>전손·침수·도난<strong>{fd.insurance.special}</strong></div></div>
        <dl className="detail-rows"><div><dt>소유자 변경</dt><dd>{fd.insurance.owners}회</dd></div><div><dt>번호판 변경</dt><dd>{fd.insurance.plateChanges === 0 ? "없음" : `${fd.insurance.plateChanges}회`}</dd></div></dl>
      </> : <p className="detail-real-note">등록된 보험 이력 정보가 없습니다.</p>}
    </SectionCard>
  );
  return (
    <SectionCard title="보험 이력" className="is-history-card" action={<a className="history-link" href={vehicleHistoryUrl(detailVehiclePlate)}>통합 이력조회</a>}>
      <div className="insurance-summary"><div>내 차 피해<strong>0건</strong></div><div>상대 차 피해<strong>0건</strong></div><div>특수사항<strong>없음</strong></div></div>
      <h3 className="subheading">차량 이력 상세</h3>
      <dl className="detail-rows"><div><dt>특수 용도 이력</dt><dd>없음</dd></div><div><dt>용도 및 차종</dt><dd>자가용 승용</dd></div>{expanded ? <><div><dt>소유자 변경</dt><dd>1회</dd></div><div><dt>번호판 변경</dt><dd>없음</dd></div></> : null}</dl>
      <button className="outline-wide-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "보험 이력 접기" : "보험 이력 전체 보기"}</button>
      <a className="history-cta" href={vehicleHistoryUrl(detailVehiclePlate)}>차량번호 {detailVehiclePlate} 이력조회</a>
    </SectionCard>
  );
}

function InspectionCard() {
  const [expanded, setExpanded] = useState(false);
  const fd = getActiveDetailCar()?.ferrariDetail;
  if (getActiveDetailCar() && !fd) return null;
  if (fd) return (
    <SectionCard title="성능 점검" className="is-inspection-card"><p className="detail-real-note">{fd.inspection ? "성능·상태 점검기록부가 등록된 매물입니다." : "성능점검 기록부가 없습니다."}</p></SectionCard>
  );
  return (
    <SectionCard title="성능 점검" className="is-inspection-card" action={<span className="muted-label">제시번호 : 262621002567</span>}>
      <dl className="detail-info-grid compact"><div><dt>사고이력 <QuestionMarkCircledIcon /></dt><dd>없음</dd></div><div><dt>단순수리 <QuestionMarkCircledIcon /></dt><dd>없음</dd></div></dl>
      {expanded ? <p className="inspection-note">성능·상태 점검기록부 기준으로 주요 골격 손상과 침수 이력이 없습니다.</p> : null}
      <button className="outline-wide-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "성능 점검 접기" : "성능 점검 전체 보기"}</button>
    </SectionCard>
  );
}

function WarrantyCard() {
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionTop, setInspectionTop] = useState(0);
  const inspectionDialogRef = useRef<HTMLDivElement | null>(null);
  const inspectionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const car = getActiveDetailCar();
  const year = car?.filter?.year;
  const mileage = car?.filter?.mileage;
  const isDealer = !car || car.sellerType === "딜러";
  const hasManufacturerWarranty = !!car && (car.badges?.includes("제조사보증") || /제조사\s*보증/.test(`${car.title} ${car.trim}`));
  const currentYear = 2026;

  const manufacturerStatus = (years: number, distance: number) => {
    if (!year || mileage === undefined) return { label: "보증 여부 확인 필요", active: false };
    const remainingYears = year + years - currentYear;
    const remainingDistance = Math.max(0, distance - mileage);
    if (remainingYears <= 0 || remainingDistance <= 0) return { label: "보증기간 종료", active: false };
    if (!hasManufacturerWarranty) return { label: "보증 여부 확인 필요", active: false };
    return { label: `약 ${remainingYears}년 / ${remainingDistance.toLocaleString("ko-KR")}km 남음`, active: true };
  };

  const bodyWarranty = manufacturerStatus(3, 60000);
  const powertrainWarranty = manufacturerStatus(5, 100000);
  const inspectionLabel = isDealer ? "2,000km / 1개월" : "개인 매물 · 별도 확인";

  useEffect(() => {
    if (!inspectionOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inspectionDialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setInspectionOpen(false);
      inspectionTriggerRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [inspectionOpen]);

  const openInspectionGuide = (event: React.MouseEvent<HTMLButtonElement>) => {
    const row = event.currentTarget.closest<HTMLElement>(".warranty-inspection");
    setInspectionTop((row?.getBoundingClientRect().bottom ?? window.innerHeight * 0.52) + 8);
    setInspectionOpen(true);
  };

  return (
    <SectionCard
      title="보증 정보"
      className="warranty-card"
    >
      <div className="warranty-box">
        <div className={bodyWarranty.active ? "is-active" : ""}>
          <span>제조사 보증 <small>(차체·일반)</small></span>
          <strong>{bodyWarranty.label}</strong>
        </div>
        <div className={powertrainWarranty.active ? "is-active" : ""}>
          <span>제조사 보증 <small>(엔진·주요)</small></span>
          <strong>{powertrainWarranty.label}</strong>
        </div>
        <div className={isDealer ? "is-active warranty-inspection" : "warranty-inspection"}>
          <button ref={inspectionTriggerRef} className="warranty-inspection-trigger" type="button" aria-haspopup="dialog" aria-expanded={inspectionOpen} onClick={openInspectionGuide}><span>성능·상태점검 보증 <QuestionMarkCircledIcon /></span></button>
          <strong>{inspectionLabel}</strong>
        </div>
      </div>
      {inspectionOpen ? <div className="warranty-inspection-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInspectionOpen(false); }}>
        <div ref={inspectionDialogRef} className="warranty-inspection-dialog" role="dialog" aria-modal="true" aria-label="성능 상태점검 보증 안내" tabIndex={-1} style={{ top: `${inspectionTop}px` }}>
          <h3>성능/상태 점검 보증</h3>
          <p>주요 부품의 점검 항목과 차량의 상태가 성능기록부와 다를 경우, 30일 또는 2,000km 이내에서 보증수리를 받을 수 있습니다. 자동차관리법에 따라 중고차 구매 시 의무 가입해야 하며, 일부 수입 또는 노후 차량의 경우 보증 요건이 다를 수 있으니 가입 가능여부를 꼭 확인하세요.</p>
        </div>
      </div> : null}
    </SectionCard>
  );
}

// 상사명(2026-10-13 「지역 밑에 상사명 2줄 · 그 밑에 등록일」): 페라리 실제 상세는 시트의 상사, 나머지는 판매자 이름 뒤 상사 낱말. 없으면 줄을 만들지 않는다
// 법인 표기 「주식회사」·「(주)」는 화면에서 생략한다(2026-10-13, 인수인계 문서 기재)
const stripCorp = (name: string) => name.replace(/\(주\)|주식회사/g, "").replace(/\s+/g, " ").trim();
function carShopName(car: Car) {
  if (car.ferrariDetail) return stripCorp(car.ferrariDetail.shop);
  const label = sellerLabel(car);
  const [, ...rest] = label.split(" ");
  return car.sellerType === "딜러" && !/딜러$/.test(label) && rest.length ? stripCorp(rest.join(" ")) : "";
}

// 판매자 정보 영역(2026-10-13 「지역 밑에 판매자 정보 영역 추가」): 실제 매물은 지역 바로 아래(상단 블록)에 그리고, 아래 회색 영역의 옛 판매자 카드는 숨긴다
// 지역 줄에서 줄 맨 앞으로 내려간 항목은 앞의 가운데 점을 뺀다(2026-10-13)
// 상세 지역 줄(2026-10-14): 1줄은 확인 가능한 시·구·동까지, 2줄은 단지ㆍ상사명으로 표시한다.
// 원본 데이터에 동이 있으면 그대로 쓰고, 서울오토갤러리는 실제 소재지인 양재동을 보완한다.
function detailLocationDong(car: Car): string | undefined {
  const [main] = car.place.split(" · ");
  const parts = main.trim().split(/\s+/);
  const dong = parts.find((part) => /(동|읍|면)$/.test(part));
  if (dong) return dong;
  if (car.place.includes("서울오토갤러리")) return "양재동";
  const [, city, ward] = parts;
  if (city?.endsWith("시") && ward?.endsWith("구")) return ward;
  return car.place.includes("도이치오토월드") ? "권선구" : undefined;
}
function useLocationWrap(ref: { current: HTMLElement | null }) {
  useEffect(() => {
    const root = ref.current;
    const text = root?.querySelector<HTMLElement>(".bbm-card-location-text");
    if (!text) return;
    const apply = () => {
      const parts = Array.from(text.querySelectorAll<HTMLElement>(".bbm-card-location-part"));
      parts.forEach((part) => part.classList.remove("is-line-start"));
      const first = text.firstElementChild as HTMLElement | null;
      let prevTop = first?.offsetTop ?? 0;
      parts.forEach((part) => {
        if (part.offsetTop > prevTop + 2) part.classList.add("is-line-start");
        prevTop = part.offsetTop;
      });
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(text);
    return () => observer.disconnect();
  });
}

// 지역 줄의 단지 · 상사명 링크(2026-10-13 「에어비앤비처럼 단지 상사 밑줄 링크」): 이동할 곳이 있는 항목에만 밑줄을 긋는다.
// 단지 = 카테고리 목록(서울오토갤러리 · 도이치오토월드), 상사명 = 딜러 페이지(서울오토갤러리 딜러 중 화면이 있는 5명)
const complexCategories = ["서울오토갤러리", "도이치오토월드"];
function locationLinks(car: Car): Record<string, string> {
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
  const sagDealer = car.seoulAutoGallery ? sagDealers.find((dealer) => car.dealer.startsWith(dealer.name)) : undefined;
  if (shop && sagDealer) links[shop] = `${window.location.pathname}?profile=dealer&shop=${sagDealer.shopNo}&emp=${sagDealer.empNo}`;
  return links;
}

function useLocationLinks(ref: { current: HTMLElement | null }, car: Car | null | undefined) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !car) return;
    const links = locationLinks(car);
    root.querySelectorAll<HTMLElement>(".bbm-card-location-part").forEach((part) => {
      const href = links[(part.textContent ?? "").trim()];
      if (href) { part.classList.add("is-link"); part.dataset.href = href; part.setAttribute("role", "link"); part.tabIndex = 0; }
      else { part.classList.remove("is-link"); delete part.dataset.href; part.removeAttribute("role"); part.removeAttribute("tabindex"); }
    });
    const go = (event: Event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-href]");
      if (!target) return;
      if (event instanceof KeyboardEvent && event.key !== "Enter") return;
      event.preventDefault();
      window.location.assign(target.dataset.href as string);
    };
    root.addEventListener("click", go);
    root.addEventListener("keydown", go);
    return () => { root.removeEventListener("click", go); root.removeEventListener("keydown", go); };
  });
}

function DetailSellerInfo({ car }: { car: Car }) {
  const isDealer = car.sellerType === "딜러";
  // 판매완료 대수는 실제 값이 없어 매물 번호로 정한 가상 값이다(2026-10-13 「판매중 판매완료 추가」)
  // 딜러 이름은 「이은호 딜러」 형식(2026-10-13): 목록의 「이름 상사」는 이름만 따고 상사는 아래 회색 줄로 옮긴다
  const label = sellerLabel(car);
  const [personName, ...shopParts] = label.split(" "); // 상사 정보는 일단 숨김(2026-10-13)
  const sellerName = isDealer && !/딜러$/.test(label) && shopParts.length ? `${personName} 딜러` : label;
  const soldCount = 12 + ((car.id * 37) % 188);
  return (
    <section className="detail-seller-info" aria-label="판매자 정보">
      <img className="detail-seller-avatar" src={asset(sellerDetailPhoto(car))} alt="" draggable={false} />
      <div className="detail-seller-text">
        <div className="detail-seller-name"><strong>{sellerName}</strong>{isDealer && carShopName(car) ? <span className="bbm-card-location-part detail-seller-shop">{carShopName(car)}</span> : null}</div>
        {isDealer ? <span><b>{car.stock}대</b> 판매중 · <b>{soldCount}대</b> 판매완료</span> : null}
        {isDealer ? <span className="detail-seller-activity">딜러 경력 7년</span> : null}
      </div>
    </section>
  );
}

function SellerCard() {
  if (getActiveDetailCar()) return null;
  return (
    <section className="detail-card seller-card">
      <div className="seller-profile"><img src={asset("detail/raw-10.jpeg")} alt={sellerScenario.name} /><div><h2>{sellerScenario.name}</h2><p>● {sellerScenario.location}</p></div></div>
      <dl className="detail-rows"><div><dt>종사원번호</dt><dd>{sellerScenario.staffNumber} <u>상사/조합정보</u></dd></div><div><dt>매매유형</dt><dd>매매알선(소속 상사 매물)</dd></div></dl>
    </section>
  );
}

function SaleCard() {
  const { setSheet, notify } = useDetailUi();
  const car = getActiveDetailCar();
  if (car) return (
    <SectionCard title="판매 정보" className="is-sale-card">
      <dl className="detail-rows is-facts-size"><div><dt>차량가</dt><dd>{car.price}</dd></div>{car.ferrariDetail ? <div><dt>판매구분</dt><dd>{car.ferrariDetail.saleType}</dd></div> : null}</dl>
      <button className="cost-entry-button" type="button" onClick={() => setSheet("cost")}><span><b>구매비용 계산기</b><small>취득세·이전비·할부금까지 한 번에</small></span><strong>계산하기</strong></button>
    </SectionCard>
  );
  return (
    <SectionCard title="판매 정보" className="is-sale-card">
      <div className="cost-box"><dl><div><dt>차량가</dt><dd>1억5,980만원</dd></div><div><dt>이전 등록비(예상)</dt><dd>314만원</dd></div><div><dt>매도비</dt><dd>33만원</dd></div></dl><div className="cost-total"><span>예상 총 비용</span><strong>1억 6,328만원</strong></div></div>
      <div className="sale-actions"><button type="button" onClick={() => setSheet("cost")}>비용계산기</button><button type="button" onClick={() => notify("동급매물로 이동했어요")}>동급매물</button><button type="button" onClick={() => notify("할부매물을 확인해요")}>할부매물</button></div>
      <button className="report-button" type="button" onClick={() => notify("신고 접수 화면을 준비했어요")}><LockClosedIcon /> 신고하기</button>
    </SectionCard>
  );
}

function DescriptionCard({ desktop = false }: { desktop?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  if (getActiveDetailCar()) return null;
  return (
    <SectionCard title={desktop ? "차량 설명" : "상세 설명"}>
      <div className={`description-copy${expanded ? " is-expanded" : ""}`}>
        <p>2022년 5월식 벤틀리 컨티넨탈 GT 4.0 모델을 판매합니다.<br />벤틀리가 V8엔진으로 구동되는 3세대 컨티넨탈 GT를 선보였다. 쿠페와 컨버터블 형태로 출시될 이 모델은 올해 말부터 미국에서 판매될 예정이며, 이어 2020년 상반기에는 유럽 및 다른 국가에서도 판매될 예정이다.</p>
        <p>파워트레인은 기존의 6.0리터 W12엔진 대신 4.0리터 V8 가솔린 트윈터보 엔진이 장착됐다. 최대출력 550마력, 최고토크 78.5kg·m의 파워를 발휘합니다.</p>
      </div>
      <div className="contact-chip">연락처: 050-6246-9261 <a href="tel:05062469261">연락하기</a></div>
      <button className="more-copy-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "접기" : "더보기"} <ChevronDownIcon /></button>
    </SectionCard>
  );
}

type RailCar = { image: string; title: string; price: string; place: string; posted: string; meta?: string };

function CarRail({ title, cars: railCars }: { title: string; cars: RailCar[] }) {
  const { notify } = useDetailUi();
  // 실제 상세정보가 연결된 매물은 가상 추천 매물을 보여주지 않는다(2026-10-13)
  if (getActiveDetailCar()?.ferrariDetail) return null;
  return (
    <section className="related-section"><h2>{title}</h2><Carousel ariaLabel={title} className="related-carousel" contentClassName="related-track">
      {railCars.map((car) => <button key={`${title}-${car.title}`} className="related-card" type="button" onClick={() => notify(`${car.title} 매물을 열었어요`)}><div className="related-photo"><img src={asset(`detail/${car.image}`)} alt={car.title} draggable={false} /><span>{car.posted}</span><b>10 ▣</b></div><div><h3>{car.title}</h3>{car.meta ? <p>{formatMileage(car.meta)}</p> : null}<strong>{car.price}</strong><small>● {car.place}</small></div></button>)}
    </Carousel></section>
  );
}

const pcAsset = (name: string) => asset(`pc-detail/${name}`);

function DesktopGallery({ onBack }: { onBack: () => void }) {
  const { setSheet, notify } = useDetailUi();
  const [selected, setSelected] = useState(0);
  const thumbs = useRef<HTMLDivElement>(null);
  // 2026-10-14 「영상도 없는데 영상 버튼, 전반적으로 오류 수정」: 실매물 상세는 그 매물의 사진 · 사진 수를 쓰고 영상 표시도 영상이 있을 때만 보인다(시안 폴백만 벤틀리 시안 24장 · 영상 표시)
  const activeCar = getActiveDetailCar();
  const isMock = !activeCar;
  const photos = isMock ? Array.from({ length: 24 }, (_, i) => pcAsset(`9573-imgImage${i % 8 || ""}.png`)) : detailPhotosOf(activeCar);
  const showPlay = isMock || !!activeCar?.filter?.video;
  const choose = (index: number) => setSelected((index + photos.length) % photos.length);
  useEffect(() => {
    const rail = thumbs.current?.querySelector<HTMLElement>(".pc-thumbnails");
    const thumb = rail?.querySelector<HTMLElement>(`[data-photo="${selected}"]`);
    if (rail && thumb) rail.scrollTo({ left: Math.max(0, thumb.offsetLeft - rail.clientWidth / 2 + 48), behavior: "smooth" });
  }, [selected]);
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); notify("공유 링크를 복사했어요"); }
    catch { notify("주소창의 링크를 복사해 공유해 주세요."); }
  };
  return <section className="pc-gallery" aria-label="차량 사진">
    <div className="pc-hero" onKeyDown={(event) => { if (event.key === "ArrowRight") choose(selected + 1); if (event.key === "ArrowLeft") choose(selected - 1); }} tabIndex={0}>
      <img className="pc-hero-photo" src={isMock && selected === 0 ? pcAsset("9550-imgFrame1000006297.png") : photos[selected]} alt={`${isMock ? "벤틀리 " : ""}차량 사진 ${selected + 1}`} draggable={false} />
      <div className="pc-hero-tools"><button aria-label="목록으로 돌아가기" onClick={onBack}><img src={asset("detail/reddit-back.svg")} alt="" /></button><div><button aria-label="공유하기" onClick={share}><img src={asset("detail/autoscout24-share.svg")} alt="" /></button><button aria-label="더보기" onClick={() => setSheet("more")}><img src={asset("detail/autoscout24-more-vertical.svg")} alt="" /></button></div></div>
      {showPlay && selected === 0 && <span className="pc-play" aria-hidden="true"><img src={pcAsset("9550-imgMaskGroup.svg")} alt="" /><img src={pcAsset("9550-imgFill7.svg")} alt="" /></span>}
      <button className="pc-photo-prev" aria-label="이전 사진" onClick={() => choose(selected - 1)}><img src={pcAsset("9573-imgFrame1000006284.svg")} alt="" /></button>
      <button className="pc-photo-next" aria-label="다음 사진" onClick={() => choose(selected + 1)}><img src={pcAsset("9573-imgFrame1000006284.svg")} alt="" /></button>
      <span className="pc-photo-counter" aria-live="polite">{selected + 1}/{photos.length}</span>
    </div>
    <div className="pc-thumbnail-region" ref={thumbs}>
      <Carousel ariaLabel="차량 사진 썸네일" className="pc-thumbnails" contentClassName="pc-thumbnail-track">
        {photos.map((src, i) => <button key={i} data-photo={i} aria-label={`사진 ${i + 1} 보기`} aria-pressed={i === selected} style={activeCar?.imageAspectRatio ? { height: 84 / activeCar.imageAspectRatio } : undefined} onClick={() => choose(i)}><img src={src} alt="" draggable={false} style={activeCar?.imageAspectRatio ? { height: "100%", objectFit: "contain" } : undefined} />{showPlay && i === 0 && <span className="pc-thumb-play" aria-hidden="true"><img src={pcAsset("9550-imgMaskGroup.svg")} alt="" /><img src={pcAsset("9550-imgFill7.svg")} alt="" /></span>}</button>)}
      </Carousel>
      <button className="pc-rail-next" aria-label="다음 썸네일" onClick={() => choose(selected + 1)}><img src={pcAsset("9573-imgFrame1000006284.svg")} alt="" /></button>
    </div>
  </section>;
}

function DesktopVehicleInfo() {
  const [expanded, setExpanded] = useState(false);
  const rows = [
    ["주행거리", formatMileage("42,000km"), "imgPropertyStatus1"], ["연료", "가솔린", "imgImage213"],
    ["변속기", "자동 8단", "imgImage214"], ["배기량", "2,497 cc", "imgImage215"],
    ["색상", "검정색 (외장) · 흰색 (시트)", "imgImage216"], ["지역", "서울 서초구", "imgImage217"],
    ["사고이력", "없음", "imgImage218"],
  ];
  return <SectionCard title="차량 정보" className="pc-info">
    <dl>{rows.map(([label, value, icon]) => <div key={label}><dt><img src={pcAsset(`9626-${icon}.png`)} alt="" />{label}</dt><dd>{value}</dd></div>)}{expanded && extraInfo.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <button className="vehicle-info-toggle" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "접기" : "더보기"}<img className={expanded ? "is-expanded" : ""} src={pcAsset("9626-imgFrame1000006238.svg")} alt="" /></button>
  </SectionCard>;
}

function DesktopSummary({ jump }: { jump: (id: string) => void }) {
  const { liked, setLiked, setSheet, notify } = useDetailUi();
  return <aside className="pc-sidebar">
    <section className="detail-card pc-summary">
      <div className="pc-title-row"><h1>벤틀리 컨티넨탈 GT 3세대 6.0 퍼스트 에디션</h1><button aria-label="매물 저장" aria-pressed={liked} onClick={() => setLiked(!liked)}>{liked ? <HeartFilledIcon /> : <img src={pcAsset("9877-imgIcon.svg")} alt="" />}<span>{liked ? 1 : 0}</span></button></div>
      <p className="pc-specs">172무2323 · 19년 02월 · {formatMileage("17,000 km")} · 가솔린</p>
      <div className="pc-badges"><span>인증중고차</span><span>1년 보증</span></div>
      <div className="pc-price-row"><strong>1억 4,500만원</strong><button onClick={() => setSheet("priceHistory")}>가격 변동</button><button className="pc-insurance" onClick={() => notify("보험료는 보험사 상담을 통해 확인해 주세요.")}>보험료 계산</button></div>
      <p className="pc-summary-note">6인승 독립시트로 뒷좌석의 편안함을 최우선으로 느껴보세요.</p>
      <div className="pc-summary-links"><button onClick={() => jump("pc-history")}><b>보험이력</b><span>0건 <img src={pcAsset("9877-imgIcon1.svg")} alt="" /></span></button><button onClick={() => jump("pc-inspection")}><b>성능점검</b><span>보기 <img src={pcAsset("9877-imgIcon1.svg")} alt="" /></span></button></div>
      <div className="pc-calculators"><button onClick={() => setSheet("cost")}>비용계산기</button><button onClick={() => jump("pc-related")}>동급매물</button><button onClick={() => notify("판매 완료된 매물 정보가 없습니다.")}>팔린매물</button></div>
    </section>
    <section className="detail-card pc-seller">
      <div className="seller-profile"><img src={pcAsset("9877-imgFrame1000006239.png")} alt="한강모터스 박성수" /><div><h2>한강모터스 박성수 <span>딜러</span></h2><p><b>5대</b> 판매중 · <b>10대</b> 판매완료</p><p>● 서울 서초구 오토갤러리</p></div></div>
      <dl><div><dt>종사원번호</dt><dd>SE25-00585 <button onClick={() => notify("한강모터스 · 서울 서초구 오토갤러리 · SE25-00585")}>상사/조합정보</button></dd></div><div><dt>매매유형</dt><dd>매매알선(소속 상사 매물)</dd></div></dl>
      <div className="pc-seller-contact"><button onClick={() => setSheet("contact")}>채팅</button><a href="tel:05062469261"><img src={pcAsset("9877-imgSvgexport251.svg")} alt="" />050-6246-9261</a></div>
      <button className="pc-report" onClick={() => setSheet("more")}>신고하기</button>
    </section>
  </aside>;
}

function DesktopHeader({ onBack }: { onBack: () => void }) {
  const { notify } = useDetailUi();
  return <header className="pc-header">
    <div className="pc-header-inner"><div className="pc-account">{["로그인", "회원가입", "고객센터"].map(label => <button key={label} onClick={() => notify(`${label}는 정식 서비스에서 이용해 주세요.`)}>{label}</button>)}</div>
      <button className="pc-logo" aria-label="보배드림 목록" onClick={onBack}><span><img src={pcAsset("9546-imgGroup.svg")} alt="" /></span><img src={pcAsset("9546-imgLogo.svg")} alt="보배드림" /></button>
      <div className="pc-navigation"><nav aria-label="주 메뉴">{["내차사기", "내차팔기", "딜러", "부품·용품", "커뮤니티", "컨텐츠", "더보기"].map(label => <button className={label === "커뮤니티" ? "active" : ""} key={label} onClick={() => label === "내차사기" ? onBack() : notify(`${label}는 정식 서비스에서 이용해 주세요.`)}>{label}{label === "더보기" && <img src={pcAsset("9546-imgIcon.svg")} alt="" />}</button>)}</nav><div className="pc-nav-icons">{[["검색", "img1IconSearchSize24"], ["마이페이지", "img1IconUserSmileSize24"], ["저장한 매물", "img1IconHeartSize24"], ["알림", "img1IconNoticeSize24"], ["전체 메뉴", "imgGroup1000005392"]].map(([label, icon]) => <button key={label} aria-label={label} onClick={() => label === "검색" ? onBack() : notify(`${label}를 확인하려면 목록으로 돌아가 주세요.`)}><img src={pcAsset(`9546-${icon}.svg`)} alt="" /></button>)}</div></div>
    </div>
  </header>;
}

function DesktopVehicleDetail({ onBack }: { onBack: () => void }) {
  const content = useRef<HTMLDivElement>(null);
  const jump = (id: string) => {
    const target = content.current?.querySelector<HTMLElement>(`#${id}`);
    const scroll = content.current?.closest(".detail-screen");
    if (target && scroll) scroll.scrollTo({ top: target.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop - 16, behavior: "smooth" });
  };
  return <div className="pc-detail" ref={content}>
    <DesktopHeader onBack={onBack} />
    <main className="pc-detail-container" aria-label="중고차 PC 상세">
      <div className="pc-detail-columns"><div className="pc-detail-left"><DesktopGallery onBack={onBack} /><DescriptionCard desktop /><DesktopVehicleInfo /><OptionsCard desktop /><div id="pc-history"><HistoryCard /></div><div id="pc-inspection"><InspectionCard /></div><WarrantyCard /></div><DesktopSummary jump={jump} /></div>
      <CarRail title="한강모터스 박성수의 다른 매물" cars={relatedCars} />
      <div id="pc-related"><CarRail title="동급매물" cars={classCars} /></div>
      <p className="safety-copy">안전한 거래와 허위매물 근절을 위해 안심번호(050) 이용 시 통화 내용이 보배드림에 안전하게 보관됩니다.<br />보배드림은 등록 시스템만 제공하며, 판매자가 직접 등록한 차량에 대한 모든 책임은 판매자에게 있습니다.</p>
      <button className="pc-return" onClick={onBack}>목록으로 돌아가기</button>
    </main>
    <footer className="pc-footer"><div><section><h3>(주) 보배네트워크 사업자 정보</h3><p>대표이사: 김보배　|　사업자등록번호: 117-81-64543</p><p>주소: (07995) 서울 양천구 목동동로 233-1 드림타워 11, 12층</p><p>통신판매업신고번호: 제2013-서울양천-0465호　|　개인정보관리책임자: 이은호</p><p>팩스: 02-6499-2329　|　메일: bobaedream@bobaedream.co.kr</p><p>Copyright ⓒ (주)보배네트워크</p></section><section><h3>고객센터</h3><strong>02-784-2329</strong><p>평일　09:00 ~ 18:00</p><p>점심시간　11:30 ~ 12:30</p></section></div><p>회사소개　　제휴/광고문의　　이용약관　　제휴/신고센터　　고객센터　　청소년보호정책　　개인정보취급방침　　원격지원</p><div className="pc-footer-social">{["imgGroup", "imgPrimeFacebook", "imgMdiYoutube", "imgFrame1000005307"].map(icon => <img key={icon} src={pcAsset(`10204-${icon}.svg`)} alt="" />)}</div></footer>
  </div>;
}

function BikeVehicleDetail({ car, onBack }: { car: Car; onBack: () => void }) {
  const bike = car.bike!;
  // 상세 썸네일 줄(카이디 크기)을 바이크 상세에도 쓴다. 사진이 여러 장이면 아래 줄에서 큰 사진을 고른다
  const photos = detailPhotosOf(car);
  const [photoIndex, setPhotoIndex] = useState(0);
  const rows = [
    ["제조사", car.maker],
    ["모델", car.modelGroup ?? car.title],
    ["연식", car.filter ? `${car.filter.year}년` : "미확인"],
    ["주행거리", car.filter ? `${car.filter.mileage.toLocaleString("ko-KR")}km` : "미확인"],
    ["배기량", `${bike.displacement.toLocaleString("ko-KR")}cc`],
    ["장르", bike.genre],
    ["면허", bike.licenseClass],
    ["상태", bike.condition],
  ];
  const sellerRows = [
    ["판매자 유형", bike.sellerType],
    ["판매자명", car.dealer],
    ["주소", bike.sellerAddress],
    ["연락 방식", bike.sellerContact],
    ["영업시간", bike.businessHours],
  ];
  return (
    <main className="vehicle-detail bike-vehicle-detail" aria-label="바이크 상세">
      <section className="detail-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ position: "relative" }}>
          <img src={photos[photoIndex] ?? asset(car.image)} alt={car.title} style={{ display: "block", width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }} />
          <button type="button" aria-label="목록으로 돌아가기" onClick={onBack} style={{ position: "absolute", top: 12, left: 12, width: 40, height: 40, border: 0, borderRadius: 20, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 22 }}>←</button>
        </div>
        {photos.length > 1 && new URLSearchParams(window.location.search).get("thumbs") === "on" ? <div className="detail-thumbs" role="group" aria-label="차량 사진 썸네일">
          {photos.map((photo, index) => <button key={`${photo}-${index}`} type="button" aria-label={`사진 ${index + 1} 보기`} aria-pressed={index === photoIndex} className={index === photoIndex ? "is-active" : ""} onClick={() => setPhotoIndex(index)}><img src={photo} alt="" draggable={false} loading="lazy" /></button>)}
        </div> : null}
        <div style={{ padding: 20 }}>
          <p style={{ margin: "0 0 6px", color: "#777", fontSize: 13 }}>테스트용 가상 매물 · {bike.scenarioId}</p>
          <h1 style={{ margin: 0, fontSize: 23 }}>{car.title}</h1>
          <p style={{ margin: "8px 0 0", color: "#555" }}>{car.trim}</p>
          <strong style={{ display: "block", marginTop: 14, fontSize: 22 }}>{car.price}</strong>
        </div>
      </section>
      <div className="detail-gray-stack">
        <SectionCard title="바이크 정보"><InfoGrid items={rows} /></SectionCard>
        <SectionCard title="판매자 정보"><InfoGrid items={sellerRows} /><p style={{ margin: "16px 0 0", color: "#666", lineHeight: 1.6 }}>{bike.sellerIntro}</p></SectionCard>
        <SectionCard title="거래 정보"><InfoGrid items={[["인증", bike.certified], ["인수 방식", bike.delivery], ["시나리오 버전", bike.scenarioVersion], ["이미지 등급", bike.imageGrade]]} /><p style={{ margin: "16px 0 0", color: "#777", fontSize: 13 }}>모든 판매자 정보는 테스트용 가상 정보이며 실제 연락처와 상세 주소가 아닙니다.</p></SectionCard>
      </div>
    </main>
  );
}

const detailTabLabels: Record<string, string> = { "차량 설명": "설명", "차량 정보": "기본 정보", "차량 히스토리": "히스토리", "사고·성능점검": "사고·점검", "차량 옵션": "옵션", "보험 이력": "보험", "성능 점검": "점검", "보증 정보": "보증정보", "판매 정보": "판매 정보", "동급매물": "동급" };

// 2026-10-14 좐좐식 상세 탭: 아래 카드들을 그대로 두고, 카드 제목을 읽어 탭을 만들고 누르면 그 카드로 이동한다. 스크롤하면 보고 있는 카드의 탭이 강조된다.
function DetailTabs() {
  const barRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(0);
  const [tabs, setTabs] = useState<{ key: string; label: string }[]>([]);
  const [active, setActive] = useState("");
  const sectionsFor = () => {
    const main = barRef.current?.closest("main");
    if (!main) return [] as { key: string; label: string; el: HTMLElement }[];
    const list: { key: string; label: string; el: HTMLElement }[] = [];
    main.querySelectorAll<HTMLElement>(".detail-gray-stack > section, .related-section").forEach((el, i) => {
      const title = el.querySelector("h2")?.textContent?.trim() ?? "";
      const label = detailTabLabels[title] ?? (title.endsWith("다른 매물") ? "판매자" : "");
      if (label) list.push({ key: `${i}-${label}`, label, el });
    });
    return list;
  };
  useEffect(() => {
    const main = barRef.current?.closest("main");
    if (!main) return;
    const scan = () => setTabs((prev) => {
      const next = sectionsFor().map(({ key, label }) => ({ key, label }));
      return prev.length === next.length && prev.every((t, i) => t.key === next[i].key) ? prev : next;
    });
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const bar = barRef.current;
    const scroller = bar?.closest<HTMLElement>(".mobile-scroll");
    if (!bar || !scroller) return;
    const update = () => {
      if (Date.now() < lockRef.current) return;
      const line = scroller.getBoundingClientRect().top + bar.offsetHeight + 12;
      let current = "";
      for (const { key, el } of sectionsFor()) if (el.getBoundingClientRect().top <= line) current = key;
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) current = sectionsFor().at(-1)?.key ?? current;
      setActive(current);
    };
    scroller.addEventListener("scroll", update, { passive: true });
    update();
    return () => scroller.removeEventListener("scroll", update);
  }, [tabs]);
  useEffect(() => {
    const bar = barRef.current;
    const tab = bar?.querySelector<HTMLElement>(".is-active");
    if (!bar || !tab) return;
    bar.scrollTo({ left: tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [active]);
  if (tabs.length < 2) return <div ref={barRef} hidden />;
  const go = (key: string) => {
    const bar = barRef.current;
    const scroller = bar?.closest<HTMLElement>(".mobile-scroll");
    const target = sectionsFor().find((section) => section.key === key)?.el;
    if (!bar || !scroller || !target) return;
    setActive(key);
    lockRef.current = Date.now() + 900;
    const top = scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - bar.offsetHeight;
    scroller.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <div ref={barRef} className="detail-tabs" role="tablist" aria-label="상세 메뉴" data-scroll-drag="ignore">
      {tabs.map((tab) => <button key={tab.key} type="button" role="tab" aria-selected={tab.key === active} className={tab.key === active ? "is-active" : ""} onClick={() => go(tab.key)}>{tab.label}</button>)}
    </div>
  );
}

function VehicleDetail() {
  const flow = useFlow();
  const goBack = () => flow.canGoBack ? flow.pop() : window.history.back();
  const activeCar = getActiveDetailCar();
  const [desktop, setDesktop] = useState(() => isDesktopPreview() && window.matchMedia("(min-width: 820px)").matches);
  useEffect(() => {
    if (isForcedMobileView()) {
      setDesktop(false);
      return;
    }
    const query = window.matchMedia("(min-width: 820px)");
    const update = () => setDesktop(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const { sheet, setSheet, toast, notify } = useDetailUi();
  if (activeCar?.bike) {
    return (
      <div className="detail-scene">
        <MobileScroll className="detail-screen"><BikeVehicleDetail car={activeCar} onBack={goBack} /></MobileScroll>
        {toast ? <div className="detail-toast" role="status">{toast}</div> : null}
      </div>
    );
  }
  return (
    <div className="detail-scene">
      <MobileScroll className="detail-screen">
        {desktop ? <DesktopVehicleDetail onBack={goBack} /> : <>
        <main className="vehicle-detail" aria-label="중고차 상세">
          <DetailHero onBack={goBack} />
          <VehicleSummary />
          <DetailTabs />
          <div className="detail-gray-stack">
            <SellerCard />
            <DetailHighlights />
            <VehicleInfoCard />
            <VehicleHistoryCard />
            <AccidentInspectionCard />
            <OptionsCard />
            <WarrantyCard />
            <SaleCard />
            <DescriptionCard />
          </div>
          <CarRail title={`${sellerScenario.name}의 다른 매물`} cars={relatedCars} />
          <CarRail title="동급매물" cars={classCars} />
          <p className="safety-copy">안전한 거래와 허위매물 근절을 위해 안심번호(050) 이용 시 통화 내용이 보배드림에 안전하게 보관됩니다.<br />보배드림은 등록 시스템만 제공하며, 판매자가 직접 등록한 차량에 대한 모든 책임은 판매자에게 있습니다. <button type="button" onClick={() => notify("신고하기를 선택했어요")}>신고하기</button></p>
        </main>
        </>}
      </MobileScroll>
      {toast ? <div className="detail-toast" role="status">{toast}</div> : null}
      <BottomSheet open={sheet !== null} onOpenChange={(open) => !open && setSheet(null)} title={sheet === "cost" ? "구매비용 계산기" : sheet === "priceHistory" ? "가격 변동 내역" : sheet === "more" ? "매물 더보기" : "판매자 상담"} description={sheet === "cost" || sheet === "priceHistory" ? undefined : sheet === "more" ? "원하는 작업을 선택하세요." : `${sellerScenario.name}에게 문의할 수 있어요.`} snap={sheet === "cost" ? 0.94 : sheet === "priceHistory" ? 0.75 : 0.42}>
        {sheet === "cost" ? <CostCalculatorSheet onClose={() => setSheet(null)} /> : sheet === "priceHistory" ? <PriceHistorySheet onClose={() => setSheet(null)} /> : <div className="detail-sheet-actions">
          {sheet === "more" ? <><button type="button" onClick={() => { notify("매물 신고를 선택했어요"); setSheet(null); }}>허위매물 신고</button><button type="button" onClick={() => { notify("판매자를 차단했어요"); setSheet(null); }}>판매자 차단</button><button type="button" onClick={() => setSheet(null)}>취소</button></> : <><a href={sellerScenario.phoneHref}><MobileIcon /> {sellerScenario.phoneLabel} 전화하기</a><button type="button" onClick={() => { notify("상담 요청을 보냈어요"); setSheet(null); }}>문자로 상담 요청</button><button type="button" onClick={() => setSheet(null)}>닫기</button></>}
        </div>}
      </BottomSheet>
    </div>
  );
}

function DetailFooter() {
  const { setSheet, notify } = useDetailUi();
  const activeCar = getActiveDetailCar();
  if (activeCar?.bike) {
    return (
      <div className="detail-bottom-bar">
        <button className="detail-history" type="button" onClick={() => notify("가상 매물 정보입니다")}>가상 매물</button>
        <button className="detail-call" type="button" onClick={() => notify(activeCar.bike?.sellerContact ?? "앱 채팅 전용 (가상)")}><img src={asset("detail/call.svg")} alt="" /> 연락 방식</button>
        <button className="detail-consult" type="button" onClick={() => notify("테스트용 앱 채팅입니다")}>채팅</button>
      </div>
    );
  }
  return (
    <div className="detail-bottom-bar">
      <a className="detail-history" href={vehicleHistoryUrl(detailVehiclePlate)}>이력조회</a>
      <a className="detail-call" href="tel:05062469261"><img src={asset("detail/call.svg")} alt="" /> 전화</a>
      <button className="detail-zalo" type="button" onClick={() => notify("카카오 상담을 준비했어요")}>카카오</button>
      <button className="detail-consult" type="button" onClick={() => setSheet("contact")}>채팅</button>
    </div>
  );
}


export { DetailUiProvider, useDetailUi, VehicleDetail, DetailFooter };
