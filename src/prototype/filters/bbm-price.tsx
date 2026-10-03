import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { bbmRangePresets } from "./bbm-filter-options";
import { bbmPricePresetRange, setBbmRange, type BbmFilterValues, type BbmPriceTab } from "./bbm-filter-state";
import "./bbm-mileage.css";
import "./bbm-price.css";

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
const PRICE_TABS: BbmPriceTab[] = ["일반", "리스 / 렌트"];
const PRICE_PRESETS = bbmRangePresets.price?.presets ?? [];
const digits = (text: string) => text.replace(/[^\d]/g, "");
const comma = (text: string) => { const value = digits(text); return value ? Number(value).toLocaleString("ko-KR") : ""; };
const priceInvalid = (value: BbmFilterValues) => {
  const min = Number(digits(value.ranges.price?.min ?? ""));
  const max = Number(digits(value.ranges.price?.max ?? ""));
  return Boolean(min && max && min > max);
};
const clearPrice = (value: BbmFilterValues): BbmFilterValues => ({ ...setBbmRange(value, "price", { min: "", max: "" }), priceTab: "일반" });

function PriceField({ label, value, onChange }: { label: string; value: string; onChange: (next: string) => void }) {
  return <label className={`pf-field${value ? " has-value" : ""}`}>
    <input inputMode="numeric" autoComplete="off" value={value} aria-label={label} onChange={(event) => onChange(comma(event.currentTarget.value))} />
    <span className="pf-floating" aria-hidden="true">{label}</span><span className="pf-unit" aria-hidden="true">만원</span>
  </label>;
}

/** 가격 본문은 모바일 바텀시트와 PC 중앙 모달이 완전히 같은 컴포넌트를 공유한다. */
export function PriceFinalPanel({ value, onChange }: { value: BbmFilterValues; onChange: (next: BbmFilterValues) => void }) {
  const range = value.ranges.price ?? { min: "", max: "" };
  const pickPreset = (preset: string) => {
    if (preset === "전체" || range.preset === preset) return onChange(setBbmRange(value, "price", { min: "", max: "" }));
    onChange(setBbmRange(value, "price", bbmPricePresetRange(preset)));
  };
  const type = (key: "min" | "max", text: string) => onChange(setBbmRange(value, "price", { min: range.min, max: range.max, [key]: text }));
  return <div className="pf-panel">
    <div className="pf-tabs" role="tablist" aria-label="가격 종류">
      {PRICE_TABS.map((tab) => <button key={tab} type="button" role="tab" aria-selected={value.priceTab === tab} className={value.priceTab === tab ? "is-selected" : ""} onClick={() => onChange({ ...value, priceTab: tab })}>{tab}</button>)}
    </div>
    <div className="pf-input-block">
      <div className="pf-inputs"><PriceField label="최저 가격" value={range.min} onChange={(text) => type("min", text)} /><span className="pf-sep" aria-hidden="true">–</span><PriceField label="최고 가격" value={range.max} onChange={(text) => type("max", text)} /></div>
      {priceInvalid(value) ? <p className="pf-error" role="alert">최저 가격이 최고 가격보다 높습니다.</p> : null}
    </div>
    <p className="pf-guide">원하는 가격을 직접 입력하거나 구간을 선택하세요.</p>
    <div className="pf-chips" role="group" aria-label="가격 구간">
      {PRICE_PRESETS.map((preset) => { const selected = preset === "전체" ? !range.min && !range.max : range.preset === preset; return <button key={preset} type="button" className={selected ? "is-selected" : ""} aria-pressed={selected} onClick={() => pickPreset(preset)}>{preset === "9천만원~" ? "9천만원 이상" : preset}</button>; })}
    </div>
  </div>;
}

function useScrollLock(enabled: boolean) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const scroller = document.querySelector<HTMLElement>(".marketplace")?.closest<HTMLElement>(".mobile-scroll");
    if (!scroller) return;
    const before = scroller.clientWidth;
    const previous = { overflowY: scroller.style.overflowY, paddingRight: scroller.style.paddingRight };
    const top = scroller.scrollTop;
    scroller.style.overflowY = "hidden";
    const gained = scroller.clientWidth - before;
    if (gained > 0) scroller.style.paddingRight = `${(parseFloat(getComputedStyle(scroller).paddingRight) || 0) + gained}px`;
    return () => { scroller.style.overflowY = previous.overflowY; scroller.style.paddingRight = previous.paddingRight; scroller.scrollTop = top; };
  }, [enabled]);
}

/** 닫기·배경·Esc는 임시값을 버리고, 아래 결과 버튼만 가격을 적용한다. */
export function PriceFinalSheet({ value, countOf, onApply, onClose, variant = "sheet", returnFocus }: { value: BbmFilterValues; countOf: (next: BbmFilterValues) => number; onApply: (next: BbmFilterValues) => void; onClose: () => void; variant?: "sheet" | "modal"; returnFocus?: () => HTMLElement | null }) {
  const modal = variant === "modal";
  const [draft, setDraft] = useState(value);
  const [count, setCount] = useState(() => countOf(value));
  const dialog = useRef<HTMLElement>(null);
  const titleId = useId();
  useScrollLock(modal);
  useEffect(() => { const timer = window.setTimeout(() => setCount(countOf(draft)), 100); return () => window.clearTimeout(timer); }, [draft, countOf]);
  const close = () => { onClose(); window.requestAnimationFrame(() => returnFocus?.()?.focus({ preventScroll: true })); };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    if (modal) window.requestAnimationFrame(() => dialog.current?.querySelector<HTMLElement>(".mf-close")?.focus({ preventScroll: true }));
    return () => window.removeEventListener("keydown", onKey);
  });
  const trap = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (!modal || event.key !== "Tab" || !dialog.current) return;
    const items = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => element.offsetParent !== null || element === document.activeElement);
    if (!items.length) return;
    const first = items[0]; const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus({ preventScroll: true }); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus({ preventScroll: true }); }
  };
  const range = draft.ranges.price;
  const hasPrice = Boolean(range?.min || range?.max || draft.priceTab !== "일반");
  const invalid = priceInvalid(draft);
  const confirm = () => { onApply({ ...value, priceTab: draft.priceTab, ranges: { ...value.ranges, price: draft.ranges.price } }); close(); };
  return createPortal(<div className={`bbmf-overlay mf-overlay ${modal ? "mf-modal-overlay" : "is-sheet"}`} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section ref={dialog} className={`mf-sheet pf-sheet${modal ? " is-modal" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={trap}>
      <header className="mf-header"><h3 className="mf-title" id={titleId}>가격</h3><button type="button" className="mf-close" aria-label="닫기" onClick={close}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></button></header>
      <div className="mf-body"><PriceFinalPanel value={draft} onChange={setDraft} /></div>
      <div className="mf-actions"><button type="button" className="mf-reset" disabled={!hasPrice} onClick={() => setDraft(clearPrice(draft))}>초기화</button><button type="button" className="mf-confirm" disabled={invalid} onClick={confirm}>{count.toLocaleString("ko-KR")}대 보기</button></div>
    </section>
  </div>, document.body);
}
