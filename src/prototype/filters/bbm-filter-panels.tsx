import { useRef, useState } from "react";
import { BbmCheckGrid, BbmCheckRow, BbmChoiceGrid, BbmColorChips, BbmKeywordInput, BbmPresetChips, BbmRangeInputs, BbmSelectBox, BbmSlider, BbmTabs } from "./bbm-filter-parts";
import { bbmAdPeriods, bbmCheckOptions, bbmOptionGroups, bbmRangePresets, type BbmFilterItem } from "./bbm-filter-options";
import { bbmOriginalCounts } from "./bbm-original-counts";
import { setBbmChecks, setBbmRange, toggleBbmCheck, type BbmCheckKey, type BbmFilterValues, type BbmPriceTab, type BbmRangeKey } from "./bbm-filter-state";

// QF-076: 사이드바 펼침형 6개 · 모달형 20개의 안쪽 화면. 선택지·순서·문구·단위는 원본 수집(docs/bbm-filter-spec.json) 그대로.
// 이번 과제는 모양만: 고른 값은 filters.bbm 에 남지만 매물 목록은 거르지 않는다. 매물 수는 원본 숫자(bbm-original-counts.ts).

type PanelProps = { value: BbmFilterValues; onChange: (next: BbmFilterValues) => void };

const originalCount = (key: BbmCheckKey, option: string) => bbmOriginalCounts[key]?.[option] ?? null;
const thisYear = 2026;
const years = Array.from({ length: thisYear - 1989 }, (_, index) => `${thisYear - index}년`);
const months = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);

// 외부색상·시트색상 동그라미 색(원본 칩 모양을 따라 새로 정한 색. 투톤은 반반)
const half = (left: string, right: string) => `linear-gradient(90deg, ${left} 50%, ${right} 50%)`;
const exteriorSwatches: Record<string, string> = {
  흰색: "#ffffff", 검정색: "#000000", 쥐색: "#5c5c5c", 청색: "#1b3f8a", 은색: "#e6e6e6", 은회색: "#b5b5b5", 빨간색: "#d0021b", 진주색: "#f4f1e4",
  노란색: "#f5e83a", 갈색: "#6b5530", 하늘색: "#6e8fa0", 녹색: "#19c80f", 담녹색: "#1d4a4a", 연금색: "#908571", 명은색: "#cdd5e0", 주황색: "#f07f12",
  연두색: "#93b25b", 자주색: "#7a2462", 은하색: "#a5abab", 갈대색: "#7c7b6e", 청옥색: "#22706f", 분홍색: "#f9c3d9", 검정투톤: half("#ffffff", "#000000"), 보라색: "#5b0e80",
  흰색투톤: half("#ffffff", "#e0e0e0"), 은색투톤: half("#ffffff", "#5c5c5c"), 금색: "#8c7430", 진주투톤: half("#f4f1e4", "#ffffff"), 갈색투톤: half("#6b5530", "#5c5c5c"), 금색투톤: half("#8c7430", "#3b3b3b"), 기타: "#ffffff",
};
const seatSwatches: Record<string, string> = {
  "검정색 계열": "#000000", "갈색 계열": "#e0a56a", "베이지 계열": "#f0cfa0", "회색 계열": "#c8c8c8", "노란색 계열": "#f0c040", "녹색 계열": "#1a9a50",
  "빨간색 계열": "#d83a3a", "주황색 계열": "#f0662a", "청색 계열": "#1e3a9a", "흰색 계열": "#ffffff", 기타: "#ffffff",
};

function CheckList({ checkKey, value, onChange, size = "modal", columns = 1 }: PanelProps & { checkKey: BbmCheckKey; size?: "modal" | "sidebar"; columns?: 1 | 2 }) {
  return (
    <BbmCheckGrid columns={columns} label={checkKey}>
      {bbmCheckOptions[checkKey].map((option) => <BbmCheckRow key={option} size={size} label={option} count={originalCount(checkKey, option)} checked={Boolean(value.checks[checkKey]?.includes(option))} onToggle={() => onChange(toggleBbmCheck(value, checkKey, option))} />)}
    </BbmCheckGrid>
  );
}

