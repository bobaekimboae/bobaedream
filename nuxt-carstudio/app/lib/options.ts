// 고르기 칸의 선택지(원본 영어 → 한국어). 영상 글자 · AI 음성 대사도 여기서 만든다.
import type { Details, Lang } from "./types";

export type Opt = { v: string; ko: string; en: string };
const o = (v: string, ko: string, en: string): Opt => ({ v, ko, en });

export const TRANSMISSION: Opt[] = [o("auto", "자동", "Automatic"), o("manual", "수동", "Manual"), o("semi", "세미오토", "Semi-automatic"), o("cvt", "CVT", "CVT")];
export const FUEL: Opt[] = [o("gasoline", "가솔린", "Petrol"), o("diesel", "디젤", "Diesel"), o("hybrid", "하이브리드", "Hybrid"), o("phev", "플러그인 하이브리드", "Plug-in hybrid"), o("ev", "전기", "Electric"), o("lpg", "LPG", "LPG")];
export const DRIVETRAIN: Opt[] = [o("fwd", "전륜구동", "FWD"), o("rwd", "후륜구동", "RWD"), o("awd", "상시 사륜(AWD)", "AWD"), o("4wd", "사륜(4WD)", "4WD")];
export const BODY: Opt[] = [o("sedan", "세단", "Sedan"), o("hatch", "해치백", "Hatchback"), o("suv", "SUV", "SUV"), o("coupe", "쿠페", "Coupe"), o("conv", "컨버터블", "Convertible"), o("wagon", "왜건", "Wagon"), o("mpv", "MPV", "MPV"), o("van", "밴", "Van"), o("pickup", "픽업", "Pickup")];
export const COLOR: Opt[] = [o("white", "흰색", "White"), o("black", "검정", "Black"), o("gray", "회색", "Grey"), o("silver", "은색", "Silver"), o("blue", "파랑", "Blue"), o("red", "빨강", "Red"), o("brown", "갈색", "Brown"), o("beige", "베이지", "Beige"), o("green", "초록", "Green"), o("yellow", "노랑", "Yellow"), o("orange", "주황", "Orange"), o("other", "기타", "Other")];
export const CONDITION: Opt[] = [o("used", "중고", "Used"), o("likenew", "신차급", "Like new"), o("new", "신차", "New")];
export const CURRENCY = [
  { v: "KRW", ko: "원 (KRW)" },
  { v: "USD", ko: "달러 (USD)" },
  { v: "EUR", ko: "유로 (EUR)" },
];

export const LANGS: { v: Lang; label: string; speech: string }[] = [
  { v: "ko", label: "한국어", speech: "ko-KR" },
  { v: "tr", label: "Türkçe", speech: "tr-TR" },
  { v: "en", label: "English", speech: "en-US" },
  { v: "es", label: "Español", speech: "es-ES" },
  { v: "fr", label: "Français", speech: "fr-FR" },
  { v: "de", label: "Deutsch", speech: "de-DE" },
  { v: "it", label: "Italiano", speech: "it-IT" },
  { v: "ru", label: "Русский", speech: "ru-RU" },
  { v: "pt", label: "Português", speech: "pt-PT" },
];

const find = (list: Opt[], v: string) => list.find((x) => x.v === v);
/** 영상 글자 언어: 한국어만 한국어, 나머지는 영어(원본 화면 글자도 영어) */
export const lab = (list: Opt[], v: string, lang: Lang) => {
  const x = find(list, v);
  return x ? (lang === "ko" ? x.ko : x.en) : "";
};

export const fmtNum = (raw: string) => {
  const n = Number(String(raw).replace(/[^\d]/g, ""));
  return n ? n.toLocaleString("en-US") : "";
};
export const mileageLabel = (d: Details) => (fmtNum(d.mileage) ? `${fmtNum(d.mileage)} ${d.unit}` : "");
export function priceLabel(d: Details, lang: Lang) {
  const n = Number(d.price.replace(/[^\d]/g, ""));
  if (!n) return "";
  if (d.currency === "KRW") {
    if (lang !== "ko") return `₩${n.toLocaleString("en-US")}`;
    // 입력이 10만 이상이면 원, 아니면 만원으로 본다
    const man = n >= 100000 ? Math.round(n / 10000) : n;
    return `${man.toLocaleString("ko-KR")}만원`;
  }
  return `${d.currency === "USD" ? "$" : "€"}${n.toLocaleString("en-US")}`;
}

