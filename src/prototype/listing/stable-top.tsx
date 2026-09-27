import { useEffect, useRef, useState, type ReactNode } from "react";
import { rangeIsSet, setBbmChecks, setBbmRange, type BbmFilterValues } from "../filters/bbm-filter-state";
import { bbmIcon } from "./bbm-list";
import "./stable-top.css";

// QF-106 상단 구조 안정성 매뉴얼 v1.1(docs/stable-top-manual.md) — 과쯔 모드 PC 상단 카드 ③ 지역 칩 줄 · ④ 연식 알약 줄 · 제목 고정 · 모바일 ⑤ 관련 검색어

/** 제목 = 상단 메뉴(유형)로 들어온 카테고리 이름만. 대수·날짜·칩 조건은 넣지 않는다 */
export function stablePageTitle(category: string) {
  if (category === "국산차") return "국산 중고차";
  if (category === "수입차") return "수입 중고차";
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

// ③ 지역 칩 줄(PC만, 항상): 누르면 바로 적용([서울 ×] 검정 칩), 다시 누르면 해제. 값은 개발 시안형 필터 "지역"(좌측 필터와 같은 값)
export const STABLE_REGION_OPTIONS = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
export function StableRegionRow({ value, onChange, onNearby }: { value: BbmFilterValues; onChange: (next: BbmFilterValues) => void; onNearby: () => void }) {
  const selected = value.checks.region ?? [];
  return (
    <PillRow label="지역:" className="bbm-ct-region-row">
      {STABLE_REGION_OPTIONS.map((name) => {
        const on = selected.includes(name);
        return <button key={name} type="button" className={`stable-pill${on ? " is-selected" : ""}`} aria-pressed={on} onClick={() => onChange(setBbmChecks(value, "region", on ? [] : [name]))}>{name}</button>;
      })}
      <button type="button" className="stable-pill is-nearby" onClick={onNearby}><img src={bbmIcon("m-region-location")} alt="" aria-hidden="true" />내 주변</button>
    </PillRow>
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
    <section className="depth-rail is-trim-row is-year-row" aria-label="연식 빠른 선택">
      <span className="depth-rail-label">연식:</span>
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
