import { useEffect, useRef, useState, type ReactNode } from "react";
import { rangeIsSet, setBbmChecks, setBbmRange, type BbmFilterValues } from "../filters/bbm-filter-state";
import { bbmIcon } from "./bbm-list";
import { BbmSheet } from "../filters/bbm-filter-parts";
import regionsKr from "../data/regions-kr.json";
import "./stable-top.css";
import "./qf-align.css";

// QF-106 상단 구조 안정성 매뉴얼 v1.1(docs/stable-top-manual.md) — 과쯔 모드 PC 상단 카드 ③ 지역 칩 줄 · ④ 연식 알약 줄 · 제목 고정 · 모바일 ⑤ 관련 검색어

/** 제목 = 상단 메뉴(유형)로 들어온 카테고리 이름만. 대수·날짜·칩 조건은 넣지 않는다 */
// QF-113 T6: 유형 줄에서 고른 유형이면 제목 = 유형 이름("트럭 · 특장" · "바이크" · "캠핑카" · "올드카" · "건설기계" · "부품 · 용품"), 중고차면 "중고차"
const STABLE_TYPE_TITLES = ["트럭 · 특장", "바이크", "캠핑카", "올드카", "건설기계", "부품 · 용품"];
export function stablePageTitle(category: string) {
  if (category === "국산차") return "국산 중고차";
  if (category === "수입차") return "수입 중고차";
  if (STABLE_TYPE_TITLES.includes(category)) return category;
  return "중고차";
}

/** 알약 줄: 이름표 + 가로 스크롤(스크롤바 숨김) + 넘치면 › 화살표. 높이 32 */
function PillRow({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ prev: false, next: false });
  useEffect(() => {
    const element = scroller.current;
    if (!element) return undefined;
    const update = () => setEdges({ prev: element.scrollLeft > 1, next: element.scrollLeft + element.clientWidth < element.scrollWidth - 1 });
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => { element.removeEventListener("scroll", update); observer.disconnect(); };
  }, []);
  const move = (direction: 1 | -1) => scroller.current?.scrollBy({ left: direction * Math.max(80, (scroller.current?.clientWidth ?? 200) - 80), behavior: "smooth" });
  return (
    <div className={`stable-pill-row${className ? ` ${className}` : ""}`}>
      {label ? <span className="stable-pill-label">{label}</span> : null}
      <div className="stable-pill-scroll">
        <div ref={scroller} className="stable-pill-track-wrap">
          <div className="stable-pill-track">{children}</div>
        </div>
        {edges.prev ? <button type="button" className="stable-pill-arrow is-prev" aria-label="이전" onClick={() => move(-1)}><img src={bbmIcon("filter-chevron")} alt="" aria-hidden="true" /></button> : null}
        {edges.next ? <button type="button" className="stable-pill-arrow is-next" aria-label="다음" onClick={() => move(1)}><img src={bbmIcon("filter-chevron")} alt="" aria-hidden="true" /></button> : null}
      </div>
    </div>
  );
}

// ③ 지역 칩 줄(PC만, 항상, 높이 32 고정). QF-111 시도 → 구·군 단계(src/prototype/data/regions-kr.json):
//  처음 "지역:" + 시도 17 + "내 주변" → 시도 누름: 칩 [서울 ×], 같은 자리가 "서울:" + "서울 전체"(선택, 700) + 구·군 알약 줄
//  구·군 누름: 칩 [강남구 ×], 줄 유지, 다른 구·군은 바뀜(하나만), 같은 구·군·"서울 전체"는 해제. 세종처럼 구·군이 없는 시도는 시도 줄 유지
export const STABLE_REGION_OPTIONS = regionsKr.sido;
const districtsOf = (sido: string | null) => (sido ? (regionsKr.districts as Record<string, string[]>)[sido] ?? [] : []);
export const stableRegionState = (value: BbmFilterValues) => {
  const sido = value.checks.region?.[0] ?? null;
  const district = value.checks.district?.find((item) => sido && item.startsWith(`${sido} `)) ?? null;
  return { sido, district, districtName: district ? district.slice((sido ?? "").length + 1) : null, districts: districtsOf(sido) };
};
/** 시도 고르기(구·군은 풀림). 같은 시도를 다시 누르면 해제(구·군 없는 시도에서만 보임) */
export const chooseStableSido = (value: BbmFilterValues, sido: string | null) => {
  const current = value.checks.region?.[0] ?? null;
  const cleared = setBbmChecks(value, "district", []);
  return setBbmChecks(cleared, "region", !sido || current === sido ? [] : [sido]);
};
/** 구·군 고르기: 같은 것 · null("전체")은 해제, 다른 것은 바꿈(하나만) */
export const chooseStableDistrict = (value: BbmFilterValues, name: string | null) => {
  const { sido, districtName } = stableRegionState(value);
  if (!sido) return value;
  return setBbmChecks(value, "district", !name || name === districtName ? [] : [`${sido} ${name}`]);
};
export function StableRegionRow({ value, onChange, onNearby }: { value: BbmFilterValues; onChange: (next: BbmFilterValues) => void; onNearby: () => void }) {
  const { sido, districtName, districts } = stableRegionState(value);
  if (sido && districts.length) {
    return (
      <PillRow key={`drill-${sido}`} label={`${sido}:`} className="bbm-ct-region-row is-district">
        <button type="button" className={`stable-pill is-all${districtName ? "" : " is-selected"}`} aria-pressed={!districtName} onClick={() => onChange(chooseStableDistrict(value, null))}>{sido} 전체</button>
        {districts.map((name) => {
          const on = districtName === name;
          return <button key={name} type="button" className={`stable-pill${on ? " is-selected" : ""}`} aria-pressed={on} onClick={() => onChange(chooseStableDistrict(value, name))}>{name}</button>;
        })}
      </PillRow>
    );
  }
  return (
    <PillRow key="sido" label="지역:" className="bbm-ct-region-row">
      {STABLE_REGION_OPTIONS.map((name) => {
        const on = sido === name;
        return <button key={name} type="button" className={`stable-pill${on ? " is-selected" : ""}`} aria-pressed={on} onClick={() => onChange(chooseStableSido(value, name))}>{name}</button>;
      })}
      <button type="button" className="stable-pill is-nearby" onClick={onNearby}><img src={bbmIcon("m-region-location")} alt="" aria-hidden="true" />내 주변</button>
    </PillRow>
  );
}

