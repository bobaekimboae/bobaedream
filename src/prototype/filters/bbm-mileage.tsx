import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { setBbmRange, type BbmFilterValues, type BbmRange } from "./bbm-filter-state";
import "./bbm-mileage.css";

// QF-117 주행거리 필터 확정 시안(mileage-final) — 과쯔 모드만. 모바일 바텀시트 + PC 좌측 사이드바 아코디언 안.
// 값 모델은 그대로(ranges.mileage = { min, max, preset }, 쉼표 문자열). 최대 없음 = max ""(= null, "10만+ · 제한 없음").
// 범위 0~100,000km · 1,000km 단위. 슬라이더 오른쪽 끝 = 제한 없음. 구간 칩 5개(1만km 이하 · 1~3만km · 3~6만km · 6~10만km · 10만km 이상)

export const MILEAGE_MAX = 100000;
export const MILEAGE_STEP = 1000;
export const MILEAGE_TICKS = [0, 20000, 40000, 60000, 80000, 100000];
export const MILEAGE_CHIPS: Array<{ id: string; min: number; max: number | null }> = [
  { id: "1만km 이하", min: 0, max: 10000 },
  { id: "1~3만km", min: 10000, max: 30000 },
  { id: "3~6만km", min: 30000, max: 60000 },
  { id: "6~10만km", min: 60000, max: 100000 },
  { id: "10만km 이상", min: 100000, max: null },
];

const digits = (text: string) => text.replace(/[^\d]/g, "");
const toNumber = (text: string | undefined) => { const d = digits(text ?? ""); return d ? Number(d) : null; };
const comma = (n: number) => n.toLocaleString("ko-KR");

/** 값 모델 → 숫자(최소 없음 = 0, 최대 없음 = null) */
export function mileageBounds(range: BbmRange | undefined) {
  return { min: toNumber(range?.min) ?? 0, max: toNumber(range?.max) };
}
/** 입력·손잡이 값이 칩 범위와 정확히 같을 때만 그 칩 */
export const mileageChipOf = (min: number, max: number | null) => MILEAGE_CHIPS.find((chip) => chip.min === min && chip.max === max)?.id;
/** 숫자 → 값 모델(쉼표 문자열). 0 ~ 제한 없음은 조건 없음 */
export function mileageRange(min: number, max: number | null): BbmRange {
  if (min <= 0 && max === null) return { min: "", max: "" };
  return { min: min > 0 ? comma(min) : "", max: max === null ? "" : comma(max), preset: mileageChipOf(min, max) };
}
export const mileageInvalid = (range: BbmRange | undefined) => { const { min, max } = mileageBounds(range); return max !== null && min > max; };

/** 요약 표기: 칩이면 "3~6만km", 직접 범위 "3.5~8만km", 최대 없음 "10만km 이상", 최소 없음 "1만km 이하" */
const man = (n: number) => `${Math.round((n / 10000) * 100) / 100}`;
export function mileageSummary(range: BbmRange | undefined) {
  if (!range || (!range.min && !range.max)) return "";
  const { min, max } = mileageBounds(range);
  const chip = mileageChipOf(min, max);
  if (chip) return chip;
  if (max === null) return `${man(min)}만km 이상`;
  if (min <= 0) return `${man(max)}만km 이하`;
  return `${man(min)}~${man(max)}만km`;
}

const pct = (value: number) => Math.max(0, Math.min(1, value / MILEAGE_MAX));
const snap = (value: number) => Math.max(0, Math.min(MILEAGE_MAX, Math.round(value / MILEAGE_STEP) * MILEAGE_STEP));
const tickLabel = (value: number) => (value === 0 ? "0" : value === MILEAGE_MAX ? "10만+" : `${value / 10000}만`);

type Layout = "sheet" | "sidebar";

function Field({ label, value, onChange, onDone }: { label: string; value: string; onChange: (next: string) => void; onDone?: () => void }) {
  return (
    <label className={`mf-field${value ? " has-value" : ""}`}>
      <input inputMode="numeric" autoComplete="off" value={value} aria-label={label} onChange={(event) => { const d = digits(event.currentTarget.value); onChange(d ? comma(Number(d)) : ""); }}
        onKeyDown={onDone ? (event) => { if (event.key === "Enter") onDone(); } : undefined} onBlur={onDone ? () => onDone() : undefined} />
      <span className="mf-floating" aria-hidden="true">{label}</span>
      <span className="mf-unit" aria-hidden="true">km</span>
    </label>
  );
}

/** 듀얼 슬라이더: 트랙 좌우 인셋 11 · 손잡이 22(누르는 영역 44) · 1,000km 단위 · 교차 금지 · 오른쪽 끝 = 제한 없음
    onCommit(QF-119): 끌기를 놓을 때(pointerup)·키보드 조작이 끝날 때(keyup) 한 번 — PC 사이드바는 이때만 목록에 반영 */