function Presets({ rangeKey, value, onChange }: PanelProps & { rangeKey: BbmRangeKey }) {
  const range = value.ranges[rangeKey];
  return <BbmPresetChips options={bbmRangePresets[rangeKey]?.presets ?? []} selected={range?.preset ?? null} onPick={(preset) => onChange(setBbmRange(value, rangeKey, { min: "", max: "", preset: range?.preset === preset ? undefined : preset }))} />;
}

function RangeFields({ rangeKey, value, onChange, layout, unit }: PanelProps & { rangeKey: BbmRangeKey; layout: "stack" | "inline"; unit?: string }) {
  const range = value.ranges[rangeKey] ?? { min: "", max: "" };
  return <BbmRangeInputs layout={layout} unit={unit ?? bbmRangePresets[rangeKey]?.unit ?? ""} min={range.min} max={range.max} onChange={(next) => onChange(setBbmRange(value, rangeKey, next))} />;
}

// ── 사이드바 펼침형(바디타입 · 차급 · 연식 · 주행거리 · 가격 · 차량번호/판매자)
export function BbmExpandPanel({ label, value, onChange }: PanelProps & { label: string }) {
  if (label === "바디타입" || label === "차급") {
    return <div className="bbmf-panel"><CheckList checkKey={label === "바디타입" ? "bodyType" : "carClass"} size="sidebar" value={value} onChange={onChange} /></div>;
  }
  if (label === "연식") {
    const year = value.ranges.year ?? { min: "", max: "" };
    const [fromYear = "", fromMonth = ""] = year.min.split(" ");
    const [toYear = "", toMonth = ""] = year.max.split(" ");
    const setYear = (key: "min" | "max", nextYear: string, nextMonth: string) => onChange(setBbmRange(value, "year", { ...year, preset: undefined, [key]: [nextYear, nextMonth].filter(Boolean).join(" ") }));
    return (
      <div className="bbmf-panel">
        <div className="bbmf-period">
          <div><BbmSelectBox label="년" value={fromYear} options={years} onChange={(next) => setYear("min", next, fromMonth)} /><BbmSelectBox label="월" value={fromMonth} options={months} onChange={(next) => setYear("min", fromYear, next)} /><span className="bbmf-range-word">부터</span></div>
          <div><BbmSelectBox label="년" value={toYear} options={years} onChange={(next) => setYear("max", next, toMonth)} /><BbmSelectBox label="월" value={toMonth} options={months} onChange={(next) => setYear("max", toYear, next)} /><span className="bbmf-range-word">까지</span></div>
        </div>
        <div className="bbmf-panel-presets is-col-3"><Presets rangeKey="year" value={value} onChange={onChange} /></div>
      </div>
    );
  }
  if (label === "주행거리") {
    return <div className="bbmf-panel"><RangeFields rangeKey="mileage" layout="stack" value={value} onChange={onChange} /><div className="bbmf-panel-presets"><Presets rangeKey="mileage" value={value} onChange={onChange} /></div></div>;
  }
  if (label === "가격") {
    return (
      <div className="bbmf-panel">
        <BbmTabs label="가격 종류" tabs={["일반", "리스 / 렌트"] as const} value={value.priceTab} onChange={(tab: BbmPriceTab) => onChange({ ...value, priceTab: tab })} />
        <div className="bbmf-panel-gap"><RangeFields rangeKey="price" layout="stack" value={value} onChange={onChange} /></div>
        <div className="bbmf-panel-presets"><Presets rangeKey="price" value={value} onChange={onChange} /></div>
      </div>
    );
  }
  if (label === "차량번호 / 판매자") {
    return <div className="bbmf-panel"><BbmKeywordInput value={value.keyword} placeholder="차량번호 / 판매자" onChange={(keyword) => onChange({ ...value, keyword })} /></div>;
  }
  return null;
}