// QF-111 모바일 "지역: 전국 ▾" 바텀시트(칩 줄은 추가하지 않음): 1단계 시도 17 알약(3열, 높이 40) + "내 주변"
// → 구·군이 있는 시도: 같은 시트가 2단계("← 서울", "서울 전체"(선택) + 구·군 3열) → 구·군 누르면 닫힘(칩 [서울 ×][강남구 ×])
// → 세종처럼 구·군이 없으면 1단계에서 바로 적용하고 닫힘
export function stableRegionLabel(value: BbmFilterValues) {
  const { sido, districtName } = stableRegionState(value);
  return sido ? [sido, districtName].filter(Boolean).join(" ") : "전국";
}
export function StableRegionSheet({ value, onChange, onClose, onNearby }: { value: BbmFilterValues; onChange: (next: BbmFilterValues) => void; onClose: () => void; onNearby: () => void }) {
  const current = stableRegionState(value);
  const [step, setStep] = useState<string | null>(current.sido && current.districts.length ? current.sido : null);
  const pickSido = (name: string) => {
    const next = setBbmChecks(setBbmChecks(value, "district", []), "region", [name]);
    onChange(next);
    if (districtsOf(name).length) setStep(name); else onClose();
  };
  if (step) {
    const districtName = value.checks.region?.[0] === step ? stableRegionState(value).districtName : null;
    return (
      <BbmSheet title={step} onBack={() => setStep(null)} onClose={onClose}>
        <div className="stable-region-grid">
          <button type="button" className={`stable-region-cell is-all${districtName ? "" : " is-selected"}`} aria-pressed={!districtName} onClick={() => { onChange(setBbmChecks(setBbmChecks(value, "region", [step]), "district", [])); onClose(); }}>{step} 전체</button>
          {districtsOf(step).map((name) => {
            const on = districtName === name;
            return <button key={name} type="button" className={`stable-region-cell${on ? " is-selected" : ""}`} aria-pressed={on} onClick={() => { onChange(setBbmChecks(setBbmChecks(value, "region", [step]), "district", [`${step} ${name}`])); onClose(); }}>{name}</button>;
          })}
        </div>
      </BbmSheet>
    );
  }
  return (
    <BbmSheet title="지역" onClose={onClose}>
      <div className="stable-region-grid">
        {STABLE_REGION_OPTIONS.map((name) => {
          const on = current.sido === name;
          return <button key={name} type="button" className={`stable-region-cell${on ? " is-selected" : ""}`} aria-pressed={on} onClick={() => pickSido(name)}>{name}</button>;
        })}
        <button type="button" className="stable-region-cell is-nearby" onClick={onNearby}><img src={bbmIcon("m-region-location")} alt="" aria-hidden="true" />내 주변</button>
      </div>
    </BbmSheet>
  );
}

// ④ 연식 알약 줄: 2026 · 2025 · … · 2019 · 이전. 누르면 바로 적용([2023년 ×]), 다른 연식은 바꿈, 다시 누르면 해제(줄은 그대로). 값은 개발 시안형 필터 "연식"
export const STABLE_YEAR_OPTIONS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "이전"];
const yearRange = (option: string) => (option === "이전" ? { min: "", max: "2018", preset: "이전" } : { min: option, max: option });
export const stableYearSelected = (value: BbmFilterValues) => {
  const range = value.ranges.year;
  if (!rangeIsSet(range) || !range) return null;
  if (range.preset === "이전" && !range.min && range.max === "2018") return "이전";
  return range.min && range.min === range.max ? range.min : null;
};
export function StableYearRow({ value, onChange }: { value: BbmFilterValues; onChange: (next: BbmFilterValues) => void }) {
  const selected = stableYearSelected(value);
  return (
    <section className="depth-rail is-trim-row is-year-row no-label" aria-label="연식 빠른 선택">
      <PillRow label="" className="stable-year-pills">
        {STABLE_YEAR_OPTIONS.map((option) => {
          const on = selected === option;
          return <button key={option} type="button" className={`stable-pill${on ? " is-selected" : ""}`} aria-pressed={on} onClick={() => onChange(setBbmRange(value, "year", on ? { min: "", max: "" } : yearRange(option)))}>{option}</button>;
        })}
      </PillRow>
    </section>
  );
}

// 모바일 ⑤ 관련 검색어 알약(높이 28)
export const stableKeywordPills = [
  { id: "domestic", label: "국산 중고차" },
  { id: "imported", label: "수입 중고차" },
  { id: "price-1000", label: "1천만원 이하" },
  { id: "light", label: "경차" },
  { id: "suv", label: "SUV" },
  { id: "hybrid", label: "하이브리드" },
];