function DualSlider({ min, max, onChange, onCommit }: { min: number; max: number | null; onChange: (min: number, max: number | null) => void; onCommit?: () => void }) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<"min" | "max" | null>(null);
  const [shown, setShown] = useState<"min" | "max" | null>(null);
  const maxValue = max === null ? MILEAGE_MAX : Math.min(max, MILEAGE_MAX);
  const valueAt = (clientX: number) => { const box = rail.current!.getBoundingClientRect(); const inset = 11; return snap(((clientX - box.left - inset) / (box.width - inset * 2)) * MILEAGE_MAX); };
  const set = (which: "min" | "max", value: number) => {
    if (which === "min") onChange(Math.min(value, maxValue), max);
    else { const next = Math.max(value, min); onChange(min, next >= MILEAGE_MAX ? null : next); }
  };
  const start = (event: ReactPointerEvent<HTMLDivElement>) => {
    const value = valueAt(event.clientX);
    const which = active ?? (Math.abs(value - min) <= Math.abs(value - maxValue) && !(min === maxValue && value > min) ? "min" : "max");
    setActive(which); setShown(which);
    // QF-119: 기본 포커스(mousedown)는 손잡이를 화면 안으로 끌어오며 스크롤을 움직일 수 있다 → 막고 preventScroll 로 직접 포커스
    event.preventDefault();
    event.currentTarget.querySelector<HTMLButtonElement>(`.mf-handle.is-${which}`)?.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    set(which, value);
  };
  const move = (event: ReactPointerEvent<HTMLDivElement>) => { if (active) set(active, valueAt(event.clientX)); };
  const end = () => { if (active) onCommit?.(); setActive(null); setShown(null); };
  const key = (which: "min" | "max") => (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const current = which === "min" ? min : maxValue;
    const next = event.key === "ArrowLeft" || event.key === "ArrowDown" ? current - MILEAGE_STEP : event.key === "ArrowRight" || event.key === "ArrowUp" ? current + MILEAGE_STEP : event.key === "Home" ? 0 : event.key === "End" ? MILEAGE_MAX : null;
    if (next === null) return;
    event.preventDefault();
    set(which, snap(next));
  };
  const keyEnd = (event: ReactKeyboardEvent<HTMLButtonElement>) => { if (["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp", "Home", "End"].includes(event.key)) onCommit?.(); };
  const left = (value: number) => `calc(11px + (100% - 22px) * ${pct(value)})`;
  const minText = `${comma(min)}km`;
  const maxText = max === null ? "제한 없음" : `${comma(max)}km`;
  return (
    <div className="mf-slider-block">
      <div ref={rail} className="mf-slider" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        <div className="mf-track" aria-hidden="true" />
        <div className="mf-fill" aria-hidden="true" style={{ left: left(min), width: `calc((100% - 22px) * ${pct(maxValue) - pct(min)})` }} />
        {(["min", "max"] as const).map((which) => {
          const value = which === "min" ? min : maxValue;
          return (
            <button key={which} type="button" role="slider" className={`mf-handle is-${which}${active === which ? " is-active" : ""}`} style={{ left: left(value) }}
              aria-label={which === "min" ? "최소 주행거리" : "최대 주행거리"} aria-valuemin={0} aria-valuemax={MILEAGE_MAX} aria-valuenow={value} aria-valuetext={which === "min" ? minText : maxText}
              onKeyDown={key(which)} onKeyUp={keyEnd} onFocus={() => setShown(which)} onBlur={() => setShown(null)}>
              <span className="mf-handle-dot" aria-hidden="true" />
              <output className={`mf-bubble${shown === which ? " is-visible" : ""}${pct(value) >= 0.9 ? " is-edge-right" : pct(value) <= 0.1 ? " is-edge-left" : ""}`} aria-hidden="true">{which === "min" ? minText : maxText}</output>
            </button>
          );
        })}
      </div>
      <div className="mf-ticks" aria-hidden="true">
        {/* QF-119: 첫 눈금은 손잡이 중심에서 시작(왼쪽 정렬), 끝 눈금은 손잡이 중심에서 끝(오른쪽 정렬), 나머지 가운데 — 모두 슬라이더 안 */}
        {MILEAGE_TICKS.map((tick) => <span key={tick} className={`mf-tick${tick === 0 ? " is-first" : tick === MILEAGE_MAX ? " is-last" : ""}`} style={tick === MILEAGE_MAX ? { right: "11px" } : { left: left(tick) }}>{tickLabel(tick)}</span>)}
      </div>
    </div>
  );
}

const TYPE_COMMIT_MS = 400;

/** 주행거리 내용(입력 → 슬라이더·눈금 → 구간 칩). sheet: 입력 한 줄 · 칩 3열 / sidebar: 입력 세로 · 칩 2열
    QF-119 PC 사이드바(sidebar): 조작 중에는 이 부품 안에서만 값을 바꾸고 목록 반영(onChange)은 한 번만 —
    손잡이는 놓을 때·키보드 조작 끝, 입력은 0.4초 멈춤·Enter·포커스 이동, 칩은 누를 때. 시트(sheet)는 이미 임시 값이라 그대로 바로 반영 */