/** 원본 영상 글자: 큰 제목 위의 작은 글 · 표의 이름 */
export const WORDS: Record<"details" | "history" | "transmission" | "fuel" | "drivetrain" | "mileage" | "condition" | "price" | "power" | "engine" | "owners" | "warranty" | "damage" | "contact", { ko: string; en: string }> = {
  details: { ko: "디테일", en: "DETAILS" },
  history: { ko: "이력", en: "HISTORY" },
  transmission: { ko: "변속기", en: "TRANSMISSION" },
  fuel: { ko: "연료", en: "FUEL TYPE" },
  drivetrain: { ko: "구동", en: "DRIVETRAIN" },
  mileage: { ko: "주행거리", en: "MILEAGE" },
  condition: { ko: "상태", en: "CONDITION" },
  price: { ko: "가격", en: "PRICE" },
  power: { ko: "출력", en: "POWER" },
  engine: { ko: "배기량", en: "ENGINE" },
  owners: { ko: "소유자", en: "OWNERS" },
  warranty: { ko: "보증", en: "WARRANTY" },
  damage: { ko: "사고 이력", en: "DAMAGE" },
  contact: { ko: "문의", en: "CONTACT" },
};
export const word = (k: keyof typeof WORDS, lang: Lang) => (lang === "ko" ? WORDS[k].ko : WORDS[k].en);

/** 구매자 6가지 중 고른 것만 짧은 글로(영상 이력 장면 · 끝 장면) */
export function buyerFacts(d: Details, lang: Lang) {
  const ko = lang === "ko";
  const out: [string, string][] = [];
  if (d.damage) out.push([ko ? "사고 이력" : "DAMAGE", d.damage === "no" ? (ko ? "없음" : "None") : ko ? "있음" : "Yes"]);
  if (d.repainted) out.push([ko ? "도색" : "REPAINTED", d.repainted === "no" ? (ko ? "없음" : "None") : ko ? "있음" : "Yes"]);
  if (d.replaced) out.push([ko ? "교환" : "REPLACED", d.replaced === "no" ? (ko ? "없음" : "None") : ko ? "있음" : "Yes"]);
  if (d.owners) out.push([ko ? "소유자" : "OWNERS", d.owners === "1" ? (ko ? "1인 소유" : "First owner") : d.owners === "2" ? (ko ? "2인" : "2nd") : ko ? "3인 이상" : "3+"]);
  if (d.warranty) out.push([ko ? "보증" : "WARRANTY", d.warranty === "active" ? (ko ? "유효" : "Active") : ko ? "만료" : "Expired"]);
  if (d.tradeIn) out.push([ko ? "대차" : "TRADE-IN", d.tradeIn === "accepted" ? (ko ? "가능" : "Accepted") : ko ? "불가" : "Not accepted"]);
  return out;
}

const josa = (w: string, a: string, b: string) => {
  const c = w.charCodeAt(w.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return /[0-9LRMN]$/i.test(w) ? a : b;
  return (c - 0xac00) % 28 ? a : b;
};

/** AI 음성 대사(장면마다 한 줄). 매물 정보에 있는 사실만 쓴다(사고 · 가격을 지어내지 않음). */
export function voiceLine(kind: string, d: Details, lang: Lang): string {
  const ko = lang === "ko";
  const car = [d.make, d.model].filter(Boolean).join(" ");
  const fuel = lab(FUEL, d.fuel, lang);
  const tr = lab(TRANSMISSION, d.transmission, lang);
  const dt = lab(DRIVETRAIN, d.drivetrain, lang);
  const body = lab(BODY, d.body, lang);
  const color = lab(COLOR, d.color, lang);
  const km = mileageLabel(d);
  if (kind === "hero") return ko ? `${d.year ? `${d.year}년식 ` : ""}${car}${josa(car, "을", "를")} 소개합니다.` : `Presenting the ${d.year ? `${d.year} ` : ""}${car}.`;
  if (kind === "title") return ko ? "안팎의 디테일을 살펴보세요." : "Take a look at the details inside and out.";
  if (kind === "details") {
    if (!body && !color) return "";
    if (ko) return color && body ? `${color} ${body}입니다.` : `${color || body}입니다.`;
    return color ? `This ${body || "car"} comes in ${color.toLowerCase()}.` : `This is a ${body}.`;
  }
  if (kind === "specs") {
    if (!fuel && !tr && !dt) return "";
    if (ko) return `${[fuel && `${fuel} 엔진`, tr && `${tr} 변속기`, dt].filter(Boolean).join(", ")}입니다.`;
    const parts = [fuel && `runs on ${fuel.toLowerCase()}`, tr && `has an ${tr.toLowerCase()} gearbox`, dt && `features ${dt === "AWD" ? "all-wheel drive" : dt}`].filter(Boolean) as string[];
    return `It ${parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0]}.`;
  }
  if (kind === "history") {
    if (!km) return "";
    return ko ? `주행거리는 ${km}입니다.` : `It has ${km} on the clock.`;
  }
  if (kind === "closing") {
    if (ko) return d.dealer ? `${d.dealer}에 지금 문의하세요.` : "지금 전화로 문의하세요.";
    return "Call today to find out more.";
  }
  if (kind === "price") {
    const p = priceLabel(d, lang);
    return p ? (ko ? `가격은 ${p}입니다.` : `It is priced at ${p}.`) : "";
  }
  return "";
}