// ── 모달형 20개 안쪽
export function BbmModalPanel({ item, value, onChange }: PanelProps & { item: BbmFilterItem }) {
  const [optionTab, setOptionTab] = useState(bbmOptionGroups[0][0]);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  if (item.label === "외부색상") {
    return <BbmColorChips options={bbmCheckOptions.exteriorColor} swatches={exteriorSwatches} selected={value.checks.exteriorColor ?? []} onToggle={(option) => onChange(toggleBbmCheck(value, "exteriorColor", option))} />;
  }
  if (item.label === "시트색상") {
    return (
      <div className="bbmf-sections">
        <section><h4 className="bbmf-section-title is-muted">시트 색상</h4><BbmColorChips options={bbmCheckOptions.seatColor} swatches={seatSwatches} selected={value.checks.seatColor ?? []} onToggle={(option) => onChange(toggleBbmCheck(value, "seatColor", option))} /></section>
        <section><h4 className="bbmf-section-title is-muted">시트 마감</h4><BbmColorChips options={bbmCheckOptions.seatFinish} selected={value.checks.seatFinish ?? []} onToggle={(option) => onChange(toggleBbmCheck(value, "seatFinish", option))} /></section>
      </div>
    );
  }
  if (item.label === "변속기") {
    return <BbmChoiceGrid options={bbmCheckOptions.transmission} selected={value.checks.transmission ?? []} onToggle={(option) => onChange(toggleBbmCheck(value, "transmission", option))} />;
  }
  if (item.label === "광고기간") {
    return <BbmChoiceGrid size="lg" firstFull options={bbmAdPeriods} selected={[value.adPeriod]} onToggle={(option) => onChange({ ...value, adPeriod: option })} />;
  }
  if (item.label === "옵션") {
    // 왼쪽 세로 탭 → 오른쪽 목록의 해당 섹션으로 이동(원본처럼 한 목록 안에 여섯 섹션)
    return (
      <div className="bbmf-options">
        <BbmTabs variant="side" label="옵션 분류" tabs={bbmOptionGroups.map(([name]) => name)} value={optionTab} onChange={(tab) => { setOptionTab(tab); sectionRefs.current[tab]?.scrollIntoView({ block: "start", behavior: "smooth" }); }} />
        <div className="bbmf-options-list">
          {bbmOptionGroups.map(([group, list]) => (
            <section key={group} ref={(element) => { sectionRefs.current[group] = element; }}>
              <h4 className="bbmf-section-title is-option">{group}</h4>
              <BbmCheckGrid>{list.map((option) => <BbmCheckRow key={option} size="option" label={option} count={originalCount("options", option)} checked={Boolean(value.checks.options?.includes(option))} onToggle={() => onChange(toggleBbmCheck(value, "options", option))} />)}</BbmCheckGrid>
            </section>
          ))}
        </div>
      </div>
    );
  }
  if (item.label === "크기") {
    return (
      <div className="bbmf-sections is-size">
        {([["전장", "length"], ["전폭", "width"], ["전고", "height"]] as Array<[string, BbmRangeKey]>).map(([title, rangeKey]) => (
          <section key={title}><h4 className="bbmf-section-title">{title}</h4><RangeFields rangeKey={rangeKey} unit="mm" layout="inline" value={value} onChange={onChange} /><BbmSlider label={title} /></section>
        ))}
      </div>
    );
  }
  if (item.rangeKey) {
    return <div><RangeFields rangeKey={item.rangeKey} layout="inline" value={value} onChange={onChange} /><BbmSlider label={item.label} /><Presets rangeKey={item.rangeKey} value={value} onChange={onChange} /></div>;
  }
  if (item.checkKey) return <CheckList checkKey={item.checkKey} columns={item.columns ?? 1} value={value} onChange={onChange} />;
  return null;
}

// 모달 [초기화]: 이 항목의 값만 지운다
export function clearBbmItem(item: BbmFilterItem, value: BbmFilterValues): BbmFilterValues {
  if (item.label === "시트색상") return setBbmChecks(setBbmChecks(value, "seatColor", []), "seatFinish", []);
  if (item.label === "크기") return (["length", "width", "height"] as BbmRangeKey[]).reduce((next, key) => setBbmRange(next, key, { min: "", max: "" }), value);
  if (item.checkKey) return setBbmChecks(value, item.checkKey, []);
  if (item.rangeKey) return setBbmRange(value, item.rangeKey, { min: "", max: "" });
  return value;
}