export function MileageFinalPanel({ value, onChange, layout }: { value: BbmFilterValues; onChange: (next: BbmFilterValues) => void; layout: Layout }) {
  const deferred = layout === "sidebar";
  const outer = value.ranges.mileage;
  const [local, setLocal] = useState<BbmRange | undefined>(outer);
  const localRef = useRef(local);
  const valueRef = useRef(value);
  valueRef.current = value;
  const pending = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  // 바깥 값이 바뀌면(초기화·상단 칩 ×·반영 완료) 조작 중이 아닐 때만 따라감
  useEffect(() => { if (!pending.current) { localRef.current = outer; setLocal(outer); } }, [outer?.min, outer?.max, outer?.preset]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const range = deferred ? local : outer;
  const { min, max } = mileageBounds(range);
  const chip = mileageChipOf(min, max);
  const commit = () => {
    window.clearTimeout(timer.current);
    if (!pending.current) return;
    pending.current = false;
    const next = localRef.current ?? { min: "", max: "" };
    const now = valueRef.current.ranges.mileage;
    if ((now?.min ?? "") === next.min && (now?.max ?? "") === next.max && now?.preset === next.preset) return;
    onChange(setBbmRange(valueRef.current, "mileage", next));
  };
  const update = (next: BbmRange, when: "now" | "later" | "typing") => {
    if (!deferred) { onChange(setBbmRange(value, "mileage", next)); return; }
    localRef.current = next; setLocal(next); pending.current = true;
    window.clearTimeout(timer.current);
    if (when === "now") commit();
    else if (when === "typing") timer.current = window.setTimeout(commit, TYPE_COMMIT_MS);
  };
  const apply = (nextMin: number, nextMax: number | null, when: "now" | "later" = "now") => update(mileageRange(nextMin, nextMax), when);
  // 직접 입력은 입력한 글자 그대로(최소 > 최대여도 남겨 두고 적용 버튼만 막음)
  const typed = (key: "min" | "max", text: string) => {
    const next = { min: range?.min ?? "", max: range?.max ?? "", [key]: text };
    const bounds = mileageBounds(next);
    update(!next.min && !next.max ? { min: "", max: "" } : { ...next, preset: mileageChipOf(bounds.min, bounds.max) }, "typing");
  };
  const done = deferred ? commit : undefined;
  return (
    <div className={`mf-panel is-${layout}`}>
      {/* QF-119: 오류 문구는 입력 아래 여백 위에 겹쳐 그려 높이를 바꾸지 않음 */}
      <div className="mf-input-block">
        <div className="mf-inputs">
          <Field label="최소 거리" value={range?.min ?? ""} onChange={(text) => typed("min", text)} onDone={done} />
          <span className="mf-sep" aria-hidden="true">–</span>
          <Field label="최대 거리" value={range?.max ?? ""} onChange={(text) => typed("max", text)} onDone={done} />
        </div>
        {mileageInvalid(range) ? <p className="mf-error" role="alert">최소 주행거리가 최대 주행거리보다 높습니다.</p> : null}
      </div>
      <DualSlider min={min} max={max} onChange={(a, b) => apply(a, b, "later")} onCommit={deferred ? commit : undefined} />
      <div className="mf-chips" role="group" aria-label="주행거리 구간">
        {MILEAGE_CHIPS.map((item) => {
          const on = chip === item.id;
          return <button key={item.id} type="button" className={`mf-chip${on ? " is-selected" : ""}`} aria-pressed={on} onClick={() => (on ? apply(0, null) : apply(item.min, item.max))}>{item.id}</button>;
        })}
      </div>
    </div>
  );
}

/** 모바일 바텀시트(mileage-final): 임시 값(draft)과 적용 값 분리. 닫기·배경·Esc 는 적용하지 않고 닫음 */
export function MileageFinalSheet({ value, countOf, onApply, onClose }: { value: BbmFilterValues; countOf: (next: BbmFilterValues) => number; onApply: (next: BbmFilterValues) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(value);
  const [count, setCount] = useState(() => countOf(value));
  // 대수는 조작 반응을 막지 않게 짧게 늦춰 계산(손잡이는 즉시)
  useEffect(() => { const timer = window.setTimeout(() => setCount(countOf(draft)), 120); return () => window.clearTimeout(timer); }, [draft, countOf]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);
  const invalid = mileageInvalid(draft.ranges.mileage);
  return createPortal(
    <div className="bbmf-overlay is-sheet mf-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="mf-sheet" role="dialog" aria-modal="true" aria-label="주행거리">
        <header className="mf-header">
          <h3 className="mf-title">주행거리</h3>
          <button type="button" className="mf-close" aria-label="닫기" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></button>
        </header>
        <div className="mf-body"><MileageFinalPanel value={draft} onChange={setDraft} layout="sheet" /></div>
        <div className="mf-actions">
          <button type="button" className="mf-reset" onClick={() => setDraft(setBbmRange(draft, "mileage", { min: "", max: "" }))}>초기화</button>
          <button type="button" className="mf-confirm" disabled={invalid} onClick={() => { onApply(draft); onClose(); }}>{count.toLocaleString("ko-KR")}대 보기</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
